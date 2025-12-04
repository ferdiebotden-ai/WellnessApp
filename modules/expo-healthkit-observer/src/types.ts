/**
 * TypeScript types for expo-healthkit-observer module
 *
 * @file modules/expo-healthkit-observer/src/types.ts
 * @author Claude Opus 4.5 (Session 37)
 * @created December 4, 2025
 */

// =============================================================================
// HEALTHKIT DATA TYPES
// =============================================================================

/**
 * HealthKit data type identifiers used for requesting permissions and observing.
 */
export const HEALTHKIT_TYPES = {
  // Heart metrics
  HEART_RATE: 'HKQuantityTypeIdentifierHeartRate',
  RESTING_HEART_RATE: 'HKQuantityTypeIdentifierRestingHeartRate',
  HRV_SDNN: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',

  // Sleep
  SLEEP_ANALYSIS: 'HKCategoryTypeIdentifierSleepAnalysis',

  // Activity
  STEP_COUNT: 'HKQuantityTypeIdentifierStepCount',
  ACTIVE_ENERGY: 'HKQuantityTypeIdentifierActiveEnergyBurned',
  DISTANCE_WALKING: 'HKQuantityTypeIdentifierDistanceWalkingRunning',

  // Workouts
  WORKOUT: 'HKWorkoutTypeIdentifier',
} as const;

export type HealthKitTypeIdentifier =
  (typeof HEALTHKIT_TYPES)[keyof typeof HEALTHKIT_TYPES];

/**
 * Update frequency for background delivery.
 * - immediate: As soon as new data is available (most battery-intensive)
 * - hourly: Once per hour
 * - daily: Once per day (most battery-efficient)
 */
export const UPDATE_FREQUENCIES = {
  IMMEDIATE: 'immediate',
  HOURLY: 'hourly',
  DAILY: 'daily',
} as const;

export type UpdateFrequency =
  (typeof UPDATE_FREQUENCIES)[keyof typeof UPDATE_FREQUENCIES];

// =============================================================================
// AUTHORIZATION
// =============================================================================

/**
 * HealthKit authorization status.
 */
export type HealthKitAuthorizationStatus =
  | 'authorized'
  | 'denied'
  | 'notDetermined'
  | 'unavailable'
  | 'unknown';

// =============================================================================
// DATA READINGS
// =============================================================================

/**
 * Metric types returned from HealthKit queries.
 */
export type HealthKitMetricType =
  | 'hrv'
  | 'rhr'
  | 'sleep'
  | 'steps'
  | 'activeCalories';

/**
 * Sleep stage values from HealthKit.
 */
export type SleepStage =
  | 'inBed'
  | 'asleepUnspecified'
  | 'awake'
  | 'asleepCore'
  | 'asleepDeep'
  | 'asleepREM'
  | 'unknown';

/**
 * HRV method used by the source.
 * IMPORTANT: Apple uses SDNN, NOT RMSSD. These are not directly comparable.
 */
export type HrvMethod = 'sdnn' | 'rmssd';

/**
 * A single reading from HealthKit.
 */
export interface HealthKitReading {
  /** Type of metric */
  metric: HealthKitMetricType;
  /** Numeric value */
  value: number;
  /** Unit of measurement (ms, bpm, count, minute, kcal) */
  unit: string;
  /** Start timestamp in milliseconds since epoch */
  startDate: number;
  /** End timestamp in milliseconds since epoch */
  endDate: number;
  /** Source app/device name */
  source: string;
  /** For HRV readings, the method used (Apple uses SDNN) */
  hrvMethod?: HrvMethod;
  /** For sleep readings, the sleep stage */
  sleepStage?: SleepStage;
}

/**
 * Event data sent when HealthKit data is updated.
 */
export interface HealthKitDataUpdateEvent extends HealthKitReading {}

/**
 * Error event data.
 */
export interface HealthKitErrorEvent {
  message: string;
}

// =============================================================================
// SYNC RESULT
// =============================================================================

/**
 * Result from a manual sync operation.
 */
export interface SyncResult {
  /** Readings fetched during sync */
  readings: HealthKitReading[];
  /** Timestamp of sync completion */
  syncedAt: Date;
  /** Source identifier */
  source: 'apple_health';
}

// =============================================================================
// NATIVE MODULE INTERFACE
// =============================================================================

/**
 * Interface for the native ExpoHealthKitObserver module.
 */
export interface ExpoHealthKitObserverModule {
  /** Check if HealthKit is available on this device */
  isAvailable(): boolean;

  /** Get current authorization status */
  getAuthorizationStatus(): HealthKitAuthorizationStatus;

  /** Request HealthKit authorization */
  requestAuthorization(): Promise<boolean>;

  /**
   * Start observing health data types with background delivery.
   * @param dataTypes Array of HealthKit type identifiers
   * @param frequency Update frequency for background delivery
   */
  startObserving(
    dataTypes: HealthKitTypeIdentifier[],
    frequency: UpdateFrequency
  ): Promise<boolean>;

  /** Stop all observer queries */
  stopObserving(): void;

  /** Manually trigger a sync and return all readings */
  syncNow(): Promise<HealthKitReading[]>;

  /** Get last sync timestamp for a specific data type */
  getLastSyncTimestamp(dataType: HealthKitTypeIdentifier): number | null;

  /** Add listener for health data updates */
  addListener(
    eventName: 'onHealthKitDataUpdate',
    listener: (event: HealthKitDataUpdateEvent) => void
  ): { remove: () => void };

  /** Add listener for sync completion */
  addListener(
    eventName: 'onSyncComplete',
    listener: (event: { readings: HealthKitReading[] }) => void
  ): { remove: () => void };

  /** Add listener for errors */
  addListener(
    eventName: 'onError',
    listener: (event: HealthKitErrorEvent) => void
  ): { remove: () => void };
}

// =============================================================================
// DEFAULT OBSERVABLE TYPES
// =============================================================================

/**
 * Default data types to observe for Apex OS.
 * These cover the core metrics needed for recovery score calculation.
 */
export const DEFAULT_OBSERVABLE_TYPES: HealthKitTypeIdentifier[] = [
  HEALTHKIT_TYPES.HRV_SDNN,
  HEALTHKIT_TYPES.SLEEP_ANALYSIS,
  HEALTHKIT_TYPES.RESTING_HEART_RATE,
  HEALTHKIT_TYPES.STEP_COUNT,
  HEALTHKIT_TYPES.ACTIVE_ENERGY,
];
