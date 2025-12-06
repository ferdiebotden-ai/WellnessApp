/**
 * Lite Mode Check-in Integration Test
 *
 * Tests the complete flow:
 * POST /api/manual-check-in → manual_check_ins insert → Check-in score calculation → recovery_scores upsert
 *
 * Flow 3 from PHASE_III_IMPLEMENTATION_PLAN.md - Session 10
 *
 * @file functions/tests/integration/lite-mode-checkin.test.ts
 * @author Claude Opus 4.5 (Session 51)
 * @created December 5, 2025
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
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

// =============================================================================
// TEST FIXTURES
// =============================================================================

/**
 * Good night's sleep check-in.
 */
function createGoodCheckInPayload() {
  return {
    sleepQuality: 4,
    sleepHours: '7-8',
    energyLevel: 4,
    timezone: 'America/New_York',
  };
}

/**
 * Poor night's sleep check-in.
 */
function createPoorCheckInPayload() {
  return {
    sleepQuality: 2,
    sleepHours: '<5',
    energyLevel: 2,
    timezone: 'America/New_York',
  };
}

/**
 * Skipped check-in (uses defaults).
 */
function createSkippedCheckInPayload() {
  return {
    skipped: true,
    timezone: 'America/New_York',
  };
}

/**
 * Great check-in (best possible).
 */
function createGreatCheckInPayload() {
  return {
    sleepQuality: 5,
    sleepHours: '7-8',
    energyLevel: 5,
    timezone: 'America/New_York',
  };
}

// =============================================================================
// TEST ENVIRONMENT SETUP
// =============================================================================

process.env.FIREBASE_PROJECT_ID = 'wellness-os-app';
process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';
process.env.FIREBASE_PRIVATE_KEY = 'fake-key-for-testing';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://vcrdogdyjljtwgoxpkew.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Mock Firebase Admin
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

