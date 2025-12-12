import React, { useEffect } from 'react';
import { StyleSheet, View, Image, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { palette } from '../../theme/palette';

interface ApexLoadingIndicatorProps {
  /** Size of the logo in pixels (default: 48) */
  size?: number;
  /** Custom color for the glow effect */
  glowColor?: string;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Apex Loading Indicator
 *
 * A branded loading indicator using the Apex OS chevron logo
 * with a pulsing scale and glow animation.
 *
 * Use this instead of generic ActivityIndicator throughout the app.
 */
export function ApexLoadingIndicator({
  size = 48,
  glowColor = palette.primary,
  style,
}: ApexLoadingIndicatorProps): JSX.Element {
  const pulse = useSharedValue(0);

  useEffect(() => {
    // Breathing rhythm: 1.2s per cycle
    pulse.value = withRepeat(
      withTiming(1, {
        duration: 600,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // Infinite
      true // Reverse
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [0.95, 1.05]);
    const glowOpacity = interpolate(pulse.value, [0, 1], [0.3, 1]);

    return {
      transform: [{ scale }],
      shadowOpacity: glowOpacity,
    };
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            width: size,
            height: size,
            shadowColor: glowColor,
          },
          animatedStyle,
        ]}
      >
        <Image
          source={require('../../../assets/Logo/chevron-only.png')}
          style={{
            width: size,
            height: size,
          }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

/**
 * Thinking Dots - For AI processing states
 *
 * Shows 3 pulsing dots in a row, similar to typing indicators.
 */
export function ThinkingDots({
  color = palette.primary,
  size = 8,
  style,
}: {
  color?: string;
  size?: number;
  style?: ViewStyle;
}): JSX.Element {
  return (
    <View style={[styles.dotsContainer, style]}>
      <PulsingDot delay={0} color={color} size={size} />
      <PulsingDot delay={150} color={color} size={size} />
      <PulsingDot delay={300} color={color} size={size} />
    </View>
  );
}

function PulsingDot({
  delay,
  color,
  size,
}: {
  delay: number;
  color: string;
  size: number;
}): JSX.Element {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withRepeat(
        withTiming(1, { duration: 400 }),
        -1,
        true
      );
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * Full Screen Loading - Centered loading indicator with optional message
 */
export function FullScreenLoading({
  message,
  style,
}: {
  message?: string;
  style?: ViewStyle;
}): JSX.Element {
  return (
    <View style={[styles.fullScreen, style]}>
      <ApexLoadingIndicator size={64} />
      {message && (
        <Animated.Text style={styles.message}>{message}</Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
  },

  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
  },

  dot: {
    // Styles applied inline
  },

  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.canvas,
    gap: 24,
  },

  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
  },
});

export default ApexLoadingIndicator;
