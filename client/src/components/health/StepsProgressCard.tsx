/**
 * StepsProgressCard Component
 *
 * Displays daily step count with a circular progress ring.
 * Apple Watch-style activity ring visualization.
 *
 * Features:
 * - Animated circular progress ring
 * - Step count with goal tracking
 * - Trend indicator vs yesterday
 * - Celebratory animation when goal met
 *
 * @file client/src/components/health/StepsProgressCard.tsx
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  useSharedValue,
} from 'react-native-reanimated';
import { CircularProgress } from '../ui/CircularProgress';
import { palette } from '../../theme/palette';
import { typography, fontFamily } from '../../theme/typography';

export interface StepsProgressCardProps {
  /** Current step count */
  steps: number | null;
  /** Daily step goal */
  goal?: number;
  /** Yesterday's step count for trend */
  yesterdaySteps?: number | null;
  /** Callback when card is pressed */
  onPress?: () => void;
  /** Whether data is loading */
  loading?: boolean;
}

export function StepsProgressCard({
  steps,
  goal = 10000,
  yesterdaySteps,
  onPress,
  loading = false,
}: StepsProgressCardProps): React.ReactElement {
  // Calculate progress
  const progress = useMemo(() => {
    if (steps === null || steps === undefined) return 0;
    return Math.min(steps / goal, 1);
  }, [steps, goal]);

  // Calculate trend vs yesterday
  const trend = useMemo(() => {
    if (steps === null || yesterdaySteps === null || yesterdaySteps === undefined) {
      return null;
    }
    const diff = steps - yesterdaySteps;
    const percentDiff = yesterdaySteps > 0
      ? Math.round((diff / yesterdaySteps) * 100)
      : 0;
    return {
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
      diff: Math.abs(diff),
      percent: Math.abs(percentDiff),
    };
  }, [steps, yesterdaySteps]);

  // Format step count with commas
  const formattedSteps = useMemo(() => {
    if (steps === null) return '--';
    return steps.toLocaleString();
  }, [steps]);

  // Goal completion percentage
  const percentComplete = Math.round(progress * 100);
  const isGoalMet = progress >= 1;

  // Determine ring color based on progress
  const ringColor = useMemo(() => {
    if (isGoalMet) return palette.success;
    if (progress >= 0.75) return palette.primary;
    if (progress >= 0.5) return palette.warning;
    return palette.primary;
  }, [progress, isGoalMet]);

  // Trend icon and color
  const trendIcon = trend?.direction === 'up' ? 'arrow-up' : trend?.direction === 'down' ? 'arrow-down' : 'remove';
  const trendColor = trend?.direction === 'up' ? palette.success : trend?.direction === 'down' ? palette.error : palette.textMuted;

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingRing} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Steps: ${formattedSteps} of ${goal.toLocaleString()} goal. ${percentComplete}% complete.`}
      testID="steps-progress-card"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="footsteps" size={18} color={palette.primary} />
          <Text style={styles.title}>STEPS</Text>
        </View>
        {trend && (
          <View style={styles.trendBadge}>
            <Ionicons name={trendIcon as any} size={12} color={trendColor} />
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trend.percent}%
            </Text>
          </View>
        )}
      </View>

      {/* Circular Progress */}
      <View style={styles.ringContainer}>
        <CircularProgress
          progress={progress}
          size={160}
          strokeWidth={14}
          fillColor={ringColor}
          trackColor={palette.subtle}
          glowOnComplete={true}
        >
          <View style={styles.ringContent}>
            <Text style={styles.stepCount}>{formattedSteps}</Text>
            <Text style={styles.goalText}>
              of {goal.toLocaleString()}
            </Text>
          </View>
        </CircularProgress>
      </View>

      {/* Footer with percentage */}
      <View style={styles.footer}>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${percentComplete}%`, backgroundColor: ringColor },
            ]}
          />
        </View>
        <View style={styles.footerTextRow}>
          <Text style={styles.percentText}>
            {percentComplete}% of daily goal
          </Text>
          {isGoalMet && (
            <View style={styles.goalMetBadge}>
              <Ionicons name="checkmark-circle" size={14} color={palette.success} />
              <Text style={styles.goalMetText}>Goal met!</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  containerPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  loadingRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 14,
    borderColor: palette.subtle,
  },
  loadingText: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...typography.label,
    color: palette.textMuted,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.elevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    ...typography.caption,
    fontWeight: '600',
  },
  ringContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  ringContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCount: {
    fontFamily: fontFamily.monoBold,
    fontSize: 32,
    color: palette.textPrimary,
    letterSpacing: -1,
  },
  goalText: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: 2,
  },
  footer: {
    marginTop: 16,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: palette.subtle,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  footerTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentText: {
    ...typography.caption,
    color: palette.textMuted,
  },
  goalMetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalMetText: {
    ...typography.caption,
    color: palette.success,
    fontWeight: '600',
  },
});

export default StepsProgressCard;
