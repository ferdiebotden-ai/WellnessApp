/**
 * Wearable Data Fixtures for Integration Tests
 *
 * Sample payloads for wearable sync endpoints, mimicking
 * real data from Apple Health and Health Connect.
 *
 * @file functions/tests/integration/fixtures/wearables.ts
 * @author Claude Opus 4.5 (Session 51)
 * @created December 5, 2025
 */

import { TEST_USER, TEST_DATES } from '../setup';

// =============================================================================
// APPLE HEALTH (iOS) FIXTURES
// =============================================================================

/**
 * Complete Apple Health sync payload - good night's sleep.
 * HRV uses SDNN method (Apple's default).
 */
export function createAppleHealthPayload(overrides: Record<string, unknown> = {}) {
  return {
    user_id: TEST_USER.id,
    source: 'apple_health' as const,
    captured_at: `${TEST_DATES.today}T07:00:00Z`,
    metrics: [
      {
        metric: 'sleep',
        value: 450, // 7.5 hours in minutes
        unit: 'minutes',
        startDate: `${TEST_DATES.yesterday}T23:00:00Z`,
        endDate: `${TEST_DATES.today}T06:30:00Z`,
        sleepStage: 'asleep',
        metadata: {
          efficiency: 88,
          deep_minutes: 81, // 18%
          rem_minutes: 99,  // 22%
          light_minutes: 248, // 55%
          awake_minutes: 22,  // 5%
        },
      },
      {
        metric: 'hrv',
        value: 72, // SDNN in ms
        unit: 'ms',
        hrvMethod: 'sdnn',
        startDate: `${TEST_DATES.today}T06:00:00Z`,
        endDate: `${TEST_DATES.today}T06:30:00Z`,
      },
      {
        metric: 'rhr',
        value: 54,
        unit: 'bpm',
        startDate: `${TEST_DATES.today}T03:00:00Z`,
        endDate: `${TEST_DATES.today}T06:00:00Z`,
      },
      {
        metric: 'steps',
        value: 8500,
        unit: 'count',
        startDate: `${TEST_DATES.yesterday}T00:00:00Z`,
        endDate: `${TEST_DATES.yesterday}T23:59:59Z`,
      },
      {
        metric: 'activeCalories',
        value: 320,
        unit: 'kcal',
        startDate: `${TEST_DATES.yesterday}T00:00:00Z`,
        endDate: `${TEST_DATES.yesterday}T23:59:59Z`,
      },
    ],
    ...overrides,
  };
}

/**
 * Apple Health payload - poor sleep (low recovery scenario).
 */
export function createAppleHealthPoorSleep(overrides: Record<string, unknown> = {}) {
  return {
    user_id: TEST_USER.id,
    source: 'apple_health' as const,
    captured_at: `${TEST_DATES.today}T07:00:00Z`,
    metrics: [
      {
        metric: 'sleep',
        value: 300, // 5 hours - below target
        unit: 'minutes',
        startDate: `${TEST_DATES.today}T01:00:00Z`,
        endDate: `${TEST_DATES.today}T06:00:00Z`,
        sleepStage: 'asleep',
        metadata: {
          efficiency: 65, // Poor efficiency
          deep_minutes: 30, // Only 10%
          rem_minutes: 45,  // 15%
          light_minutes: 180, // 60%
          awake_minutes: 45,  // 15% - too much
        },
      },
      {
        metric: 'hrv',
        value: 35, // Low HRV - stressed/tired
        unit: 'ms',
        hrvMethod: 'sdnn',
      },
      {
        metric: 'rhr',
        value: 72, // Elevated RHR - poor recovery
        unit: 'bpm',
      },
    ],
    ...overrides,
  };
}

// =============================================================================
// HEALTH CONNECT (Android) FIXTURES
// =============================================================================

/**
 * Complete Health Connect sync payload - good night's sleep.
 * HRV uses RMSSD method (Health Connect's default).
 */
