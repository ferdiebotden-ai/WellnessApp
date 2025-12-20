/**
 * ExpoHealthKitObserver TypeScript bridge
 *
 * This module bridges the native iOS HealthKit observer to React Native.
 * On non-iOS platforms, methods return safe fallback values.
 *
 * @file modules/expo-healthkit-observer/src/ExpoHealthKitObserver.ts
 * @author Claude Opus 4.5 (Session 37)
 * @created December 4, 2025
 */

import { Platform } from 'react-native';
import { requireNativeModule, EventEmitter } from 'expo-modules-core';
import type {
  ExpoHealthKitObserverModule,
  HealthKitReading,
  HealthKitTypeIdentifier,
  UpdateFrequency,
  HealthKitAuthorizationStatus,
  HealthKitDataUpdateEvent,
  HealthKitErrorEvent,
} from './types';

// =============================================================================
// NATIVE MODULE
// =============================================================================

/**
 * Get the native module, or null on non-iOS platforms.
 */
const getNativeModule = (): ExpoHealthKitObserverModule | null => {
  if (Platform.OS !== 'ios') {
    return null;
  }

  try {
    return requireNativeModule<ExpoHealthKitObserverModule>(
      'ExpoHealthKitObserver'
    );
  } catch {
    console.warn(
      '[ExpoHealthKitObserver] Native module not available. Ensure you are running a development build, not Expo Go.'
    );
    return null;
  }
};

const nativeModule = getNativeModule();

// =============================================================================
// EVENT EMITTER
// =============================================================================

const emitter = nativeModule ? new EventEmitter(nativeModule as any) : null;

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Check if HealthKit is available on this device.
 * Returns false on non-iOS platforms.
 * Includes defensive guards against missing native methods.
 */
export function isAvailable(): boolean {
  if (!nativeModule || typeof nativeModule.isAvailable !== 'function') {
    return false;
  }
  try {
    return nativeModule.isAvailable();
  } catch (error) {
    console.warn('[ExpoHealthKitObserver] isAvailable() threw error:', error);
    return false;
  }
}

/**
 * Get current HealthKit authorization status.
 * Includes defensive guards against missing native methods.
 */
export function getAuthorizationStatus(): HealthKitAuthorizationStatus {
  if (!nativeModule || typeof nativeModule.getAuthorizationStatus !== 'function') {
    return 'unavailable';
  }
  try {
    return nativeModule.getAuthorizationStatus();
  } catch (error) {
    console.warn('[ExpoHealthKitObserver] getAuthorizationStatus() threw error:', error);
    return 'unavailable';
  }
}

/**
 * Request HealthKit authorization.
 * @returns Promise resolving to true if authorization was granted.
 */
export async function requestAuthorization(): Promise<boolean> {
  if (!nativeModule || typeof nativeModule.requestAuthorization !== 'function') {
    console.warn(
      '[ExpoHealthKitObserver] requestAuthorization called but native method not available'
    );
    return false;
  }
  try {
    return await nativeModule.requestAuthorization();
  } catch (error) {
    console.warn('[ExpoHealthKitObserver] requestAuthorization() threw error:', error);
    return false;
  }
}

/**
 * Start observing health data types with background delivery.
 *
 * @param dataTypes Array of HealthKit type identifiers to observe
 * @param frequency Update frequency for background delivery
 * @returns Promise resolving to true if observers were started successfully
 */
export async function startObserving(
  dataTypes: HealthKitTypeIdentifier[],
  frequency: UpdateFrequency = 'immediate'
): Promise<boolean> {
  if (!nativeModule || typeof nativeModule.startObserving !== 'function') {
    console.warn(
      '[ExpoHealthKitObserver] startObserving called but native method not available'
    );
    return false;
  }
  try {
    return await nativeModule.startObserving(dataTypes, frequency);
  } catch (error) {
    console.warn('[ExpoHealthKitObserver] startObserving() threw error:', error);
    return false;
  }
}

/**
 * Stop all observer queries.
 */
export function stopObserving(): void {
  if (!nativeModule || typeof nativeModule.stopObserving !== 'function') {
    return;
  }
  try {
    nativeModule.stopObserving();
  } catch (error) {
    console.warn('[ExpoHealthKitObserver] stopObserving() threw error:', error);
  }
}

/**
 * Manually trigger a sync and return all recent readings.
 *
 * @returns Promise resolving to array of HealthKit readings
 */
export async function syncNow(): Promise<HealthKitReading[]> {
  if (!nativeModule || typeof nativeModule.syncNow !== 'function') {
    console.warn('[ExpoHealthKitObserver] syncNow called but native method not available');
    return [];
  }
  try {
    return await nativeModule.syncNow();
  } catch (error) {
    console.warn('[ExpoHealthKitObserver] syncNow() threw error:', error);
    return [];
  }
}

/**
 * Get last sync timestamp for a specific data type.
 *
 * @param dataType HealthKit type identifier
 * @returns Timestamp in milliseconds, or null if never synced
 */
export function getLastSyncTimestamp(
  dataType: HealthKitTypeIdentifier
): number | null {
  if (!nativeModule || typeof nativeModule.getLastSyncTimestamp !== 'function') {
    return null;
  }
  try {
    const timestamp = nativeModule.getLastSyncTimestamp(dataType);
    return timestamp && timestamp > 0 ? timestamp : null;
  } catch (error) {
    console.warn('[ExpoHealthKitObserver] getLastSyncTimestamp() threw error:', error);
    return null;
  }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

/**
 * Subscribe to health data update events.
 * Called when background delivery triggers with new data.
 *
 * @param callback Function to call with the updated reading
 * @returns Subscription object with remove() method
 */
export function addDataUpdateListener(
  callback: (data: HealthKitDataUpdateEvent) => void
): { remove: () => void } {
  if (!emitter) {
    return { remove: () => {} };
  }
  const subscription = (emitter as any).addListener('onHealthKitDataUpdate', callback);
  return {
    remove: () => subscription.remove(),
  };
}

/**
 * Subscribe to error events.
 *
 * @param callback Function to call with error details
 * @returns Subscription object with remove() method
 */
export function addErrorListener(
  callback: (error: HealthKitErrorEvent) => void
): { remove: () => void } {
  if (!emitter) {
    return { remove: () => {} };
  }
  const subscription = (emitter as any).addListener('onError', callback);
  return {
    remove: () => subscription.remove(),
  };
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  isAvailable,
  getAuthorizationStatus,
  requestAuthorization,
  startObserving,
  stopObserving,
  syncNow,
  getLastSyncTimestamp,
  addDataUpdateListener,
  addErrorListener,
};
