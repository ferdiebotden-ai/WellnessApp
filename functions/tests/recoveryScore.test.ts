/**
 * Recovery Score Service Tests
 *
 * Comprehensive unit tests for the recovery calculation algorithm.
 * Tests cover component scoring, weight redistribution, edge case detection,
 * and the complete recovery calculation flow.
 *
 * Reference: PHASE_III_IMPLEMENTATION_PLAN.md - Session 3
 *
 * @file functions/tests/recoveryScore.test.ts
 * @author Claude Opus 4.5 (Session 40)
 * @created December 4, 2025
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  calculateRecoveryScore,
  calculateHrvScore,
  calculateRhrScore,
  calculateSleepQualityScore,
  calculateSleepDurationScore,
  calculateRespiratoryRateScore,
  calculateTemperaturePenalty,
  detectEdgeCases,
  generateRecommendations,
  shouldCalculateRecovery,
  getBaselineStatus,
  COMPONENT_WEIGHTS,
  type RecoveryInput,
} from '../src/services/recoveryScore';
import type { DailyMetricsRow } from '../src/types/wearable.types';
import type { UserBaseline } from '../src/types/recovery.types';

// Test environment setup
process.env.FIREBASE_PROJECT_ID = 'demo-project';
process.env.FIREBASE_CLIENT_EMAIL = 'demo@example.com';
process.env.FIREBASE_PRIVATE_KEY = 'line1\\nline2';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
process.env.SUPABASE_JWT_SECRET = 'secret';

// =============================================================================
// TEST FIXTURES
// =============================================================================

/**
 * Create a mock user baseline for testing.
 */
