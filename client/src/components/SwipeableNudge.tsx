/**
 * SwipeableNudge
 *
 * Wrapper component that adds swipe gestures to nudge cards.
 * - Swipe right (>80px) → Complete (teal confirmation)
 * - Swipe left (>80px) → Dismiss (muted red)
 *
 * Uses PanResponder + Reanimated for cross-platform compatibility.
 *
 * Reference: Phase 3 Session 6 - Real-time Sync
 */

import React, { useCallback, useRef } from 'react';
import {
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

/** Minimum swipe distance to trigger action */
const SWIPE_THRESHOLD = 80;

/** Maximum swipe distance (prevents over-swiping) */
const MAX_SWIPE = 120;

/** Screen width for calculations */
const SCREEN_WIDTH = Dimensions.get('window').width;

interface SwipeableNudgeProps {
  /** Content to render inside the swipeable container */
  children: React.ReactNode;
  /** Called when user swipes right past threshold */
  onSwipeRight?: () => void;
  /** Called when user swipes left past threshold */
  onSwipeLeft?: () => void;
  /** Whether the nudge is currently being updated */
  isUpdating?: boolean;
  /** Whether swipe gestures are disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Trigger haptic feedback on threshold crossing.
 * Safe for web (no-op if haptics unavailable).
 */
const triggerHaptic = () => {
  if (Platform.OS === 'web') return;
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Haptics not available
  }
};

/**
 * Swipeable wrapper for nudge cards.
 * Reveals action indicators on swipe and triggers callbacks.
 */
export const SwipeableNudge: React.FC<SwipeableNudgeProps> = ({
  children,
  onSwipeRight,
  onSwipeLeft,
  isUpdating = false,
  disabled = false,
  testID,
}) => {
  const translateX = useSharedValue(0);
  const hasTriggeredHaptic = useRef(false);

  /**
   * Handle swipe completion.
   */
  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'right' && onSwipeRight) {
        onSwipeRight();
      } else if (direction === 'left' && onSwipeLeft) {
        onSwipeLeft();
      }
    },
    [onSwipeRight, onSwipeLeft]
  );

  /**
   * PanResponder for handling swipe gestures.
   */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        const { dx, dy } = gestureState;
        return !disabled && !isUpdating && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onPanResponderGrant: () => {
        hasTriggeredHaptic.current = false;
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx } = gestureState;

        // Clamp translation
        const clampedDx = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, dx));
        translateX.value = clampedDx;

        // Trigger haptic when crossing threshold
        if (!hasTriggeredHaptic.current && Math.abs(dx) >= SWIPE_THRESHOLD) {
          hasTriggeredHaptic.current = true;
          runOnJS(triggerHaptic)();
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;

        if (dx > SWIPE_THRESHOLD && onSwipeRight) {
          // Swipe right → Complete
          runOnJS(handleSwipeComplete)('right');
        } else if (dx < -SWIPE_THRESHOLD && onSwipeLeft) {
          // Swipe left → Dismiss
          runOnJS(handleSwipeComplete)('left');
        }

        // Animate back to center
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
        });
      },
      onPanResponderTerminate: () => {
        // Reset on cancel
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
        });
      },
    })
  ).current;

  /**
   * Animated style for the card container.
   */
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  /**
   * Animated style for left action (dismiss) indicator.
   */
  const leftActionStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.abs(Math.min(0, translateX.value)) / SWIPE_THRESHOLD);
    return {
      opacity: progress,
      transform: [{ scale: 0.8 + progress * 0.2 }],
    };
  });

  /**
   * Animated style for right action (complete) indicator.
   */
  const rightActionStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.max(0, translateX.value) / SWIPE_THRESHOLD);
    return {
      opacity: progress,
      transform: [{ scale: 0.8 + progress * 0.2 }],
    };
  });

  return (
    <View style={styles.container} testID={testID}>
      {/* Left action indicator (Dismiss - shown when swiping left) */}
      <View style={[styles.actionContainer, styles.leftAction]}>
        <Animated.View style={[styles.actionContent, leftActionStyle]}>
          <Text style={styles.dismissIcon}>✕</Text>
          <Text style={styles.actionLabel}>Dismiss</Text>
        </Animated.View>
      </View>

      {/* Right action indicator (Complete - shown when swiping right) */}
      <View style={[styles.actionContainer, styles.rightAction]}>
        <Animated.View style={[styles.actionContent, rightActionStyle]}>
          <Text style={styles.completeIcon}>✓</Text>
          <Text style={[styles.actionLabel, styles.completeLabel]}>Complete</Text>
        </Animated.View>
      </View>

      {/* Swipeable card content */}
      <Animated.View
        style={[styles.cardWrapper, cardStyle]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  cardWrapper: {
    zIndex: 2,
    backgroundColor: palette.background,
  },
  actionContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: MAX_SWIPE + 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  leftAction: {
    right: 0,
    backgroundColor: palette.errorMuted,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  rightAction: {
    left: 0,
    backgroundColor: palette.successMuted,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  actionContent: {
    alignItems: 'center',
    gap: 4,
  },
  dismissIcon: {
    fontSize: 24,
    color: palette.error,
    fontWeight: '700',
  },
  completeIcon: {
    fontSize: 24,
    color: palette.success,
    fontWeight: '700',
  },
  actionLabel: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  completeLabel: {
    color: palette.success,
  },
});

export default SwipeableNudge;
