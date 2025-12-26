import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RecoveryScoreCard } from '../components/RecoveryScoreCard';
import { LiteModeScoreCard } from '../components/LiteModeScoreCard';
import { WakeConfirmationOverlay } from '../components/WakeConfirmationOverlay';
import { SilentErrorBoundary } from '../components/ErrorBoundary';
// New Home Screen components (Session 57)
import { HomeHeader } from '../components/home/HomeHeader';
// TodaysFocusCard removed (Session 87) - Consolidated into MyScheduleSection to avoid redundancy
import { DayTimeline } from '../components/home/DayTimeline';
import { WeeklyProgressCard } from '../components/home/WeeklyProgressCard';
import { MyScheduleSection } from '../components/home/MyScheduleSection';
import { QuickHealthStats } from '../components/health';
// Session 86: Protocol Quick Sheet and AI Coach integration
import { ProtocolQuickSheet } from '../components/protocol/ProtocolQuickSheet';
import { ChatModal, ChatContext } from '../components/ChatModal';
import type { ManualCheckInInput } from '../types/checkIn';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { useTaskFeed } from '../hooks/useTaskFeed';
import { useRecoveryScore } from '../hooks/useRecoveryScore';
import { useWakeDetection } from '../hooks/useWakeDetection';
import { useNudgeActions } from '../hooks/useNudgeActions';
// New hooks (Session 57)
// useTodaysFocus removed (Session 87) - Consolidated into MyScheduleSection
import { useWeeklyProgress, useMockWeeklyProgress } from '../hooks/useWeeklyProgress';
import { useEnrolledProtocols, ScheduledProtocol } from '../hooks/useEnrolledProtocols';
import { useTodayMetrics } from '../hooks/useTodayMetrics';
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

  // Session 85: Today's health metrics for QuickHealthStats
  const { metrics: healthMetrics, loading: loadingHealthMetrics } = useTodayMetrics(userId);

  // Session 57/87: Today's Focus removed - consolidated into MyScheduleSection
  // The "One Big Thing" philosophy is preserved via visual highlighting of due-now protocols

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

  // Refresh enrolled protocols when screen comes into focus
  // This ensures new enrollments from ProtocolBrowser are displayed
  useFocusEffect(
    useCallback(() => {
      refreshEnrolledProtocols();
    }, [refreshEnrolledProtocols])
  );

  // Track protocols currently being updated (for swipe actions)
  const [updatingProtocolIds, setUpdatingProtocolIds] = useState<Set<string>>(new Set());

  // Session 86: Quick Sheet and AI Coach state
  const [quickSheetProtocol, setQuickSheetProtocol] = useState<ScheduledProtocol | null>(null);
  const [showQuickSheet, setShowQuickSheet] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext | undefined>(undefined);
  const [isCompletingProtocol, setIsCompletingProtocol] = useState(false);

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

  // Session 64/86: Handle tap on scheduled protocol card - now opens quick sheet
  const handleScheduledProtocolPress = useCallback(
    (protocol: ScheduledProtocol) => {
      setQuickSheetProtocol(protocol);
      setShowQuickSheet(true);
    },
    []
  );

  // Session 86: Quick Sheet action handlers
  const handleQuickSheetClose = useCallback(() => {
    setShowQuickSheet(false);
    setQuickSheetProtocol(null);
  }, []);

  const handleQuickSheetComplete = useCallback(
    async (protocol: ScheduledProtocol) => {
      // Navigate to ProtocolDetail to show completion modal
      setShowQuickSheet(false);
      navigation.navigate('ProtocolDetail', {
        protocolId: protocol.protocol_id,
        protocolName: protocol.protocol.name,
        moduleId: protocol.module_id || undefined,
        source: 'schedule',
      });
    },
    [navigation]
  );

  const handleQuickSheetAskAI = useCallback(
    (protocol: ScheduledProtocol) => {
      // Close quick sheet and open chat with protocol context
      setShowQuickSheet(false);
      setChatContext({
        type: 'protocol',
        protocolId: protocol.protocol_id,
        protocolName: protocol.protocol.name,
        mechanism: protocol.protocol.summary,
      });
      setShowChatModal(true);
    },
    []
  );

  const handleQuickSheetViewDetails = useCallback(
    (protocol: ScheduledProtocol) => {
      // Close quick sheet and navigate to full detail screen
      setShowQuickSheet(false);
      navigation.navigate('ProtocolDetail', {
        protocolId: protocol.protocol_id,
        protocolName: protocol.protocol.name,
        moduleId: protocol.module_id || undefined,
        source: 'schedule',
      });
    },
    [navigation]
  );

  const handleChatModalClose = useCallback(() => {
    setShowChatModal(false);
    setChatContext(undefined);
  }, []);

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
    // Navigate to Profile tab, then to Weekly Insights screen
    navigation.getParent()?.navigate('Profile', { screen: 'WeeklyInsights' });
  }, [navigation]);

  // Session 87: handleFocusStart removed - TodaysFocusCard consolidated into MyScheduleSection

  return (
    <View style={styles.root} testID="home-screen">
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} testID="home-scroll-view">
        {/* 1. Header with greeting and date */}
        <HomeHeader userName={userName} />

        {/* 2. Recovery Score Hero */}
        <View style={styles.section}>
          <SilentErrorBoundary>
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
          </SilentErrorBoundary>
        </View>

        {/* 2.5. Quick Health Stats - Session 85 */}
        <SilentErrorBoundary>
          <QuickHealthStats
            steps={healthMetrics?.steps ?? null}
            sleepHours={healthMetrics?.sleep.durationHours ?? null}
            hrv={healthMetrics?.hrv.avg ?? null}
            rhr={healthMetrics?.rhr.avg ?? null}
            loading={loadingHealthMetrics}
          />
        </SilentErrorBoundary>

        {/* Session 87: TodaysFocusCard removed - consolidated into MyScheduleSection */}
        {/* The "One Big Thing" philosophy preserved via pulsing border on due-now protocols */}

        {/* 3. Day Timeline (Horizontal) */}
        <View style={styles.section}>
          <SilentErrorBoundary>
            <DayTimeline
              tasks={tasks.filter((t) => t.scheduledAt)}
              onComplete={handleTaskComplete}
              onTaskPress={handleTaskPress}
              loading={loadingTasks}
            />
          </SilentErrorBoundary>
        </View>

        {/* 4. Today's Protocols - Session 87 (consolidated from TodaysFocusCard + MyScheduleSection) */}
        <View style={styles.section}>
          <SilentErrorBoundary>
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
          </SilentErrorBoundary>
        </View>

        {/* 5. Weekly Progress */}
        <View style={styles.section}>
          <SilentErrorBoundary>
            <WeeklyProgressCard
              protocols={weeklyProtocols}
              onSynthesisPress={handleSynthesisPress}
              loading={loadingWeekly}
            />
          </SilentErrorBoundary>
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

      {/* Session 86: Protocol Quick Sheet */}
      <ProtocolQuickSheet
        visible={showQuickSheet}
        protocol={quickSheetProtocol}
        onClose={handleQuickSheetClose}
        onMarkComplete={handleQuickSheetComplete}
        onAskAICoach={handleQuickSheetAskAI}
        onViewFullDetails={handleQuickSheetViewDetails}
        isCompleting={isCompletingProtocol}
      />

      {/* Session 86: AI Coach Modal with Protocol Context */}
      <ChatModal
        visible={showChatModal}
        onClose={handleChatModalClose}
        initialContext={chatContext}
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
