import React, { useEffect } from 'react';
import { TextStyle, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import { typography, fontFamily } from '../../theme/typography';
import { tokens } from '../../theme/tokens';

interface AnimatedNumberProps {
  /** The target value to animate to */
  value: number;
  /** Suffix to display after the number (e.g., '%', 'ms') */
  suffix?: string;
  /** Prefix to display before the number (e.g., '$', '+') */
  prefix?: string;
  /** Number of decimal places */
  decimals?: number;
  /** Duration of the count-up animation in ms (default: 500ms) */
  duration?: number;
  /** Text style - defaults to metricLarge */
  style?: TextStyle;
  /** Color override for the number */
  color?: string;
  /** Whether to animate (set false for reduced motion) */
  animated?: boolean;
  /** Called when animation completes */
  onAnimationComplete?: () => void;
}

/**
 * Animated Number Component
 *
 * Displays a number with a count-up animation.
 * Uses monospace font for metrics by default.
 */
export function AnimatedNumber({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = tokens.animation.metric,
  style,
  color,
  animated = true,
  onAnimationComplete,
}: AnimatedNumberProps): JSX.Element {
  const animatedValue = useSharedValue(animated ? 0 : value);

  useEffect(() => {
    if (animated) {
      animatedValue.value = withTiming(
        value,
        {
          duration,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        }
      );
    } else {
      animatedValue.value = value;
    }
  }, [value, animated, duration, onAnimationComplete, animatedValue]);

  // Derive the display text
  const displayText = useDerivedValue(() => {
    const rounded = decimals > 0
      ? animatedValue.value.toFixed(decimals)
      : Math.round(animatedValue.value).toString();
    return `${prefix}${rounded}${suffix}`;
  });

  // Since AnimatedText is complex, we'll use a workaround with state
  const [displayValue, setDisplayValue] = React.useState(
    `${prefix}${animated ? '0' : value.toFixed(decimals)}${suffix}`
  );

  useEffect(() => {
    if (!animated) {
      setDisplayValue(`${prefix}${value.toFixed(decimals)}${suffix}`);
      return;
    }

    // For animated values, we need to update state periodically
    const startTime = Date.now();
    const startValue = 0;
    const endValue = value;

    const updateDisplay = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeProgress;

      const formatted = decimals > 0
        ? currentValue.toFixed(decimals)
        : Math.round(currentValue).toString();

      setDisplayValue(`${prefix}${formatted}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(updateDisplay);
      } else if (onAnimationComplete) {
        onAnimationComplete();
      }
    };

    requestAnimationFrame(updateDisplay);
  }, [value, animated, duration, prefix, suffix, decimals, onAnimationComplete]);

  return (
    <Text
      style={[
        styles.number,
        typography.metricLarge,
        style,
        color ? { color } : undefined,
      ]}
    >
      {displayValue}
    </Text>
  );
}

/**
 * Simple static metric display (no animation)
 * Use this when you need consistent monospace display without animation
 */
export function MetricDisplay({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  style,
  color,
}: Omit<AnimatedNumberProps, 'duration' | 'animated' | 'onAnimationComplete'>): JSX.Element {
  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return (
    <Text
      style={[
        styles.number,
        typography.metricLarge,
        style,
        color ? { color } : undefined,
      ]}
    >
      {prefix}{formatted}{suffix}
    </Text>
  );
}

const styles = StyleSheet.create({
  number: {
    fontFamily: fontFamily.monoBold,
    textAlign: 'center',
  },
});

export default AnimatedNumber;
