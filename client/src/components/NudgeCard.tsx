import React, { useCallback, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { ThinkingDots } from './ui/ApexLoadingIndicator';
import { ProtocolCelebration } from './animations/ProtocolCelebration';
import type { DashboardTask } from '../types/dashboard';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { ReasoningExpansion } from './ReasoningExpansion';

interface Props {
  task: DashboardTask;
  onOutsideTap?: () => void;
  /** Callback when complete button is pressed */
  onComplete?: () => void;
  /** Callback when dismiss button is pressed */
  onDismiss?: () => void;
  /** Whether the nudge is currently being updated */
  isUpdating?: boolean;
  /** Whether to show action buttons (default: true for pending nudges) */
  showActions?: boolean;
}

/**
 * NudgeCard with expandable "Why?" reasoning panel
 * Displays nudge with 4-panel expansion: Mechanism, Evidence, Your Data, Confidence
 * Now includes action buttons for complete/dismiss (Phase 3 Session 6)
 */
export const NudgeCard: React.FC<Props> = ({
  task,
  onOutsideTap,
  onComplete,
  onDismiss,
  isUpdating = false,
  showActions,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const animatedHeight = useSharedValue(0);

  const timeLabel = task.scheduledAt
    ? task.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Anytime';

  const hasWhyExpansion = !!task.whyExpansion;

  // Determine if actions should be shown
  // Default: show for pending nudges only
  const shouldShowActions =
    showActions !== undefined
      ? showActions
      : task.status === 'pending' && (onComplete || onDismiss);

  // Check if task is in a terminal state
  const isTerminalState = task.status === 'completed' || task.status === 'dismissed';

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

  // Handle complete with celebration animation
  const handleCompletePress = useCallback(() => {
    setShowCelebration(true);
  }, []);

  // After celebration, call actual onComplete
  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    onComplete?.();
  }, [onComplete]);

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
              >
                <ReasoningExpansion
                  data={task.whyExpansion!}
                  edgeCases={task.edgeCases}
                />
              </View>
            )}

            {/* Animated expansion */}
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

        {/* Action footer with complete/dismiss buttons */}
        {shouldShowActions && !isTerminalState && (
          <View style={styles.actionFooter}>
            {isUpdating ? (
              <View style={styles.loadingContainer}>
                <ThinkingDots color={palette.primary} size={6} />
                <Text style={styles.loadingText}>Updating...</Text>
              </View>
            ) : (
              <>
                {onDismiss && (
                  <Pressable
                    onPress={onDismiss}
                    style={({ pressed }) => [
                      styles.actionButton,
                      styles.dismissButton,
                      pressed && styles.buttonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss nudge"
                    hitSlop={4}
                    testID="nudge-dismiss-button"
                  >
                    <Text style={styles.dismissIcon}>✕</Text>
                  </Pressable>
                )}
                {onComplete && (
                  <Pressable
                    onPress={handleCompletePress}
                    style={({ pressed }) => [
                      styles.actionButton,
                      styles.completeButton,
                      pressed && styles.buttonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Mark as complete"
                    hitSlop={4}
                    testID="nudge-complete-button"
                  >
                    <Text style={styles.completeIcon}>✓</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        )}

        {/* Celebration overlay */}
        {showCelebration && (
          <View style={styles.celebrationOverlay}>
            <ProtocolCelebration
              visible={showCelebration}
              onComplete={handleCelebrationComplete}
              size={80}
              duration={1000}
            />
          </View>
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
    pointerEvents: 'none',
  },
  // Action footer styles (Phase 3 Session 6)
  actionFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    gap: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    ...typography.caption,
    color: palette.textMuted,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButton: {
    backgroundColor: palette.errorMuted,
  },
  completeButton: {
    backgroundColor: palette.successMuted,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  dismissIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.error,
  },
  completeIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.success,
  },
  // Celebration overlay (Phase 7 Session 68)
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 18, 24, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
});
