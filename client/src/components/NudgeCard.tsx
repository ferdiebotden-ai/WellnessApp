import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import type { DashboardTask } from '../types/dashboard';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { ReasoningExpansion } from './ReasoningExpansion';

interface Props {
  task: DashboardTask;
  onOutsideTap?: () => void;
}

/**
 * NudgeCard with expandable "Why?" reasoning panel
 * Displays nudge with 4-panel expansion: Mechanism, Evidence, Your Data, Confidence
 */
export const NudgeCard: React.FC<Props> = ({ task, onOutsideTap }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const animatedHeight = useSharedValue(0);

  const timeLabel = task.scheduledAt
    ? task.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Anytime';

  const hasWhyExpansion = !!task.whyExpansion;

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && contentHeight === 0) {
      setContentHeight(height);
    }
  }, [contentHeight]);

  const toggleExpand = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    // Animate height with spring for smooth 200ms feel
    animatedHeight.value = withSpring(newExpanded ? 1 : 0, {
      damping: 20,
      stiffness: 200,
      overshootClamping: true,
    });
  }, [isExpanded, animatedHeight]);

  const collapse = useCallback(() => {
    if (isExpanded) {
      setIsExpanded(false);
      animatedHeight.value = withSpring(0, {
        damping: 20,
        stiffness: 200,
        overshootClamping: true,
      });
    }
  }, [isExpanded, animatedHeight]);

  // Animated style for the expansion container
  const expandStyle = useAnimatedStyle(() => {
    if (contentHeight === 0) {
      // Before measurement, keep hidden
      return { height: 0, opacity: 0, overflow: 'hidden' as const };
    }

    const height = interpolate(
      animatedHeight.value,
      [0, 1],
      [0, contentHeight]
    );

    const opacity = interpolate(
      animatedHeight.value,
      [0, 0.5, 1],
      [0, 0.5, 1]
    );

    return {
      height,
      opacity,
      overflow: 'hidden' as const,
    };
  });

  // Handle card press for collapse on outside tap
  const handleCardPress = useCallback(() => {
    if (isExpanded && onOutsideTap) {
      onOutsideTap();
    }
  }, [isExpanded, onOutsideTap]);

  return (
    <Pressable onPress={handleCardPress}>
      <View style={styles.card}>
        {/* Header row: Title + Checkmark */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{task.title}</Text>
            <Text style={styles.meta}>
              {task.source === 'schedule' ? 'Scheduled' : 'Live Nudge'} • {timeLabel}
            </Text>
          </View>
          {task.status === 'completed' && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>

        {/* Why? button (only if expansion data exists) */}
        {hasWhyExpansion && (
          <Pressable
            onPress={toggleExpand}
            style={styles.whyButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isExpanded ? 'Hide reasoning' : 'Show reasoning'}
            accessibilityState={{ expanded: isExpanded }}
          >
            <Text style={styles.whyText}>
              {isExpanded ? 'Hide' : 'Why?'}
            </Text>
          </Pressable>
        )}

        {/* Expandable reasoning panel */}
        {hasWhyExpansion && (
          <>
            {/* Hidden content for height measurement */}
            {contentHeight === 0 && (
              <View
                style={styles.hiddenMeasure}
                onLayout={handleContentLayout}
                pointerEvents="none"
              >
                <ReasoningExpansion data={task.whyExpansion!} />
              </View>
            )}

            {/* Animated expansion */}
            <Animated.View style={expandStyle}>
              {isExpanded && <ReasoningExpansion data={task.whyExpansion!} />}
            </Animated.View>
          </>
        )}
      </View>
    </Pressable>
  );
};

/**
 * Hook to manage outside tap collapse for multiple NudgeCards
 * Returns the currently expanded card ID and a setter
 */
export const useNudgeCardExpansion = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleExpand = useCallback((id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedId(null);
  }, []);

  return { expandedId, handleExpand, collapseAll };
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    gap: 6,
  },
  title: {
    ...typography.subheading,
    color: palette.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: 'uppercase',
  },
  checkmark: {
    ...typography.heading,
    color: palette.success,
    marginLeft: 12,
  },
  whyButton: {
    marginTop: 12,
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
  },
});
