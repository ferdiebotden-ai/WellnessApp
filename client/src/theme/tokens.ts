/**
 * Apex OS Design Tokens
 *
 * Spacing follows an 8pt grid system.
 * Premium feel requires generous padding (20px for cards, not 16px).
 */

export const tokens = {
  // Border radius
  radius: {
    sm: 8,    // Small elements (badges, chips)
    md: 12,   // Default (buttons, cards, inputs)
    lg: 16,   // Large cards (hero cards)
    xl: 20,   // Extra large (modals, sheets)
    full: 9999, // Pill shape
  },

  // Spacing (8pt grid)
  spacing: {
    xs: 4,    // Tight gaps
    sm: 8,    // Small gaps
    md: 20,   // Premium card padding (was 16)
    lg: 28,   // Section gaps (was 24)
    xl: 40,   // Major breaks (was 32)
    xxl: 56,  // Hero sections
  },

  // Touch targets (accessibility)
  touch: {
    min: 44,        // WCAG minimum
    preferred: 48,  // Recommended
    large: 56,      // Large buttons
  },

  // Animation durations (ms)
  animation: {
    instant: 0,
    fast: 100,      // Button press
    normal: 150,    // Toggle, checkbox
    medium: 250,    // Screen transitions, modals
    slow: 350,      // Maximum for UI responses
    metric: 500,    // Metric count-up
  },

  // Z-index layers
  zIndex: {
    base: 0,
    card: 1,
    sticky: 10,
    modal: 100,
    toast: 1000,
  },
};

export type Tokens = typeof tokens;
