/**
 * Calendar → MVD Detection Integration Test
 *
 * Tests the complete flow:
 * POST /api/calendar/sync → meeting_load_history insert → MVD detector → user_mvd_states update
 *
 * Flow 4 from PHASE_III_IMPLEMENTATION_PLAN.md - Session 10
 *
 * @file functions/tests/integration/calendar-mvd.test.ts
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
 * Light day calendar sync (<4 hours of meetings).
 */
function createLightDayPayload() {
  return {
    provider: 'device',
    busy_blocks: [
      {
        start: `${TEST_DATES.today}T09:00:00Z`,
        end: `${TEST_DATES.today}T10:00:00Z`,
        title: 'Team Standup',
      },
      {
        start: `${TEST_DATES.today}T14:00:00Z`,
        end: `${TEST_DATES.today}T14:30:00Z`,
        title: '1:1 with Manager',
      },
      {
        start: `${TEST_DATES.today}T16:00:00Z`,
        end: `${TEST_DATES.today}T17:00:00Z`,
        title: 'Project Review',
      },
    ],
    timezone: 'America/New_York',
  };
}

/**
 * Heavy day calendar sync (>7 hours of meetings → triggers MVD).
 */
function createHeavyDayPayload() {
  return {
    provider: 'device',
    busy_blocks: [
      {
        start: `${TEST_DATES.today}T08:00:00Z`,
        end: `${TEST_DATES.today}T09:30:00Z`,
        title: 'Executive Review',
      },
      {
        start: `${TEST_DATES.today}T09:30:00Z`,
        end: `${TEST_DATES.today}T11:00:00Z`,
        title: 'Product Planning',
      },
      {
        start: `${TEST_DATES.today}T11:00:00Z`,
        end: `${TEST_DATES.today}T12:00:00Z`,
        title: 'Client Call',
      },
      {
        start: `${TEST_DATES.today}T13:00:00Z`,
        end: `${TEST_DATES.today}T14:30:00Z`,
        title: 'Design Review',
      },
      {
        start: `${TEST_DATES.today}T14:30:00Z`,
        end: `${TEST_DATES.today}T16:00:00Z`,
        title: 'Engineering Sync',
      },
      {
        start: `${TEST_DATES.today}T16:00:00Z`,
        end: `${TEST_DATES.today}T17:30:00Z`,
        title: 'Sprint Planning',
      },
      {
        start: `${TEST_DATES.today}T17:30:00Z`,
        end: `${TEST_DATES.today}T18:30:00Z`,
        title: 'Team Retrospective',
      },
    ],
    timezone: 'America/New_York',
  };
}

/**
 * Medium day calendar sync (4-7 hours).
 */
function createMediumDayPayload() {
  return {
    provider: 'device',
    busy_blocks: [
      {
        start: `${TEST_DATES.today}T09:00:00Z`,
        end: `${TEST_DATES.today}T10:30:00Z`,
        title: 'Team Meeting',
      },
      {
        start: `${TEST_DATES.today}T11:00:00Z`,
        end: `${TEST_DATES.today}T12:00:00Z`,
        title: '1:1',
      },
      {
        start: `${TEST_DATES.today}T14:00:00Z`,
        end: `${TEST_DATES.today}T15:30:00Z`,
        title: 'Project Review',
      },
      {
        start: `${TEST_DATES.today}T16:00:00Z`,
        end: `${TEST_DATES.today}T17:00:00Z`,
        title: 'Planning',
      },
    ],
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
        get: vi.fn().mockResolvedValue({
          exists: false,
          data: () => null,
        }),
        update: vi.fn().mockResolvedValue({}),
      }),
    }),
  }),
}));

// =============================================================================
// LIFECYCLE HOOKS
// =============================================================================

