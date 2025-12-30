/**
 * SwipeableProtocolCard
 *
 * Wrapper that adds swipe gestures to ScheduledProtocolCard.
 * - Swipe right (>80px) → Complete/Start (only when protocol is due)
 * - Swipe left (>80px) → Remove from schedule
 *
 * Uses PanResponder + Reanimated for cross-platform compatibility.
 */

import React, { useCallback, useRef } from 'react';
import {
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import { ScheduledProtocolCard } from './ScheduledProtocolCard';
import type { ScheduledProtocol } from '../../hooks/useEnrolledProtocols';

/** Minimum swipe distance to trigger action */
const SWIPE_THRESHOLD = 80;

/** Minimum distance to START capturing gesture (prevents tap interference on iOS) */
const SWIPE_THRESHOLD_START = 25;

/** Maximum swipe distance (prevents over-swiping) */
const MAX_SWIPE = 120;

interface SwipeableProtocolCardProps {
  /** Protocol data */
  protocol: ScheduledProtocol;
  /** Called when card is tapped (navigate to detail) */
  onPress: (protocol: ScheduledProtocol) => void;
  /** Called when user swipes right (complete/start protocol) */
  onSwipeRight?: (protocol: ScheduledProtocol) => void;
  /** Called when user swipes left (unenroll/remove from schedule) */
  onSwipeLeft?: (protocol: ScheduledProtocol) => void;
  /** Whether the card is currently being updated */
  isUpdating?: boolean;
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
 * Swipeable wrapper for protocol cards.
 * Only enables right swipe when protocol is due (isDueNow).
 */
export const SwipeableProtocolCard: React.FC<SwipeableProtocolCardProps> = ({
  protocol,
  onPress,
  onSwipeRight,
  onSwipeLeft,
  isUpdating = false,
  testID,
}) => {
  const translateX = useSharedValue(0);
  const hasTriggeredHaptic = useRef(false);

  // Right swipe only enabled when protocol is due now
  const canSwipeRight = protocol.isDueNow && !!onSwipeRight;
  const canSwipeLeft = !!onSwipeLeft;

  /**
   * Handle swipe completion.
   */
  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'right' && canSwipeRight) {
        onSwipeRight?.(protocol);
      } else if (direction === 'left' && canSwipeLeft) {
        onSwipeLeft?.(protocol);
      }
    },
    [protocol, onSwipeRight, onSwipeLeft, canSwipeRight, canSwipeLeft]
  );

  /**
   * PanResponder for handling swipe gestures.
   */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy, vx } = gestureState;
        // Only respond to horizontal swipes when not updating
        if (isUpdating) return false;

        // Session 103: Higher threshold (25px vs 10px) + velocity check
        // This prevents accidental gesture capture from finger drift during taps on iOS
        // Normal tap drift is 5-15px; intentional swipes exceed 25px with velocity
        const isIntentionalSwipe =
          Math.abs(dx) > Math.abs(dy) &&
          Math.abs(dx) > SWIPE_THRESHOLD_START &&
          Math.abs(vx) > 0.1; // Require some velocity (intentional movement)

        if (!isIntentionalSwipe) return false;

        // Only allow swipes in enabled directions
        const swipingRight = dx > 0;
        const swipingLeft = dx < 0;

        return (swipingRight && canSwipeRight) || (swipingLeft && canSwipeLeft);
      },
      onPanResponderGrant: () => {
        hasTriggeredHaptic.current = false;
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx } = gestureState;

        // Clamp translation based on enabled directions
        let clampedDx = dx;
        if (dx > 0 && !canSwipeRight) clampedDx = 0;
        if (dx < 0 && !canSwipeLeft) clampedDx = 0;
        clampedDx = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, clampedDx));

        translateX.value = clampedDx;

        // Trigger haptic when crossing threshold
        if (!hasTriggeredHaptic.current && Math.abs(dx) >= SWIPE_THRESHOLD) {
          hasTriggeredHaptic.current = true;
          runOnJS(triggerHaptic)();
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;

        if (dx > SWIPE_THRESHOLD && canSwipeRight) {
          runOnJS(handleSwipeComplete)('right');
        } else if (dx < -SWIPE_THRESHOLD && canSwipeLeft) {
          runOnJS(handleSwipeComplete)('left');
        }

        // Animate back to center
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
        });
      },
      onPanResponderTerminate: () => {
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
   * Animated style for left action (remove) indicator.
   */
  const leftActionStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.abs(Math.min(0, translateX.value)) / SWIPE_THRESHOLD);
    return {
      opacity: progress,
      transform: [{ scale: 0.8 + progress * 0.2 }],
    };
  });

  /**
   * Animated style for right action (start) indicator.
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
      {/* Left action indicator (Remove - shown when swiping left) */}
      {canSwipeLeft && (
        <View style={[styles.actionContainer, styles.leftAction]}>
          <Animated.View style={[styles.actionContent, leftActionStyle]}>
            <Text style={styles.removeIcon}>✕</Text>
            <Text style={styles.actionLabel}>Remove</Text>
          </Animated.View>
        </View>
      )}

      {/* Right action indicator (Start - shown when swiping right, only if due now) */}
      {canSwipeRight && (
        <View style={[styles.actionContainer, styles.rightAction]}>
          <Animated.View style={[styles.actionContent, rightActionStyle]}>
            <Text style={styles.startIcon}>▶</Text>
            <Text style={[styles.actionLabel, styles.startLabel]}>Start</Text>
          </Animated.View>
        </View>
      )}

      {/* Swipeable card content */}
      <Animated.View
        style={[styles.cardWrapper, cardStyle]}
        {...panResponder.panHandlers}
      >
        <ScheduledProtocolCard
          protocol={protocol}
          onPress={onPress}
          testID={testID ? `${testID}-card` : undefined}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
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
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  rightAction: {
    left: 0,
    backgroundColor: `${palette.primary}20`, // 20% opacity teal
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  actionContent: {
    alignItems: 'center',
    gap: 4,
  },
  removeIcon: {
    fontSize: 24,
    color: palette.error,
    fontWeight: '700',
  },
  startIcon: {
    fontSize: 20,
    color: palette.primary,
    fontWeight: '700',
  },
  actionLabel: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  startLabel: {
    color: palette.primary,
  },
});

export default SwipeableProtocolCard;
