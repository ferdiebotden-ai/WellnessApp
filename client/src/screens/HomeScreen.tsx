import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HealthMetricCard } from '../components/HealthMetricCard';
import { ModuleEnrollmentCard } from '../components/ModuleEnrollmentCard';
import { TaskList } from '../components/TaskList';
import { RecoveryScoreCard } from '../components/RecoveryScoreCard';
import { LiteModeScoreCard } from '../components/LiteModeScoreCard';
import { WakeConfirmationOverlay } from '../components/WakeConfirmationOverlay';
import type { ManualCheckInInput, CheckInResult } from '../types/checkIn';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { useTaskFeed } from '../hooks/useTaskFeed';
import { useRecoveryScore } from '../hooks/useRecoveryScore';
import { useWakeDetection } from '../hooks/useWakeDetection';
import { useNudgeActions } from '../hooks/useNudgeActions';
import { useTodayMetrics } from '../hooks/useTodayMetrics';
import type { DashboardTask, HealthMetric, ModuleEnrollment } from '../types/dashboard';
import { firebaseAuth } from '../services/firebase';
import { LockedModuleCard } from '../components/LockedModuleCard';
import type { HomeStackParamList } from '../navigation/HomeStack';
import { useMonetization } from '../providers/MonetizationProvider';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { useDashboardData } from '../hooks/useDashboardData';

type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, 'Home'>;

interface LockedModule {
  id: string;
  title: string;
  description: string;
  tier: 'pro' | 'elite';
}

