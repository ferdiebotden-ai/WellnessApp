/**
 * Health Connect Wake Detector (Client-side)
 *
 * Detects wake time from Health Connect sleep session data.
 * Uses the end time of the most recent sleep session as wake indicator.
 * Mirrors HealthKitWakeDetector for cross-platform consistency.
 *
 * @file client/src/services/wake/HealthConnectWakeDetector.ts
 * @author Claude Opus 4.5 (Session 50)
 * @created December 5, 2025
 */

import { Platform } from 'react-native';

import {
  HealthConnectReading,
  SleepStage,
} from '../../types/healthConnect';
import { HealthConnectAdapter } from '../health/HealthConnectAdapter';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of wake detection from Health Connect.
 */
export interface HealthConnectWakeResult {
  detected: boolean;
  wakeTime: Date | null;
  sleepStartTime: Date | null;
  sleepDurationHours: number | null;
  source: 'health_connect';
  reason: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Sleep stages that indicate actual sleep (not just awake time).
 */
const ACTUAL_SLEEP_STAGES: SleepStage[] = [
  'asleepCore',
  'asleepDeep',
  'asleepREM',
  'asleepUnspecified',
];

/**
 * Minimum sleep duration (hours) to consider valid for wake detection.
 */
const MIN_SLEEP_HOURS = 2;

/**
 * Maximum age of sleep data (hours) to consider for wake detection.
 */
const MAX_SLEEP_DATA_AGE_HOURS = 24;

// =============================================================================
// DETECTOR CLASS
// =============================================================================

/**
 * Lazy-loaded Health Connect library reference.
 */
let healthConnectLib: typeof import('react-native-health-connect') | null = null;

/**
 * Lazily load the Health Connect library.
 */
async function getHealthConnectLib() {
  if (healthConnectLib) return healthConnectLib;

  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    healthConnectLib = await import('react-native-health-connect');
    return healthConnectLib;
  } catch (err) {
    console.error('[HealthConnectWakeDetector] Failed to load library:', err);
    return null;
  }
}

export class HealthConnectWakeDetector {
  private isInitialized = false;

  constructor() {
    // Only initialize on Android
    if (Platform.OS === 'android') {
      this.initialize();
    }
  }

  /**
   * Initialize the Health Connect SDK.
   */
  private async initialize(): Promise<void> {
    try {
      const lib = await getHealthConnectLib();
      if (!lib) return;

      await lib.initialize();
      this.isInitialized = true;
    } catch (error) {
      console.warn('[HealthConnectWakeDetector] Failed to initialize:', error);
    }
  }

  /**
   * Check if Health Connect is available on this device.
   */
  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const lib = await getHealthConnectLib();
      if (!lib) return false;

      if (!this.isInitialized) {
        await this.initialize();
      }

