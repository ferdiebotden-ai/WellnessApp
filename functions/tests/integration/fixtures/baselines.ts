/**
 * User Baseline Fixtures for Integration Tests
 *
 * Baseline data represents 14+ days of aggregated health metrics
 * used for recovery score calculation (z-score normalization).
 *
 * @file functions/tests/integration/fixtures/baselines.ts
 * @author Claude Opus 4.5 (Session 51)
 * @created December 5, 2025
 */

import { TEST_USER, TEST_DATES } from '../setup';

// =============================================================================
// ESTABLISHED BASELINE (Ready for Recovery Calculation)
// =============================================================================

/**
 * Complete baseline with 14+ samples - ready for recovery scoring.
 * Uses RMSSD method (common for Apple Watch).
 */
export function createEstablishedBaseline(overrides: Record<string, unknown> = {}) {
  return {
    user_id: TEST_USER.id,

    // HRV baseline (log-normal distribution)
    hrv_ln_mean: Math.log(48), // ~48ms RMSSD baseline
    hrv_ln_std_dev: 0.22,
    hrv_coefficient_of_variation: 14,
    hrv_method: 'rmssd',
    hrv_sample_count: 14,

    // RHR baseline
    rhr_mean: 56,
    rhr_std_dev: 3.5,
    rhr_sample_count: 14,

    // Respiratory rate baseline
    respiratory_rate_mean: 14.2,
    respiratory_rate_std_dev: 1.1,

    // Sleep baseline
    sleep_duration_target: 450, // 7.5 hours in minutes

    // Temperature baseline
    temperature_baseline_celsius: 36.5,

    // Menstrual cycle (not tracking)
    menstrual_cycle_tracking: false,
    cycle_day: null,
    last_period_start: null,

    // Confidence
    confidence_level: 'high',
    last_updated: `${TEST_DATES.today}T06:00:00Z`,
    created_at: `${TEST_DATES.twoWeeksAgo}T06:00:00Z`,

    ...overrides,
  };
}

/**
 * Baseline with SDNN method (some Apple Watch models).
 * SDNN values are typically higher than RMSSD.
 */
export function createSdnnBaseline(overrides: Record<string, unknown> = {}) {
  return {
    user_id: TEST_USER.id,

    hrv_ln_mean: Math.log(65), // ~65ms SDNN baseline
    hrv_ln_std_dev: 0.25,
    hrv_coefficient_of_variation: 16,
    hrv_method: 'sdnn',
    hrv_sample_count: 14,

    rhr_mean: 58,
    rhr_std_dev: 4,
    rhr_sample_count: 14,

    respiratory_rate_mean: 14.5,
    respiratory_rate_std_dev: 1.2,

    sleep_duration_target: 450,
    temperature_baseline_celsius: 36.5,

    menstrual_cycle_tracking: false,
    cycle_day: null,
    last_period_start: null,

    confidence_level: 'high',
    last_updated: `${TEST_DATES.today}T06:00:00Z`,
    created_at: `${TEST_DATES.twoWeeksAgo}T06:00:00Z`,

    ...overrides,
  };
}

// =============================================================================
// NEW USER BASELINE (Not Ready)
// =============================================================================

/**
 * Partial baseline with only 3 samples - not ready for recovery scoring.
 */
export function createPartialBaseline(overrides: Record<string, unknown> = {}) {
  return {
    user_id: TEST_USER.id,

    hrv_ln_mean: Math.log(45),
    hrv_ln_std_dev: 0.30, // Higher variance with fewer samples
    hrv_coefficient_of_variation: 18,
    hrv_method: 'rmssd',
    hrv_sample_count: 3, // Not enough for reliable scoring

    rhr_mean: 60,
    rhr_std_dev: 5,
    rhr_sample_count: 3,

    respiratory_rate_mean: 15,
    respiratory_rate_std_dev: 1.5,

    sleep_duration_target: 450,
    temperature_baseline_celsius: 36.5,

    menstrual_cycle_tracking: false,
    cycle_day: null,
    last_period_start: null,

    confidence_level: 'low', // Low confidence due to few samples
    last_updated: `${TEST_DATES.today}T06:00:00Z`,
    created_at: `${TEST_DATES.weekAgo}T06:00:00Z`,

    ...overrides,
  };
}

