/**
 * DayTimeline
 *
 * Horizontal Bloomberg-style timeline showing today's protocols.
 * Features time dots and scrollable protocol cards.
 *
 * @file client/src/components/home/DayTimeline.tsx
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import type { DashboardTask } from '../../types/dashboard';

interface Props {
  /** Tasks from useTaskFeed */
  tasks: DashboardTask[];
  /** Callback when a task is completed */
  onComplete?: (task: DashboardTask) => void;
  /** Callback when a task card is pressed */
  onTaskPress?: (task: DashboardTask) => void;
  /** Whether the component is loading */
  loading?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Time slots for the timeline axis
 */
const TIME_SLOTS = [
  { hour: 7, label: '7am' },
  { hour: 10, label: '10am' },
  { hour: 13, label: '1pm' },
  { hour: 17, label: '5pm' },
  { hour: 21, label: '9pm' },
];

/**
 * Get the time slot index for a given hour
 */
const getTimeSlotIndex = (hour: number): number => {
  if (hour < 9) return 0;
  if (hour < 12) return 1;
  if (hour < 15) return 2;
  if (hour < 19) return 3;
  return 4;
};

/**
 * Get current hour
 */
const getCurrentHour = (): number => new Date().getHours();

/**
 * Check if a time slot is past
 */
const isSlotPast = (slotHour: number): boolean => {
  return getCurrentHour() > slotHour + 2;
};

/**
 * Check if a time slot is current (within 2 hours)
 */
const isSlotCurrent = (slotHour: number): boolean => {
  const currentHour = getCurrentHour();
  return currentHour >= slotHour - 1 && currentHour <= slotHour + 2;
};

/**
 * Pulsing dot for current time slot
 */
const PulsingDot: React.FC<{ active: boolean }> = ({ active }) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (active) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      opacity.value = 1;
    }
  }, [active, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!active) return null;

  return (
    <Animated.View style={[styles.pulsingRing, animatedStyle]} />
  );
};

/**
 * Timeline dot component
 */
const TimelineDot: React.FC<{
  slot: typeof TIME_SLOTS[0];
  isCurrent: boolean;
  isPast: boolean;
  hasTask: boolean;
}> = ({ slot, isCurrent, isPast, hasTask }) => {
  return (
    <View style={styles.dotContainer}>
      <View style={styles.dotWrapper}>
        <PulsingDot active={isCurrent} />
        <View
          style={[
            styles.dot,
            isPast && styles.dotPast,
            isCurrent && styles.dotCurrent,
            hasTask && !isPast && styles.dotWithTask,
          ]}
        />
      </View>
      <Text style={[styles.dotLabel, isPast && styles.dotLabelPast]}>
        {slot.label}
      </Text>
    </View>
  );
};

/**
 * Protocol card for the timeline
 */
const TimelineCard: React.FC<{
  task: DashboardTask;
  onComplete?: () => void;
  onPress?: () => void;
}> = ({ task, onComplete, onPress }) => {
  const isCompleted = task.status === 'completed';

  const handleComplete = useCallback(() => {
    if (!isCompleted && onComplete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    }
  }, [isCompleted, onComplete]);

  // Extract duration from title if present
  const durationMatch = task.title.match(/(\d+)\s*min/i);
  const duration = durationMatch ? `${durationMatch[1]} min` : '';

  // Get time label
  const timeLabel = task.scheduledAt
    ? task.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isCompleted && styles.cardCompleted,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <Text
          style={[styles.cardTitle, isCompleted && styles.cardTitleCompleted]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
      </View>

      <View style={styles.cardMeta}>
        {timeLabel && <Text style={styles.cardTime}>{timeLabel}</Text>}
        {duration && <Text style={styles.cardDuration}>{duration}</Text>}
      </View>

      {!isCompleted && onComplete && (
        <Pressable
          onPress={handleComplete}
          style={({ pressed }) => [
            styles.completeButton,
            pressed && styles.completeButtonPressed,
          ]}
          hitSlop={8}
        >
          <Text style={styles.completeButtonText}>Done</Text>
        </Pressable>
      )}
    </Pressable>
  );
};

