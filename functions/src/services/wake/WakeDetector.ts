/**
 * Wake Detection Service for Apex OS Phase 3
 *
 * Detects user wake events from multiple sources (HealthKit, phone unlock, manual)
 * and determines if Morning Anchor should be triggered.
 *
 * Detection confidence hierarchy:
 * - HealthKit sleep end: 0.95 (most accurate)
 * - Phone unlock + user confirmed: 0.85 (boosted)
 * - Manual report: 0.70
 * - Phone unlock (unconfirmed): 0.60 (weakest)
 *
 * @file functions/src/services/wake/WakeDetector.ts
 * @author Claude Opus 4.5 (Session 42)
 * @created December 5, 2025
 */

import {
  WakeDetectionMethod,
  WakeDetectionResult,
  WakeSourceMetrics,
  HrvSpikeMetrics,
  PhoneUnlockMetrics,
  ManualWakeMetrics,
  getMethodConfidence,
  calculateMorningAnchorWindow,
  MorningAnchorConfig,
} from '../../types/wake.types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Input for wake detection analysis.
 */
export interface WakeDetectionInput {
  userId: string;
  source: 'healthkit' | 'phone_unlock' | 'manual';
  timezone: string;

  // HealthKit-specific
  sleepEndTime?: Date;
  sleepStartTime?: Date; // For nap detection

  // Phone unlock-specific
  phoneUnlockTime?: Date;
  userConfirmedAt?: Date; // Boosts confidence if user tapped "Let's Go"

  // Manual-specific
  reportedWakeTime?: Date;
}

/**
 * Output from wake detection analysis.
 */
export interface WakeDetectionOutput {
  detected: boolean;
  wakeTime: Date | null;
  method: WakeDetectionMethod | null;
  confidence: number;
  effectiveConfidence: number; // Boosted if user confirmed
  shouldTriggerMorningAnchor: boolean;
  morningAnchorWindow: {
    start: Date;
    end: Date;
    optimal: Date;
  } | null;
  sourceMetrics: WakeSourceMetrics | null;
  reason: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Minimum hour (local time) to consider a valid wake event.
 * Earlier than this is likely a false positive (checking phone at night).
 */
const MIN_WAKE_HOUR = 4;

/**
 * Maximum hour (local time) to consider a valid wake event.
 * Later than this is unlikely to be a "morning" wake.
 */
const MAX_WAKE_HOUR = 14;

/**
 * Minimum sleep duration (hours) to qualify as night sleep.
 * Shorter durations are treated as naps.
 */
const MIN_NIGHT_SLEEP_HOURS = 3;

/**
 * Hour after which short sleep is definitely a nap, not night sleep.
 */
const NAP_DETECTION_HOUR = 12;

/**
 * Confidence boost when user confirms phone unlock wake.
 */
const PHONE_UNLOCK_CONFIRMATION_BOOST = 0.25;

/**
 * Default Morning Anchor configuration.
 */
const DEFAULT_MORNING_ANCHOR_CONFIG: MorningAnchorConfig = {
  minDelayMinutes: 5,
  maxDelayMinutes: 15,
  optimalDelayMinutes: 8,
  skipReasons: [],
};

// =============================================================================
// WAKE DETECTOR CLASS
// =============================================================================

export class WakeDetector {
  /**
   * Analyze input and detect wake event.
   *
   * @param input - Wake detection input from various sources
   * @returns Detection result with confidence and Morning Anchor timing
   */
  detect(input: WakeDetectionInput): WakeDetectionOutput {
    const { source, timezone } = input;

    // Route to appropriate detection method
    switch (source) {
      case 'healthkit':
        return this.detectFromHealthKit(input, timezone);

      case 'phone_unlock':
        return this.detectFromPhoneUnlock(input, timezone);

      case 'manual':
        return this.detectFromManual(input, timezone);

      default:
        return this.noDetection('Unknown source');
    }
  }

