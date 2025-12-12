/**
 * Apex OS Color System
 *
 * Aesthetic DNA: Bloomberg Terminal (40%) + Oura Ring (30%) + Linear (15%) + Calm (10%)
 * All colors meet WCAG AA contrast requirements on their intended backgrounds.
 */
export const palette = {
  // Background Layers (depth hierarchy - deeper = darker)
  canvas: '#0F1218',      // App background, deepest layer
  background: '#0F1218',  // Alias for canvas (backward compatibility)
  surface: '#181C25',     // Cards, modals, chat bubbles
  elevated: '#1F2430',    // Inputs, pressed states, nav bar
  subtle: '#2A303D',      // Borders, dividers, progress backgrounds

  // Text Colors
  textPrimary: '#F6F8FC',   // Headlines, key data (14.8:1 contrast)
  textSecondary: '#A7B4C7', // Body text, descriptions (7.2:1 contrast)
  textMuted: '#6C7688',     // Captions, labels, timestamps (4.5:1 contrast)
  textDisabled: '#4A5568',  // Disabled controls, placeholders (decorative only)

  // Accent Colors
  primary: '#63E6BE',     // Primary CTAs, active states (teal)
  accentTeal: '#63E6BE',  // Primary actions, positive emphasis
  secondary: '#5B8DEF',   // Secondary actions, links (blue)
  accentBlue: '#5B8DEF',  // Informational emphasis
  accent: '#D4A574',      // Pro tier, achievements (gold)
  accentGold: '#D4A574',  // Premium indicators

  // Recovery Zone Colors (use sparingly, always with text labels)
  recoveryHigh: '#4ADE80',     // 75-100% - Push day
  recoveryModerate: '#FBBF24', // 60-74% - Steady day
  recoveryLow: '#F87171',      // <60% - Recovery day

  // Semantic Colors
  success: '#4ADE80',       // Confirmations, completed actions
  successMuted: '#1A3D30',  // Success background overlay
  warning: '#FBBF24',       // Caution states, pending actions
  error: '#F87171',         // Errors, failures
  errorMuted: '#3D2020',    // Error background overlay
  info: '#5B8DEF',          // Informational messages, tips

  // Border (for backward compatibility)
  border: '#2A303D',        // Alias for subtle

  // Utility
  white: '#FFFFFF',
  transparent: 'transparent',
};

// Glass Materials (for premium overlays, modals, hero cards)
export const glassMaterials = {
  ultraThin: 'rgba(24, 28, 37, 0.7)',   // Overlays, popovers
  thin: 'rgba(24, 28, 37, 0.85)',       // Optional card enhancement
  regular: 'rgba(24, 28, 37, 0.95)',    // Modals, bottom sheets
};

// Helper function to get recovery zone color based on score
export function getRecoveryColor(score: number): string {
  if (score >= 75) return palette.recoveryHigh;
  if (score >= 60) return palette.recoveryModerate;
  return palette.recoveryLow;
}

// Helper function to get recovery zone overlay (12% opacity)
export function getRecoveryOverlay(score: number): string {
  const color = getRecoveryColor(score);
  // Convert hex to rgba with 12% opacity
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}

export type Palette = typeof palette;