export const DayTimeline: React.FC<Props> = ({
  tasks,
  onComplete,
  onTaskPress,
  loading = false,
  testID = 'day-timeline',
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const currentHour = getCurrentHour();

  // Group tasks by time slot
  const tasksBySlot = useMemo(() => {
    const grouped: Record<number, DashboardTask[]> = {};

    tasks.forEach((task) => {
      if (task.scheduledAt) {
        const hour = task.scheduledAt.getHours();
        const slotIndex = getTimeSlotIndex(hour);
        if (!grouped[slotIndex]) grouped[slotIndex] = [];
        grouped[slotIndex].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  // Check which slots have tasks
  const slotsWithTasks = useMemo(() => {
    return TIME_SLOTS.map((_, index) => (tasksBySlot[index]?.length ?? 0) > 0);
  }, [tasksBySlot]);

  // Auto-scroll to current time on mount
  useEffect(() => {
    const currentSlotIndex = getTimeSlotIndex(currentHour);
    // Scroll to show current time slot
    const scrollX = Math.max(0, currentSlotIndex * 80 - 40);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: scrollX, animated: true });
    }, 100);
  }, [currentHour]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.container} testID={testID}>
        <Text style={styles.sectionTitle}>TODAY'S SCHEDULE</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <View style={styles.container} testID={testID}>
        <Text style={styles.sectionTitle}>TODAY'S SCHEDULE</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No scheduled protocols yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.sectionTitle}>TODAY'S SCHEDULE</Text>

      {/* Timeline axis */}
      <View style={styles.timelineAxis}>
        <View style={styles.timelineLine} />
        <View style={styles.dotsRow}>
          {TIME_SLOTS.map((slot, index) => (
            <TimelineDot
              key={slot.hour}
              slot={slot}
              isCurrent={isSlotCurrent(slot.hour)}
              isPast={isSlotPast(slot.hour)}
              hasTask={slotsWithTasks[index]}
            />
          ))}
        </View>
      </View>

      {/* Scrollable protocol cards */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}
        testID={`${testID}-scroll`}
      >
        {tasks.map((task) => (
          <TimelineCard
            key={task.id}
            task={task}
            onComplete={onComplete ? () => onComplete(task) : undefined}
            onPress={onTaskPress ? () => onTaskPress(task) : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sectionTitle: {
    ...typography.caption,
    color: palette.textMuted,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  loadingContainer: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: palette.textMuted,
  },
  emptyContainer: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: palette.textMuted,
  },

  // Timeline axis
  timelineAxis: {
    height: 48,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 8,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: palette.elevated,
    borderRadius: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  dotContainer: {
    alignItems: 'center',
    width: 50,
  },
  dotWrapper: {
    position: 'relative',
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.elevated,
  },
  dotPast: {
    backgroundColor: palette.textMuted,
  },
  dotCurrent: {
    backgroundColor: palette.primary,
  },
  dotWithTask: {
    backgroundColor: palette.primary,
  },
  dotLabel: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 4,
    fontSize: 10,
  },
  dotLabelPast: {
    color: palette.textMuted,
    opacity: 0.6,
  },
  pulsingRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.primary,
  },

  // Cards
  cardsContainer: {
    paddingHorizontal: 4,
    gap: 12,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 14,
    width: 160,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  cardCompleted: {
    opacity: 0.7,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    ...typography.subheading,
    color: palette.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  cardTitleCompleted: {
    textDecorationLine: 'line-through',
    color: palette.textMuted,
  },
  checkmark: {
    fontSize: 16,
    color: palette.success,
    fontWeight: '700',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  cardTime: {
    ...typography.caption,
    color: palette.textMuted,
  },
  cardDuration: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: '500',
  },
  completeButton: {
    backgroundColor: palette.successMuted,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  completeButtonPressed: {
    opacity: 0.7,
  },
  completeButtonText: {
    ...typography.caption,
    color: palette.success,
    fontWeight: '600',
  },
});

export default DayTimeline;