  /**
   * Detect wake from HealthKit sleep data.
   * Uses sleep end time as wake indicator.
   */
  private detectFromHealthKit(
    input: WakeDetectionInput,
    timezone: string
  ): WakeDetectionOutput {
    const { sleepEndTime, sleepStartTime } = input;

    if (!sleepEndTime) {
      return this.noDetection('No sleep end time provided');
    }

    const wakeTime = sleepEndTime;
    const localHour = this.getLocalHour(wakeTime, timezone);

    // Validate wake time is within reasonable window
    if (localHour < MIN_WAKE_HOUR) {
      return this.noDetection(`Wake time too early (${localHour}h < ${MIN_WAKE_HOUR}h)`);
    }

    if (localHour > MAX_WAKE_HOUR) {
      return this.noDetection(`Wake time too late (${localHour}h > ${MAX_WAKE_HOUR}h)`);
    }

    // Check for nap (short sleep after noon)
    if (sleepStartTime) {
      const sleepDurationHours =
        (wakeTime.getTime() - sleepStartTime.getTime()) / (1000 * 60 * 60);

      if (
        sleepDurationHours < MIN_NIGHT_SLEEP_HOURS &&
        localHour >= NAP_DETECTION_HOUR
      ) {
        return this.noDetection(
          `Detected nap (${sleepDurationHours.toFixed(1)}h after ${NAP_DETECTION_HOUR}:00)`
        );
      }
    }

    // Valid HealthKit wake
    const method: WakeDetectionMethod = 'hrv_spike'; // HealthKit uses HRV-derived sleep analysis
    const confidence = getMethodConfidence(method);

    const sourceMetrics: HrvSpikeMetrics = {
      method: 'hrv_spike',
      preWakeHrv: 0, // Not available from basic sleep data
      postWakeHrv: 0,
      deltaPercent: 0,
      detectionWindowMinutes: 30,
    };

    const morningAnchorWindow = calculateMorningAnchorWindow(
      wakeTime,
      DEFAULT_MORNING_ANCHOR_CONFIG
    );

    return {
      detected: true,
      wakeTime,
      method,
      confidence,
      effectiveConfidence: confidence, // No boost for wearable data
      shouldTriggerMorningAnchor: this.isWithinTriggerWindow(morningAnchorWindow),
      morningAnchorWindow,
      sourceMetrics,
      reason: 'HealthKit sleep end time detected',
    };
  }

  /**
   * Detect wake from phone unlock (Lite Mode).
   * Lower confidence, can be boosted by user confirmation.
   */
  private detectFromPhoneUnlock(
    input: WakeDetectionInput,
    timezone: string
  ): WakeDetectionOutput {
    const { phoneUnlockTime, userConfirmedAt } = input;

    if (!phoneUnlockTime) {
      return this.noDetection('No phone unlock time provided');
    }

    const wakeTime = phoneUnlockTime;
    const localHour = this.getLocalHour(wakeTime, timezone);

    // Validate wake time is within reasonable window
    if (localHour < MIN_WAKE_HOUR) {
      return this.noDetection(
        `Phone unlock too early (${localHour}h < ${MIN_WAKE_HOUR}h)`
      );
    }

    if (localHour > MAX_WAKE_HOUR) {
      return this.noDetection(
        `Phone unlock too late (${localHour}h > ${MAX_WAKE_HOUR}h)`
      );
    }

    // Calculate confidence
    const method: WakeDetectionMethod = 'phone_unlock';
    const baseConfidence = getMethodConfidence(method);
    const effectiveConfidence = userConfirmedAt
      ? Math.min(baseConfidence + PHONE_UNLOCK_CONFIRMATION_BOOST, 1.0)
      : baseConfidence;

    const sourceMetrics: PhoneUnlockMetrics = {
      method: 'phone_unlock',
      firstUnlockTime: phoneUnlockTime.toISOString(),
      deviceTimezone: timezone,
      isWorkday: this.isWorkday(phoneUnlockTime),
    };

    const morningAnchorWindow = calculateMorningAnchorWindow(
      wakeTime,
      DEFAULT_MORNING_ANCHOR_CONFIG
    );

    return {
      detected: true,
      wakeTime,
      method,
      confidence: baseConfidence,
      effectiveConfidence,
      shouldTriggerMorningAnchor: this.isWithinTriggerWindow(morningAnchorWindow),
      morningAnchorWindow,
      sourceMetrics,
      reason: userConfirmedAt
        ? 'Phone unlock confirmed by user'
        : 'Phone unlock detected (unconfirmed)',
    };
  }

