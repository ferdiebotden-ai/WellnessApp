/**
 * TypeScript types for Health Connect (Android) integration
 *
 * Mirrors the HealthKit type structure for consistency across platforms.
 * Health Connect uses different type identifiers but maps to the same
 * unified data format for the backend.
 *
 * Key differences from HealthKit:
 * - Health Connect provides RMSSD directly (Apple provides SDNN)
 * - Sleep stages have different naming conventions
 * - Permission model is stricter (permanent lockout after 2 denials)
 *
 * @file client/src/types/healthConnect.ts
 * @author Claude Opus 4.5 (Session 50)
 * @created December 5, 2025
 */

// =============================================================================
// HEALTH CONNECT DATA TYPES
// =============================================================================

/**
 * Health Connect record type identifiers.
 * These map to the Android Health Connect SDK record types.
 */
export const HEALTH_CONNECT_TYPES = {
  // Heart metrics
  HEART_RATE: 'HeartRate',
  RESTING_HEART_RATE: 'RestingHeartRate',
  HRV_RMSSD: 'HeartRateVariabilityRmssd',

  // Sleep
  SLEEP_SESSION: 'SleepSession',

  // Activity
  STEPS: 'Steps',
  ACTIVE_CALORIES_BURNED: 'ActiveCaloriesBurned',
  DISTANCE: 'Distance',

  // Exercise
  EXERCISE_SESSION: 'ExerciseSession',
} as const;

export type HealthConnectTypeIdentifier =
  (typeof HEALTH_CONNECT_TYPES)[keyof typeof HEALTH_CONNECT_TYPES];

// =============================================================================
// AUTHORIZATION
// =============================================================================

/**
 * Health Connect availability status.
 * - available: Health Connect is installed and ready
 * - notInstalled: Health Connect app needs to be installed
 * - notSupported: Device doesn't support Health Connect (pre-API 26)
 * - unknown: Status cannot be determined
 */
export type HealthConnectAvailabilityStatus =
  | 'available'
  | 'notInstalled'
  | 'notSupported'
  | 'unknown';

/**
 * Health Connect permission status.
 * Similar to HealthKit but with permanent lockout behavior.
 *
 * IMPORTANT: If user denies permission twice, the app is permanently
 * locked out and cannot request permissions again.
 */
export type HealthConnectAuthorizationStatus =
  | 'authorized'
  | 'denied'
  | 'notDetermined'
  | 'unavailable'
  | 'permanentlyDenied' // Android-specific: locked out after 2 denials
  | 'unknown';

// =============================================================================
// DATA READINGS
// =============================================================================

/**
 * Metric types returned from Health Connect queries.
 * Matches HealthKit metric types for unified handling.
 */
export type HealthConnectMetricType =
  | 'hrv'
  | 'rhr'
  | 'sleep'
  | 'steps'
  | 'activeCalories';

/**
 * Sleep stage values from Health Connect.
 * Maps to our unified SleepStage type.
 */
export type HealthConnectSleepStage =
  | 'awake'
  | 'awake_in_bed' // User is awake while in bed
  | 'sleeping' // Unspecified sleep
  | 'out_of_bed' // User got out of bed
  | 'light' // Light sleep
  | 'deep' // Deep sleep
  | 'rem' // REM sleep
  | 'unknown';

/**
 * Unified sleep stage type (matches HealthKit).
 * Health Connect stages are mapped to this format.
 */
export type SleepStage =
  | 'inBed'
  | 'asleepUnspecified'
  | 'awake'
  | 'asleepCore' // Light sleep
  | 'asleepDeep'
  | 'asleepREM'
  | 'unknown';

/**
 * HRV method used by the source.
 * Health Connect provides RMSSD directly (preferred for recovery scoring).
 */
export type HrvMethod = 'sdnn' | 'rmssd';

/**
 * A single reading from Health Connect.
 * Matches HealthKitReading structure for unified handling.
 */
export interface HealthConnectReading {
  /** Type of metric */
  metric: HealthConnectMetricType;
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
  /** For HRV readings, the method used (Health Connect uses RMSSD) */
  hrvMethod?: HrvMethod;
  /** For sleep readings, the sleep stage */
  sleepStage?: SleepStage;
}

/**
 * Event data sent when Health Connect data is updated.
 */
export interface HealthConnectDataUpdateEvent extends HealthConnectReading {}

/**
 * Error event data.
 */
export interface HealthConnectErrorEvent {
  message: string;
  code?: string;
}

// =============================================================================
// HEALTH CONNECT SDK TYPES
// =============================================================================

/**
 * Permission type for Health Connect.
 * Format: { recordType: string, accessType: 'read' | 'write' }
 */
export interface HealthConnectPermission {
  recordType: HealthConnectTypeIdentifier;
  accessType: 'read' | 'write';
}

/**
 * Health Connect record from the SDK.
 * Generic structure - specific record types have additional fields.
 */
