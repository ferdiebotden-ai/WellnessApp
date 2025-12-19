import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { palette } from '../theme/palette';
import { fontFamily } from '../theme/typography';
import { tokens } from '../theme/tokens';

interface FormInputProps extends TextInputProps {
  /** Label text above the input */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Container style override */
  containerStyle?: ViewStyle;
  /** Helper text below the input */
  helperText?: string;
}

/**
 * Form Input Component
 *
 * A styled text input with label, error, and focus states.
 * Uses elevated background with subtle border, teal focus indicator.
 */
export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={palette.textMuted}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...textInputProps}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && helperText && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },

  label: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textPrimary,
    marginBottom: tokens.spacing.sm,
  },

  input: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    color: palette.textPrimary,
    backgroundColor: palette.elevated,
    borderWidth: 1,
    borderColor: palette.subtle,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: tokens.touch.preferred,
    textAlignVertical: 'center',
  },

  inputFocused: {
    borderColor: palette.primary,
  },

  inputError: {
    borderColor: palette.error,
  },

  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: palette.error,
    marginTop: 6,
  },

  helperText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: palette.textMuted,
    marginTop: 6,
  },
});