  /**
   * Detect wake from manual user report.
   */
  private detectFromManual(
    input: WakeDetectionInput,
    timezone: string
  ): WakeDetectionOutput {
    const { reportedWakeTime, phoneUnlockTime } = input;
    const wakeTime = reportedWakeTime || phoneUnlockTime;

    if (!wakeTime) {
      return this.noDetection('No wake time provided');
    }

    const localHour = this.getLocalHour(wakeTime, timezone);

    // Validate wake time is within reasonable window
    if (localHour < MIN_WAKE_HOUR) {
      return this.noDetection(
        `Manual wake time too early (${localHour}h < ${MIN_WAKE_HOUR}h)`
      );
    }

    if (localHour > MAX_WAKE_HOUR) {
      return this.noDetection(
        `Manual wake time too late (${localHour}h > ${MAX_WAKE_HOUR}h)`
      );
    }

    const method: WakeDetectionMethod = 'manual';
    const confidence = getMethodConfidence(method);

    const sourceMetrics: ManualWakeMetrics = {
      method: 'manual',
      reportedAt: new Date().toISOString(),
      wakeTimeReported: wakeTime.toISOString(),
      source: 'app',
    };

    const morningAnchorWindow = calculateMorningAnchorWindow(
      wakeTime,
      DEFAULT_MORNING_ANCHOR_CONFIG
    );

    return {
      detected: true,
      wakeTime,
      method,
      confidence,
      effectiveConfidence: confidence,
      shouldTriggerMorningAnchor: this.isWithinTriggerWindow(morningAnchorWindow),
      morningAnchorWindow,
      sourceMetrics,
      reason: 'User manually reported wake time',
    };
  }

  /**
   * Return a no-detection result with reason.
   */
  private noDetection(reason: string): WakeDetectionOutput {
    return {
      detected: false,
      wakeTime: null,
      method: null,
      confidence: 0,
      effectiveConfidence: 0,
      shouldTriggerMorningAnchor: false,
      morningAnchorWindow: null,
      sourceMetrics: null,
      reason,
    };
  }

  /**
   * Get local hour from Date in given timezone.
   */
  private getLocalHour(date: Date, timezone: string): number {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      });
      const parts = formatter.formatToParts(date);
      const hourPart = parts.find((p) => p.type === 'hour');
      return hourPart ? parseInt(hourPart.value, 10) : date.getUTCHours();
    } catch {
      // Fallback to UTC if timezone is invalid
      return date.getUTCHours();
    }
  }

  /**
   * Check if date is a workday (Monday-Friday).
   */
  private isWorkday(date: Date): boolean {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  }

  /**
   * Check if we're within the trigger window for Morning Anchor.
   * Currently always returns true since we trigger on detection.
   * In future, could check if we're within the 5-15 min window.
   */
  private isWithinTriggerWindow(
    window: { start: Date; end: Date; optimal: Date }
  ): boolean {
    const now = new Date();
    // If detection just happened, we schedule for the optimal window
    // So we always "should trigger" - the timing happens in MorningAnchorService
    return true;
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let wakeDetectorInstance: WakeDetector | null = null;

export function getWakeDetector(): WakeDetector {
  if (!wakeDetectorInstance) {
    wakeDetectorInstance = new WakeDetector();
  }
  return wakeDetectorInstance;
}

// Also export class for testing
export default WakeDetector;
