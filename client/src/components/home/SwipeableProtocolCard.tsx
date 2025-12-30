/**
 * SwipeableProtocolCard
 *
 * Wrapper that adds swipe gestures to ScheduledProtocolCard.
 * - Swipe right (>80px) → Complete/Start (only when protocol is due)
 * - Swipe left (>80px) → Remove from schedule
 * - Tap → Open protocol detail sheet
 *
 * Session 104: Migrated from PanResponder to react-native-gesture-handler
 * to fix iOS gesture competition issues where taps were being captured
 * as swipes, preventing the detail sheet from opening.
 */

import React, { useCallback } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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

/** Maximum swipe distance (prevents over-swiping) */
const MAX_SWIPE = 120;

/** Minimum pan distance before pan gesture activates (allows taps to work) */
const PAN_ACTIVATION_THRESHOLD = 20;

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
 *
 * Uses react-native-gesture-handler for proper gesture arbitration on iOS.
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
  const hasTriggeredHaptic = useSharedValue(false);

  // Right swipe only enabled when protocol is due now
  const canSwipeRight = protocol.isDueNow && !!onSwipeRight;
  const canSwipeLeft = !!onSwipeLeft;

  /**
   * Handle tap - opens detail sheet
   */
  const handleTap = useCallback(() => {
    onPress(protocol);
  }, [onPress, protocol]);

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
   * Tap gesture - handles card press to open detail sheet
   * This runs on the native thread and properly arbitrates with pan
   */
  const tapGesture = Gesture.Tap()
    .enabled(!isUpdating)
    .onEnd(() => {
      'worklet';
      runOnJS(handleTap)();
    });

  /**
   * Pan gesture - handles horizontal swipes
   * Only activates after PAN_ACTIVATION_THRESHOLD to allow taps to work
   */
  const panGesture = Gesture.Pan()
    .enabled(!isUpdating)
    .activeOffsetX([-PAN_ACTIVATION_THRESHOLD, PAN_ACTIVATION_THRESHOLD])
    .failOffsetY([-15, 15]) // Fail if vertical movement exceeds 15px (scrolling)
    .onStart(() => {
      'worklet';
      hasTriggeredHaptic.value = false;
    })
    .onUpdate((event) => {
      'worklet';
      const { translationX } = event;

      // Clamp translation based on enabled directions
      let clampedX = translationX;
      if (translationX > 0 && !canSwipeRight) clampedX = 0;
      if (translationX < 0 && !canSwipeLeft) clampedX = 0;
      clampedX = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, clampedX));

      translateX.value = clampedX;

      // Trigger haptic when crossing threshold
      if (!hasTriggeredHaptic.value && Math.abs(translationX) >= SWIPE_THRESHOLD) {
        hasTriggeredHaptic.value = true;
        runOnJS(triggerHaptic)();
      }
    })
    .onEnd((event) => {
      'worklet';
      const { translationX } = event;

      if (translationX > SWIPE_THRESHOLD && canSwipeRight) {
        runOnJS(handleSwipeComplete)('right');
      } else if (translationX < -SWIPE_THRESHOLD && canSwipeLeft) {
        runOnJS(handleSwipeComplete)('left');
      }

      // Animate back to center
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 200,
      });
    })
    .onFinalize(() => {
      'worklet';
      // Ensure we spring back even if gesture is cancelled
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 200,
      });
    });

  /**
   * Composed gesture: Pan has priority, but tap wins if no significant horizontal movement
   * Gesture.Exclusive ensures only one gesture runs at a time
   */
  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

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

      {/* Swipeable card content with gesture handler */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.cardWrapper, cardStyle]}>
          <ScheduledProtocolCard
            protocol={protocol}
            onPress={() => {}} // Handled by gesture - pass no-op to satisfy prop type
            testID={testID ? `${testID}-card` : undefined}
          />
        </Animated.View>
      </GestureDetector>
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