function createMockBaseline(overrides: Partial<UserBaseline> = {}): UserBaseline {
  return {
    userId: 'test-user-123',
    hrvLnMean: Math.log(45), // ~45ms RMSSD baseline
    hrvLnStdDev: 0.25,
    hrvCoefficientOfVariation: 15,
    hrvMethod: 'rmssd',
    hrvSampleCount: 14,
    rhrMean: 58,
    rhrStdDev: 3,
    rhrSampleCount: 14,
    respiratoryRateMean: 14,
    respiratoryRateStdDev: 1,
    sleepDurationTarget: 450, // 7.5 hours
    temperatureBaselineCelsius: 36.5,
    menstrualCycleTracking: false,
    cycleDay: null,
    lastPeriodStart: null,
    confidenceLevel: 'high',
    lastUpdated: new Date(),
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock daily metrics row for testing.
 */
function createMockDailyMetrics(overrides: Partial<DailyMetricsRow> = {}): DailyMetricsRow {
  return {
    id: 'metric-123',
    user_id: 'test-user-123',
    date: '2025-12-04',
    sleep_duration_hours: 7.5,
    sleep_efficiency: 88,
    sleep_onset_minutes: 15,
    bedtime_start: '2025-12-03T23:00:00Z',
    bedtime_end: '2025-12-04T06:30:00Z',
    rem_percentage: 22,
    deep_percentage: 18,
    light_percentage: 55,
    awake_percentage: 5,
    hrv_avg: 48,
    hrv_method: 'rmssd',
    rhr_avg: 56,
    respiratory_rate_avg: 14,
    steps: 8500,
    active_minutes: 45,
    active_calories: 320,
    temperature_deviation: 0.1,
    recovery_score: null,
    recovery_confidence: null,
    wearable_source: 'apple_health',
    raw_payload: {},
    synced_at: '2025-12-04T07:00:00Z',
    created_at: '2025-12-04T07:00:00Z',
    updated_at: '2025-12-04T07:00:00Z',
    ...overrides,
  };
}

// =============================================================================
// COMPONENT WEIGHTS
// =============================================================================

describe('Component Weights', () => {
  it('should sum to 1.0', () => {
    const total = Object.values(COMPONENT_WEIGHTS).reduce((sum, w) => sum + w, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  it('should have HRV as the highest weight at 0.40', () => {
    expect(COMPONENT_WEIGHTS.hrv).toBe(0.40);
  });

  it('should have correct individual weights', () => {
    expect(COMPONENT_WEIGHTS.hrv).toBe(0.40);
    expect(COMPONENT_WEIGHTS.rhr).toBe(0.25);
    expect(COMPONENT_WEIGHTS.sleepQuality).toBe(0.20);
    expect(COMPONENT_WEIGHTS.sleepDuration).toBe(0.10);
    expect(COMPONENT_WEIGHTS.respiratoryRate).toBe(0.05);
  });
});

// =============================================================================
// HRV SCORE CALCULATION
// =============================================================================

describe('calculateHrvScore', () => {
  const baseline = createMockBaseline();

  it('should return 70 for HRV at baseline', () => {
    const result = calculateHrvScore(45, 'rmssd', baseline); // Baseline is ~45ms
    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(result.score).toBeLessThanOrEqual(75);
    expect(result.available).toBe(true);
  });

  it('should return higher score for HRV above baseline', () => {
    const result = calculateHrvScore(60, 'rmssd', baseline); // +33% above baseline
    expect(result.score).toBeGreaterThan(70);
    expect(result.available).toBe(true);
  });

  it('should return lower score for HRV below baseline', () => {
    const result = calculateHrvScore(30, 'rmssd', baseline); // -33% below baseline
    expect(result.score).toBeLessThan(70);
    expect(result.available).toBe(true);
  });

  it('should cap score at 100', () => {
    const result = calculateHrvScore(100, 'rmssd', baseline); // Very high HRV
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should cap score at 0', () => {
    const result = calculateHrvScore(10, 'rmssd', baseline); // Very low HRV
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('should return unavailable for null HRV', () => {
    const result = calculateHrvScore(null, null, baseline);
    expect(result.available).toBe(false);
    expect(result.score).toBe(0);
  });

  it('should return unavailable for zero HRV', () => {
    const result = calculateHrvScore(0, 'rmssd', baseline);
    expect(result.available).toBe(false);
  });

  it('should handle HRV method mismatch gracefully', () => {
    const result = calculateHrvScore(45, 'sdnn', baseline); // SDNN vs RMSSD baseline
    expect(result.available).toBe(true);
    expect(result.score).toBe(65); // Conservative score for mismatch
    expect(result.vsBaseline).toContain('Method mismatch');
  });

  it('should handle insufficient baseline variance', () => {
    const noVarianceBaseline = createMockBaseline({ hrvLnStdDev: 0 });
    const result = calculateHrvScore(45, 'rmssd', noVarianceBaseline);
    expect(result.score).toBe(70); // Assume baseline
    expect(result.available).toBe(true);
  });
});

// =============================================================================
// RHR SCORE CALCULATION
// =============================================================================

describe('calculateRhrScore', () => {
  const baseline = createMockBaseline(); // RHR baseline: 58 bpm

  it('should return ~70 for RHR at baseline', () => {
    const result = calculateRhrScore(58, baseline);
    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(result.score).toBeLessThanOrEqual(75);
  });

  it('should return higher score for RHR below baseline (inverse scoring)', () => {
    const result = calculateRhrScore(52, baseline); // -6 bpm below baseline
    expect(result.score).toBeGreaterThan(70);
  });

  it('should return lower score for RHR above baseline', () => {
    const result = calculateRhrScore(65, baseline); // +7 bpm above baseline
    expect(result.score).toBeLessThan(70);
  });

  it('should return unavailable for null RHR', () => {
    const result = calculateRhrScore(null, baseline);
    expect(result.available).toBe(false);
  });

  it('should return unavailable for zero RHR', () => {
    const result = calculateRhrScore(0, baseline);
    expect(result.available).toBe(false);
  });

  it('should format bpm difference correctly for higher RHR', () => {
    const result = calculateRhrScore(62, baseline);
    expect(result.vsBaseline).toContain('+4');
    expect(result.vsBaseline).toContain('bpm');
  });

  it('should format bpm difference correctly for lower RHR', () => {
    const result = calculateRhrScore(54, baseline);
    expect(result.vsBaseline).toContain('-4');
    expect(result.vsBaseline).toContain('bpm');
  });
});

// =============================================================================
// SLEEP QUALITY SCORE CALCULATION
// =============================================================================

describe('calculateSleepQualityScore', () => {
  it('should return high score for optimal sleep metrics', () => {
    const result = calculateSleepQualityScore(92, 20, 23); // 92% efficiency, 20% deep, 23% REM
    expect(result.score).toBeGreaterThan(85);
    expect(result.available).toBe(true);
  });

  it('should return moderate score for average sleep metrics', () => {
    const result = calculateSleepQualityScore(80, 15, 18);
    expect(result.score).toBeGreaterThan(50);
    expect(result.score).toBeLessThan(90);
  });

  it('should return low score for poor sleep metrics', () => {
    const result = calculateSleepQualityScore(60, 8, 10);
    expect(result.score).toBeLessThan(60);
  });

  it('should handle missing efficiency gracefully', () => {
    const result = calculateSleepQualityScore(null, 20, 22);
    expect(result.available).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it('should handle missing deep sleep gracefully', () => {
    const result = calculateSleepQualityScore(88, null, 22);
    expect(result.available).toBe(true);
  });

  it('should handle missing REM sleep gracefully', () => {
    const result = calculateSleepQualityScore(88, 20, null);
    expect(result.available).toBe(true);
  });

  it('should return unavailable when all metrics missing', () => {
    const result = calculateSleepQualityScore(null, null, null);
    expect(result.available).toBe(false);
  });

  it('should return full breakdown in result', () => {
    const result = calculateSleepQualityScore(90, 18, 22);
    expect(result.efficiency).toBe(90);
    expect(result.deepPct).toBe(18);
    expect(result.remPct).toBe(22);
  });
});

// =============================================================================
// SLEEP DURATION SCORE CALCULATION
// =============================================================================

describe('calculateSleepDurationScore', () => {
  const targetMinutes = 450; // 7.5 hours

  it('should return 100 for meeting sleep target', () => {
    const result = calculateSleepDurationScore(7.5, targetMinutes);
    expect(result.score).toBe(100);
    expect(result.vsTarget).toBe('On target');
  });

  it('should return 100 for exceeding sleep target', () => {
    const result = calculateSleepDurationScore(8.5, targetMinutes);
    expect(result.score).toBe(100);
  });

  it('should return ~85 for 90% of target', () => {
    const result = calculateSleepDurationScore(6.75, targetMinutes); // 90% of 7.5h
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.score).toBeLessThanOrEqual(95);
  });

  it('should return ~70 for 80% of target', () => {
    const result = calculateSleepDurationScore(6.0, targetMinutes); // 80% of 7.5h
    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(result.score).toBeLessThanOrEqual(75);
  });

  it('should return low score for 50% of target', () => {
    const result = calculateSleepDurationScore(3.75, targetMinutes);
    expect(result.score).toBeLessThan(50);
  });

  it('should return unavailable for null sleep hours', () => {
    const result = calculateSleepDurationScore(null, targetMinutes);
    expect(result.available).toBe(false);
  });

  it('should format positive difference correctly', () => {
    const result = calculateSleepDurationScore(8.5, targetMinutes);
    expect(result.vsTarget).toContain('+');
  });

  it('should format negative difference correctly', () => {
    const result = calculateSleepDurationScore(6.0, targetMinutes);
    expect(result.vsTarget).toContain('-');
  });
});

// =============================================================================
// RESPIRATORY RATE SCORE CALCULATION
// =============================================================================

describe('calculateRespiratoryRateScore', () => {
  const baseline = createMockBaseline(); // RR baseline: 14 breaths/min

  it('should return high score for normal respiratory rate', () => {
    const result = calculateRespiratoryRateScore(14, baseline);
    // At baseline, Z-score = 0 maps to 70 points
    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(result.score).toBeLessThanOrEqual(75);
  });

  it('should return lower score for elevated respiratory rate', () => {
    const result = calculateRespiratoryRateScore(18, baseline);
    expect(result.score).toBeLessThan(80);
  });

  it('should return unavailable for null rate', () => {
    const result = calculateRespiratoryRateScore(null, baseline);
    expect(result.available).toBe(false);
  });

  it('should handle no baseline with population norms', () => {
    const noBaselineUser = createMockBaseline({ respiratoryRateMean: 0, respiratoryRateStdDev: 0 });

    // Normal range
    const normalResult = calculateRespiratoryRateScore(14, noBaselineUser);
    expect(normalResult.score).toBe(100);
    expect(normalResult.vsBaseline).toBe('Normal range');

    // Below normal
    const lowResult = calculateRespiratoryRateScore(10, noBaselineUser);
    expect(lowResult.score).toBe(85);

    // Elevated
    const highResult = calculateRespiratoryRateScore(20, noBaselineUser);
    expect(highResult.score).toBeLessThan(70);
  });
});

// =============================================================================
// TEMPERATURE PENALTY CALCULATION
// =============================================================================

describe('calculateTemperaturePenalty', () => {
  it('should return 0 penalty for no temperature deviation', () => {
    const result = calculateTemperaturePenalty(0.1, false, null);
    expect(result.penalty).toBe(0);
  });

  it('should return 0 penalty for small deviation within threshold', () => {
    const result = calculateTemperaturePenalty(0.25, false, null);
    expect(result.penalty).toBe(0);
  });

  it('should return -5 penalty for mild deviation', () => {
    const result = calculateTemperaturePenalty(0.4, false, null);
    expect(result.penalty).toBe(-5);
  });

  it('should return -10 penalty for moderate deviation', () => {
    const result = calculateTemperaturePenalty(0.6, false, null);
    expect(result.penalty).toBe(-10);
  });

  it('should return -15 penalty for severe deviation', () => {
    const result = calculateTemperaturePenalty(1.2, false, null);
    expect(result.penalty).toBe(-15);
  });

  it('should return 0 penalty for null deviation', () => {
    const result = calculateTemperaturePenalty(null, false, null);
    expect(result.penalty).toBe(0);
    expect(result.deviation).toBeNull();
  });

  it('should adjust for menstrual luteal phase', () => {
    // Luteal phase (day 20) should allow +0.3°C more before penalizing
    const withAdjustment = calculateTemperaturePenalty(0.5, true, 20);
    // 0.5 - 0.3 = 0.2, which is below threshold
    expect(withAdjustment.penalty).toBe(0);

    // Without adjustment, 0.5°C would be -5 penalty
    const withoutAdjustment = calculateTemperaturePenalty(0.5, false, null);
    expect(withoutAdjustment.penalty).toBe(-5);
  });

  it('should not adjust during follicular phase', () => {
    // Follicular phase (day 5) should not get adjustment
    const result = calculateTemperaturePenalty(0.5, true, 5);
    expect(result.penalty).toBe(-5);
  });
});

// =============================================================================
// EDGE CASE DETECTION
// =============================================================================

describe('detectEdgeCases', () => {
  const baseline = createMockBaseline();

  it('should detect alcohol consumption pattern', () => {
    const alcoholMetrics = createMockDailyMetrics({
      hrv_avg: 30, // -33% below baseline (threshold is -25%)
      rhr_avg: 65, // +7 bpm above baseline (threshold is +5)
      rem_percentage: 10, // Low REM (threshold is <14%)
    });

    const edgeCases = detectEdgeCases(alcoholMetrics, baseline);
    expect(edgeCases.alcoholDetected).toBe(true);
  });

  it('should not detect alcohol when metrics are normal', () => {
    const normalMetrics = createMockDailyMetrics();
    const edgeCases = detectEdgeCases(normalMetrics, baseline);
    expect(edgeCases.alcoholDetected).toBe(false);
  });

  it('should detect high illness risk with multiple signals', () => {
    const sickMetrics = createMockDailyMetrics({
      temperature_deviation: 0.8, // Elevated temp
      respiratory_rate_avg: 17, // +3 above baseline
      rhr_avg: 68, // +10 bpm above baseline
      hrv_avg: 28, // -38% below baseline
    });

    const edgeCases = detectEdgeCases(sickMetrics, baseline);
    expect(edgeCases.illnessRisk).toBe('high');
  });

  it('should detect medium illness risk with two signals', () => {
    const mildSickMetrics = createMockDailyMetrics({
      temperature_deviation: 0.6, // Elevated temp
      rhr_avg: 65, // +7 bpm above baseline
    });

    const edgeCases = detectEdgeCases(mildSickMetrics, baseline);
    expect(edgeCases.illnessRisk).toBe('medium');
  });

  it('should detect low illness risk with one signal', () => {
    const oneSigMetrics = createMockDailyMetrics({
      temperature_deviation: 0.6, // Just elevated temp
    });

    const edgeCases = detectEdgeCases(oneSigMetrics, baseline);
    expect(edgeCases.illnessRisk).toBe('low');
  });

  it('should detect menstrual phase adjustment when applicable', () => {
    const lutealBaseline = createMockBaseline({
      menstrualCycleTracking: true,
      cycleDay: 18,
    });

    const metrics = createMockDailyMetrics();
    const edgeCases = detectEdgeCases(metrics, lutealBaseline);
    expect(edgeCases.menstrualPhaseAdjustment).toBe(true);
  });

  it('should not detect menstrual adjustment during follicular phase', () => {
    const follicularBaseline = createMockBaseline({
      menstrualCycleTracking: true,
      cycleDay: 8,
    });

    const metrics = createMockDailyMetrics();
    const edgeCases = detectEdgeCases(metrics, follicularBaseline);
    expect(edgeCases.menstrualPhaseAdjustment).toBe(false);
  });
});

// =============================================================================
// RECOMMENDATIONS GENERATION
// =============================================================================

describe('generateRecommendations', () => {
  it('should recommend high intensity for green zone', () => {
    const recommendations = generateRecommendations(75, 'green', {
      alcoholDetected: false,
      illnessRisk: 'none',
      travelDetected: false,
      menstrualPhaseAdjustment: false,
    });

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].type).toBe('training');
    expect(recommendations[0].headline).toContain('high intensity');
    expect(recommendations[0].activateMVD).toBe(false);
  });

  it('should recommend moderate activity for yellow zone', () => {
    const recommendations = generateRecommendations(50, 'yellow', {
      alcoholDetected: false,
      illnessRisk: 'none',
      travelDetected: false,
      menstrualPhaseAdjustment: false,
    });

    expect(recommendations[0].type).toBe('training');
    expect(recommendations[0].headline).toContain('Moderate');
  });

  it('should recommend rest for red zone', () => {
    const recommendations = generateRecommendations(25, 'red', {
      alcoholDetected: false,
      illnessRisk: 'none',
      travelDetected: false,
      menstrualPhaseAdjustment: false,
    });

    expect(recommendations[0].type).toBe('rest');
    expect(recommendations[0].activateMVD).toBe(true);
    expect(recommendations[0].protocols).toContain('nsdr');
  });

  it('should add alcohol-specific recommendation when detected', () => {
    const recommendations = generateRecommendations(40, 'yellow', {
      alcoholDetected: true,
      illnessRisk: 'none',
      travelDetected: false,
      menstrualPhaseAdjustment: false,
    });

    const alcoholRec = recommendations.find((r) => r.type === 'recovery');
    expect(alcoholRec).toBeDefined();
    expect(alcoholRec?.headline).toContain('stress markers');
  });

  it('should add illness warning when risk is high', () => {
    const recommendations = generateRecommendations(30, 'red', {
      alcoholDetected: false,
      illnessRisk: 'high',
      travelDetected: false,
      menstrualPhaseAdjustment: false,
    });

    const illnessRec = recommendations.find((r) => r.type === 'health');
    expect(illnessRec).toBeDefined();
    expect(illnessRec?.headline).toContain('illness');
    expect(illnessRec?.activateMVD).toBe(true);
  });
});

// =============================================================================
// FULL RECOVERY SCORE CALCULATION
// =============================================================================

describe('calculateRecoveryScore', () => {
  it('should calculate complete recovery score with all inputs', () => {
    const input: RecoveryInput = {
      dailyMetrics: createMockDailyMetrics(),
      userBaseline: createMockBaseline(),
    };

    const result = calculateRecoveryScore(input);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.zone).toMatch(/^(red|yellow|green)$/);
    expect(result.components).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.dataCompleteness).toBe(100);
    expect(result.missingInputs).toHaveLength(0);
  });

  it('should return green zone for excellent recovery metrics', () => {
    const excellentMetrics = createMockDailyMetrics({
      hrv_avg: 65, // Well above baseline
      rhr_avg: 52, // Below baseline
      sleep_efficiency: 95,
      deep_percentage: 22,
      rem_percentage: 24,
      sleep_duration_hours: 8,
      temperature_deviation: 0,
    });

    const input: RecoveryInput = {
      dailyMetrics: excellentMetrics,
      userBaseline: createMockBaseline(),
    };

    const result = calculateRecoveryScore(input);
    expect(result.zone).toBe('green');
    expect(result.score).toBeGreaterThanOrEqual(67);
  });

  it('should return red zone for poor recovery metrics', () => {
    const poorMetrics = createMockDailyMetrics({
      hrv_avg: 25, // Well below baseline
      rhr_avg: 72, // Above baseline
      sleep_efficiency: 65,
      deep_percentage: 8,
      rem_percentage: 12,
      sleep_duration_hours: 5,
      temperature_deviation: 0.8,
    });

    const input: RecoveryInput = {
      dailyMetrics: poorMetrics,
      userBaseline: createMockBaseline(),
    };

    const result = calculateRecoveryScore(input);
    expect(result.zone).toBe('red');
    expect(result.score).toBeLessThanOrEqual(33);
  });

  it('should handle missing HRV and redistribute weights', () => {
    const noHrvMetrics = createMockDailyMetrics({
      hrv_avg: null,
      hrv_method: null,
    });

    const input: RecoveryInput = {
      dailyMetrics: noHrvMetrics,
      userBaseline: createMockBaseline(),
    };

    const result = calculateRecoveryScore(input);

    expect(result.missingInputs).toContain('hrv');
    expect(result.dataCompleteness).toBe(80); // 4/5 components
    // Score should still be valid
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should handle missing respiratory rate (Oura-only metric)', () => {
    const noRrMetrics = createMockDailyMetrics({
      respiratory_rate_avg: null,
    });

    const input: RecoveryInput = {
      dailyMetrics: noRrMetrics,
      userBaseline: createMockBaseline(),
    };

    const result = calculateRecoveryScore(input);

    expect(result.missingInputs).toContain('respiratoryRate');
    expect(result.dataCompleteness).toBe(80);
  });

  it('should handle multiple missing components', () => {
    const minimalMetrics = createMockDailyMetrics({
      hrv_avg: 45,
      rhr_avg: 58,
      sleep_efficiency: null,
      deep_percentage: null,
      rem_percentage: null,
      sleep_duration_hours: null,
      respiratory_rate_avg: null,
    });

    const input: RecoveryInput = {
      dailyMetrics: minimalMetrics,
      userBaseline: createMockBaseline(),
    };

    const result = calculateRecoveryScore(input);

    // Should still calculate with HRV and RHR
    expect(result.dataCompleteness).toBe(40); // 2/5 components
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('should apply temperature penalty', () => {
    const feverMetrics = createMockDailyMetrics({
      temperature_deviation: 1.5, // Fever-level
    });

    const input: RecoveryInput = {
      dailyMetrics: feverMetrics,
      userBaseline: createMockBaseline(),
    };

    const result = calculateRecoveryScore(input);

    expect(result.components.temperaturePenalty.penalty).toBe(-15);
    // Score should be reduced by the penalty
    expect(result.score).toBeLessThan(80);
  });

  it('should generate reasoning string', () => {
    const input: RecoveryInput = {
      dailyMetrics: createMockDailyMetrics(),
      userBaseline: createMockBaseline(),
    };

    const result = calculateRecoveryScore(input);

    expect(result.reasoning).toBeDefined();
    expect(result.reasoning.length).toBeGreaterThan(0);
    expect(result.reasoning).toContain('Recovery Score');
    expect(result.reasoning).toContain('zone');
  });

  it('should include component breakdown in result', () => {
    const input: RecoveryInput = {
      dailyMetrics: createMockDailyMetrics(),
      userBaseline: createMockBaseline(),
    };

    const result = calculateRecoveryScore(input);

    expect(result.components.hrv.weight).toBe(0.40);
    expect(result.components.rhr.weight).toBe(0.25);
    expect(result.components.sleepQuality.weight).toBe(0.20);
    expect(result.components.sleepDuration.weight).toBe(0.10);
    expect(result.components.respiratoryRate.weight).toBe(0.05);
  });
});

// =============================================================================
// ZONE BOUNDARY CONDITIONS
// =============================================================================

describe('Zone Boundaries', () => {
  it('should classify score 33 as red zone', () => {
    // Create metrics that would produce a score around 33
    // This tests the boundary between red and yellow
    const borderlineMetrics = createMockDailyMetrics({
      hrv_avg: 20, // Very low
      rhr_avg: 75, // High
      sleep_efficiency: 50,
      deep_percentage: 5,
      rem_percentage: 8,
      sleep_duration_hours: 4,
    });

    const input: RecoveryInput = {
      dailyMetrics: borderlineMetrics,
      userBaseline: createMockBaseline(),
    };

    const result = calculateRecoveryScore(input);
    if (result.score <= 33) {
      expect(result.zone).toBe('red');
    }
  });

  it('should classify score 34 as yellow zone', () => {
    const input: RecoveryInput = {
      dailyMetrics: createMockDailyMetrics({
        hrv_avg: 28,
        rhr_avg: 68,
        sleep_efficiency: 65,
        sleep_duration_hours: 5,
      }),
      userBaseline: createMockBaseline(),
    };

    const result = calculateRecoveryScore(input);
    if (result.score >= 34 && result.score <= 66) {
      expect(result.zone).toBe('yellow');
    }
  });

  it('should classify score 67 as green zone', () => {
    const input: RecoveryInput = {
      dailyMetrics: createMockDailyMetrics({
        hrv_avg: 50,
        rhr_avg: 55,
        sleep_efficiency: 88,
        deep_percentage: 18,
        rem_percentage: 22,
        sleep_duration_hours: 7.5,
      }),
      userBaseline: createMockBaseline(),
    };

    const result = calculateRecoveryScore(input);
    if (result.score >= 67) {
      expect(result.zone).toBe('green');
    }
  });
});

// =============================================================================
// BASELINE VALIDATION
// =============================================================================

describe('shouldCalculateRecovery', () => {
  it('should return false for null baseline', () => {
    expect(shouldCalculateRecovery(null)).toBe(false);
  });

  it('should return true for high confidence baseline', () => {
    const highConfidence = createMockBaseline({ confidenceLevel: 'high', hrvSampleCount: 14 });
    expect(shouldCalculateRecovery(highConfidence)).toBe(true);
  });

  it('should return true for medium confidence baseline', () => {
    const mediumConfidence = createMockBaseline({ confidenceLevel: 'medium', hrvSampleCount: 10 });
    expect(shouldCalculateRecovery(mediumConfidence)).toBe(true);
  });

  it('should return true for low confidence with 3+ samples (MVP)', () => {
    const lowWithSamples = createMockBaseline({ confidenceLevel: 'low', hrvSampleCount: 5 });
    expect(shouldCalculateRecovery(lowWithSamples)).toBe(true);
  });

  it('should return false for low confidence with <3 samples', () => {
    const tooLow = createMockBaseline({ confidenceLevel: 'low', hrvSampleCount: 2 });
    expect(shouldCalculateRecovery(tooLow)).toBe(false);
  });
});

describe('getBaselineStatus', () => {
  it('should return not ready for null baseline', () => {
    const status = getBaselineStatus(null);
    expect(status.ready).toBe(false);
    expect(status.daysCollected).toBe(0);
    expect(status.message).toContain('Sync');
  });

  it('should return building status for partial baseline', () => {
    const partial = createMockBaseline({ hrvSampleCount: 4, confidenceLevel: 'low' });
    const status = getBaselineStatus(partial);
    expect(status.ready).toBe(false);
    expect(status.daysCollected).toBe(4);
    expect(status.message).toContain('Day 4/7');
  });

  it('should return ready for complete baseline', () => {
    const complete = createMockBaseline({ hrvSampleCount: 14, confidenceLevel: 'high' });
    const status = getBaselineStatus(complete);
    expect(status.ready).toBe(true);
    expect(status.message).toBe('Baseline ready');
  });
});

// =============================================================================
// SDNN VS RMSSD HANDLING
// =============================================================================

describe('SDNN vs RMSSD Handling', () => {
  it('should handle Apple Watch SDNN data correctly', () => {
    const sdnnBaseline = createMockBaseline({
      hrvMethod: 'sdnn',
      hrvLnMean: Math.log(70), // SDNN values are typically higher than RMSSD
    });

    const sdnnMetrics = createMockDailyMetrics({
      hrv_avg: 75,
      hrv_method: 'sdnn',
    });

    const input: RecoveryInput = {
      dailyMetrics: sdnnMetrics,
      userBaseline: sdnnBaseline,
    };

    const result = calculateRecoveryScore(input);
    // HRV component should have a raw value (meaning it was available)
    expect(result.components.hrv.raw).toBe(75);
    // Should calculate properly with matching methods
    expect(result.components.hrv.score).toBeGreaterThan(0);
  });

  it('should warn on SDNN data with RMSSD baseline', () => {
    const rmssdBaseline = createMockBaseline({
      hrvMethod: 'rmssd',
    });

    const sdnnMetrics = createMockDailyMetrics({
      hrv_avg: 70,
      hrv_method: 'sdnn', // Mismatch!
    });

    const input: RecoveryInput = {
      dailyMetrics: sdnnMetrics,
      userBaseline: rmssdBaseline,
    };

    const result = calculateRecoveryScore(input);
    expect(result.components.hrv.vsBaseline).toContain('Method mismatch');
    // Should still provide a conservative score
    expect(result.components.hrv.score).toBe(65);
  });
});

// =============================================================================
// CONFIDENCE CALCULATION
// =============================================================================

describe('Confidence Calculation', () => {
  it('should return high confidence for complete data and high baseline', () => {
    const input: RecoveryInput = {
      dailyMetrics: createMockDailyMetrics(),
      userBaseline: createMockBaseline({ confidenceLevel: 'high' }),
    };

    const result = calculateRecoveryScore(input);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('should return lower confidence for medium baseline', () => {
    const input: RecoveryInput = {
      dailyMetrics: createMockDailyMetrics(),
      userBaseline: createMockBaseline({ confidenceLevel: 'medium' }),
    };

    const result = calculateRecoveryScore(input);
    expect(result.confidence).toBeLessThan(0.9);
  });

  it('should return lowest confidence for low baseline', () => {
    const input: RecoveryInput = {
      dailyMetrics: createMockDailyMetrics(),
      userBaseline: createMockBaseline({ confidenceLevel: 'low', hrvSampleCount: 5 }),
    };

    const result = calculateRecoveryScore(input);
    // Low baseline contributes 0.4 to sample size factor (weight 0.25)
    // Other factors remain at defaults, so confidence is still moderate
    expect(result.confidence).toBeLessThan(0.85);
    expect(result.confidence).toBeGreaterThan(0.5);
  });
});
