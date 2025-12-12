import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Apex OS Haptic Feedback System
 *
 * Haptic feedback provides tactile confirmation for user interactions.
 * Always pair haptic feedback with visual feedback.
 */

// User preference for haptic intensity
type HapticPreference = 'enhanced' | 'minimal' | 'off';

// Default preference (can be updated from user settings)
let hapticPreference: HapticPreference = 'enhanced';

/**
 * Set haptic preference from user settings
 */
export function setHapticPreference(preference: HapticPreference): void {
  hapticPreference = preference;
}

/**
 * Get current haptic preference
 */
export function getHapticPreference(): HapticPreference {
  return hapticPreference;
}

/**
 * Core haptic functions
 */
export const haptic = {
  /**
   * Light impact - for button taps, card presses, minor interactions
   */
  light: async (): Promise<void> => {
    if (Platform.OS === 'web' || hapticPreference === 'off') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silently fail if haptics not available
    }
  },

  /**
   * Medium impact - for important actions, protocol start, pull-to-refresh
   */
  medium: async (): Promise<void> => {
    if (Platform.OS === 'web' || hapticPreference === 'off') return;
    try {
      if (hapticPreference === 'minimal') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {
      // Silently fail if haptics not available
    }
  },

  /**
   * Heavy impact - for destructive actions, major confirmations
   */
  heavy: async (): Promise<void> => {
    if (Platform.OS === 'web' || hapticPreference === 'off') return;
    try {
      if (hapticPreference === 'minimal') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch {
      // Silently fail if haptics not available
    }
  },

  /**
   * Success notification - for protocol completion, successful sync
   */
  success: async (): Promise<void> => {
    if (Platform.OS === 'web' || hapticPreference === 'off') return;
    try {
      if (hapticPreference === 'minimal') {
        await Haptics.selectionAsync();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      // Silently fail if haptics not available
    }
  },

  /**
   * Warning notification - for validation errors, pending actions
   */
  warning: async (): Promise<void> => {
    if (Platform.OS === 'web' || hapticPreference === 'off') return;
    try {
      if (hapticPreference === 'minimal') {
        await Haptics.selectionAsync();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {
      // Silently fail if haptics not available
    }
  },

  /**
   * Error notification - for errors, failures
   */
  error: async (): Promise<void> => {
    if (Platform.OS === 'web' || hapticPreference === 'off') return;
    try {
      if (hapticPreference === 'minimal') {
        await Haptics.selectionAsync();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      // Silently fail if haptics not available
    }
  },

  /**
   * Selection - for tab selection, toggle switches, picker changes
   */
  selection: async (): Promise<void> => {
    if (Platform.OS === 'web' || hapticPreference === 'off') return;
    try {
      await Haptics.selectionAsync();
    } catch {
      // Silently fail if haptics not available
    }
  },
};

/**
 * Interaction → Haptic mapping guide:
 *
 * | Interaction              | Haptic Type |
 * |--------------------------|-------------|
 * | Button tap               | light       |
 * | Card tap                 | light       |
 * | Tab selection            | selection   |
 * | Toggle switch            | selection   |
 * | Protocol start           | medium      |
 * | Protocol complete        | success     |
 * | Wearable sync success    | success     |
 * | Error state              | error       |
 * | Form validation error    | warning     |
 * | Slider drag              | selection   |
 * | Pull to refresh trigger  | medium      |
 * | Delete action            | warning     |
 */

export default haptic;
