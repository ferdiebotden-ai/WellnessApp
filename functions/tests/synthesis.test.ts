/**
 * Weekly Synthesis Tests
 *
 * Tests for data aggregation, Pearson correlation, and metrics calculation.
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 5
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  pearsonCorrelation,
  interpretCorrelation,
  getCorrelationStrength,
  getWeekMonday,
  getWeekSunday,
  SYNTHESIS_CONFIG,
  OUTCOME_EXPECTED_DIRECTION,
  OUTCOME_METRIC_NAMES,
} from '../src/synthesis';
import type {
  OutcomeMetric,
  ProtocolLogRow,
  WearableDataRow,
} from '../src/synthesis';

// Test environment setup
process.env.FIREBASE_PROJECT_ID = 'demo-project';
process.env.FIREBASE_CLIENT_EMAIL = 'demo@example.com';
process.env.FIREBASE_PRIVATE_KEY = 'line1\\nline2';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
process.env.SUPABASE_JWT_SECRET = 'secret';
process.env.DEFAULT_TRIAL_DAYS = '7';
process.env.OPENAI_API_KEY = 'openai-key';
process.env.PINECONE_API_KEY = 'pinecone-key';
process.env.PINECONE_INDEX_NAME = 'demo-index';
process.env.REVENUECAT_WEBHOOK_SECRET = 'webhook-secret';

/**
 * Helper to create mock protocol log rows
 */
function createProtocolLog(overrides: Partial<ProtocolLogRow> = {}): ProtocolLogRow {
  return {
    id: 'log-' + Math.random().toString(36).substring(7),
    user_id: 'user-123',
    protocol_id: 'protocol-1',
    module_id: 'module-1',
    source: 'manual',
    status: 'completed',
    logged_at: '2025-12-02T10:00:00.000Z',
    duration_minutes: null,
    ...overrides,
  };
}

/**
 * Helper to create mock wearable data rows
 */
function createWearableData(overrides: Partial<WearableDataRow> = {}): WearableDataRow {
  return {
    id: 'wearable-' + Math.random().toString(36).substring(7),
    user_id: 'user-123',
    source: 'apple_health',
    recorded_at: '2025-12-02T06:00:00.000Z',
    hrv_score: 65,
    hrv_rmssd_ms: 45.5,
    sleep_hours: 7.5,
    resting_hr_bpm: 58,
    readiness_score: 72,
    ...overrides,
  };
}

// ============================================================================
// PEARSON CORRELATION TESTS
// ============================================================================

describe('Pearson Correlation', () => {
  describe('Basic Calculation', () => {
    it('should calculate perfect positive correlation (r = 1.0)', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const result = pearsonCorrelation(x, y);
      expect(result.r).toBeCloseTo(1.0, 4);
      expect(result.p_value).toBeLessThan(0.01);
      expect(result.n).toBe(5);
    });

    it('should calculate perfect negative correlation (r = -1.0)', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2];
      const result = pearsonCorrelation(x, y);
      expect(result.r).toBeCloseTo(-1.0, 4);
      expect(result.p_value).toBeLessThan(0.01);
    });

    it('should calculate no correlation (r approximately 0)', () => {
      // Data with no linear relationship
      const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const y = [5, 3, 7, 2, 8, 4, 6, 1, 9, 5]; // Random-ish
      const result = pearsonCorrelation(x, y);
      expect(Math.abs(result.r)).toBeLessThan(0.3);
    });

    it('should calculate moderate positive correlation', () => {
      // Some noise but clear trend
      const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const y = [2, 3, 5, 4, 6, 7, 8, 7, 9, 10];
      const result = pearsonCorrelation(x, y);
      expect(result.r).toBeGreaterThan(0.8);
      expect(result.r).toBeLessThan(1.0);
    });

    it('should return r=0 when one variable has no variance', () => {
      const x = [5, 5, 5, 5, 5];
      const y = [1, 2, 3, 4, 5];
      const result = pearsonCorrelation(x, y);
      expect(result.r).toBe(0);
      expect(result.p_value).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for mismatched array lengths', () => {
      const x = [1, 2, 3];
      const y = [1, 2];
      expect(() => pearsonCorrelation(x, y)).toThrow('Arrays must have the same length');
    });

    it('should throw error for fewer than 3 data points', () => {
      const x = [1, 2];
      const y = [3, 4];
      expect(() => pearsonCorrelation(x, y)).toThrow('At least 3 data points required');
    });

    it('should handle exactly 3 data points', () => {
      const x = [1, 2, 3];
      const y = [2, 4, 6];
      const result = pearsonCorrelation(x, y);
      expect(result.n).toBe(3);
      expect(result.r).toBeCloseTo(1.0, 4);
    });
  });

  describe('P-Value Calculation', () => {
    it('should return significant p-value for strong correlation with large n', () => {
      const x = Array.from({ length: 30 }, (_, i) => i);
      const y = x.map((v) => v * 2 + Math.random() * 0.1);
      const result = pearsonCorrelation(x, y);
      expect(result.p_value).toBeLessThan(0.05);
    });

    it('should return non-significant p-value for weak correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [3, 2, 5, 4, 3]; // No clear relationship
      const result = pearsonCorrelation(x, y);
      expect(result.p_value).toBeGreaterThan(0.05);
    });
  });
});

