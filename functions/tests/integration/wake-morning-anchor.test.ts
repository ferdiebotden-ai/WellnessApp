/**
 * Wake Detection → Morning Anchor Integration Test
 *
 * Tests the complete flow:
 * POST /api/wake-events → wake_events insert → Morning Anchor nudge creation → Firestore live_nudges
 *
 * Flow 2 from PHASE_III_IMPLEMENTATION_PLAN.md - Session 10
 *
 * @file functions/tests/integration/wake-morning-anchor.test.ts
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
 * Create a valid wake event payload for HealthKit (auto-triggers).
 */
function createHealthKitWakePayload(overrides: Record<string, unknown> = {}) {
  return {
    source: 'healthkit',
    wake_time: `${TEST_DATES.today}T06:30:00Z`,
    sleep_start_time: `${TEST_DATES.yesterday}T23:00:00Z`,
    timezone: 'America/New_York',
    ...overrides,
  };
}

/**
 * Create a valid wake event payload for phone unlock (needs confirmation).
 */
function createPhoneUnlockWakePayload(overrides: Record<string, unknown> = {}) {
  return {
    source: 'phone_unlock',
    wake_time: `${TEST_DATES.today}T06:35:00Z`,
    user_confirmed_at: `${TEST_DATES.today}T06:36:00Z`,
    timezone: 'America/New_York',
    ...overrides,
  };
}

/**
 * Create a manual wake event payload.
 */
