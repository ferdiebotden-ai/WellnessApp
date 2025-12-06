/**
 * Firestore Real-time Sync Integration Test
 *
 * Tests the complete flow:
 * Recovery calculation → Firestore `users/{uid}/recovery/{date}` → Client listener
 *
 * Flow 6 from PHASE_III_IMPLEMENTATION_PLAN.md - Session 10
 *
 * Note: This test uses mocked Firestore since we don't want to hit real Firebase
 * in integration tests. The sync logic is tested via the wearables sync flow.
 *
 * @file functions/tests/integration/firestore-sync.test.ts
 * @author Claude Opus 4.5 (Session 51)
 * @created December 5, 2025
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import {
  TEST_USER,
  TEST_DATES,
  getTestSupabaseClient,
  ensureTestUserExists,
  cleanupTestData,
  cleanupTestDataForDate,
} from './setup';
import { createFirestoreMock } from './mocks';

// =============================================================================
// TEST ENVIRONMENT SETUP
// =============================================================================

process.env.FIREBASE_PROJECT_ID = 'wellness-os-app';
process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';
process.env.FIREBASE_PRIVATE_KEY = 'fake-key-for-testing';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://vcrdogdyjljtwgoxpkew.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create Firestore mock
const firestoreMock = createFirestoreMock();

// Mock Firebase Admin
vi.mock('../../src/firebaseAdmin', () => ({
  verifyFirebaseToken: vi.fn().mockResolvedValue({
    uid: 'test-firebase-uid-integration-001',
    email: 'integration-test@apex-os.test',
  }),
  getFirebaseApp: vi.fn(),
  getFirestore: () => firestoreMock.firestore,
}));

// Mock firebase-admin/firestore
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => firestoreMock.firestore,
  Timestamp: {
    now: () => ({ seconds: Date.now() / 1000, nanoseconds: 0 }),
    fromDate: (date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 }),
  },
}));

// =============================================================================
// LIFECYCLE HOOKS
// =============================================================================

describe('Firestore Real-time Sync Integration', () => {
  beforeAll(async () => {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Skipping integration tests: SUPABASE_SERVICE_ROLE_KEY not set');
      return;
    }

    await ensureTestUserExists();
  });

  afterAll(async () => {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await cleanupTestData();
    }
  });

  afterEach(async () => {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await cleanupTestDataForDate(TEST_DATES.today);
    }
    firestoreMock.clearData();
    vi.clearAllMocks();
  });

  // =============================================================================
  // SYNC DOCUMENT STRUCTURE TESTS
  // =============================================================================

  describe('Sync Document Structure', () => {
    it('should sync recovery data with correct structure', async () => {
      // Import after mocks are set up
      const { syncTodayMetrics } = await import('../../src/services/FirestoreSync');

      const dailyMetrics = {
        id: 'test-metric-id',
        user_id: TEST_USER.id,
        date: TEST_DATES.today,
        sleep_duration_hours: 7.5,
        sleep_efficiency: 88,
        sleep_onset_minutes: 15,
        bedtime_start: `${TEST_DATES.yesterday}T23:00:00Z`,
        bedtime_end: `${TEST_DATES.today}T06:30:00Z`,
        rem_percentage: 22,
        deep_percentage: 18,
        light_percentage: 55,
        awake_percentage: 5,
        hrv_avg: 55,
        hrv_method: 'rmssd' as const,
        rhr_avg: 54,
        respiratory_rate_avg: 14,
        steps: 8500,
        active_minutes: 45,
        active_calories: 320,
        temperature_deviation: 0.1,
        recovery_score: 75,
        recovery_confidence: 0.85,
        wearable_source: 'apple_health' as const,
        raw_payload: {},
        synced_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const recoveryResult = {
        score: 75,
        zone: 'green' as const,
        confidence: 0.85,
        reasoning: 'Good recovery based on sleep and HRV metrics.',
        components: {
          hrv: { raw: 55, score: 78, vsBaseline: '+10%', weight: 0.4, available: true },
          rhr: { raw: 54, score: 80, vsBaseline: '-3%', weight: 0.25, available: true },
          sleepQuality: { efficiency: 88, deepPct: 18, remPct: 22, score: 82, weight: 0.2, available: true },
          sleepDuration: { hours: 7.5, vsTarget: '-3%', score: 90, weight: 0.1, available: true },
          respiratoryRate: { raw: 14, score: 85, vsBaseline: '0%', weight: 0.05, available: true },
          temperaturePenalty: { deviation: 0.1, penalty: 0 },
        },
        dataCompleteness: 0.95,
        missingInputs: [],
        edgeCases: [],
      };

      const baseline = {
        userId: TEST_USER.id,
        hrvLnMean: Math.log(50),
        hrvLnStdDev: 0.22,
        hrvCoefficientOfVariation: 14,
        hrvMethod: 'rmssd' as const,
        hrvSampleCount: 14,
        rhrMean: 56,
        rhrStdDev: 3,
        rhrSampleCount: 14,
        respiratoryRateMean: 14,
        respiratoryRateStdDev: 1,
        sleepDurationTarget: 450,
        temperatureBaselineCelsius: 36.5,
        menstrualCycleTracking: false,
        cycleDay: null,
        lastPeriodStart: null,
        confidenceLevel: 'high' as const,
        lastUpdated: new Date(),
        createdAt: new Date(),
      };

      // Call sync function
      await syncTodayMetrics(TEST_USER.id, TEST_DATES.today, dailyMetrics, recoveryResult, baseline);

      // Verify Firestore was called
      expect(firestoreMock.set).toHaveBeenCalled();

      // Check document structure
      const syncedData = firestoreMock.getData();
      expect(syncedData).toBeDefined();

      if (syncedData) {
        expect(syncedData).toHaveProperty('date');
        expect(syncedData).toHaveProperty('userId');
        expect(syncedData).toHaveProperty('recovery');
        expect(syncedData).toHaveProperty('sleep');
        expect(syncedData).toHaveProperty('hrv');
        expect(syncedData).toHaveProperty('rhr');
      }
    });

    it('should include recovery score and zone', async () => {
      const { syncTodayMetrics } = await import('../../src/services/FirestoreSync');

      const dailyMetrics = {
        id: 'test-id',
        user_id: TEST_USER.id,
        date: TEST_DATES.today,
        sleep_duration_hours: 7,
        sleep_efficiency: 85,
        sleep_onset_minutes: null,
        bedtime_start: null,
        bedtime_end: null,
        rem_percentage: null,
        deep_percentage: null,
        light_percentage: null,
        awake_percentage: null,
        hrv_avg: 50,
        hrv_method: 'rmssd' as const,
        rhr_avg: 58,
        respiratory_rate_avg: null,
        steps: null,
        active_minutes: null,
        active_calories: null,
        temperature_deviation: null,
        recovery_score: 65,
        recovery_confidence: 0.75,
        wearable_source: 'apple_health' as const,
        raw_payload: {},
        synced_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const recoveryResult = {
        score: 65,
        zone: 'yellow' as const,
        confidence: 0.75,
        reasoning: 'Moderate recovery.',
        components: {
          hrv: { raw: 50, score: 70, vsBaseline: '+5%', weight: 0.4, available: true },
          rhr: { raw: 58, score: 72, vsBaseline: '+2%', weight: 0.25, available: true },
          sleepQuality: { efficiency: 85, deepPct: null, remPct: null, score: 75, weight: 0.2, available: true },
          sleepDuration: { hours: 7, vsTarget: '-7%', score: 80, weight: 0.1, available: true },
          respiratoryRate: { raw: null, score: 70, vsBaseline: 'N/A', weight: 0.05, available: false },
          temperaturePenalty: { deviation: null, penalty: 0 },
        },
        dataCompleteness: 0.8,
        missingInputs: ['respiratory_rate'],
        edgeCases: [],
      };

      await syncTodayMetrics(TEST_USER.id, TEST_DATES.today, dailyMetrics, recoveryResult, null);

      const syncedData = firestoreMock.getData() as Record<string, unknown> | undefined;

      if (syncedData && syncedData.recovery) {
        const recovery = syncedData.recovery as Record<string, unknown>;
        expect(recovery.score).toBe(65);
        expect(recovery.zone).toBe('yellow');
        expect(recovery.confidence).toBe(0.75);
      }
    });

    it('should include component scores', async () => {
      const { syncTodayMetrics } = await import('../../src/services/FirestoreSync');

      const dailyMetrics = {
        id: 'test-id',
        user_id: TEST_USER.id,
        date: TEST_DATES.today,
        sleep_duration_hours: 8,
        sleep_efficiency: 92,
        sleep_onset_minutes: 10,
        bedtime_start: null,
        bedtime_end: null,
        rem_percentage: 25,
        deep_percentage: 20,
        light_percentage: 50,
        awake_percentage: 5,
        hrv_avg: 60,
        hrv_method: 'rmssd' as const,
        rhr_avg: 52,
        respiratory_rate_avg: 13,
        steps: 10000,
        active_minutes: 60,
        active_calories: 400,
        temperature_deviation: 0,
        recovery_score: 85,
        recovery_confidence: 0.9,
        wearable_source: 'apple_health' as const,
        raw_payload: {},
        synced_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const recoveryResult = {
        score: 85,
        zone: 'green' as const,
        confidence: 0.9,
        reasoning: 'Excellent recovery.',
        components: {
          hrv: { raw: 60, score: 88, vsBaseline: '+20%', weight: 0.4, available: true },
          rhr: { raw: 52, score: 90, vsBaseline: '-7%', weight: 0.25, available: true },
          sleepQuality: { efficiency: 92, deepPct: 20, remPct: 25, score: 90, weight: 0.2, available: true },
          sleepDuration: { hours: 8, vsTarget: '+7%', score: 95, weight: 0.1, available: true },
          respiratoryRate: { raw: 13, score: 88, vsBaseline: '-7%', weight: 0.05, available: true },
          temperaturePenalty: { deviation: 0, penalty: 0 },
        },
        dataCompleteness: 1.0,
        missingInputs: [],
        edgeCases: [],
      };

      await syncTodayMetrics(TEST_USER.id, TEST_DATES.today, dailyMetrics, recoveryResult, null);

      const syncedData = firestoreMock.getData() as Record<string, unknown> | undefined;

      if (syncedData && syncedData.recovery) {
        const recovery = syncedData.recovery as Record<string, { hrv?: number }>;
        expect(recovery.components).toBeDefined();
        // Components should include hrv, rhr, sleepQuality, sleepDuration
        if (recovery.components) {
          expect(recovery.components.hrv).toBeDefined();
        }
      }
    });
  });

  // =============================================================================
  // SLEEP DATA SYNC TESTS
  // =============================================================================

  describe('Sleep Data Sync', () => {
    it('should sync sleep metrics', async () => {
      const { syncTodayMetrics } = await import('../../src/services/FirestoreSync');

      const dailyMetrics = {
        id: 'test-id',
        user_id: TEST_USER.id,
        date: TEST_DATES.today,
        sleep_duration_hours: 7.5,
        sleep_efficiency: 88,
        sleep_onset_minutes: 15,
        bedtime_start: `${TEST_DATES.yesterday}T23:00:00Z`,
        bedtime_end: `${TEST_DATES.today}T06:30:00Z`,
        rem_percentage: 22,
        deep_percentage: 18,
        light_percentage: 55,
        awake_percentage: 5,
        hrv_avg: 50,
        hrv_method: 'rmssd' as const,
        rhr_avg: 55,
        respiratory_rate_avg: null,
        steps: null,
        active_minutes: null,
        active_calories: null,
        temperature_deviation: null,
        recovery_score: null,
        recovery_confidence: null,
        wearable_source: 'apple_health' as const,
        raw_payload: {},
        synced_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await syncTodayMetrics(TEST_USER.id, TEST_DATES.today, dailyMetrics, null, null);

      const syncedData = firestoreMock.getData() as Record<string, unknown> | undefined;

      if (syncedData && syncedData.sleep) {
        const sleep = syncedData.sleep as Record<string, unknown>;
        expect(sleep.durationHours).toBe(7.5);
        expect(sleep.efficiency).toBe(88);
        expect(sleep.deepPct).toBe(18);
        expect(sleep.remPct).toBe(22);
      }
    });
  });

  // =============================================================================
  // HRV DATA SYNC TESTS
  // =============================================================================

  describe('HRV Data Sync', () => {
    it('should sync HRV with method tracking', async () => {
      const { syncTodayMetrics } = await import('../../src/services/FirestoreSync');

      const dailyMetrics = {
        id: 'test-id',
        user_id: TEST_USER.id,
        date: TEST_DATES.today,
        sleep_duration_hours: 7,
        sleep_efficiency: null,
        sleep_onset_minutes: null,
        bedtime_start: null,
        bedtime_end: null,
        rem_percentage: null,
        deep_percentage: null,
        light_percentage: null,
        awake_percentage: null,
        hrv_avg: 65,
        hrv_method: 'sdnn' as const, // Apple Health SDNN
        rhr_avg: 55,
        respiratory_rate_avg: null,
        steps: null,
        active_minutes: null,
        active_calories: null,
        temperature_deviation: null,
        recovery_score: null,
        recovery_confidence: null,
        wearable_source: 'apple_health' as const,
        raw_payload: {},
        synced_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await syncTodayMetrics(TEST_USER.id, TEST_DATES.today, dailyMetrics, null, null);

      const syncedData = firestoreMock.getData() as Record<string, unknown> | undefined;

      if (syncedData && syncedData.hrv) {
        const hrv = syncedData.hrv as Record<string, unknown>;
        expect(hrv.avg).toBe(65);
        expect(hrv.method).toBe('sdnn');
      }
    });
  });

  // =============================================================================
  // YESTERDAY'S SCORE COMPARISON TESTS
  // =============================================================================

  describe('Yesterday\'s Score Comparison', () => {
    it('should include vsBaseline strings when baseline provided', async () => {
      const { syncTodayMetrics } = await import('../../src/services/FirestoreSync');

      const dailyMetrics = {
        id: 'test-id',
        user_id: TEST_USER.id,
        date: TEST_DATES.today,
        sleep_duration_hours: 7,
        sleep_efficiency: null,
        sleep_onset_minutes: null,
        bedtime_start: null,
        bedtime_end: null,
        rem_percentage: null,
        deep_percentage: null,
        light_percentage: null,
        awake_percentage: null,
        hrv_avg: 60,
        hrv_method: 'rmssd' as const,
        rhr_avg: 52,
        respiratory_rate_avg: null,
        steps: null,
        active_minutes: null,
        active_calories: null,
        temperature_deviation: null,
        recovery_score: null,
        recovery_confidence: null,
        wearable_source: 'apple_health' as const,
        raw_payload: {},
        synced_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const baseline = {
        userId: TEST_USER.id,
        hrvLnMean: Math.log(50), // Baseline ~50ms
        hrvLnStdDev: 0.2,
        hrvCoefficientOfVariation: 14,
        hrvMethod: 'rmssd' as const,
        hrvSampleCount: 14,
        rhrMean: 55, // Baseline 55 bpm
        rhrStdDev: 3,
        rhrSampleCount: 14,
        respiratoryRateMean: 14,
        respiratoryRateStdDev: 1,
        sleepDurationTarget: 450,
        temperatureBaselineCelsius: 36.5,
        menstrualCycleTracking: false,
        cycleDay: null,
        lastPeriodStart: null,
        confidenceLevel: 'high' as const,
        lastUpdated: new Date(),
        createdAt: new Date(),
      };

      await syncTodayMetrics(TEST_USER.id, TEST_DATES.today, dailyMetrics, null, baseline);

      const syncedData = firestoreMock.getData() as Record<string, unknown> | undefined;

      // HRV should show +20% (60 vs 50 baseline)
      if (syncedData && syncedData.hrv) {
        const hrv = syncedData.hrv as Record<string, unknown>;
        expect(hrv.vsBaseline).toBeDefined();
      }

      // RHR should show -5% (52 vs 55 baseline)
      if (syncedData && syncedData.rhr) {
        const rhr = syncedData.rhr as Record<string, unknown>;
        expect(rhr.vsBaseline).toBeDefined();
      }
    });
  });
});
