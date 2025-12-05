/**
 * Phone Unlock Wake Detector (Client-side)
 *
 * Detects wake using app foreground events as a proxy for phone unlock.
 * Used in Lite Mode when no wearable is connected.
 *
 * Detection logic:
 * - Triggers on first app foreground after 4 AM local time
 * - Only triggers once per day
 * - Resets at midnight
 *
 * @file client/src/services/wake/PhoneUnlockDetector.ts
 * @author Claude Opus 4.5 (Session 42)
 * @created December 5, 2025
 */

import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of phone unlock detection.
 */
export interface PhoneUnlockResult {
  detected: boolean;
  unlockTime: Date | null;
  isFirstUnlockToday: boolean;
  reason: string;
}

/**
 * Callback for wake detection events.
 */
export type WakeDetectedCallback = (unlockTime: Date) => void;

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Minimum hour (local time) to trigger wake detection.
 * Earlier than this is likely a middle-of-night phone check.
 */
const MIN_WAKE_HOUR = 4;

/**
 * Maximum hour (local time) to trigger wake detection.
 * Later than this is not a "morning" wake.
 */
const MAX_WAKE_HOUR = 14;

/**
 * Storage key for tracking last trigger date.
 */
const STORAGE_KEY = '@apex_os/wake_detector/last_trigger_date';

// =============================================================================
// DETECTOR CLASS
// =============================================================================

export class PhoneUnlockDetector {
  private hasTriggeredToday = false;
  private lastTriggerDate: string | null = null;
  private callback: WakeDetectedCallback | null = null;
  private appStateSubscription: { remove: () => void } | null = null;
  private isRunning = false;

  constructor() {
    this.loadLastTriggerDate();
  }

  /**
   * Load the last trigger date from storage.
   */
  private async loadLastTriggerDate(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.lastTriggerDate = stored;
        const today = this.getTodayString();
        this.hasTriggeredToday = this.lastTriggerDate === today;
      }
    } catch (error) {
      console.warn('[PhoneUnlockDetector] Failed to load last trigger date:', error);
    }
  }

  /**
   * Save the trigger date to storage.
   */
  private async saveTriggerDate(date: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, date);
      this.lastTriggerDate = date;
    } catch (error) {
      console.warn('[PhoneUnlockDetector] Failed to save trigger date:', error);
    }
  }

  /**
   * Get today's date as YYYY-MM-DD string in local timezone.
   */
  private getTodayString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Start listening for app foreground events.
   *
   * @param onWakeDetected - Callback when wake is detected
   */
  start(onWakeDetected: WakeDetectedCallback): void {
    if (this.isRunning) {
      console.warn('[PhoneUnlockDetector] Already running');
      return;
    }

    this.callback = onWakeDetected;
    this.isRunning = true;

    // Check if we need to reset for a new day
    this.checkDayRollover();

    // Subscribe to app state changes
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );

    // If app is already active, check immediately
    if (AppState.currentState === 'active') {
      this.checkForWake();
    }
  }

  /**
   * Stop listening for app foreground events.
   */
  stop(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.callback = null;
    this.isRunning = false;
  }

  /**
   * Handle app state change events.
   */
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'active') {
      this.checkForWake();
    }
  };

  /**
   * Check if this app foreground qualifies as a wake event.
   */
  private checkForWake(): void {
    // Check day rollover first
    this.checkDayRollover();

    // Already triggered today
    if (this.hasTriggeredToday) {
      return;
    }

    const now = new Date();
    const localHour = now.getHours();

    // Check time window
    if (localHour < MIN_WAKE_HOUR) {
      // Too early - likely middle-of-night phone check
      return;
    }

    if (localHour >= MAX_WAKE_HOUR) {
      // Too late - not a morning wake
      return;
    }

    // Valid wake detection!
    this.hasTriggeredToday = true;
    const today = this.getTodayString();
    this.saveTriggerDate(today);

    // Notify callback
    if (this.callback) {
      this.callback(now);
    }
  }

  /**
   * Check if we've crossed midnight and need to reset.
   */
  private checkDayRollover(): void {
    const today = this.getTodayString();
    if (this.lastTriggerDate !== today) {
      // New day - reset trigger flag
      this.hasTriggeredToday = false;
    }
  }

  /**
   * Manually check current state and return detection result.
   * Does not trigger callback, just returns current status.
   */
  checkNow(): PhoneUnlockResult {
    this.checkDayRollover();

    if (this.hasTriggeredToday) {
      return {
        detected: false,
        unlockTime: null,
        isFirstUnlockToday: false,
        reason: 'Already triggered today',
      };
    }

    const now = new Date();
    const localHour = now.getHours();

    if (localHour < MIN_WAKE_HOUR) {
      return {
        detected: false,
        unlockTime: null,
        isFirstUnlockToday: false,
        reason: `Too early (${localHour}h < ${MIN_WAKE_HOUR}h)`,
      };
    }

    if (localHour >= MAX_WAKE_HOUR) {
      return {
        detected: false,
        unlockTime: null,
        isFirstUnlockToday: false,
        reason: `Too late (${localHour}h >= ${MAX_WAKE_HOUR}h)`,
      };
    }

    return {
      detected: true,
      unlockTime: now,
      isFirstUnlockToday: true,
      reason: 'First unlock in valid morning window',
    };
  }

  /**
   * Force trigger wake detection (for testing or manual activation).
   */
  forceTrigger(): void {
    if (this.hasTriggeredToday) {
      return;
    }

    const now = new Date();
    this.hasTriggeredToday = true;
    this.saveTriggerDate(this.getTodayString());

    if (this.callback) {
      this.callback(now);
    }
  }

  /**
   * Reset the detector (for testing or day change).
   */
  reset(): void {
    this.hasTriggeredToday = false;
    this.lastTriggerDate = null;
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {
      // Ignore errors on reset
    });
  }

  /**
   * Check if wake has already been triggered today.
   */
  hasTriggered(): boolean {
    this.checkDayRollover();
    return this.hasTriggeredToday;
  }

  /**
   * Get the minimum wake hour setting.
   */
  getMinWakeHour(): number {
    return MIN_WAKE_HOUR;
  }

  /**
   * Get the maximum wake hour setting.
   */
  getMaxWakeHour(): number {
    return MAX_WAKE_HOUR;
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let detectorInstance: PhoneUnlockDetector | null = null;

export function getPhoneUnlockDetector(): PhoneUnlockDetector {
  if (!detectorInstance) {
    detectorInstance = new PhoneUnlockDetector();
  }
  return detectorInstance;
}

export default PhoneUnlockDetector;