export interface HealthConnectRecord {
  recordType: string;
  time?: {
    startTime: string; // ISO 8601
    endTime: string; // ISO 8601
  };
  startTime?: string; // ISO 8601
  endTime?: string; // ISO 8601
  metadata?: {
    id?: string;
    dataOrigin?: string;
    lastModifiedTime?: string;
    clientRecordId?: string;
    clientRecordVersion?: number;
    device?: {
      manufacturer?: string;
      model?: string;
      type?: number;
    };
  };
}

/**
 * Heart Rate Variability RMSSD record.
 * Note: Uses 'time' string for instant measurements (overrides base interface).
 */
export interface HeartRateVariabilityRmssdRecord extends Omit<HealthConnectRecord, 'time'> {
  recordType: 'HeartRateVariabilityRmssd';
  heartRateVariabilityMillis: number;
  time: string; // ISO 8601 instant
}

/**
 * Resting Heart Rate record.
 * Note: Uses 'time' string for instant measurements (overrides base interface).
 */
export interface RestingHeartRateRecord extends Omit<HealthConnectRecord, 'time'> {
  recordType: 'RestingHeartRate';
  beatsPerMinute: number;
  time: string; // ISO 8601 instant
}

/**
 * Steps record.
 */
export interface StepsRecord extends HealthConnectRecord {
  recordType: 'Steps';
  count: number;
  startTime: string;
  endTime: string;
}

/**
 * Active Calories Burned record.
 */
export interface ActiveCaloriesBurnedRecord extends HealthConnectRecord {
  recordType: 'ActiveCaloriesBurned';
  energy: {
    inKilocalories: number;
  };
  startTime: string;
  endTime: string;
}

/**
 * Sleep stage record (part of SleepSessionRecord).
 */
export interface SleepStageRecord {
  stage: number; // 0=unknown, 1=awake, 2=sleeping, 3=out_of_bed, 4=light, 5=deep, 6=rem
  startTime: string;
  endTime: string;
}

/**
 * Sleep Session record.
 */
export interface SleepSessionRecord extends HealthConnectRecord {
  recordType: 'SleepSession';
  title?: string;
  notes?: string;
  stages?: SleepStageRecord[];
  startTime: string;
  endTime: string;
}

// =============================================================================
// SYNC RESULT
// =============================================================================

/**
 * Result from a manual sync operation.
 */
export interface SyncResult {
  /** Readings fetched during sync */
  readings: HealthConnectReading[];
  /** Timestamp of sync completion */
  syncedAt: Date;
  /** Source identifier */
  source: 'health_connect';
}

// =============================================================================
// DEFAULT PERMISSIONS
// =============================================================================

/**
 * Default permissions to request for Apex OS.
 * Read-only permissions for recovery score calculation.
 */
export const DEFAULT_PERMISSIONS: HealthConnectPermission[] = [
  { recordType: 'HeartRateVariabilityRmssd', accessType: 'read' },
  { recordType: 'RestingHeartRate', accessType: 'read' },
  { recordType: 'SleepSession', accessType: 'read' },
  { recordType: 'Steps', accessType: 'read' },
  { recordType: 'ActiveCaloriesBurned', accessType: 'read' },
];

/**
 * Record types to read for recovery scoring.
 */
export const DEFAULT_RECORD_TYPES: HealthConnectTypeIdentifier[] = [
  HEALTH_CONNECT_TYPES.HRV_RMSSD,
  HEALTH_CONNECT_TYPES.RESTING_HEART_RATE,
  HEALTH_CONNECT_TYPES.SLEEP_SESSION,
  HEALTH_CONNECT_TYPES.STEPS,
  HEALTH_CONNECT_TYPES.ACTIVE_CALORIES_BURNED,
];

// =============================================================================
// SLEEP STAGE MAPPING
// =============================================================================

/**
 * Maps Health Connect sleep stage numbers to our unified SleepStage type.
 */
export const SLEEP_STAGE_MAP: Record<number, SleepStage> = {
  0: 'unknown', // STAGE_TYPE_UNKNOWN
  1: 'awake', // STAGE_TYPE_AWAKE
  2: 'asleepUnspecified', // STAGE_TYPE_SLEEPING
  3: 'awake', // STAGE_TYPE_OUT_OF_BED (treat as awake for calculations)
  4: 'asleepCore', // STAGE_TYPE_LIGHT
  5: 'asleepDeep', // STAGE_TYPE_DEEP
  6: 'asleepREM', // STAGE_TYPE_REM
};

/**
 * Maps Health Connect sleep stage string names to our unified SleepStage type.
 */
export const SLEEP_STAGE_NAME_MAP: Record<HealthConnectSleepStage, SleepStage> =
  {
    unknown: 'unknown',
    awake: 'awake',
    awake_in_bed: 'inBed',
    sleeping: 'asleepUnspecified',
    out_of_bed: 'awake',
    light: 'asleepCore',
    deep: 'asleepDeep',
    rem: 'asleepREM',
  };
