/**
 * expo-healthkit-observer module exports
 *
 * Native iOS HealthKit integration with background delivery observers for Apex OS.
 *
 * @example
 * ```typescript
 * import ExpoHealthKitObserver, {
 *   HEALTHKIT_TYPES,
 *   UPDATE_FREQUENCIES,
 *   DEFAULT_OBSERVABLE_TYPES,
 * } from 'expo-healthkit-observer';
 *
 * // Check availability
 * if (ExpoHealthKitObserver.isAvailable()) {
 *   // Request authorization
 *   const authorized = await ExpoHealthKitObserver.requestAuthorization();
 *
 *   if (authorized) {
 *     // Start background observers
 *     await ExpoHealthKitObserver.startObserving(
 *       DEFAULT_OBSERVABLE_TYPES,
 *       UPDATE_FREQUENCIES.IMMEDIATE
 *     );
 *
 *     // Listen for updates
 *     const subscription = ExpoHealthKitObserver.addDataUpdateListener((data) => {
 *       console.log('New health data:', data);
 *     });
 *
 *     // Clean up when done
 *     subscription.remove();
 *   }
 * }
 * ```
 *
 * @file modules/expo-healthkit-observer/src/index.ts
 * @author Claude Opus 4.5 (Session 37)
 * @created December 4, 2025
 */

// Default export - the module with all methods
export { default } from './ExpoHealthKitObserver';

// Named exports - individual functions
export {
  isAvailable,
  getAuthorizationStatus,
  requestAuthorization,
  startObserving,
  stopObserving,
  syncNow,
  getLastSyncTimestamp,
  addDataUpdateListener,
  addErrorListener,
} from './ExpoHealthKitObserver';

// Types
export type {
  ExpoHealthKitObserverModule,
  HealthKitTypeIdentifier,
  UpdateFrequency,
  HealthKitAuthorizationStatus,
  HealthKitMetricType,
  SleepStage,
  HrvMethod,
  HealthKitReading,
  HealthKitDataUpdateEvent,
  HealthKitErrorEvent,
  SyncResult,
} from './types';

// Constants
export {
  HEALTHKIT_TYPES,
  UPDATE_FREQUENCIES,
  DEFAULT_OBSERVABLE_TYPES,
} from './types';
