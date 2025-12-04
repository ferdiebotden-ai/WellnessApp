/**
 * ShimmerText Component
 *
 * Animated text with a shimmer/pulse effect for AI "thinking" states.
 * Uses React Native Reanimated for smooth 60fps animations.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Session 12
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { palette } from '../theme/palette';

interface ShimmerTextProps {
  /** The text to display */
  text: string;
  /** Custom text style */
  style?: TextStyle;
  /** Animation duration in ms (default 1500) */
  duration?: number;
  /** Whether the animation is active */
  isAnimating?: boolean;
}

/**
 * ShimmerText displays text with a pulsing opacity animation
 * that creates a shimmer/breathing effect during AI processing.
 */
export const ShimmerText: React.FC<ShimmerTextProps> = ({
  text,
  style,
  duration = 1500,
  isAnimating = true,
}) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isAnimating) {
      // Pulse from full opacity to 50% and back
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.5, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1, // Infinite repeat
        false // Don't reverse (we handle it with sequence)
      );
    } else {
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [isAnimating, duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.text, style, animatedStyle]}>
      {text}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.textSecondary,
    textAlign: 'center',
  },
});