      const sdkStatus = await lib.getSdkStatus();
      return sdkStatus === lib.SdkAvailabilityStatus.SDK_AVAILABLE;
    } catch {
      return false;
    }
  }

  /**
   * Detect wake time from Health Connect sleep data.
   *
   * @returns Wake detection result
   */
  async detectWake(): Promise<HealthConnectWakeResult> {
    // Check platform
    if (Platform.OS !== 'android') {
      return this.noDetection('Health Connect only available on Android');
    }

    try {
      const lib = await getHealthConnectLib();
      if (!lib) {
        return this.noDetection('Health Connect library not available');
      }

      // Initialize if needed
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Check SDK availability
      const sdkStatus = await lib.getSdkStatus();
      if (sdkStatus !== lib.SdkAvailabilityStatus.SDK_AVAILABLE) {
        return this.noDetection('Health Connect not available on this device');
      }

      // Query sleep sessions from the last 24 hours
      const now = new Date();
      const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Type assertion for readRecords API (handles type mismatch between versions)
      type ReadRecordsParams = Parameters<typeof lib.readRecords>;
      const sleepRecords = await lib.readRecords(
        'SleepSession' as ReadRecordsParams[0],
        {
          timeRangeFilter: {
            operator: 'between',
            startTime: startTime.toISOString(),
            endTime: now.toISOString(),
          },
        } as ReadRecordsParams[1]
      );

      if (!sleepRecords?.records || sleepRecords.records.length === 0) {
        return this.noDetection('No sleep data available');
      }

      // Convert to our unified format
      const sleepReadings = HealthConnectAdapter.convertSleepRecords(
        sleepRecords.records as any[]
      );

      // Filter to actual sleep stages (not awake time)
      const actualSleepReadings = sleepReadings.filter(
        (r) =>
          r.metric === 'sleep' &&
          ACTUAL_SLEEP_STAGES.includes(r.sleepStage as SleepStage)
      );

      if (actualSleepReadings.length === 0) {
        return this.noDetection('No actual sleep data available (only awake stages)');
      }

      // Sort by end time descending to get most recent
      actualSleepReadings.sort((a, b) => b.endDate - a.endDate);

      const latestSleep = actualSleepReadings[0];
      const wakeTime = new Date(latestSleep.endDate);

      // Check if data is too old
      const ageHours = (Date.now() - latestSleep.endDate) / (1000 * 60 * 60);
      if (ageHours > MAX_SLEEP_DATA_AGE_HOURS) {
        return this.noDetection(`Sleep data too old (${ageHours.toFixed(1)}h)`);
      }

      // Find the start of the sleep session
      const sessionStartTime = this.findSessionStart(
        actualSleepReadings,
        latestSleep.endDate
      );
      const sleepDurationHours = sessionStartTime
        ? (latestSleep.endDate - sessionStartTime.getTime()) / (1000 * 60 * 60)
        : null;

      // Check minimum sleep duration
      if (sleepDurationHours !== null && sleepDurationHours < MIN_SLEEP_HOURS) {
        return this.noDetection(`Sleep too short (${sleepDurationHours.toFixed(1)}h)`);
      }

      return {
        detected: true,
        wakeTime,
        sleepStartTime: sessionStartTime,
        sleepDurationHours,
        source: 'health_connect',
        reason: 'Wake detected from Health Connect sleep end time',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.noDetection(`Health Connect sync error: ${message}`);
    }
  }

  /**
   * Find the start of the sleep session containing the given end time.
   */
  private findSessionStart(
    readings: HealthConnectReading[],
    sessionEndMs: number
  ): Date | null {
    // Session gap threshold - if there's more than 2 hours between readings,
    // they're probably different sessions
    const SESSION_GAP_MS = 2 * 60 * 60 * 1000;

    // Filter readings within a reasonable window of the session end
    const sessionReadings = readings.filter((r) => {
      const gap = sessionEndMs - r.endDate;
      return gap >= 0 && gap < 12 * 60 * 60 * 1000; // Within 12 hours
    });

    if (sessionReadings.length === 0) {
      return null;
    }

    // Sort by start time ascending
    sessionReadings.sort((a, b) => a.startDate - b.startDate);

    // Find earliest reading that's part of continuous session
    let sessionStart = sessionReadings[0].startDate;

    for (let i = 1; i < sessionReadings.length; i++) {
      const gap = sessionReadings[i].startDate - sessionReadings[i - 1].endDate;
      if (gap > SESSION_GAP_MS) {
        // Gap too large - this is a different session
        sessionStart = sessionReadings[i].startDate;
      }
    }

    return new Date(sessionStart);
  }

  /**
   * Return a no-detection result.
   */
  private noDetection(reason: string): HealthConnectWakeResult {
    return {
      detected: false,
      wakeTime: null,
      sleepStartTime: null,
      sleepDurationHours: null,
      source: 'health_connect',
      reason,
    };
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let detectorInstance: HealthConnectWakeDetector | null = null;

export function getHealthConnectWakeDetector(): HealthConnectWakeDetector {
  if (!detectorInstance) {
    detectorInstance = new HealthConnectWakeDetector();
  }
  return detectorInstance;
}

export default HealthConnectWakeDetector;
