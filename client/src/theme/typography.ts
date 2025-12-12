import { Platform, StyleSheet, TextStyle } from 'react-native';
import { palette } from './palette';

/**
 * Apex OS Typography System
 *
 * UI Font: Inter (headlines, UI text, body)
 * Data Font: Platform-specific monospace (metrics, numbers, data)
 */

// Font family constants
export const fontFamily = {
  // Inter variants (UI)
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',

  // Monospace variants (Data) - platform-specific
  mono: Platform.select({
    ios: 'SF Mono',
    android: 'JetBrainsMono_400Regular',
    default: 'monospace',
  }) as string,
  monoSemiBold: Platform.select({
    ios: 'SF Mono',
    android: 'JetBrainsMono_600SemiBold',
    default: 'monospace',
  }) as string,
  monoBold: Platform.select({
    ios: 'SF Mono',
    android: 'JetBrainsMono_700Bold',
    default: 'monospace',
  }) as string,
};

// Type scale with semantic naming
export const typography = StyleSheet.create({
  // Display & Headlines
  display: {
    fontFamily: fontFamily.bold,
    fontSize: 48,
    lineHeight: 48 * 1.1,
    fontWeight: '700',
    color: palette.textPrimary,
  } as TextStyle,

  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 28 * 1.2,
    fontWeight: '700',
    color: palette.textPrimary,
  } as TextStyle,

  h2: {
    fontFamily: fontFamily.semiBold,
    fontSize: 22,
    lineHeight: 22 * 1.25,
    fontWeight: '600',
    color: palette.textPrimary,
  } as TextStyle,

  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 18 * 1.3,
    fontWeight: '600',
    color: palette.textPrimary,
  } as TextStyle,

  // Body text
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 16 * 1.5,
    fontWeight: '400',
    color: palette.textSecondary,
  } as TextStyle,

  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 14 * 1.5,
    fontWeight: '400',
    color: palette.textSecondary,
  } as TextStyle,

  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 12 * 1.4,
    fontWeight: '500',
    color: palette.textMuted,
  } as TextStyle,

  // Metrics (monospace for data)
  metricLarge: {
    fontFamily: fontFamily.monoBold,
    fontSize: 48,
    lineHeight: 48,
    fontWeight: '700',
    color: palette.textPrimary,
  } as TextStyle,

  metricMedium: {
    fontFamily: fontFamily.monoSemiBold,
    fontSize: 28,
    lineHeight: 28 * 1.1,
    fontWeight: '600',
    color: palette.textPrimary,
  } as TextStyle,

  metricSmall: {
    fontFamily: fontFamily.mono,
    fontSize: 16,
    lineHeight: 16 * 1.2,
    fontWeight: '500',
    color: palette.textPrimary,
  } as TextStyle,

  // Labels & UI elements
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 12 * 1.4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: palette.textMuted,
  } as TextStyle,

  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 16 * 1.25,
    fontWeight: '600',
    color: palette.textPrimary,
  } as TextStyle,

  // Legacy aliases for backward compatibility
  heading: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: palette.textPrimary,
  } as TextStyle,

  subheading: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
    color: palette.textPrimary,
  } as TextStyle,
});

export type Typography = typeof typography;
