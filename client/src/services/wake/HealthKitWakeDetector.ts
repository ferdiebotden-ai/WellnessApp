/**
 * HealthKit Wake Detector (Client-side)
 *
 * Detects wake time from HealthKit sleep analysis data.
 * Uses the end time of the most recent sleep session as wake indicator.
 *
 * @file client/src/services/wake/HealthKitWakeDetector.ts
 * @author Claude Opus 4.5 (Session 42)
 * @created December 5, 2025
 */

import { Platform } from 'react-native';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Sleep reading from HealthKit.
 */
interface SleepReading {
  metric: 'sleep';
  value: number;
  unit: string;
  startDate: number; // Epoch ms
  endDate: number; // Epoch ms
  source: string;
  sleepStage?: 'inBed' | 'asleepUnspecified' | 'awake' | 'asleepCore' | 'asleepDeep' | 'asleepREM' | 'unknown';
}

/**
 * HealthKit reading generic type.
 */
interface HealthKitReading {
  metric: string;
  value: number;
  unit: string;
  startDate: number;
  endDate: number;
  source: string;
  sleepStage?: string;
}

/**
 * Result of wake detection from HealthKit.
 */
export interface HealthKitWakeResult {
  detected: boolean;
  wakeTime: Date | null;
  sleepStartTime: Date | null;
  sleepDurationHours: number | null;
  source: 'apple_health';
  reason: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Sleep stages that indicate actual sleep (not just "in bed").
 */
const ACTUAL_SLEEP_STAGES = ['asleepCore', 'asleepDeep', 'asleepREM', 'asleepUnspecified'];

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

export class HealthKitWakeDetector {
  private healthKitModule: {
    isAvailable: () => boolean;
    syncNow: () => Promise<HealthKitReading[]>;
  } | null = null;

  constructor() {
    // Only initialize on iOS
    if (Platform.OS === 'ios') {
      this.loadHealthKitModule();
    }
  }

  /**
   * Dynamically load the HealthKit module.
   * This prevents crashes on non-iOS platforms.
   */
  private async loadHealthKitModule(): Promise<void> {
    try {
      // Dynamic import using relative path to local module
      // This avoids bundling issues on web/Android
      const module = await import('../../../../modules/expo-healthkit-observer/src');
      this.healthKitModule = module.default;
    } catch (error) {
      console.warn('[HealthKitWakeDetector] Failed to load HealthKit module:', error);
    }
  }

  /**
   * Check if HealthKit is available on this device.
   * Includes defensive guards against missing native module methods.
   */
  isAvailable(): boolean {
    if (Platform.OS !== 'ios') {
      return false;
    }
    // Guard against missing method AND null module
    if (!this.healthKitModule || typeof this.healthKitModule.isAvailable !== 'function') {
      return false;
    }
    try {
      return this.healthKitModule.isAvailable();
    } catch (error) {
      console.warn('[HealthKitWakeDetector] isAvailable() threw error:', error);
      return false;
    }
  }

  /**
   * Detect wake time from HealthKit sleep data.
   *
   * @returns Wake detection result
   */
  async detectWake(): Promise<HealthKitWakeResult> {
    // Check platform
    if (Platform.OS !== 'ios') {
      return this.noDetection('HealthKit only available on iOS');
    }

    // Check module loaded
    if (!this.healthKitModule) {
      await this.loadHealthKitModule();
      if (!this.healthKitModule) {
        return this.noDetection('HealthKit module not available');
      }
    }

    // Check availability (with defensive guard)
    if (typeof this.healthKitModule.isAvailable !== 'function' || !this.healthKitModule.isAvailable()) {
      return this.noDetection('HealthKit not available on this device');
    }

    // Check syncNow exists before calling
    if (typeof this.healthKitModule.syncNow !== 'function') {
      return this.noDetection('HealthKit syncNow method not available');
    }

    try {
      // Sync and get readings
      const readings = await this.healthKitModule.syncNow();

      // Filter to sleep readings
      const sleepReadings = readings.filter(
        (r): r is SleepReading =>
          r.metric === 'sleep' &&
          ACTUAL_SLEEP_STAGES.includes(r.sleepStage || '')
      );

      if (sleepReadings.length === 0) {
        return this.noDetection('No sleep data available');
      }

      // Sort by end time descending to get most recent
      sleepReadings.sort((a, b) => b.endDate - a.endDate);

      const latestSleep = sleepReadings[0];
      const wakeTime = new Date(latestSleep.endDate);

      // Check if data is too old
      const ageHours = (Date.now() - latestSleep.endDate) / (1000 * 60 * 60);
      if (ageHours > MAX_SLEEP_DATA_AGE_HOURS) {
        return this.noDetection(`Sleep data too old (${ageHours.toFixed(1)}h)`);
      }

      // Find the earliest sleep start for this session
      // (sleep sessions may have multiple readings for different stages)
      const sessionStartTime = this.findSessionStart(sleepReadings, latestSleep.endDate);
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
        source: 'apple_health',
        reason: 'Wake detected from HealthKit sleep end time',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.noDetection(`HealthKit sync error: ${message}`);
    }
  }

  /**
   * Find the start of the sleep session containing the given end time.
   * Looks for readings that are part of the same sleep session.
   */
  private findSessionStart(readings: SleepReading[], sessionEndMs: number): Date | null {
    // Session gap threshold - if there's more than 2 hours between readings,
    // they're probably different sessions
    const SESSION_GAP_MS = 2 * 60 * 60 * 1000;

    // Filter readings that ended within a reasonable time of the session end
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
  private noDetection(reason: string): HealthKitWakeResult {
    return {
      detected: false,
      wakeTime: null,
      sleepStartTime: null,
      sleepDurationHours: null,
      source: 'apple_health',
      reason,
    };
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let detectorInstance: HealthKitWakeDetector | null = null;

export function getHealthKitWakeDetector(): HealthKitWakeDetector {
  if (!detectorInstance) {
    detectorInstance = new HealthKitWakeDetector();
  }
  return detectorInstance;
}

export default HealthKitWakeDetector;
