/**
 * User Fixtures for Integration Tests
 *
 * @file functions/tests/integration/fixtures/users.ts
 * @author Claude Opus 4.5 (Session 51)
 * @created December 5, 2025
 */

import { TEST_USER } from '../setup';

// =============================================================================
// USER PROFILE FIXTURES
// =============================================================================

/**
 * Test user with complete profile (has wearable, established baseline).
 */
export const ESTABLISHED_USER = {
  ...TEST_USER,
  onboarding_completed: true,
  wearable_source: 'apple_health' as const,
  primary_goal: 'improve_sleep',
  timezone: 'America/New_York',
};

/**
 * Test user in Lite Mode (no wearable).
 */
export const LITE_MODE_USER = {
  ...TEST_USER,
  id: 'test-lite-mode-user-001',
  email: 'lite-mode-test@apex-os.test',
  firebase_uid: 'test-firebase-uid-lite-001',
  onboarding_completed: true,
  wearable_source: 'manual' as const,
  primary_goal: 'increase_energy',
  timezone: 'America/Los_Angeles',
};

/**
 * New user without baseline data (< 5 days).
 */
export const NEW_USER = {
  ...TEST_USER,
  id: 'test-new-user-001',
  email: 'new-user-test@apex-os.test',
  firebase_uid: 'test-firebase-uid-new-001',
  onboarding_completed: true,
  wearable_source: 'apple_health' as const,
  primary_goal: 'reduce_stress',
  timezone: 'Europe/London',
};

// =============================================================================
// MODULE ENROLLMENT FIXTURES
// =============================================================================

export const ENROLLED_MODULES = [
  {
    user_id: TEST_USER.id,
    module_id: 'sleep-optimization',
    is_primary: true,
    enrolled_at: '2020-01-01T00:00:00Z',
  },
  {
    user_id: TEST_USER.id,
    module_id: 'stress-management',
    is_primary: false,
    enrolled_at: '2020-01-01T00:00:00Z',
  },
  {
    user_id: TEST_USER.id,
    module_id: 'energy-boost',
    is_primary: false,
    enrolled_at: '2020-01-01T00:00:00Z',
  },
];
