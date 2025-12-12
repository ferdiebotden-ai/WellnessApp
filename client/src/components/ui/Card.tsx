import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { palette } from '../../theme/palette';
import { elevation } from '../../theme/elevation';
import { tokens } from '../../theme/tokens';
import { haptic } from '../../utils/haptics';

export type CardVariant = 'default' | 'elevated' | 'highlighted' | 'hero' | 'glass';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  /** Whether to show press animation */
  animated?: boolean;
  /** Whether to trigger haptic feedback on press */
  hapticFeedback?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Base Card Component
 *
 * A premium card with elevation, press animations, and haptic feedback.
 * Uses 20px padding for premium spacing (not 16px).
 */
export function Card({
  children,
  variant = 'default',
  onPress,
  disabled = false,
  style,
  testID,
  animated = true,
  hapticFeedback = true,
}: CardProps): JSX.Element {
  const scale = useSharedValue(1);
  const isPressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    if (!disabled && animated) {
      scale.value = withTiming(0.98, { duration: tokens.animation.fast });
      isPressed.value = withTiming(1, { duration: tokens.animation.fast });
    }
    if (!disabled && hapticFeedback && onPress) {
      void haptic.light();
    }
  }, [disabled, animated, hapticFeedback, onPress, scale, isPressed]);

  const handlePressOut = useCallback(() => {
    if (animated) {
      scale.value = withTiming(1, { duration: tokens.animation.fast });
      isPressed.value = withTiming(0, { duration: tokens.animation.fast });
    }
  }, [animated, scale, isPressed]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      // Interpolate shadow based on press state (only for iOS)
      shadowOpacity: interpolate(isPressed.value, [0, 1], [0.12, 0.08]),
    };
  });

  const cardStyle = getCardStyle(variant);
  const elevationStyle = getElevationStyle(variant, !!onPress);

  // Non-pressable card
  if (!onPress) {
    return (
      <View
        style={[styles.base, cardStyle, elevationStyle, style]}
        testID={testID}
      >
        {children}
      </View>
    );
  }

  // Pressable card with animation
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      testID={testID}
      style={[
        styles.base,
        cardStyle,
        elevationStyle,
        disabled && styles.disabled,
        style,
        animated && animatedStyle,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

function getCardStyle(variant: CardVariant): ViewStyle {
  switch (variant) {
    case 'elevated':
      return styles.elevated;
    case 'highlighted':
      return styles.highlighted;
    case 'hero':
      return styles.hero;
    case 'glass':
      return styles.glass;
    default:
      return styles.default;
  }
}

function getElevationStyle(variant: CardVariant, isPressable: boolean): ViewStyle {
  switch (variant) {
    case 'hero':
      return elevation.hero;
    case 'glass':
      return elevation.modal;
    case 'elevated':
      return isPressable ? elevation.cardHover : elevation.card;
    default:
      return elevation.card;
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md, // 20px premium spacing
    overflow: 'hidden',
  },

  default: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.subtle,
  },

  elevated: {
    backgroundColor: palette.elevated,
    borderWidth: 1,
    borderColor: palette.subtle,
  },

  highlighted: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.primary,
  },

  hero: {
    backgroundColor: palette.surface,
    borderRadius: tokens.radius.lg, // 16px for hero
    padding: tokens.spacing.lg, // 28px for hero
  },

  glass: {
    backgroundColor: 'rgba(24, 28, 37, 0.85)', // glassMaterials.thin
    borderWidth: 0,
  },

  disabled: {
    opacity: 0.5,
  },
});

export default Card;