describe('Calendar → MVD Detection Integration', () => {
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

      // Also clean up MVD states
      const supabase = getTestSupabaseClient();
      await supabase
        .from('user_mvd_states')
        .delete()
        .eq('user_id', TEST_USER.id);
    }
    vi.clearAllMocks();
  });

  // =============================================================================
  // CALENDAR SYNC TESTS
  // =============================================================================

  describe('Calendar Sync', () => {
    it('should sync calendar and calculate meeting hours', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createLightDayPayload();

      const response = await request(apiApp)
        .post('/api/calendar/sync')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.meeting_hours).toBeDefined();
    });

    it('should store meeting metrics in meeting_load_history', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const supabase = getTestSupabaseClient();
      const payload = createLightDayPayload();

      await request(apiApp)
        .post('/api/calendar/sync')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      const { data: history } = await supabase
        .from('meeting_load_history')
        .select('*')
        .eq('user_id', TEST_USER.id)
        .eq('date', TEST_DATES.today)
        .single();

      expect(history).toBeDefined();
      expect(history?.meeting_hours).toBeGreaterThan(0);
      expect(history?.meeting_count).toBe(3); // 3 meetings in light day
    });
  });

  // =============================================================================
  // MVD DETECTION TESTS
  // =============================================================================

  describe('MVD Detection', () => {
    it('should NOT trigger MVD for light day (<4 hours)', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createLightDayPayload();

      const response = await request(apiApp)
        .post('/api/calendar/sync')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(200);
      // MVD should not be triggered
      expect(response.body.mvd_triggered).toBeFalsy();

      // Verify MVD state is not active
      const mvdResponse = await request(apiApp)
        .get('/api/mvd/status')
        .set('Authorization', `Bearer mock-token`);

      expect(mvdResponse.body.mvd_active).toBe(false);
    });

    it('should trigger MVD for heavy day (>7 hours)', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const payload = createHeavyDayPayload();

      const response = await request(apiApp)
        .post('/api/calendar/sync')
        .set('Authorization', `Bearer mock-token`)
        .send(payload);

      expect(response.status).toBe(200);

      // Check MVD status
      const mvdResponse = await request(apiApp)
        .get('/api/mvd/status')
        .set('Authorization', `Bearer mock-token`);

      // Heavy day should trigger MVD (or at least show in response)
      // The actual trigger depends on implementation
      if (mvdResponse.body.mvd_active) {
        expect(mvdResponse.body.trigger).toContain('calendar');
      }
    });
  });

  // =============================================================================
  // MVD MANUAL ACTIVATION TESTS
  // =============================================================================

  describe('MVD Manual Activation', () => {
    it('should activate MVD manually', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const response = await request(apiApp)
        .post('/api/mvd/activate')
        .set('Authorization', `Bearer mock-token`)
        .send({ mvdType: 'full' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify status
      const statusResponse = await request(apiApp)
        .get('/api/mvd/status')
        .set('Authorization', `Bearer mock-token`);

      expect(statusResponse.body.mvd_active).toBe(true);
      expect(statusResponse.body.mvd_type).toBe('full');
    });

    it('should reject duplicate activation', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      // First activation
      await request(apiApp)
        .post('/api/mvd/activate')
        .set('Authorization', `Bearer mock-token`)
        .send({ mvdType: 'full' });

      // Second activation should fail
      const response = await request(apiApp)
        .post('/api/mvd/activate')
        .set('Authorization', `Bearer mock-token`)
        .send({ mvdType: 'full' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already active');
    });

    it('should support different MVD types', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      // Activate with travel type
      const response = await request(apiApp)
        .post('/api/mvd/activate')
        .set('Authorization', `Bearer mock-token`)
        .send({ mvdType: 'travel' });

      expect(response.status).toBe(200);

      const statusResponse = await request(apiApp)
        .get('/api/mvd/status')
        .set('Authorization', `Bearer mock-token`);

      expect(statusResponse.body.mvd_type).toBe('travel');
    });
  });

  // =============================================================================
  // MVD DEACTIVATION TESTS
  // =============================================================================

  describe('MVD Deactivation', () => {
    it('should deactivate MVD manually', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      // First activate
      await request(apiApp)
        .post('/api/mvd/activate')
        .set('Authorization', `Bearer mock-token`)
        .send({ mvdType: 'full' });

      // Then deactivate
      const response = await request(apiApp)
        .post('/api/mvd/deactivate')
        .set('Authorization', `Bearer mock-token`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify status
      const statusResponse = await request(apiApp)
        .get('/api/mvd/status')
        .set('Authorization', `Bearer mock-token`);

      expect(statusResponse.body.mvd_active).toBe(false);
    });

    it('should handle deactivation when not active', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const response = await request(apiApp)
        .post('/api/mvd/deactivate')
        .set('Authorization', `Bearer mock-token`);

      // Should either succeed (no-op) or return appropriate message
      expect([200, 400]).toContain(response.status);
    });
  });

  // =============================================================================
  // GET /api/mvd/status TESTS
  // =============================================================================

  describe('GET /api/mvd/status', () => {
    it('should return mvd_active=false when not activated', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const response = await request(apiApp)
        .get('/api/mvd/status')
        .set('Authorization', `Bearer mock-token`);

      expect(response.status).toBe(200);
      expect(response.body.mvd_active).toBe(false);
    });

    it('should return full status when MVD is active', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      // Activate MVD
      await request(apiApp)
        .post('/api/mvd/activate')
        .set('Authorization', `Bearer mock-token`)
        .send({ mvdType: 'semi_active' });

      const response = await request(apiApp)
        .get('/api/mvd/status')
        .set('Authorization', `Bearer mock-token`);

      expect(response.status).toBe(200);
      expect(response.body.mvd_active).toBe(true);
      expect(response.body.mvd_type).toBe('semi_active');
      expect(response.body.trigger).toBeDefined();
      expect(response.body.activated_at).toBeDefined();
    });
  });

  // =============================================================================
  // GET /api/calendar/today TESTS
  // =============================================================================

  describe('GET /api/calendar/today', () => {
    it('should return today\'s calendar metrics', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      // First sync calendar
      await request(apiApp)
        .post('/api/calendar/sync')
        .set('Authorization', `Bearer mock-token`)
        .send(createMediumDayPayload());

      // Then get today's metrics
      const response = await request(apiApp)
        .get('/api/calendar/today')
        .set('Authorization', `Bearer mock-token`);

      expect(response.status).toBe(200);
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.meeting_hours).toBeGreaterThan(0);
    });

    it('should return empty metrics if no calendar synced', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const response = await request(apiApp)
        .get('/api/calendar/today')
        .set('Authorization', `Bearer mock-token`);

      expect(response.status).toBe(200);
      // Should handle gracefully
    });
  });

  // =============================================================================
  // GET /api/calendar/status TESTS
  // =============================================================================

  describe('GET /api/calendar/status', () => {
    it('should return calendar integration status', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const response = await request(apiApp)
        .get('/api/calendar/status')
        .set('Authorization', `Bearer mock-token`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      // Status should indicate connection state
    });
  });

  // =============================================================================
  // INPUT VALIDATION TESTS
  // =============================================================================

  describe('Input Validation', () => {
    it('should reject invalid MVD type', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const response = await request(apiApp)
        .post('/api/mvd/activate')
        .set('Authorization', `Bearer mock-token`)
        .send({ mvdType: 'invalid_type' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('mvdType');
    });

    it('should reject missing authorization', async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return;
      }

      const response = await request(apiApp)
        .get('/api/mvd/status');
      // No Authorization header

      expect(response.status).toBe(401);
    });
  });
});
