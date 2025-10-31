import { describe, expect, it, vi, beforeEach } from 'vitest';
import { filterMutableFields, buildUserInsert } from '../src/users';
import { normalizePrivateKey } from '../src/config';

process.env.FIREBASE_PROJECT_ID = 'demo-project';
process.env.FIREBASE_CLIENT_EMAIL = 'demo@example.com';
process.env.FIREBASE_PRIVATE_KEY = 'line1\\nline2';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
process.env.SUPABASE_JWT_SECRET = 'secret';
process.env.DEFAULT_TRIAL_DAYS = '7';

describe('normalizePrivateKey', () => {
  it('replaces escaped newlines with actual newlines', () => {
    const input = 'line1\\nline2';
    expect(normalizePrivateKey(input)).toBe('line1\nline2');
  });
});

describe('filterMutableFields', () => {
  it('keeps only mutable profile properties', async () => {
    const updates = filterMutableFields({
      display_name: 'New Name',
      onboarding_complete: true,
      preferences: { theme: 'dark' },
      earnedBadges: [123, 'badge-two'],
      tier: 'pro'
    });

    expect(updates).toEqual({
      display_name: 'New Name',
      onboarding_complete: true,
      preferences: { theme: 'dark' },
      earnedBadges: ['123', 'badge-two']
    });
  });
});

describe('buildUserInsert', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a user profile with default values and calculated trial end', () => {
    const profile = buildUserInsert('uid-123', 'user@example.com', 'Display');
    expect(profile).toMatchObject({
      id: 'uid-123',
      email: 'user@example.com',
      display_name: 'Display',
      tier: 'trial',
      onboarding_complete: false,
      preferences: {},
      healthMetrics: {},
      earnedBadges: []
    });

    expect(profile.trial_start_date).toBe('2024-01-01T00:00:00.000Z');
    expect(profile.trial_end_date).toBe('2024-01-08T00:00:00.000Z');
  });
});
