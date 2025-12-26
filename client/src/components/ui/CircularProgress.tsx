/**
 * CircularProgress Component
 *
 * An animated circular progress indicator using SVG.
 * Used for step counters, goals, and activity rings.
 *
 * Features:
 * - Smooth spring animation on progress change
 * - Customizable colors, size, and stroke width
 * - Optional center content slot
 * - Gradient fill support
 *
 * @file client/src/components/ui/CircularProgress.tsx
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { palette } from '../../theme/palette';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CircularProgressProps {
  /** Progress value from 0 to 1 */
  progress: number;
  /** Overall size (width & height) */
  size?: number;
  /** Stroke width of the ring */
  strokeWidth?: number;
  /** Background track color */
  trackColor?: string;
  /** Progress fill color */
  fillColor?: string;
  /** Secondary color for gradient (optional) */
  fillColorSecondary?: string;
  /** Content to render in center */
  children?: React.ReactNode;
  /** Whether to animate changes */
  animated?: boolean;
  /** Container style */
  style?: ViewStyle;
  /** Rotate start position (in degrees, 0 = top) */
  rotation?: number;
  /** Show glow effect when complete */
  glowOnComplete?: boolean;
}

export function CircularProgress({
  progress,
  size = 180,
  strokeWidth = 16,
  trackColor = palette.subtle,
  fillColor = palette.primary,
  fillColorSecondary,
  children,
  animated = true,
  style,
  rotation = -90,
  glowOnComplete = true,
}: CircularProgressProps): React.ReactElement {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));

  // Animated progress value
  const animatedProgress = useSharedValue(0);

  // Calculate ring dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Update animated value when progress changes
  useEffect(() => {
    if (animated) {
      animatedProgress.value = withSpring(clampedProgress, {
        damping: 20,
        stiffness: 90,
        mass: 1,
      });
    } else {
      animatedProgress.value = clampedProgress;
    }
  }, [clampedProgress, animated, animatedProgress]);

  // Animated stroke dash offset
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = interpolate(
      animatedProgress.value,
      [0, 1],
      [circumference, 0]
    );
    return {
      strokeDashoffset,
    };
  });

  // Determine if complete (for glow effect)
  const isComplete = clampedProgress >= 1;
  const effectiveFillColor = isComplete ? palette.success : fillColor;

  // Use gradient if secondary color provided
  const useGradient = !!fillColorSecondary;
  const gradientId = 'progressGradient';

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Glow effect when complete */}
      {glowOnComplete && isComplete && (
        <View
          style={[
            styles.glow,
            {
              width: size + 20,
              height: size + 20,
              borderRadius: (size + 20) / 2,
              backgroundColor: palette.success,
            },
          ]}
        />
      )}

      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: [{ rotate: `${rotation}deg` }] }}
      >
        {/* Gradient definition */}
        {useGradient && (
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={fillColor} />
              <Stop offset="100%" stopColor={fillColorSecondary} />
            </LinearGradient>
          </Defs>
        )}

        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress fill */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={useGradient ? `url(#${gradientId})` : effectiveFillColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>

      {/* Center content */}
      {children && (
        <View style={styles.centerContent}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    opacity: 0.15,
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CircularProgress;