const LOCKED_MODULES: LockedModule[] = [
  {
    id: 'mod_stress_regulation',
    title: 'Stress & Emotional Regulation',
    description: 'Unlock HRV-guided breathing plans and advanced stress resilience analytics.',
    tier: 'pro',
  },
  {
    id: 'mod_energy_recovery',
    title: 'Energy & Recovery',
    description: 'Access metabolic recovery dashboards, cold exposure protocols, and readiness forecasting.',
    tier: 'pro',
  },
  {
    id: 'elite_concierge',
    title: 'Elite Concierge',
    description: 'Get 1:1 concierge coaching, lab integrations, and executive performance planning.',
    tier: 'elite',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const userId = firebaseAuth.currentUser?.uid ?? null;
  const { tasks, loading: loadingTasks } = useTaskFeed(userId);
  const { metrics, enrollments, loading: loadingDashboard } = useDashboardData();
  const {
    data: recoveryData,
    baselineStatus,
    loading: loadingRecovery,
    isLiteMode,
    checkInData,
    refresh: refreshRecoveryScore,
  } = useRecoveryScore(userId ?? undefined);
  const { requestProModuleAccess } = useMonetization();
  const { isModuleEnabled } = useFeatureFlags();

  // Real-time metrics from Firestore (Phase 3 Session 6)
  const { metrics: todayMetrics } = useTodayMetrics(userId);

  // Track tasks currently being updated
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set());

  // Nudge actions with optimistic updates (Phase 3 Session 6)
  const { complete, dismiss, pendingActions, isSyncing } = useNudgeActions({
    userId,
    onActionComplete: (task, action) => {
      console.log(`[HomeScreen] ${action} completed for: ${task.title}`);
      setUpdatingTasks((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    },
    onActionError: (task, error) => {
      console.error(`[HomeScreen] Action failed for ${task.title}:`, error);
      setUpdatingTasks((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      Alert.alert('Action Failed', error);
    },
    onQueuedOffline: (count) => {
      console.log(`[HomeScreen] ${count} actions queued offline`);
    },
  });

  // Wake detection for Morning Anchor (Phase 3)
  const {
    showConfirmation: showWakeConfirmation,
    handleConfirm: handleWakeConfirm,
    handleLater: handleWakeLater,
    handleDismiss: handleWakeDismiss,
  } = useWakeDetection();

  // Handle Lite Mode check-in completion (Phase 3 Session 49)
  const handleCheckInComplete = useCallback(
    async (answers: ManualCheckInInput) => {
      if (!userId) {
        console.error('[HomeScreen] No userId for check-in');
        return;
      }

      try {
        const token = await firebaseAuth.currentUser?.getIdToken();
        if (!token) {
          throw new Error('No auth token');
        }

        const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com';
        const response = await fetch(`${API_BASE_URL}/api/manual-check-in`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(answers),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error((errorData as { error?: string }).error || 'Check-in failed');
        }

        // Refresh recovery score to show new check-in data
        await refreshRecoveryScore();
        console.log('[HomeScreen] Check-in completed successfully');
      } catch (error) {
        console.error('[HomeScreen] Check-in failed:', error);
        Alert.alert('Check-in Failed', 'Unable to save your check-in. Please try again.');
        throw error; // Re-throw so overlay knows it failed
      }
    },
    [userId, refreshRecoveryScore]
  );

  // Handle task completion
  const handleTaskComplete = useCallback(
    async (task: DashboardTask) => {
      setUpdatingTasks((prev) => new Set(prev).add(task.id));
      await complete(task);
    },
    [complete]
  );

  // Handle task dismissal
  const handleTaskDismiss = useCallback(
    async (task: DashboardTask) => {
      setUpdatingTasks((prev) => new Set(prev).add(task.id));
      await dismiss(task);
    },
    [dismiss]
  );

  const handleModulePress = useCallback(
    (module: ModuleEnrollment) => {
      if (module.tier === 'pro') {
        const allowed = requestProModuleAccess(module.id);
        if (!allowed) {
          return;
        }
      }

      Alert.alert(module.title, 'Module details will be available soon.');
    },
    [requestProModuleAccess]
  );

  // Filter modules based on feature flags
  const filteredEnrolledModules = useMemo(() => {
    return enrollments.filter((module) => {
      // Map module IDs to feature flags
      if (module.id === 'sleep') {
        return isModuleEnabled('sleep');
      }
      if (module.id === 'resilience') {
        // Resilience maps to stress module
        return isModuleEnabled('stress');
      }
      // Default to enabled if not mapped
      return true;
    });
  }, [enrollments, isModuleEnabled]);

  const orderedModules = useMemo(
    () => [...filteredEnrolledModules].sort((a, b) => b.progressPct - a.progressPct),
    [filteredEnrolledModules]
  );

  // Filter locked modules based on feature flags
  const filteredLockedModules = useMemo(() => {
    return LOCKED_MODULES.filter((module) => {
      // Map module IDs to feature flags
      if (module.id === 'mod_stress_regulation') {
        return isModuleEnabled('stress');
      }
      if (module.id === 'mod_energy_recovery') {
        return isModuleEnabled('energy');
      }
      // Elite concierge doesn't have a specific flag - show if any pro module is enabled
      if (module.id === 'elite_concierge') {
        return isModuleEnabled('stress') || isModuleEnabled('energy') || isModuleEnabled('dopamine');
      }
      // Default to enabled if not mapped
      return true;
    });
  }, [isModuleEnabled]);

  const handleLockedModulePress = useCallback(
    (moduleId: string) => {
      const module = LOCKED_MODULES.find((item) => item.id === moduleId);
      if (!module) {
        return;
      }

      navigation.navigate('Waitlist', {
        tier: module.tier,
        moduleName: module.title,
      });
    },
    [navigation]
  );

  return (
    <View style={styles.root} testID="home-screen">
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} testID="home-scroll-view">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Outcomes</Text>
          {/* Conditional rendering: LiteModeScoreCard for manual check-in users, RecoveryScoreCard for wearable users */}
          {isLiteMode ? (
            <LiteModeScoreCard
              data={checkInData}
              loading={loadingRecovery}
              onCheckIn={() => {
                // Trigger wake confirmation overlay to start check-in
                handleWakeConfirm();
              }}
            />
          ) : (
            <RecoveryScoreCard
              data={recoveryData}
              baselineStatus={baselineStatus}
              loading={loadingRecovery}
            />
          )}
          <View style={styles.metricsRow}>
            {metrics.length > 0 ? (
              metrics.map((metric) => (
                <HealthMetricCard metric={metric} key={metric.id} />
              ))
            ) : (
              <Text style={styles.emptyState}>No health metrics available yet.</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Protocols</Text>
          {orderedModules.length > 0 ? (
            <View style={styles.moduleStack}>
              {orderedModules.map((module) => (
                <ModuleEnrollmentCard
                  key={module.id}
                  module={module}
                  locked={module.tier === 'pro'}
                  onPress={() => handleModulePress(module)}
                  testID={`module-card-${module.id}`}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyState}>No active modules available.</Text>
          )}
        </View>

        {filteredLockedModules.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unlock Next-Level Modules</Text>
            <View style={styles.lockedModules}>
              {filteredLockedModules.map((module) => (
                <LockedModuleCard
                  key={module.id}
                  id={module.id}
                  title={module.title}
                  description={module.description}
                  tier={module.tier}
                  onPress={handleLockedModulePress}
                />
              ))}
            </View>
          </View>
        )}

        <View style={[styles.section, styles.taskSection]}>
          <Text style={styles.sectionTitle}>Today's Plan</Text>
          <TaskList
            loading={loadingTasks}
            tasks={tasks}
            emptyMessage="Your schedule is clear."
            onComplete={handleTaskComplete}
            onDismiss={handleTaskDismiss}
            updatingTasks={updatingTasks}
          />
          {pendingActions > 0 && (
            <Text style={styles.syncStatus}>
              {isSyncing ? 'Syncing...' : `${pendingActions} action${pendingActions > 1 ? 's' : ''} pending`}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Wake Confirmation Overlay - shows check-in questionnaire for Lite Mode users */}
      <WakeConfirmationOverlay
        visible={showWakeConfirmation}
        isLiteMode={isLiteMode}
        onConfirm={handleWakeConfirm}
        onCheckInComplete={handleCheckInComplete}
        onLater={handleWakeLater}
        onDismiss={handleWakeDismiss}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 32,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    ...typography.subheading,
    color: palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  moduleStack: {
    gap: 16,
  },
  lockedModules: {
    gap: 16,
  },
  taskSection: {
    paddingBottom: 16,
  },
  emptyState: {
    ...typography.body,
    color: palette.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 24,
  },
  syncStatus: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
