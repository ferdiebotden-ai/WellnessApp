/**
 * Apex OS Theme System
 *
 * Centralized export for all design tokens.
 * Import from '@/theme' or './theme' to access all design system values.
 */

// Color system
export { palette, glassMaterials, getRecoveryColor, getRecoveryOverlay } from './palette';
export type { Palette } from './palette';

// Typography system
export { typography, fontFamily } from './typography';
export type { Typography } from './typography';

// Design tokens
export { tokens } from './tokens';
export type { Tokens } from './tokens';

// Elevation system
export { elevation, createGlow } from './elevation';
export type { Elevation } from './elevation';

// Re-export commonly used values for convenience
export const colors = {
  canvas: '#0F1218',
  surface: '#181C25',
  elevated: '#1F2430',
  subtle: '#2A303D',
  primary: '#63E6BE',
  secondary: '#5B8DEF',
  accent: '#D4A574',
  textPrimary: '#F6F8FC',
  textSecondary: '#A7B4C7',
  textMuted: '#6C7688',
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 20,
  lg: 28,
  xl: 40,
  xxl: 56,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;