export function createHealthConnectPayload(overrides: Record<string, unknown> = {}) {
  return {
    user_id: TEST_USER.id,
    source: 'health_connect' as const,
    captured_at: `${TEST_DATES.today}T07:00:00Z`,
    metrics: [
      {
        metric: 'sleep',
        value: 420, // 7 hours in minutes
        unit: 'minutes',
        startDate: `${TEST_DATES.yesterday}T23:30:00Z`,
        endDate: `${TEST_DATES.today}T06:30:00Z`,
        sleepStage: 'asleep',
        metadata: {
          efficiency: 85,
          deep_minutes: 75,
          rem_minutes: 84,
          light_minutes: 231,
          awake_minutes: 30,
        },
      },
      {
        metric: 'hrv',
        value: 55, // RMSSD in ms (typically lower than SDNN)
        unit: 'ms',
        hrvMethod: 'rmssd',
        startDate: `${TEST_DATES.today}T05:30:00Z`,
        endDate: `${TEST_DATES.today}T06:00:00Z`,
      },
      {
        metric: 'rhr',
        value: 58,
        unit: 'bpm',
      },
      {
        metric: 'steps',
        value: 7200,
        unit: 'count',
      },
      {
        metric: 'activeCalories',
        value: 280,
        unit: 'kcal',
      },
    ],
    ...overrides,
  };
}

// =============================================================================
// PARTIAL DATA FIXTURES
// =============================================================================

/**
 * Wearable payload with missing HRV (some devices don't report).
 */
export function createPartialPayload(overrides: Record<string, unknown> = {}) {
  return {
    user_id: TEST_USER.id,
    source: 'apple_health' as const,
    captured_at: `${TEST_DATES.today}T07:00:00Z`,
    metrics: [
      {
        metric: 'sleep',
        value: 390,
        unit: 'minutes',
        sleepStage: 'asleep',
      },
      {
        metric: 'steps',
        value: 6000,
        unit: 'count',
      },
      // No HRV, no RHR - common for basic fitness trackers
    ],
    ...overrides,
  };
}

// =============================================================================
// EDGE CASE FIXTURES
// =============================================================================

/**
 * Payload suggesting illness (elevated temp, elevated RHR, low HRV).
 */
export function createIllnessPatternPayload(overrides: Record<string, unknown> = {}) {
  return {
    user_id: TEST_USER.id,
    source: 'apple_health' as const,
    captured_at: `${TEST_DATES.today}T07:00:00Z`,
    metrics: [
      {
        metric: 'sleep',
        value: 540, // 9 hours - sleeping more when sick
        unit: 'minutes',
        metadata: {
          efficiency: 75,
          deep_minutes: 108,
          rem_minutes: 54,
          light_minutes: 324,
          awake_minutes: 54,
        },
      },
      {
        metric: 'hrv',
        value: 28, // Very low HRV
        unit: 'ms',
        hrvMethod: 'sdnn',
      },
      {
        metric: 'rhr',
        value: 78, // Elevated RHR
        unit: 'bpm',
      },
      {
        metric: 'respiratoryRate',
        value: 18, // Elevated breathing
        unit: 'bpm',
      },
      {
        metric: 'temperature',
        value: 0.8, // +0.8°C deviation (fever)
        unit: 'celsius_deviation',
      },
    ],
    ...overrides,
  };
}

/**
 * Payload suggesting alcohol consumption (RHR spike + HRV drop, normal sleep duration).
 */
export function createAlcoholPatternPayload(overrides: Record<string, unknown> = {}) {
  return {
    user_id: TEST_USER.id,
    source: 'apple_health' as const,
    captured_at: `${TEST_DATES.today}T07:00:00Z`,
    metrics: [
      {
        metric: 'sleep',
        value: 420,
        unit: 'minutes',
        metadata: {
          efficiency: 70,
          deep_minutes: 42, // Low deep sleep
          rem_minutes: 42,  // Low REM
          light_minutes: 294, // High light sleep
          awake_minutes: 42,
        },
      },
      {
        metric: 'hrv',
        value: 32, // Significantly depressed HRV
        unit: 'ms',
        hrvMethod: 'sdnn',
      },
      {
        metric: 'rhr',
        value: 68, // Elevated RHR
        unit: 'bpm',
      },
    ],
    ...overrides,
  };
}
