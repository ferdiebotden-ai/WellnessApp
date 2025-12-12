import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette, getRecoveryColor } from '../../theme/palette';
import { tokens } from '../../theme/tokens';

interface ProgressBarProps {
  /** Progress value (0-1 or 0-100 depending on max) */
  progress: number;
  /** Maximum value (default: 1 for 0-1 range, or 100 for percentage) */
  max?: number;
  /** Height of the progress bar */
  height?: number;
  /** Background color of the track */
  trackColor?: string;
  /** Fill color of the progress */
  fillColor?: string;
  /** Use recovery zone colors based on progress percentage */
  useZoneColors?: boolean;
  /** Duration of the fill animation in ms */
  duration?: number;
  /** Whether to animate */
  animated?: boolean;
  /** Border radius (default: height/2 for pill shape) */
  borderRadius?: number;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Animated Progress Bar Component
 *
 * Displays progress with an animated fill.
 * Can use recovery zone colors based on percentage.
 */
export function ProgressBar({
  progress,
  max = 1,
  height = 6,
  trackColor = palette.subtle,
  fillColor,
  useZoneColors = false,
  duration = 400,
  animated = true,
  borderRadius,
  style,
}: ProgressBarProps): JSX.Element {
  const progressPercent = Math.min(Math.max(progress / max, 0), 1);
  const animatedProgress = useSharedValue(animated ? 0 : progressPercent);

  // Determine fill color
  const actualFillColor = useZoneColors
    ? getRecoveryColor(progressPercent * 100)
    : fillColor || palette.primary;

  useEffect(() => {
    if (animated) {
      animatedProgress.value = withTiming(progressPercent, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      animatedProgress.value = progressPercent;
    }
  }, [progressPercent, animated, duration, animatedProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  const actualBorderRadius = borderRadius ?? height / 2;

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor,
          borderRadius: actualBorderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: actualFillColor,
            borderRadius: actualBorderRadius,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

/**
 * Recovery Progress Bar - Pre-configured with zone colors
 */
export function RecoveryProgressBar({
  score,
  style,
}: {
  score: number;
  style?: ViewStyle;
}): JSX.Element {
  return (
    <ProgressBar
      progress={score}
      max={100}
      height={6}
      useZoneColors
      style={style}
    />
  );
}

/**
 * Adherence Progress Bar - For protocol adherence (e.g., 5/7 days)
 */
export function AdherenceProgressBar({
  completed,
  total,
  style,
}: {
  completed: number;
  total: number;
  style?: ViewStyle;
}): JSX.Element {
  return (
    <ProgressBar
      progress={completed}
      max={total}
      height={4}
      fillColor={palette.primary}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

export default ProgressBar;