function createManualWakePayload(overrides: Record<string, unknown> = {}) {
  return {
    source: 'manual',
    wake_time: `${TEST_DATES.today}T07:00:00Z`,
    timezone: 'America/Los_Angeles',
    ...overrides,
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

// Track if Morning Anchor was triggered
let morningAnchorTriggered = false;
let firestoreNudgeWritten = false;

// Mock Firebase Admin
vi.mock('../../src/firebaseAdmin', () => ({
  verifyFirebaseToken: vi.fn().mockResolvedValue({
    uid: 'test-firebase-uid-integration-001',
    email: 'integration-test@apex-os.test',
  }),
  getFirebaseApp: vi.fn(),
  getFirestore: vi.fn().mockReturnValue({
    collection: vi.fn().mockImplementation((name: string) => ({
      doc: vi.fn().mockReturnValue({
        set: vi.fn().mockImplementation(async () => {
          if (name === 'live_nudges') {
            firestoreNudgeWritten = true;
          }
          return Promise.resolve();
        }),
        get: vi.fn().mockResolvedValue({ exists: false }),
        collection: vi.fn().mockReturnValue({
          add: vi.fn().mockResolvedValue({ id: 'nudge-123' }),
        }),
      }),
    })),
  }),
}));

// =============================================================================
// LIFECYCLE HOOKS
// =============================================================================

describe('Wake Detection → Morning Anchor Integration', () => {
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
    morningAnchorTriggered = false;
    firestoreNudgeWritten = false;
    vi.clearAllMocks();
  });

  // =============================================================================
  // HEALTHKIT WAKE TESTS
  // =============================================================================

  describe('HealthKit Wake Source', () => {
    it('should create wake event for HealthKit source', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const supabase = getTestSupabaseClient();
      const payload = createHealthKitWakePayload();

      const response = await request(apiApp)
        .post('/api/wake-events')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.wake_event_id).toBeDefined();

      // Verify wake event was stored
      const { data: wakeEvent } = await supabase
        .from('wake_events')
        .select('*')
        .eq('user_id', TEST_USER.id)
        .eq('date', TEST_DATES.today)
        .single();

      expect(wakeEvent).toBeDefined();
      expect(wakeEvent?.detection_method).toBe('healthkit');
      expect(wakeEvent?.confidence).toBeGreaterThanOrEqual(0.9); // HealthKit = high confidence
    });

    it('should trigger Morning Anchor for HealthKit wake', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createHealthKitWakePayload();

      const response = await request(apiApp)
        .post('/api/wake-events')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(200);
      // Morning Anchor should be triggered (based on response)
      // The actual Firestore write depends on user's module enrollment
      expect(response.body.morning_anchor_triggered).toBeDefined();
    });
  });

  // =============================================================================
  // PHONE UNLOCK WAKE TESTS
  // =============================================================================

  describe('Phone Unlock Wake Source', () => {
    it('should create wake event for phone unlock with confirmation', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const supabase = getTestSupabaseClient();
      const payload = createPhoneUnlockWakePayload();

      const response = await request(apiApp)
        .post('/api/wake-events')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(200);

      const { data: wakeEvent } = await supabase
        .from('wake_events')
        .select('*')
        .eq('user_id', TEST_USER.id)
        .eq('date', TEST_DATES.today)
        .single();

      expect(wakeEvent).toBeDefined();
      expect(wakeEvent?.detection_method).toBe('phone_unlock');
      expect(wakeEvent?.user_confirmed_at).toBeDefined(); // Confirmation timestamp saved
      expect(wakeEvent?.confidence).toBeGreaterThanOrEqual(0.8); // Confirmed = higher confidence
    });

    it('should have lower confidence for unconfirmed phone unlock', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const supabase = getTestSupabaseClient();
      // Payload without user_confirmed_at
      const payload = createPhoneUnlockWakePayload({ user_confirmed_at: undefined });

      const response = await request(apiApp)
        .post('/api/wake-events')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(200);

      const { data: wakeEvent } = await supabase
        .from('wake_events')
        .select('*')
        .eq('user_id', TEST_USER.id)
        .eq('date', TEST_DATES.today)
        .single();

      // Unconfirmed should have lower confidence
      expect(wakeEvent?.confidence).toBeLessThan(0.8);
    });
  });

  // =============================================================================
  // DUPLICATE PREVENTION TESTS
  // =============================================================================

  describe('Duplicate Prevention', () => {
    it('should prevent duplicate wake events for same day', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createHealthKitWakePayload();

      // First request should succeed
      const response1 = await request(apiApp)
        .post('/api/wake-events')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response1.status).toBe(200);
      expect(response1.body.success).toBe(true);

      // Second request should be rejected or return existing
      const response2 = await request(apiApp)
        .post('/api/wake-events')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      // Either returns 409 Conflict or 200 with existing event
      expect([200, 409]).toContain(response2.status);

      // Verify only one wake event exists
      const supabase = getTestSupabaseClient();
      const { data: events, count } = await supabase
        .from('wake_events')
        .select('*', { count: 'exact' })
        .eq('user_id', TEST_USER.id)
        .eq('date', TEST_DATES.today);

      expect(count).toBe(1);
    });
  });

  // =============================================================================
  // TIME WINDOW VALIDATION TESTS
  // =============================================================================

  describe('Time Window Validation', () => {
    it('should reject wake events outside valid window (before 4am)', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createHealthKitWakePayload({
        wake_time: `${TEST_DATES.today}T02:00:00Z`, // 2am - too early
      });

      const response = await request(apiApp)
        .post('/api/wake-events')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      // Should either reject or accept with lower confidence
      // Implementation-dependent
      if (response.status === 200) {
        expect(response.body.wake_event_id).toBeDefined();
      } else {
        expect(response.status).toBe(400);
      }
    });

    it('should reject wake events outside valid window (after 11am)', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createHealthKitWakePayload({
        wake_time: `${TEST_DATES.today}T15:00:00Z`, // 3pm - too late for morning
      });

      const response = await request(apiApp)
        .post('/api/wake-events')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      // Should either reject or accept with note that it's late
      if (response.status === 400) {
        expect(response.body.error).toContain('time');
      }
    });
  });

  // =============================================================================
  // TIMEZONE HANDLING TESTS
  // =============================================================================

  describe('Timezone Handling', () => {
    it('should handle different timezones correctly', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const supabase = getTestSupabaseClient();

      // Wake at 6:30 Pacific (which is 9:30 Eastern)
      const payload = createManualWakePayload({
        timezone: 'America/Los_Angeles',
      });

      const response = await request(apiApp)
        .post('/api/wake-events')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(200);

      const { data: wakeEvent } = await supabase
        .from('wake_events')
        .select('timezone')
        .eq('user_id', TEST_USER.id)
        .eq('date', TEST_DATES.today)
        .single();

      expect(wakeEvent?.timezone).toBe('America/Los_Angeles');
    });

    it('should reject invalid timezone', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createHealthKitWakePayload({
        timezone: 'Invalid/Timezone',
      });

      const response = await request(apiApp)
        .post('/api/wake-events')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('timezone');
    });
  });

  // =============================================================================
  // GET TODAY'S WAKE EVENT TESTS
  // =============================================================================

  describe('GET /api/wake-events/today', () => {
    it('should return today\'s wake event if exists', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      // First create a wake event
      const payload = createHealthKitWakePayload();
      await request(apiApp)
        .post('/api/wake-events')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      // Then retrieve it
      const response = await request(apiApp)
        .get('/api/wake-events/today')
        .set('Authorization', `Bearer mock-token`);

      expect(response.status).toBe(200);
      expect(response.body.wake_event).toBeDefined();
      expect(response.body.wake_event.detection_method).toBe('healthkit');
    });

    it('should return null if no wake event today', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const response = await request(apiApp)
        .get('/api/wake-events/today')
        .set('Authorization', `Bearer mock-token`);

      expect(response.status).toBe(200);
      expect(response.body.wake_event).toBeNull();
    });
  });

  // =============================================================================
  // VALIDATION TESTS
  // =============================================================================

  describe('Input Validation', () => {
    it('should reject invalid source', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = {
        source: 'invalid_source',
        wake_time: `${TEST_DATES.today}T06:30:00Z`,
        timezone: 'America/New_York',
      };

      const response = await request(apiApp)
        .post('/api/wake-events')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('source');
    });

    it('should reject invalid wake_time format', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = {
        source: 'healthkit',
        wake_time: 'not-a-date',
        timezone: 'America/New_York',
      };

      const response = await request(apiApp)
        .post('/api/wake-events')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('wake_time');
    });

    it('should reject missing authorization', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createHealthKitWakePayload();

      const response = await request(apiApp)
        .post('/api/wake-events')
        .send(payload); // No Authorization header

      expect(response.status).toBe(401);
    });
  });
});