// ============================================================================
// CORRELATION INTERPRETATION TESTS
// ============================================================================

describe('Correlation Interpretation', () => {
  it('should interpret strong positive correlation for sleep_hours', () => {
    const result = interpretCorrelation(0.6, 'sleep_hours'); // 0.6 is in "strong" range (0.5-0.7)
    expect(result.direction).toBe('positive');
    expect(result.interpretation).toContain('Strong');
    expect(result.interpretation).toContain('improved');
  });

  it('should interpret negative correlation for resting_hr (beneficial)', () => {
    // Lower resting HR is better, so negative correlation is beneficial
    const result = interpretCorrelation(-0.5, 'resting_hr');
    expect(result.direction).toBe('negative');
    expect(result.interpretation).toContain('improved'); // Beneficial
  });

  it('should interpret positive correlation for resting_hr (concerning)', () => {
    // Higher resting HR is worse
    const result = interpretCorrelation(0.5, 'resting_hr');
    expect(result.direction).toBe('positive');
    expect(result.interpretation).toContain('decreased'); // Not beneficial
  });

  it('should identify neutral correlation for weak values', () => {
    const result = interpretCorrelation(0.05, 'hrv_score');
    expect(result.direction).toBe('neutral');
    expect(result.interpretation).toContain('No meaningful');
  });

  it('should handle all outcome metrics', () => {
    const outcomes: OutcomeMetric[] = ['sleep_hours', 'hrv_score', 'recovery_score', 'resting_hr'];
    for (const outcome of outcomes) {
      const result = interpretCorrelation(0.5, outcome);
      expect(result.direction).toBeDefined();
      expect(result.interpretation.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// CORRELATION STRENGTH TESTS
// ============================================================================

describe('Correlation Strength', () => {
  it('should classify no correlation (< 0.1)', () => {
    expect(getCorrelationStrength(0.05)).toBe('none');
    expect(getCorrelationStrength(-0.08)).toBe('none');
  });

  it('should classify weak correlation (0.1 - 0.3)', () => {
    expect(getCorrelationStrength(0.2)).toBe('weak');
    expect(getCorrelationStrength(-0.25)).toBe('weak');
  });

  it('should classify moderate correlation (0.3 - 0.5)', () => {
    expect(getCorrelationStrength(0.4)).toBe('moderate');
    expect(getCorrelationStrength(-0.45)).toBe('moderate');
  });

  it('should classify strong correlation (0.5 - 0.7)', () => {
    expect(getCorrelationStrength(0.6)).toBe('strong');
    expect(getCorrelationStrength(-0.65)).toBe('strong');
  });

  it('should classify very strong correlation (> 0.7)', () => {
    expect(getCorrelationStrength(0.85)).toBe('very_strong');
    expect(getCorrelationStrength(-0.9)).toBe('very_strong');
    expect(getCorrelationStrength(1.0)).toBe('very_strong');
  });
});

// ============================================================================
// WEEK DATE HELPER TESTS
// ============================================================================

describe('Week Date Helpers', () => {
  describe('getWeekMonday', () => {
    it('should return Monday for a Monday input', () => {
      // Use noon UTC to avoid timezone edge cases
      const monday = new Date('2025-12-01T12:00:00.000Z'); // Monday
      const result = getWeekMonday(monday);
      expect(result.getDay()).toBe(1); // Monday = 1
    });

    it('should return Monday for a Wednesday input', () => {
      const wednesday = new Date('2025-12-03T12:00:00.000Z'); // Wednesday
      const result = getWeekMonday(wednesday);
      expect(result.getDay()).toBe(1);
    });

    it('should return Monday for a Sunday input', () => {
      const sunday = new Date('2025-12-07T12:00:00.000Z'); // Sunday
      const result = getWeekMonday(sunday);
      expect(result.getDay()).toBe(1);
    });

    it('should return Monday for a Saturday input', () => {
      const saturday = new Date('2025-12-06T12:00:00.000Z'); // Saturday
      const result = getWeekMonday(saturday);
      expect(result.getDay()).toBe(1);
    });

    it('should return Monday at start of day', () => {
      const wednesday = new Date('2025-12-03T12:00:00.000Z');
      const result = getWeekMonday(wednesday);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });

  describe('getWeekSunday', () => {
    it('should return Sunday for a Monday input', () => {
      const monday = new Date('2025-12-01T12:00:00.000Z');
      const result = getWeekSunday(monday);
      expect(result.getDay()).toBe(0); // Sunday = 0
    });

    it('should return Sunday for a Sunday input', () => {
      const sunday = new Date('2025-12-07T12:00:00.000Z');
      const result = getWeekSunday(sunday);
      expect(result.getDay()).toBe(0);
    });

    it('should return Sunday at end of day', () => {
      const friday = new Date('2025-11-28T12:00:00.000Z'); // Friday
      const result = getWeekSunday(friday);
      expect(result.getDay()).toBe(0);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });
  });
});

// ============================================================================
// SYNTHESIS CONFIG TESTS
// ============================================================================

describe('Synthesis Configuration', () => {
  it('should have valid MIN_DATA_DAYS', () => {
    expect(SYNTHESIS_CONFIG.MIN_DATA_DAYS).toBeGreaterThan(0);
    expect(SYNTHESIS_CONFIG.MIN_DATA_DAYS).toBeLessThanOrEqual(7);
  });

  it('should have valid MIN_CORRELATION_DAYS', () => {
    expect(SYNTHESIS_CONFIG.MIN_CORRELATION_DAYS).toBeGreaterThanOrEqual(14);
  });

  it('should have valid p-value threshold', () => {
    expect(SYNTHESIS_CONFIG.CORRELATION_P_THRESHOLD).toBe(0.05);
  });

  it('should have valid word count range', () => {
    expect(SYNTHESIS_CONFIG.MIN_WORD_COUNT).toBeLessThan(SYNTHESIS_CONFIG.TARGET_WORD_COUNT);
    expect(SYNTHESIS_CONFIG.TARGET_WORD_COUNT).toBeLessThan(SYNTHESIS_CONFIG.MAX_WORD_COUNT);
  });

  it('should have all expected outcome metrics', () => {
    const outcomes: OutcomeMetric[] = ['sleep_hours', 'hrv_score', 'recovery_score', 'resting_hr'];
    for (const outcome of outcomes) {
      expect(OUTCOME_EXPECTED_DIRECTION[outcome]).toBeDefined();
      expect(OUTCOME_METRIC_NAMES[outcome]).toBeDefined();
    }
  });
});

// ============================================================================
// PROTOCOL LOG HELPER TESTS
// ============================================================================

describe('Protocol Log Helpers', () => {
  it('should create valid protocol log mock', () => {
    const log = createProtocolLog();
    expect(log.id).toBeDefined();
    expect(log.user_id).toBe('user-123');
    expect(log.status).toBe('completed');
  });

  it('should allow overriding log properties', () => {
    const log = createProtocolLog({
      protocol_id: 'custom-protocol',
      duration_minutes: 15,
    });
    expect(log.protocol_id).toBe('custom-protocol');
    expect(log.duration_minutes).toBe(15);
  });

  it('should create logs with different dates', () => {
    const log1 = createProtocolLog({ logged_at: '2025-12-01T10:00:00.000Z' });
    const log2 = createProtocolLog({ logged_at: '2025-12-02T10:00:00.000Z' });
    expect(log1.logged_at).not.toBe(log2.logged_at);
  });
});

// ============================================================================
// WEARABLE DATA HELPER TESTS
// ============================================================================

describe('Wearable Data Helpers', () => {
  it('should create valid wearable data mock', () => {
    const data = createWearableData();
    expect(data.id).toBeDefined();
    expect(data.hrv_score).toBe(65);
    expect(data.sleep_hours).toBe(7.5);
    expect(data.readiness_score).toBe(72);
  });

  it('should allow null values for metrics', () => {
    const data = createWearableData({
      hrv_score: null,
      sleep_hours: null,
    });
    expect(data.hrv_score).toBeNull();
    expect(data.sleep_hours).toBeNull();
  });

  it('should support different wearable sources', () => {
    const appleData = createWearableData({ source: 'apple_health' });
    const googleData = createWearableData({ source: 'google_fit' });
    expect(appleData.source).toBe('apple_health');
    expect(googleData.source).toBe('google_fit');
  });
});

// ============================================================================
// NUMERICAL PRECISION TESTS
// ============================================================================

describe('Numerical Precision', () => {
  it('should handle large correlation sample sizes', () => {
    const n = 100;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = x.map((v) => v * 1.5 + 10);
    const result = pearsonCorrelation(x, y);
    expect(result.r).toBeCloseTo(1.0, 4);
    expect(result.n).toBe(n);
  });

  it('should handle very small differences in data', () => {
    const x = [1.0001, 1.0002, 1.0003, 1.0004, 1.0005];
    const y = [2.0001, 2.0002, 2.0003, 2.0004, 2.0005];
    const result = pearsonCorrelation(x, y);
    expect(result.r).toBeCloseTo(1.0, 4);
  });

  it('should round correlation coefficient to 4 decimals', () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [2, 3, 5, 4, 6, 7, 8, 9, 10, 11];
    const result = pearsonCorrelation(x, y);
    const decimalPlaces = (result.r.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(4);
  });

  it('should round p-value to 6 decimals', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    const result = pearsonCorrelation(x, y);
    const decimalPlaces = (result.p_value.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(6);
  });
});

// ============================================================================
// EDGE CASES TESTS
// ============================================================================

describe('Edge Cases', () => {
  it('should handle correlation with identical values', () => {
    const x = [5, 5, 5, 5, 5];
    const y = [5, 5, 5, 5, 5];
    const result = pearsonCorrelation(x, y);
    expect(result.r).toBe(0);
    expect(result.p_value).toBe(1);
  });

  it('should handle mixed positive and negative values', () => {
    const x = [-5, -2, 0, 2, 5];
    const y = [-10, -4, 0, 4, 10];
    const result = pearsonCorrelation(x, y);
    expect(result.r).toBeCloseTo(1.0, 4);
  });

  it('should handle decimal values correctly', () => {
    const x = [0.1, 0.2, 0.3, 0.4, 0.5];
    const y = [0.2, 0.4, 0.6, 0.8, 1.0];
    const result = pearsonCorrelation(x, y);
    expect(result.r).toBeCloseTo(1.0, 4);
  });

  it('should handle large values without overflow', () => {
    const x = [1000000, 2000000, 3000000, 4000000, 5000000];
    const y = [2000000, 4000000, 6000000, 8000000, 10000000];
    const result = pearsonCorrelation(x, y);
    expect(result.r).toBeCloseTo(1.0, 4);
    expect(Number.isFinite(result.p_value)).toBe(true);
  });

  it('should handle real-world HRV and sleep data ranges', () => {
    // Realistic HRV scores (20-100) and sleep hours (4-10)
    const hrv = [45, 52, 48, 55, 60, 58, 62, 50, 55, 58, 63, 65, 60, 57];
    const sleep = [6.5, 7.2, 6.8, 7.5, 7.8, 7.2, 8.0, 6.2, 7.0, 7.5, 8.2, 7.8, 7.5, 7.0];
    const result = pearsonCorrelation(hrv, sleep);
    expect(Number.isFinite(result.r)).toBe(true);
    expect(result.r).toBeGreaterThanOrEqual(-1);
    expect(result.r).toBeLessThanOrEqual(1);
    expect(Number.isFinite(result.p_value)).toBe(true);
  });
});

// ============================================================================
// STATISTICAL ACCURACY TESTS (Known Values)
// ============================================================================

describe('Statistical Accuracy', () => {
  it('should match known correlation for test dataset 1', () => {
    // Known test case: r = 0.8 for this dataset
    const x = [1, 2, 3, 4, 5];
    const y = [1, 3, 2, 5, 4];
    const result = pearsonCorrelation(x, y);
    expect(result.r).toBeCloseTo(0.8, 1); // Actual r = 0.8
  });

  it('should produce symmetric results', () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [2, 3, 5, 4, 6, 7, 8, 9, 10, 11];
    const result1 = pearsonCorrelation(x, y);
    const result2 = pearsonCorrelation(y, x);
    expect(result1.r).toBeCloseTo(result2.r, 6);
    expect(result1.p_value).toBeCloseTo(result2.p_value, 6);
  });

  it('should return p-value between 0 and 1', () => {
    const testCases = [
      { x: [1, 2, 3, 4, 5], y: [2, 4, 6, 8, 10] },
      { x: [1, 2, 3, 4, 5], y: [5, 4, 3, 2, 1] },
      { x: [1, 2, 3, 4, 5], y: [3, 1, 4, 2, 5] },
    ];

    for (const { x, y } of testCases) {
      const result = pearsonCorrelation(x, y);
      expect(result.p_value).toBeGreaterThanOrEqual(0);
      expect(result.p_value).toBeLessThanOrEqual(1);
    }
  });
});
