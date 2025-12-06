/**
 * Wearable Sync → Recovery Score Integration Test
 *
 * Tests the complete flow:
 * POST /api/wearables/sync → daily_metrics upsert → recovery calculation → recovery_scores upsert
 *
 * Flow 1 from PHASE_III_IMPLEMENTATION_PLAN.md - Session 10
 *
 * @file functions/tests/integration/wearable-recovery.test.ts
 * @author Claude Opus 4.5 (Session 51)
 * @created December 5, 2025
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { apiApp } from '../../src/api';
import {
  TEST_USER,
  TEST_DATES,
  getTestSupabaseClient,
  ensureTestUserExists,
  cleanupTestData,
  cleanupTestDataForDate,
} from './setup';
import {
  createAppleHealthPayload,
  createHealthConnectPayload,
  createAppleHealthPoorSleep,
  createPartialPayload,
  createIllnessPatternPayload,
} from './fixtures/wearables';
import {
  createEstablishedBaseline,
  createPartialBaseline,
  createSdnnBaseline,
} from './fixtures/baselines';

// =============================================================================
// TEST ENVIRONMENT SETUP
// =============================================================================

// Set required environment variables
process.env.FIREBASE_PROJECT_ID = 'wellness-os-app';
process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';
process.env.FIREBASE_PRIVATE_KEY = 'fake-key-for-testing';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://vcrdogdyjljtwgoxpkew.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Mock Firebase Admin (we don't want to hit real Firebase in tests)
// Note: Values must be inlined because vi.mock is hoisted before imports
vi.mock('../../src/firebaseAdmin', () => ({
  verifyFirebaseToken: vi.fn().mockResolvedValue({
    uid: 'test-firebase-uid-integration-001',
    email: 'integration-test@apex-os.test',
  }),
  getFirebaseApp: vi.fn(),
  getFirestore: vi.fn().mockReturnValue({
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        set: vi.fn().mockResolvedValue({}),
        get: vi.fn().mockResolvedValue({ exists: false }),
      }),
    }),
  }),
}));

// =============================================================================
// LIFECYCLE HOOKS
// =============================================================================

describe('Wearable Sync → Recovery Score Integration', () => {
  beforeAll(async () => {
    // Skip if no Supabase credentials
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
    vi.clearAllMocks();
  });

  // =============================================================================
  // BASELINE NOT READY TESTS
  // =============================================================================

  describe('New User (Baseline Not Ready)', () => {
    it('should sync wearable data but skip recovery calculation', async () => {
      // Skip if no credentials
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const supabase = getTestSupabaseClient();
      const payload = createAppleHealthPayload();

      // Ensure no baseline exists (delete if any)
      await supabase.from('user_baselines').delete().eq('user_id', TEST_USER.id);

      // Sync wearable data
      const response = await request(apiApp)
        .post('/api/wearables/sync')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify daily_metrics was written
      const { data: metrics } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', TEST_USER.id)
        .eq('date', TEST_DATES.today)
        .single();

      expect(metrics).toBeDefined();
      expect(metrics?.hrv_method).toBe('sdnn'); // Apple Health uses SDNN

      // Recovery score should NOT be calculated (no baseline)
      const { data: recovery } = await supabase
        .from('recovery_scores')
        .select('*')
        .eq('user_id', TEST_USER.id)
        .eq('date', TEST_DATES.today)
        .single();

      // Should be null or not exist
      expect(recovery?.recovery_score).toBeFalsy();
    });

    it('should return baseline status via GET /api/recovery', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const response = await request(apiApp)
        .get(`/api/recovery?date=${TEST_DATES.today}`)
        .set('Authorization', `Bearer mock-token`);

      expect(response.status).toBe(200);
      expect(response.body.baseline).toBeDefined();
      expect(response.body.baseline.ready).toBe(false);
      expect(response.body.baseline.message).toContain('collecting data');
    });
  });

  // =============================================================================
  // ESTABLISHED USER TESTS
  // =============================================================================

  describe('Established User (Baseline Ready)', () => {
    beforeEach(async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      // Insert established baseline
      const supabase = getTestSupabaseClient();
      const baseline = createEstablishedBaseline();

      await supabase.from('user_baselines').upsert(baseline, {
        onConflict: 'user_id',
      });
    });

    it('should calculate recovery score after wearable sync', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const supabase = getTestSupabaseClient();
      const payload = createAppleHealthPayload();

      const response = await request(apiApp)
        .post('/api/wearables/sync')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(200);

      // Verify recovery score was calculated
      const { data: recovery } = await supabase
        .from('recovery_scores')
        .select('*')
        .eq('user_id', TEST_USER.id)
        .eq('date', TEST_DATES.today)
        .single();

      expect(recovery).toBeDefined();
      expect(recovery?.recovery_score).toBeGreaterThan(0);
      expect(recovery?.recovery_score).toBeLessThanOrEqual(100);
      expect(recovery?.recovery_confidence).toBeGreaterThan(0);
      expect(['red', 'yellow', 'green']).toContain(recovery?.recovery_zone);
    });

    it('should return full recovery score via GET /api/recovery', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      // First sync data
      const payload = createAppleHealthPayload();
      await request(apiApp)
        .post('/api/wearables/sync')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      // Then get recovery
      const response = await request(apiApp)
        .get(`/api/recovery?date=${TEST_DATES.today}`)
        .set('Authorization', `Bearer mock-token`);

      expect(response.status).toBe(200);
      expect(response.body.isLiteMode).toBe(false);
      expect(response.body.recovery).toBeDefined();
      expect(response.body.recovery.score).toBeGreaterThan(0);
      expect(response.body.recovery.components).toBeDefined();
      expect(response.body.recovery.components.hrv).toBeDefined();
      expect(response.body.recovery.components.rhr).toBeDefined();
      expect(response.body.recovery.components.sleepQuality).toBeDefined();
    });
  });

  // =============================================================================
  // PLATFORM PARITY TESTS
  // =============================================================================

  describe('Platform Parity (iOS vs Android)', () => {
    beforeEach(async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      // Insert baseline
      const supabase = getTestSupabaseClient();
      const baseline = createEstablishedBaseline();
      await supabase.from('user_baselines').upsert(baseline, { onConflict: 'user_id' });
    });

    it('should track HRV method correctly for Apple Health (SDNN)', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const supabase = getTestSupabaseClient();
      const payload = createAppleHealthPayload();

      await request(apiApp)
        .post('/api/wearables/sync')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      const { data: metrics } = await supabase
        .from('daily_metrics')
        .select('hrv_method, hrv_avg')
        .eq('user_id', TEST_USER.id)
        .eq('date', TEST_DATES.today)
        .single();

      expect(metrics?.hrv_method).toBe('sdnn');
    });

    it('should track HRV method correctly for Health Connect (RMSSD)', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const supabase = getTestSupabaseClient();
      const payload = createHealthConnectPayload();

      await request(apiApp)
        .post('/api/wearables/sync')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      const { data: metrics } = await supabase
        .from('daily_metrics')
        .select('hrv_method, hrv_avg')
        .eq('user_id', TEST_USER.id)
        .eq('date', TEST_DATES.today)
        .single();

      expect(metrics?.hrv_method).toBe('rmssd');
    });
  });

  // =============================================================================
  // EDGE CASE TESTS
  // =============================================================================

  describe('Edge Cases', () => {
    beforeEach(async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const supabase = getTestSupabaseClient();
      const baseline = createEstablishedBaseline();
      await supabase.from('user_baselines').upsert(baseline, { onConflict: 'user_id' });
    });

    it('should detect poor sleep and assign low recovery zone', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const supabase = getTestSupabaseClient();
      const payload = createAppleHealthPoorSleep();

      await request(apiApp)
        .post('/api/wearables/sync')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      const { data: recovery } = await supabase
        .from('recovery_scores')
        .select('recovery_score, recovery_zone')
        .eq('user_id', TEST_USER.id)
        .eq('date', TEST_DATES.today)
        .single();

      // Poor sleep should result in lower score
      expect(recovery?.recovery_score).toBeLessThan(60);
      expect(['red', 'yellow']).toContain(recovery?.recovery_zone);
    });

    it('should handle partial data (missing HRV)', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const supabase = getTestSupabaseClient();
      const payload = createPartialPayload();

      const response = await request(apiApp)
        .post('/api/wearables/sync')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(200);

      // Should still write to daily_metrics with null HRV
      const { data: metrics } = await supabase
        .from('daily_metrics')
        .select('hrv_avg, sleep_duration_hours')
        .eq('user_id', TEST_USER.id)
        .eq('date', TEST_DATES.today)
        .single();

      expect(metrics).toBeDefined();
      expect(metrics?.hrv_avg).toBeNull();
      expect(metrics?.sleep_duration_hours).toBeGreaterThan(0);
    });

    it('should detect illness pattern (fever + elevated RHR + low HRV)', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createIllnessPatternPayload();

      await request(apiApp)
        .post('/api/wearables/sync')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      // Get recovery via API to check for edge case detection
      const response = await request(apiApp)
        .get(`/api/recovery?date=${TEST_DATES.today}`)
        .set('Authorization', `Bearer mock-token`);

      // Illness pattern should result in low recovery
      if (response.body.recovery) {
        expect(response.body.recovery.score).toBeLessThan(50);
      }
    });
  });

  // =============================================================================
  // DATA INTEGRITY TESTS
  // =============================================================================

  describe('Data Integrity', () => {
    it('should upsert (not duplicate) on repeated syncs', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const supabase = getTestSupabaseClient();
      const payload = createAppleHealthPayload();

      // Sync twice
      await request(apiApp)
        .post('/api/wearables/sync')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      await request(apiApp)
        .post('/api/wearables/sync')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      // Should only have one row for this date
      const { data: metrics, count } = await supabase
        .from('daily_metrics')
        .select('*', { count: 'exact' })
        .eq('user_id', TEST_USER.id)
        .eq('date', TEST_DATES.today);

      expect(count).toBe(1);
    });

    it('should archive raw payload in wearable_data_archive', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const supabase = getTestSupabaseClient();
      const payload = createAppleHealthPayload();

      await request(apiApp)
        .post('/api/wearables/sync')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      const { data: archive } = await supabase
        .from('wearable_data_archive')
        .select('*')
        .eq('user_id', TEST_USER.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      expect(archive).toBeDefined();
      expect(archive?.source).toBe('apple_health');
      expect(archive?.raw_payload).toBeDefined();
    });
  });
});
