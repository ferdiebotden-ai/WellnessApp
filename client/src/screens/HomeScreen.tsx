import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RecoveryScoreCard } from '../components/RecoveryScoreCard';
import { LiteModeScoreCard } from '../components/LiteModeScoreCard';
import { WakeConfirmationOverlay } from '../components/WakeConfirmationOverlay';
// New Home Screen components (Session 57)
import { HomeHeader } from '../components/home/HomeHeader';
import { TodaysFocusCard } from '../components/home/TodaysFocusCard';
import { DayTimeline } from '../components/home/DayTimeline';
import { WeeklyProgressCard } from '../components/home/WeeklyProgressCard';
import { MyScheduleSection } from '../components/home/MyScheduleSection';
import type { ManualCheckInInput } from '../types/checkIn';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { useTaskFeed } from '../hooks/useTaskFeed';
import { useRecoveryScore } from '../hooks/useRecoveryScore';
import { useWakeDetection } from '../hooks/useWakeDetection';
import { useNudgeActions } from '../hooks/useNudgeActions';
// New hooks (Session 57)
import { useTodaysFocus } from '../hooks/useTodaysFocus';
import { useWeeklyProgress, useMockWeeklyProgress } from '../hooks/useWeeklyProgress';
import { useEnrolledProtocols, ScheduledProtocol } from '../hooks/useEnrolledProtocols';
import { unenrollFromProtocol } from '../services/api';
import type { DashboardTask, ModuleEnrollment } from '../types/dashboard';
import { firebaseAuth } from '../services/firebase';
import type { HomeStackParamList } from '../navigation/HomeStack';
import { useMonetization } from '../providers/MonetizationProvider';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { useDashboardData } from '../hooks/useDashboardData';

