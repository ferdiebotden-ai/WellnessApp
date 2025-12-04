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
 */
export function isAvailable(): boolean {
  if (!nativeModule) {
    return false;
  }
  return nativeModule.isAvailable();
}

/**
 * Get current HealthKit authorization status.
 */
export function getAuthorizationStatus(): HealthKitAuthorizationStatus {
  if (!nativeModule) {
    return 'unavailable';
  }
  return nativeModule.getAuthorizationStatus();
}

/**
 * Request HealthKit authorization.
 * @returns Promise resolving to true if authorization was granted.
 */
export async function requestAuthorization(): Promise<boolean> {
  if (!nativeModule) {
    console.warn(
      '[ExpoHealthKitObserver] requestAuthorization called on non-iOS platform'
    );
    return false;
  }
  return nativeModule.requestAuthorization();
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
  if (!nativeModule) {
    console.warn(
      '[ExpoHealthKitObserver] startObserving called on non-iOS platform'
    );
    return false;
  }
  return nativeModule.startObserving(dataTypes, frequency);
}

/**
 * Stop all observer queries.
 */
export function stopObserving(): void {
  if (!nativeModule) {
    return;
  }
  nativeModule.stopObserving();
}

/**
 * Manually trigger a sync and return all recent readings.
 *
 * @returns Promise resolving to array of HealthKit readings
 */
export async function syncNow(): Promise<HealthKitReading[]> {
  if (!nativeModule) {
    console.warn('[ExpoHealthKitObserver] syncNow called on non-iOS platform');
    return [];
  }
  return nativeModule.syncNow();
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
  if (!nativeModule) {
    return null;
  }
  const timestamp = nativeModule.getLastSyncTimestamp(dataType);
  return timestamp && timestamp > 0 ? timestamp : null;
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