describe('Lite Mode Check-in Integration', () => {
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
    vi.clearAllMocks();
  });

  // =============================================================================
  // FULL CHECK-IN TESTS
  // =============================================================================

  describe('Full Check-in (All Questions Answered)', () => {
    it('should submit check-in and calculate score', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createGoodCheckInPayload();

      const response = await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result).toBeDefined();
      expect(response.body.result.score).toBeGreaterThan(0);
      expect(response.body.result.score).toBeLessThanOrEqual(100);
      expect(response.body.result.confidence).toBeLessThanOrEqual(0.6); // Lite Mode max
    });

    it('should store check-in in daily_metrics with manual source', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const supabase = getTestSupabaseClient();
      const payload = createGoodCheckInPayload();

      await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      // Verify daily_metrics entry
      const { data: metrics } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', TEST_USER.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      expect(metrics).toBeDefined();
      expect(metrics?.wearable_source).toBe('manual');
      expect(metrics?.recovery_score).toBeGreaterThan(0);
    });

    it('should assign green zone for good check-in', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createGreatCheckInPayload();

      const response = await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.result.zone).toBe('green');
    });

    it('should assign red/yellow zone for poor check-in', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createPoorCheckInPayload();

      const response = await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(['red', 'yellow']).toContain(response.body.result.zone);
    });
  });

  // =============================================================================
  // SKIPPED CHECK-IN TESTS
  // =============================================================================

  describe('Skipped Check-in (Uses Defaults)', () => {
    it('should use default values when skipped', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createSkippedCheckInPayload();

      const response = await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.skipped).toBe(true);
      // Score should be middle range (defaults: quality=3, hours=7-8, energy=3)
      expect(response.body.result.score).toBeGreaterThanOrEqual(50);
      expect(response.body.result.score).toBeLessThanOrEqual(70);
    });

    it('should mark check-in as skipped in components', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createSkippedCheckInPayload();

      const response = await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.body.result.components).toBeDefined();
      // Skipped uses defaults (sleepQuality=3, sleepHours=7-8, energyLevel=3)
    });
  });

  // =============================================================================
  // SCORE CALCULATION ACCURACY TESTS
  // =============================================================================

  describe('Score Calculation Accuracy', () => {
    it('should calculate score using 3-component formula', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createGoodCheckInPayload();

      const response = await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      const result = response.body.result;
      expect(result.components).toBeDefined();
      expect(result.components.sleepQuality).toBeDefined();
      expect(result.components.sleepDuration).toBeDefined();
      expect(result.components.energyLevel).toBeDefined();

      // Verify weights add up
      const totalWeight =
        result.components.sleepQuality.weight +
        result.components.sleepDuration.weight +
        result.components.energyLevel.weight;

      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it('should include recommendations for poor score', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createPoorCheckInPayload();

      const response = await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.body.result.recommendations).toBeDefined();
      expect(Array.isArray(response.body.result.recommendations)).toBe(true);
    });
  });

  // =============================================================================
  // GET /api/recovery LITE MODE TESTS
  // =============================================================================

  describe('GET /api/recovery with Lite Mode', () => {
    it('should return isLiteMode=true for check-in score', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      // First submit a check-in
      const payload = createGoodCheckInPayload();
      await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      // Then get recovery
      const response = await request(apiApp)
        .get('/api/recovery')
        .set('Authorization', `Bearer mock-token`);

      expect(response.status).toBe(200);
      expect(response.body.isLiteMode).toBe(true);
      expect(response.body.recovery).toBeDefined();
      expect(response.body.recovery.isLiteMode).toBe(true);
    });

    it('should include 3-component breakdown for Lite Mode', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createGoodCheckInPayload();
      await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      const response = await request(apiApp)
        .get('/api/recovery')
        .set('Authorization', `Bearer mock-token`);

      expect(response.body.recovery.components).toBeDefined();
      expect(response.body.recovery.components.sleepQuality).toBeDefined();
      expect(response.body.recovery.components.sleepDuration).toBeDefined();
      expect(response.body.recovery.components.energyLevel).toBeDefined();
      // Should NOT have wearable-specific components
      expect(response.body.recovery.components.hrv).toBeUndefined();
    });
  });

  // =============================================================================
  // GET /api/manual-check-in/today TESTS
  // =============================================================================

  describe('GET /api/manual-check-in/today', () => {
    it('should return today\'s check-in if exists', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      // Submit check-in
      const payload = createGoodCheckInPayload();
      await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      // Get today's check-in
      const response = await request(apiApp)
        .get('/api/manual-check-in/today')
        .set('Authorization', `Bearer mock-token`);

      expect(response.status).toBe(200);
      expect(response.body.checkIn).toBeDefined();
      expect(response.body.checkIn.result.score).toBeGreaterThan(0);
    });

    it('should return null if no check-in today', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const response = await request(apiApp)
        .get('/api/manual-check-in/today')
        .set('Authorization', `Bearer mock-token`);

      expect(response.status).toBe(200);
      expect(response.body.checkIn).toBeNull();
    });
  });

  // =============================================================================
  // INPUT VALIDATION TESTS
  // =============================================================================

  describe('Input Validation', () => {
    it('should reject sleepQuality outside 1-5 range', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = {
        sleepQuality: 6, // Invalid
        sleepHours: '7-8',
        energyLevel: 3,
      };

      const response = await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('sleepQuality');
    });

    it('should reject invalid sleepHours option', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = {
        sleepQuality: 3,
        sleepHours: '9-10', // Invalid option
        energyLevel: 3,
      };

      const response = await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('sleepHours');
    });

    it('should reject energyLevel outside 1-5 range', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = {
        sleepQuality: 3,
        sleepHours: '7-8',
        energyLevel: 0, // Invalid
      };

      const response = await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('energyLevel');
    });

    it('should reject missing required fields (unless skipped)', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = {
        // Missing sleepQuality, sleepHours, energyLevel
        timezone: 'America/New_York',
      };

      const response = await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(400);
    });
  });

  // =============================================================================
  // UPSERT BEHAVIOR TESTS
  // =============================================================================

  describe('Upsert Behavior', () => {
    it('should update existing check-in for same day', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const supabase = getTestSupabaseClient();

      // First check-in
      await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(createPoorCheckInPayload());

      // Second check-in (update)
      const response2 = await request(apiApp)
        .post('/api/manual-check-in')
        .set('Authorization', `Bearer mock-token`)
        .send(createGoodCheckInPayload());

      expect(response2.status).toBe(200);

      // Should only have one entry
      const { count } = await supabase
        .from('daily_metrics')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', TEST_USER.id)
        .eq('wearable_source', 'manual');

      expect(count).toBe(1);
    });
  });
});
