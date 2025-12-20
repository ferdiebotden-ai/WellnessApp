/**
 * useWakeDetection Hook
 *
 * Orchestrates wake detection based on user configuration:
 * - Wearable users: Auto-trigger from HealthKit sleep data
 * - Lite Mode users: Phone unlock detection with confirmation overlay
 *
 * Usage:
 * ```tsx
 * function HomeScreen() {
 *   const {
 *     showConfirmation,
 *     handleConfirm,
 *     handleLater,
 *     handleDismiss,
 *     isLiteMode,
 *   } = useWakeDetection();
 *
 *   return (
 *     <>
 *       <HomeContent />
 *       <WakeConfirmationOverlay
 *         visible={showConfirmation}
 *         onConfirm={handleConfirm}
 *         onLater={handleLater}
 *         onDismiss={handleDismiss}
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * @file client/src/hooks/useWakeDetection.ts
 * @author Claude Opus 4.5 (Session 42)
 * @created December 5, 2025
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getHealthKitWakeDetector,
  getHealthConnectWakeDetector,
  getPhoneUnlockDetector,
  getWakeEventService,
} from '../services/wake';

// =============================================================================
// TYPES
// =============================================================================

export interface UseWakeDetectionReturn {
  /** Whether confirmation overlay should be shown */
  showConfirmation: boolean;
  /** Detected wake time (if any) */
  detectedWakeTime: Date | null;
  /** Whether user is in Lite Mode (no wearable) */
  isLiteMode: boolean;
  /** Whether wake detection is active */
  isActive: boolean;
  /** Handle user confirming wake in overlay */
  handleConfirm: () => void;
  /** Handle user tapping "Later" in overlay */
  handleLater: () => void;
  /** Handle user dismissing overlay */
  handleDismiss: () => void;
  /** Force check for wake (for testing) */
  checkForWake: () => Promise<void>;
  /** Last error (if any) */
  error: string | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY_SNOOZED_UNTIL = '@apex_os/wake_detection/snoozed_until';
const STORAGE_KEY_SKIPPED_DATE = '@apex_os/wake_detection/skipped_date';
const SNOOZE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// =============================================================================
// HOOK
// =============================================================================

