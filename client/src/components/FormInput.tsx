import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

interface FormInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: object;
}

/**
 * Reusable form input component with label and error message support.
 */
export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...textInputProps
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={palette.textMuted}
        {...textInputProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    ...typography.subheading,
    color: palette.textPrimary,
    marginBottom: 8,
  },
  input: {
    ...typography.body,
    color: palette.textPrimary,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  inputError: {
    borderColor: palette.error,
  },
  errorText: {
    ...typography.caption,
    color: palette.error,
    marginTop: 6,
  },
});

