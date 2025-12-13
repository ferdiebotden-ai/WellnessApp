/**
 * BreathingEmpty
 *
 * Subtle breathing animation for empty states.
 * Creates a calming, alive feel rather than static empty screens.
 *
 * Animation: Scale 0.98 → 1.02, opacity 0.8 → 1.0, 3s infinite cycle
 * Respects reduced motion preferences.
 *
 * @file client/src/components/animations/BreathingEmpty.tsx
 * @author Claude Opus 4.5 (Session 68)
 * @created December 13, 2025
 */

import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { palette } from '../../theme/palette';

// =============================================================================
// TYPES
// =============================================================================

interface Props {
  /** Content to wrap with breathing animation */
  children: React.ReactNode;
  /** Additional container styles */
  style?: ViewStyle;
  /** Animation duration in ms (default: 3000) */
  duration?: number;
  /** Scale range (default: [0.98, 1.02]) */
  scaleRange?: [number, number];
  /** Opacity range (default: [0.85, 1.0]) */
  opacityRange?: [number, number];
  /** Whether animation is enabled (default: true) */
  enabled?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_DURATION = 3000;
const DEFAULT_SCALE_RANGE: [number, number] = [0.98, 1.02];
const DEFAULT_OPACITY_RANGE: [number, number] = [0.85, 1.0];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const BreathingEmpty: React.FC<Props> = ({
  children,
  style,
  duration = DEFAULT_DURATION,
  scaleRange = DEFAULT_SCALE_RANGE,
  opacityRange = DEFAULT_OPACITY_RANGE,
  enabled = true,
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Check for reduced motion preference
  useEffect(() => {
    const checkReducedMotion = async () => {
      const isReduced = await AccessibilityInfo.isReduceMotionEnabled();
      setReducedMotion(isReduced);
    };
    checkReducedMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Start/stop animation based on enabled state and reduced motion
  useEffect(() => {
    if (!enabled || reducedMotion) {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = 1;
      opacity.value = 1;
      return;
    }

    const halfDuration = duration / 2;

    // Scale breathing: 1 → min → max → 1
    scale.value = withRepeat(
      withSequence(
        withTiming(scaleRange[0], {
          duration: halfDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(scaleRange[1], {
          duration: halfDuration,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1, // Infinite
      true // Reverse
    );

    // Opacity breathing: 1 → min → max → 1
    opacity.value = withRepeat(
      withSequence(
        withTiming(opacityRange[0], {
          duration: halfDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(opacityRange[1], {
          duration: halfDuration,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [enabled, reducedMotion, duration, scale, opacity, scaleRange, opacityRange]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // If reduced motion or disabled, render without animation
  if (reducedMotion || !enabled) {
    return (
      <Animated.View style={[styles.container, style]}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BreathingEmpty;
