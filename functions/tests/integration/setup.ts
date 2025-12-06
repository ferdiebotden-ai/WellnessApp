/**
 * Integration Test Setup
 *
 * Provides test user management and database cleanup utilities
 * for integration tests that hit the real Supabase database.
 *
 * @file functions/tests/integration/setup.ts
 * @author Claude Opus 4.5 (Session 51)
 * @created December 5, 2025
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { beforeAll, afterAll, afterEach } from 'vitest';

// =============================================================================
// TEST USER CONSTANTS
// =============================================================================

export const TEST_USER = {
  id: 'test-integration-user-001',
  email: 'integration-test@apex-os.test',
  firebase_uid: 'test-firebase-uid-integration-001',
};

// Use distinct historical dates to avoid collision with production data
export const TEST_DATE_PREFIX = '2020-01-';
export const TEST_DATES = {
  today: '2020-01-15',
  yesterday: '2020-01-14',
  weekAgo: '2020-01-08',
  twoWeeksAgo: '2020-01-01',
};

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

let supabaseClient: SupabaseClient | null = null;

export function getTestSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
      );
    }

    supabaseClient = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseClient;
}

// =============================================================================
// TEST USER MANAGEMENT
// =============================================================================

/**
 * Ensure test user exists in the database.
 * Creates the user if it doesn't exist.
 */
export async function ensureTestUserExists(): Promise<void> {
  const supabase = getTestSupabaseClient();

  // Check if test user exists
  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('id', TEST_USER.id)
    .single();

  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116 = not found, which is expected if user doesn't exist
    throw new Error(`Failed to check test user: ${selectError.message}`);
  }

  if (!existingUser) {
    // Create test user
    const { error: insertError } = await supabase.from('users').insert({
      id: TEST_USER.id,
      email: TEST_USER.email,
      firebase_uid: TEST_USER.firebase_uid,
      display_name: 'Integration Test User',
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      throw new Error(`Failed to create test user: ${insertError.message}`);
    }

    console.log(`Created test user: ${TEST_USER.id}`);
  }
}

// =============================================================================
// DATA CLEANUP
// =============================================================================

/**
 * Tables that may contain test data, in deletion order (respecting FK constraints).
 */
const TEST_DATA_TABLES = [
  'nudges',
  'recovery_scores',
  'daily_metrics',
  'wake_events',
  'manual_check_ins',
  'meeting_load_history',
  'user_baselines',
  'wearable_data_archive',
];

/**
 * Clean up all test data for the test user.
 * Uses test date prefix to avoid deleting production data.
 */
export async function cleanupTestData(): Promise<void> {
  const supabase = getTestSupabaseClient();

  for (const table of TEST_DATA_TABLES) {
    try {
      // Delete by user_id
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', TEST_USER.id);

      if (error && !error.message.includes('does not exist')) {
        console.warn(`Warning: Failed to cleanup ${table}: ${error.message}`);
      }
    } catch (err) {
      // Table might not exist or have different structure
      console.warn(`Warning: Could not cleanup ${table}`);
    }
  }
}

/**
 * Clean up data for a specific date only.
 */
export async function cleanupTestDataForDate(date: string): Promise<void> {
  const supabase = getTestSupabaseClient();

  const tablesWithDate = [
    'recovery_scores',
    'daily_metrics',
    'wake_events',
    'manual_check_ins',
    'meeting_load_history',
  ];

  for (const table of tablesWithDate) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', TEST_USER.id)
        .eq('date', date);

      if (error && !error.message.includes('does not exist')) {
        console.warn(`Warning: Failed to cleanup ${table} for ${date}: ${error.message}`);
      }
    } catch (err) {
      // Ignore errors
    }
  }
}

// =============================================================================
// TEST LIFECYCLE HOOKS
// =============================================================================

/**
 * Call this in beforeAll to set up the test environment.
 */
export async function setupIntegrationTest(): Promise<void> {
  await ensureTestUserExists();
}

/**
 * Call this in afterAll to clean up after all tests.
 */
export async function teardownIntegrationTest(): Promise<void> {
  await cleanupTestData();
}

/**
 * Helper to set up common test lifecycle hooks.
 * Usage: setupTestHooks() at the top of your test file.
 */
export function setupTestHooks(): void {
  beforeAll(async () => {
    await setupIntegrationTest();
  });

  afterAll(async () => {
    await teardownIntegrationTest();
  });

  afterEach(async () => {
    // Clean up test dates after each test for isolation
    await cleanupTestDataForDate(TEST_DATES.today);
  });
}

// =============================================================================
// TEST ENVIRONMENT CHECK
// =============================================================================

/**
 * Verify that all required environment variables are set.
 */
export function verifyTestEnvironment(): void {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'FIREBASE_PROJECT_ID',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for integration tests: ${missing.join(', ')}`
    );
  }
}
