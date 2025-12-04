/**
 * AIThinkingState Component
 *
 * Displays an animated "thinking" indicator during AI processing.
 * Shows cycling messages with shimmer effect to indicate activity.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Session 12
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { ShimmerText } from './ShimmerText';
import { palette } from '../theme/palette';

/**
 * Messages that cycle during AI thinking
 * Changes every 3 seconds to show progress
 */
const THINKING_MESSAGES = [
  'Analyzing your data...',
  'Researching protocols...',
  'Tailoring to your needs...',
  'Almost there...',
];

/** Interval between message changes in ms */
const MESSAGE_INTERVAL = 3000;

interface AIThinkingStateProps {
  /** Whether the thinking animation is visible */
  visible: boolean;
  /** Compact variant for TaskList cards (smaller padding) */
  compact?: boolean;
  /** Custom messages to cycle through */
  messages?: string[];
  /** Custom interval between messages in ms */
  interval?: number;
}

/**
 * Animated pulsing dot component
 */
const PulsingDot: React.FC<{ delay: number; isAnimating: boolean }> = ({
  delay,
  isAnimating,
}) => {
  const opacity = useSharedValue(0.3);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isAnimating) {
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        )
      );
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1.2, { duration: 400, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        )
      );
    } else {
      opacity.value = withTiming(0.5, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [isAnimating, delay, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

/**
 * AIThinkingState shows an animated indicator during AI processing.
 * - Cycles through status messages every 3 seconds
 * - Uses shimmer animation on text
 * - Supports compact mode for inline use in cards
 */
export const AIThinkingState: React.FC<AIThinkingStateProps> = ({
  visible,
  compact = false,
  messages = THINKING_MESSAGES,
  interval = MESSAGE_INTERVAL,
}) => {
  const [messageIndex, setMessageIndex] = useState(0);

  // Cycle through messages
  useEffect(() => {
    if (!visible) {
      setMessageIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [visible, messages.length, interval]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.container,
        compact && styles.containerCompact,
      ]}
    >
      {/* Pulsing dot indicator */}
      <View style={styles.dotContainer}>
        <PulsingDot delay={0} isAnimating={visible} />
        <PulsingDot delay={150} isAnimating={visible} />
        <PulsingDot delay={300} isAnimating={visible} />
      </View>

      {/* Animated shimmer text */}
      <ShimmerText
        text={messages[messageIndex]}
        style={compact ? styles.textCompact : styles.text}
        isAnimating={visible}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  containerCompact: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.primary,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.textSecondary,
    textAlign: 'center',
  },
  textCompact: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.textSecondary,
    textAlign: 'center',
  },
});