type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, 'Home'>;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const userId = firebaseAuth.currentUser?.uid ?? null;
  const { tasks, loading: loadingTasks } = useTaskFeed(userId);
  const { enrollments, loading: loadingDashboard } = useDashboardData();
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

  // Session 57: Today's Focus (One Big Thing)
  const { focus, isMVD } = useTodaysFocus({
    tasks,
    recoveryZone: recoveryData?.zone ?? null,
    recoveryScore: recoveryData?.score ?? null,
  });

  // Session 57: Weekly Progress (use mock if Firestore unavailable)
  const weeklyProgress = useWeeklyProgress(userId);
  const mockProgress = useMockWeeklyProgress();
  const { protocols: weeklyProtocols, loading: loadingWeekly } =
    weeklyProgress.protocols.length > 0 ? weeklyProgress : mockProgress;

  // Session 64: Enrolled protocols for My Schedule section
  const {
    protocols: enrolledProtocols,
    loading: loadingEnrolled,
    error: enrolledError,
    refresh: refreshEnrolledProtocols,
  } = useEnrolledProtocols();

  // Track protocols currently being updated (for swipe actions)
  const [updatingProtocolIds, setUpdatingProtocolIds] = useState<Set<string>>(new Set());

  // Get user's first name for greeting
  const userName = firebaseAuth.currentUser?.displayName?.split(' ')[0] || undefined;

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

  // Filter modules based on feature flags (still used for handleTaskPress fallback)
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

  // Session 57: Navigation callbacks
  const handleProfilePress = useCallback(() => {
    // Navigate to Profile tab
    navigation.getParent()?.navigate('Profile');
  }, [navigation]);

  const handleChatPress = useCallback(() => {
    // TODO: Open AI chat modal
    Alert.alert('AI Coach', 'Chat feature coming soon!');
  }, []);

  // Session 58: Navigate to Protocol Detail
  const handleTaskPress = useCallback(
    (task: DashboardTask) => {
      // Get moduleId from first enrolled module (if available)
      const moduleId = orderedModules[0]?.id;

      navigation.navigate('ProtocolDetail', {
        protocolId: task.id,
        protocolName: task.title,
        moduleId,
        source: task.source === 'nudge' ? 'nudge' : 'schedule',
      });
    },
    [navigation, orderedModules]
  );

  const handleAddProtocol = useCallback(() => {
    // Navigate to Protocol Browser screen
    navigation.navigate('ProtocolBrowser');
  }, [navigation]);

  // Session 64: Handle tap on scheduled protocol card
  const handleScheduledProtocolPress = useCallback(
    (protocol: ScheduledProtocol) => {
      navigation.navigate('ProtocolDetail', {
        protocolId: protocol.protocol_id,
        protocolName: protocol.protocol.name,
        moduleId: protocol.module_id || undefined,
        source: 'schedule',
      });
    },
    [navigation]
  );

  // Session 65: Handle swipe-right to start protocol (same as tap)
  const handleProtocolStart = useCallback(
    (protocol: ScheduledProtocol) => {
      // Navigate to protocol detail to start it
      navigation.navigate('ProtocolDetail', {
        protocolId: protocol.protocol_id,
        protocolName: protocol.protocol.name,
        moduleId: protocol.module_id || undefined,
        source: 'schedule',
      });
    },
    [navigation]
  );

  // Session 65: Handle swipe-left to unenroll from protocol
  const handleProtocolUnenroll = useCallback(
    async (protocol: ScheduledProtocol) => {
      // Show confirmation dialog
      Alert.alert(
        'Remove from Schedule',
        `Remove "${protocol.protocol.name}" from your schedule?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              setUpdatingProtocolIds((prev) => new Set(prev).add(protocol.id));
              try {
                await unenrollFromProtocol(protocol.protocol_id);
                await refreshEnrolledProtocols();
              } catch (error) {
                console.error('[HomeScreen] Unenroll failed:', error);
                Alert.alert('Error', 'Failed to remove protocol. Please try again.');
              } finally {
                setUpdatingProtocolIds((prev) => {
                  const next = new Set(prev);
                  next.delete(protocol.id);
                  return next;
                });
              }
            },
          },
        ]
      );
    },
    [refreshEnrolledProtocols]
  );

  const handleSynthesisPress = useCallback(() => {
    // Navigate to Insights tab (Weekly Synthesis)
    navigation.getParent()?.navigate('Insights');
  }, [navigation]);

  const handleFocusStart = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        await handleTaskComplete(task);
      }
    },
    [tasks, handleTaskComplete]
  );

  return (
    <View style={styles.root} testID="home-screen">
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} testID="home-scroll-view">
        {/* 1. Header with greeting, date, and actions */}
        <HomeHeader
          userName={userName}
          onProfilePress={handleProfilePress}
          onChatPress={handleChatPress}
        />

        {/* 2. Recovery Score Hero */}
        <View style={styles.section}>
          {isLiteMode ? (
            <LiteModeScoreCard
              data={checkInData}
              loading={loadingRecovery}
              onCheckIn={() => {
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
        </View>

        {/* 3. Today's Focus (One Big Thing) */}
        <View style={styles.section}>
          <TodaysFocusCard
            focus={focus}
            isMVD={isMVD}
            onStart={handleFocusStart}
            loading={loadingTasks}
          />
        </View>

        {/* 4. Day Timeline (Horizontal) */}
        <View style={styles.section}>
          <DayTimeline
            tasks={tasks.filter((t) => t.scheduledAt)}
            onComplete={handleTaskComplete}
            onTaskPress={handleTaskPress}
            loading={loadingTasks}
          />
        </View>

        {/* 5. My Schedule - Session 64 (replaces Your Focus Areas) */}
        <View style={styles.section}>
          <MyScheduleSection
            protocols={enrolledProtocols}
            loading={loadingEnrolled}
            error={enrolledError}
            onProtocolPress={handleScheduledProtocolPress}
            onAddProtocol={handleAddProtocol}
            onProtocolStart={handleProtocolStart}
            onProtocolUnenroll={handleProtocolUnenroll}
            updatingProtocolIds={updatingProtocolIds}
            testID="my-schedule-section"
          />
        </View>

        {/* 6. Weekly Progress */}
        <View style={styles.section}>
          <WeeklyProgressCard
            protocols={weeklyProtocols}
            onSynthesisPress={handleSynthesisPress}
            loading={loadingWeekly}
          />
        </View>

        {/* Sync status indicator */}
        {pendingActions > 0 && (
          <Text style={styles.syncStatus}>
            {isSyncing ? 'Syncing...' : `${pendingActions} action${pendingActions > 1 ? 's' : ''} pending`}
          </Text>
        )}
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
    gap: 28, // Session 57: 28px section gaps per design system
  },
  section: {
    gap: 16,
  },
  syncStatus: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
