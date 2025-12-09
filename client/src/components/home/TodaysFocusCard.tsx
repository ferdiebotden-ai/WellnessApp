/**
 * TodaysFocusCard
 *
 * AI-curated "One Big Thing" focus card for the home screen.
 * Shows the highest priority protocol with CTA button.
 *
 * @file client/src/components/home/TodaysFocusCard.tsx
 */

import React, { useCallback, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import type { TodaysFocus } from '../../hooks/useTodaysFocus';
import { ReasoningExpansion } from '../ReasoningExpansion';

interface Props {
  /** The focus data from useTodaysFocus */
  focus: TodaysFocus | null;
  /** Whether the user is in MVD mode */
  isMVD?: boolean;
  /** Callback when START NOW button is pressed */
  onStart?: (taskId: string) => void;
  /** Whether the card is in loading state */
  loading?: boolean;
  /** Test ID for testing */
  testID?: string;
}

export const TodaysFocusCard: React.FC<Props> = ({
  focus,
  isMVD = false,
  onStart,
  loading = false,
  testID = 'todays-focus-card',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const animatedHeight = useSharedValue(0);

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && contentHeight === 0) {
      setContentHeight(height);
    }
  }, [contentHeight]);

  const toggleExpand = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    animatedHeight.value = withSpring(newExpanded ? 1 : 0, {
      damping: 20,
      stiffness: 200,
      overshootClamping: true,
    });
  }, [isExpanded, animatedHeight]);

  const handleStart = useCallback(() => {
    if (focus && onStart) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onStart(focus.task.id);
    }
  }, [focus, onStart]);

  const expandStyle = useAnimatedStyle(() => {
    if (contentHeight === 0) {
      return { height: 0, opacity: 0, overflow: 'hidden' as const };
    }
    return {
      height: interpolate(animatedHeight.value, [0, 1], [0, contentHeight]),
      opacity: interpolate(animatedHeight.value, [0, 0.5, 1], [0, 0.5, 1]),
      overflow: 'hidden' as const,
    };
  });

  // Loading state
  if (loading) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Finding your focus...</Text>
        </View>
      </View>
    );
  }

  // Empty state - all tasks completed
  if (!focus) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>✓</Text>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyText}>
            No pending protocols. Check back later or explore new ones.
          </Text>
        </View>
      </View>
    );
  }

  const { task, reason, duration, personalizedContext } = focus;
  const hasExpansion = !!task.whyExpansion;

  return (
    <View style={styles.container} testID={testID}>
      {/* MVD Badge */}
      {isMVD && (
        <View style={styles.mvdBadge}>
          <Text style={styles.mvdText}>RECOVERY DAY</Text>
        </View>
      )}

      {/* Label */}
      <Text style={styles.label}>TODAY'S FOCUS</Text>

      {/* Protocol Title */}
      <Text style={styles.title} testID={`${testID}-title`}>
        {task.title}
      </Text>

      {/* Metadata Row: Duration + Reason */}
      <View style={styles.metaRow}>
        {duration && (
          <Text style={styles.duration}>{duration} min</Text>
        )}
        <Text style={styles.reason} numberOfLines={2}>
          {reason}
        </Text>
      </View>

      {/* Personalized Context */}
      {personalizedContext && (
        <Text style={styles.personalizedContext} numberOfLines={2}>
          {personalizedContext}
        </Text>
      )}

      {/* Why? Link (if expansion data exists) */}
      {hasExpansion && (
        <Pressable
          onPress={toggleExpand}
          style={styles.whyButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Hide details' : 'Show why'}
        >
          <Text style={styles.whyText}>
            {isExpanded ? 'Hide Details' : 'Why this?'}
          </Text>
        </Pressable>
      )}

      {/* Expandable reasoning */}
      {hasExpansion && (
        <>
          {contentHeight === 0 && (
            <View style={styles.hiddenMeasure} onLayout={handleContentLayout}>
              <ReasoningExpansion
                data={task.whyExpansion!}
                edgeCases={task.edgeCases}
              />
            </View>
          )}
          <Animated.View style={expandStyle}>
            {isExpanded && (
              <ReasoningExpansion
                data={task.whyExpansion!}
                edgeCases={task.edgeCases}
              />
            )}
          </Animated.View>
        </>
      )}

      {/* CTA Button */}
      <Pressable
        onPress={handleStart}
        style={({ pressed }) => [
          styles.startButton,
          pressed && styles.startButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Start ${task.title}`}
        testID={`${testID}-start-button`}
      >
        <Text style={styles.startButtonText}>START NOW</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: palette.textMuted,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
    color: palette.success,
    marginBottom: 8,
  },
  emptyTitle: {
    ...typography.subheading,
    color: palette.textPrimary,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.body,
    color: palette.textMuted,
    textAlign: 'center',
  },
  mvdBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${palette.accent}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  mvdText: {
    ...typography.caption,
    color: palette.accent,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  label: {
    ...typography.caption,
    color: palette.textMuted,
    letterSpacing: 1.2,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    ...typography.heading,
    color: palette.textPrimary,
    fontSize: 20,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  duration: {
    ...typography.caption,
    color: palette.primary,
    fontWeight: '600',
    backgroundColor: `${palette.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reason: {
    ...typography.body,
    color: palette.textSecondary,
    flex: 1,
  },
  personalizedContext: {
    ...typography.body,
    color: palette.primary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  whyButton: {
    marginTop: 4,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  whyText: {
    ...typography.body,
    color: palette.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  hiddenMeasure: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    right: 0,
    pointerEvents: 'none',
  },
  startButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  startButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  startButtonText: {
    ...typography.subheading,
    color: palette.background,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default TodaysFocusCard;
