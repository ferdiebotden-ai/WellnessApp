import React, { useCallback } from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '../theme/palette';
import { fontFamily } from '../theme/typography';
import { tokens } from '../theme/tokens';
import { haptic } from '../utils/haptics';
import { ThinkingDots } from './ui/ApexLoadingIndicator';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface PrimaryButtonProps extends Omit<PressableProps, 'style'> {
  /** Button label text */
  title: string;
  /** Show loading spinner */
  loading?: boolean;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
  /** Enable haptic feedback (default: true) */
  hapticFeedback?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Primary Button Component
 *
 * A premium button with press animation and haptic feedback.
 * - Primary: Teal background, dark text
 * - Secondary: Outlined with teal border
 * - Ghost: Text only, no background
 */
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  loading = false,
  disabled,
  variant = 'primary',
  style,
  textStyle,
  hapticFeedback = true,
  onPress,
  ...pressableProps
}) => {
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const handlePressIn = useCallback(() => {
    if (!isDisabled) {
      scale.value = withTiming(0.97, { duration: tokens.animation.fast });
      if (hapticFeedback) {
        void haptic.light();
      }
    }
  }, [isDisabled, hapticFeedback, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: tokens.animation.fast });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonStyle = getButtonStyle(variant);
  const buttonTextStyle = getTextStyle(variant);
  const loadingColor = getLoadingColor(variant);

  return (
    <AnimatedPressable
      style={[
        styles.button,
        buttonStyle,
        isDisabled && styles.buttonDisabled,
        style,
        animatedStyle,
      ]}
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...pressableProps}
    >
      {loading ? (
        <ThinkingDots color={loadingColor} size={6} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            buttonTextStyle,
            isDisabled && styles.buttonTextDisabled,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
};

function getButtonStyle(variant: ButtonVariant): ViewStyle {
  switch (variant) {
    case 'secondary':
      return styles.secondaryButton;
    case 'ghost':
      return styles.ghostButton;
    case 'destructive':
      return styles.destructiveButton;
    default:
      return styles.primaryButton;
  }
}

function getTextStyle(variant: ButtonVariant): TextStyle {
  switch (variant) {
    case 'secondary':
      return styles.secondaryButtonText;
    case 'ghost':
      return styles.ghostButtonText;
    case 'destructive':
      return styles.destructiveButtonText;
    default:
      return styles.primaryButtonText;
  }
}

function getLoadingColor(variant: ButtonVariant): string {
  switch (variant) {
    case 'secondary':
    case 'ghost':
      return palette.primary;
    case 'destructive':
      return palette.textPrimary; // White on error background
    default:
      return palette.canvas; // Dark on teal
  }
}

const styles = StyleSheet.create({
  button: {
    borderRadius: tokens.radius.md,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: tokens.touch.preferred, // 48px
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButton: {
    backgroundColor: palette.primary,
  },

  secondaryButton: {
    backgroundColor: palette.elevated,
    borderWidth: 1,
    borderColor: palette.primary,
  },

  ghostButton: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: tokens.touch.min, // 44px
  },

  destructiveButton: {
    backgroundColor: palette.error,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
  },

  primaryButtonText: {
    color: palette.canvas, // Dark text on teal background
  },

  secondaryButtonText: {
    color: palette.primary, // Teal text
  },

  ghostButtonText: {
    color: palette.primary, // Teal text
  },

  destructiveButtonText: {
    color: palette.textPrimary, // White text on error background
  },

  buttonTextDisabled: {
    opacity: 0.7,
  },
});