// =============================================================================
// EDGE CASE BASELINES
// =============================================================================

/**
 * Baseline with menstrual cycle tracking enabled.
 */
export function createMenstrualTrackingBaseline(overrides: Record<string, unknown> = {}) {
  return {
    user_id: TEST_USER.id,

    hrv_ln_mean: Math.log(50),
    hrv_ln_std_dev: 0.28, // Slightly higher variance due to cycle
    hrv_coefficient_of_variation: 16,
    hrv_method: 'rmssd',
    hrv_sample_count: 28, // Full cycle of data

    rhr_mean: 62,
    rhr_std_dev: 4,
    rhr_sample_count: 28,

    respiratory_rate_mean: 14.5,
    respiratory_rate_std_dev: 1.3,

    sleep_duration_target: 480, // 8 hours
    temperature_baseline_celsius: 36.4,

    menstrual_cycle_tracking: true,
    cycle_day: 14, // Mid-cycle (ovulation)
    last_period_start: '2020-01-01',

    confidence_level: 'high',
    last_updated: `${TEST_DATES.today}T06:00:00Z`,
    created_at: '2019-12-15T06:00:00Z',

    ...overrides,
  };
}

/**
 * Athlete baseline - lower RHR, higher HRV.
 */
export function createAthleteBaseline(overrides: Record<string, unknown> = {}) {
  return {
    user_id: TEST_USER.id,

    hrv_ln_mean: Math.log(75), // High HRV typical of athletes
    hrv_ln_std_dev: 0.20,
    hrv_coefficient_of_variation: 12,
    hrv_method: 'rmssd',
    hrv_sample_count: 30,

    rhr_mean: 48, // Low RHR - very fit
    rhr_std_dev: 2.5,
    rhr_sample_count: 30,

    respiratory_rate_mean: 12, // Efficient breathing
    respiratory_rate_std_dev: 0.8,

    sleep_duration_target: 510, // 8.5 hours - athletes need more sleep
    temperature_baseline_celsius: 36.3,

    menstrual_cycle_tracking: false,
    cycle_day: null,
    last_period_start: null,

    confidence_level: 'high',
    last_updated: `${TEST_DATES.today}T06:00:00Z`,
    created_at: '2019-12-01T06:00:00Z',

    ...overrides,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create historical daily_metrics entries to establish a baseline.
 * Call this to seed data for a new user before baseline calculation.
 */
export function createBaselineSeedMetrics(
  userId: string,
  startDate: string,
  days: number = 14
): Array<Record<string, unknown>> {
  const metrics = [];
  const baseDate = new Date(startDate);

  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    metrics.push({
      user_id: userId,
      date: dateStr,
      sleep_duration_hours: 7 + Math.random() * 1.5, // 7-8.5 hours
      sleep_efficiency: 80 + Math.random() * 15, // 80-95%
      sleep_onset_minutes: 10 + Math.random() * 20, // 10-30 min
      rem_percentage: 18 + Math.random() * 8, // 18-26%
      deep_percentage: 14 + Math.random() * 8, // 14-22%
      light_percentage: 50 + Math.random() * 10, // 50-60%
      awake_percentage: 3 + Math.random() * 5, // 3-8%
      hrv_avg: 45 + Math.random() * 15, // 45-60ms
      hrv_method: 'rmssd',
      rhr_avg: 54 + Math.random() * 8, // 54-62 bpm
      respiratory_rate_avg: 13 + Math.random() * 3, // 13-16 bpm
      steps: 6000 + Math.floor(Math.random() * 6000), // 6k-12k
      active_calories: 200 + Math.floor(Math.random() * 200), // 200-400
      temperature_deviation: -0.2 + Math.random() * 0.4, // -0.2 to +0.2
      wearable_source: 'apple_health',
      synced_at: `${dateStr}T07:00:00Z`,
      created_at: `${dateStr}T07:00:00Z`,
      updated_at: `${dateStr}T07:00:00Z`,
    });
  }

  return metrics;
}