export function useWakeDetection(): UseWakeDetectionReturn {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [detectedWakeTime, setDetectedWakeTime] = useState<Date | null>(null);
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snoozedUntilRef = useRef<Date | null>(null);
  const hasInitializedRef = useRef(false);
  const phoneUnlockDetectorRef = useRef<ReturnType<typeof getPhoneUnlockDetector> | null>(null);

  /**
   * Check if health data is available (HealthKit on iOS, Health Connect on Android).
   * If not, we're in Lite Mode.
   * Includes defensive guards against missing methods or broken detectors.
   */
  const checkLiteMode = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      try {
        const healthKitDetector = getHealthKitWakeDetector();
        // Extra guard: verify detector and method exist
        if (!healthKitDetector || typeof healthKitDetector.isAvailable !== 'function') {
          console.warn('[useWakeDetection] HealthKit detector or isAvailable method not available');
          return true; // Fallback to Lite Mode
        }
        return !healthKitDetector.isAvailable();
      } catch (error) {
        // If we can't check, assume Lite Mode
        console.warn('[useWakeDetection] checkLiteMode iOS error:', error);
        return true;
      }
    } else if (Platform.OS === 'android') {
      try {
        const healthConnectDetector = getHealthConnectWakeDetector();
        // Extra guard: verify detector and method exist
        if (!healthConnectDetector || typeof healthConnectDetector.isAvailable !== 'function') {
          console.warn('[useWakeDetection] Health Connect detector or isAvailable method not available');
          return true; // Fallback to Lite Mode
        }
        const available = await healthConnectDetector.isAvailable();
        return !available;
      } catch (error) {
        // If we can't check, assume Lite Mode
        console.warn('[useWakeDetection] checkLiteMode Android error:', error);
        return true;
      }
    }

    // Non-mobile platforms are always Lite Mode
    return true;
  }, []);

  /**
   * Check if we've snoozed and should wait.
   */
  const checkSnoozed = useCallback(async (): Promise<boolean> => {
    try {
      const storedSnooze = await AsyncStorage.getItem(STORAGE_KEY_SNOOZED_UNTIL);
      if (!storedSnooze) return false;

      const snoozedUntil = new Date(storedSnooze);
      if (Date.now() < snoozedUntil.getTime()) {
        snoozedUntilRef.current = snoozedUntil;
        return true;
      }

      // Snooze expired, clear it
      await AsyncStorage.removeItem(STORAGE_KEY_SNOOZED_UNTIL);
      return false;
    } catch {
      return false;
    }
  }, []);

  /**
   * Check if we've skipped for today.
   */
  const checkSkippedToday = useCallback(async (): Promise<boolean> => {
    try {
      const storedDate = await AsyncStorage.getItem(STORAGE_KEY_SKIPPED_DATE);
      if (!storedDate) return false;

      const today = new Date().toISOString().split('T')[0];
      return storedDate === today;
    } catch {
      return false;
    }
  }, []);

  /**
   * Try to detect wake from wearable data (HealthKit on iOS, Health Connect on Android).
   * Includes defensive guards against missing methods.
   */
  const detectFromWearable = useCallback(async (): Promise<void> => {
    try {
      let result: { detected: boolean; wakeTime: Date | null; sleepStartTime: Date | null };
      let source: 'apple_health' | 'health_connect';

      if (Platform.OS === 'ios') {
        const healthKitDetector = getHealthKitWakeDetector();
        // Guard: verify detectWake method exists
        if (!healthKitDetector || typeof healthKitDetector.detectWake !== 'function') {
          console.warn('[useWakeDetection] detectFromWearable: HealthKit detectWake not available');
          return;
        }
        const hkResult = await healthKitDetector.detectWake();
        result = hkResult;
        source = 'apple_health';
      } else if (Platform.OS === 'android') {
        const healthConnectDetector = getHealthConnectWakeDetector();
        // Guard: verify detectWake method exists
        if (!healthConnectDetector || typeof healthConnectDetector.detectWake !== 'function') {
          console.warn('[useWakeDetection] detectFromWearable: Health Connect detectWake not available');
          return;
        }
        const hcResult = await healthConnectDetector.detectWake();
        result = hcResult;
        source = 'health_connect';
      } else {
        return; // No wearable support on other platforms
      }

      if (result.detected && result.wakeTime) {
        // Auto-send wake event to backend (no confirmation needed)
        const wakeService = getWakeEventService();
        const response = source === 'apple_health'
          ? await wakeService.sendHealthKitWake(
              result.wakeTime,
              result.sleepStartTime ?? undefined
            )
          : await wakeService.sendHealthConnectWake(
              result.wakeTime,
              result.sleepStartTime ?? undefined
            );

        if (response.success) {
          console.log(`[WakeDetection] ${source} wake sent:`, response);
          setDetectedWakeTime(result.wakeTime);
        } else {
          setError(response.error || 'Failed to send wake event');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const platform = Platform.OS === 'ios' ? 'HealthKit' : 'Health Connect';
      setError(`${platform} wake detection error: ${message}`);
    }
  }, []);

  /**
   * Handle phone unlock detection (Lite Mode).
   */
  const handlePhoneUnlock = useCallback(async (unlockTime: Date): Promise<void> => {
    // Check if snoozed or skipped
    const isSnoozed = await checkSnoozed();
    if (isSnoozed) {
      console.log('[WakeDetection] Snoozed, skipping confirmation');
      return;
    }

    const isSkipped = await checkSkippedToday();
    if (isSkipped) {
      console.log('[WakeDetection] Skipped for today');
      return;
    }

    // Check if we already detected wake today
    const wakeService = getWakeEventService();
    const hasTriggered = await wakeService.hasMorningAnchorTriggeredToday();
    if (hasTriggered) {
      console.log('[WakeDetection] Morning Anchor already triggered today');
      return;
    }

    // Show confirmation overlay
    setDetectedWakeTime(unlockTime);
    setShowConfirmation(true);
  }, [checkSnoozed, checkSkippedToday]);

  /**
   * Handle user confirming wake.
   */
  const handleConfirm = useCallback(async (): Promise<void> => {
    setShowConfirmation(false);

    if (!detectedWakeTime) return;

    try {
      const wakeService = getWakeEventService();
      const response = await wakeService.sendPhoneUnlockWake(
        detectedWakeTime,
        true // User confirmed
      );

      if (!response.success) {
        setError(response.error || 'Failed to send wake event');
      } else {
        console.log('[WakeDetection] Phone unlock wake confirmed:', response);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to confirm wake: ${message}`);
    }
  }, [detectedWakeTime]);

  /**
   * Handle user tapping "Later" (snooze).
   */
  const handleLater = useCallback(async (): Promise<void> => {
    setShowConfirmation(false);

    const snoozedUntil = new Date(Date.now() + SNOOZE_DURATION_MS);
    snoozedUntilRef.current = snoozedUntil;

    try {
      await AsyncStorage.setItem(STORAGE_KEY_SNOOZED_UNTIL, snoozedUntil.toISOString());
    } catch {
      // Ignore storage errors
    }

    console.log('[WakeDetection] Snoozed until:', snoozedUntil);
  }, []);

  /**
   * Handle user dismissing overlay (skip for today).
   */
  const handleDismiss = useCallback(async (): Promise<void> => {
    setShowConfirmation(false);

    const today = new Date().toISOString().split('T')[0];

    try {
      await AsyncStorage.setItem(STORAGE_KEY_SKIPPED_DATE, today);
    } catch {
      // Ignore storage errors
    }

    // Still send wake event but without confirmation (lower confidence)
    if (detectedWakeTime) {
      const wakeService = getWakeEventService();
      await wakeService.sendPhoneUnlockWake(detectedWakeTime, false);
    }

    console.log('[WakeDetection] Skipped for today');
  }, [detectedWakeTime]);

  /**
   * Force check for wake (for testing or manual trigger).
   * Includes defensive guards against missing methods.
   */
  const checkForWake = useCallback(async (): Promise<void> => {
    if (isLiteMode) {
      const detector = getPhoneUnlockDetector();
      // Guard: verify forceTrigger method exists
      if (detector && typeof detector.forceTrigger === 'function') {
        detector.forceTrigger();
      } else {
        console.warn('[useWakeDetection] checkForWake: PhoneUnlockDetector.forceTrigger not available');
      }
    } else {
      await detectFromWearable();
    }
  }, [isLiteMode, detectFromWearable]);

  /**
   * Initialize wake detection.
   */
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initialize = async () => {
      // Check if Lite Mode
      const liteMode = await checkLiteMode();
      setIsLiteMode(liteMode);

      if (liteMode) {
        // Lite Mode: Start phone unlock detection
        const detector = getPhoneUnlockDetector();
        phoneUnlockDetectorRef.current = detector;
        detector.start(handlePhoneUnlock);
        setIsActive(true);
      } else {
        // Wearable Mode: Check for wake on app active
        if (AppState.currentState === 'active') {
          await detectFromWearable();
        }
        setIsActive(true);
      }
    };

    initialize();

    return () => {
      if (phoneUnlockDetectorRef.current) {
        phoneUnlockDetectorRef.current.stop();
      }
    };
  }, [checkLiteMode, handlePhoneUnlock, detectFromWearable]);

  /**
   * Re-check for wake when app becomes active (wearable mode).
   */
  useEffect(() => {
    if (isLiteMode) return; // Phone unlock detector handles this

    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        await detectFromWearable();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isLiteMode, detectFromWearable]);

  /**
   * Handle snooze expiration.
   */
  useEffect(() => {
    if (!snoozedUntilRef.current) return;

    const timeUntilExpiry = snoozedUntilRef.current.getTime() - Date.now();
    if (timeUntilExpiry <= 0) {
      snoozedUntilRef.current = null;
      return;
    }

    const timer = setTimeout(() => {
      snoozedUntilRef.current = null;
      // Re-trigger if phone unlock detector has pending detection
      if (isLiteMode && phoneUnlockDetectorRef.current) {
        const result = phoneUnlockDetectorRef.current.checkNow();
        if (result.detected && result.unlockTime) {
          handlePhoneUnlock(result.unlockTime);
        }
      }
    }, timeUntilExpiry);

    return () => clearTimeout(timer);
  }, [isLiteMode, handlePhoneUnlock]);

  return {
    showConfirmation,
    detectedWakeTime,
    isLiteMode,
    isActive,
    handleConfirm,
    handleLater,
    handleDismiss,
    checkForWake,
    error,
  };
}

export default useWakeDetection;
