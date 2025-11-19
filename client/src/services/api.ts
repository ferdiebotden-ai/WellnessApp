import { getAuth } from 'firebase/auth';
import type { ModuleSummary } from '../types/module';
import type { MonetizationStatus } from '../types/monetization';
import type { UserPreferences, UserProfile } from '../types/user';
import type { WearableSyncPayload } from './wearables/aggregators';

type HttpMethod = 'GET' | 'POST' | 'DELETE' | 'PATCH';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DEV_CORE_MODULES: ModuleSummary[] = [
  {
    id: 'sleep_foundations',
    name: 'Sleep Foundations',
    tier: 'core',
    headline: 'Sleep better, recover faster',
    description: 'Reset your sleep schedule, improve deep sleep, and boost recovery.',
  },
  {
    id: 'metabolic_reset',
    name: 'Metabolic Reset',
    tier: 'core',
    headline: 'Stabilize energy and focus',
    description: 'Dial-in nutrition, glucose, and metabolic flexibility.',
  },
  {
    id: 'stress_resilience',
    name: 'Stress Resilience',
    tier: 'core',
    headline: 'Calm mind, strong body',
    description: 'Nervous system regulation, nervous system downshifting, breath work.',
  },
];

const request = async <T>(path: string, method: HttpMethod, body?: unknown): Promise<T> => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User is not authenticated');
  }

  const token = await currentUser.getIdToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = (errorPayload as { error?: string }).error || 'Unexpected error';
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
};

export const fetchCoreModules = async () => {
  try {
    return await request<ModuleSummary[]>(`/api/modules?tier=core`, 'GET');
  } catch (error) {
    console.warn('Backend API unavailable, using development fallback core modules.', error);
    return DEV_CORE_MODULES;
  }
};

export const completeOnboarding = async (primaryModuleId: string) => {
  try {
    return await request<{
      success: boolean;
      trial_start_date: string;
      trial_end_date: string;
      primary_module_id: string;
    }>('/api/onboarding/complete', 'POST', { primary_module_id: primaryModuleId });
  } catch (error) {
    console.warn('Backend API unavailable, simulating onboarding completion.', error);
    const now = new Date();
    const trialStart = now.toISOString();
    const trialEnd = new Date(now.getTime() + 14 * MS_PER_DAY).toISOString();
    return {
      success: true,
      trial_start_date: trialStart,
      trial_end_date: trialEnd,
      primary_module_id: primaryModuleId,
    };
  }
};

/**
 * Submits a waitlist entry for premium tiers.
 * @param email Email address for follow-up communication.
 * @param tierInterestedIn Tier the user wants access to.
 */
export const submitWaitlistEntry = (email: string, tierInterestedIn: 'pro' | 'elite') =>
  request<{ success: boolean }>('/api/waitlist', 'POST', {
    email,
    tier_interested_in: tierInterestedIn,
  });

/**
 * Sends wearable readings to the Wellness OS API for synchronization.
 * @param payload Normalized wearable metrics payload.
 * @returns API response indicating whether the sync was accepted.
 */
export const syncWearableData = (payload: WearableSyncPayload) =>
  request<{ success: boolean }>('/api/wearables/sync', 'POST', payload);

export interface ProtocolLogEntry {
  id: string;
  protocol_id?: string | null;
  protocolName?: string | null;
  module_id?: string | null;
  status?: string | null;
  logged_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AiAuditLogEntry {
  id: string;
  created_at?: string | null;
  action?: string | null;
  agent?: string | null;
  model?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface PrivacyLogsResponse {
  protocolLogs: ProtocolLogEntry[];
  aiAuditLog: AiAuditLogEntry[];
}

export const fetchPrivacyLogs = () => request<PrivacyLogsResponse>('/api/users/me/privacy', 'GET');

export const requestUserDataExport = () => request<{ accepted: boolean }>('/api/users/me/export', 'POST');

export const requestAccountDeletion = () => request<{ accepted: boolean }>('/api/users/me', 'DELETE');

export const sendChatQuery = (message: string, conversationId?: string) =>
  request<{ response: string; conversationId: string; citations: string[] }>('/api/chat', 'POST', {
    message,
    conversationId,
  });

/**
 * Retrieves the current user profile.
 * @returns User profile including preferences and other user data.
 */
export const fetchCurrentUser = () => request<{ user: UserProfile }>('/api/users/me', 'GET');

/**
 * Updates user preferences.
 * @param preferences Partial preferences object to update.
 * @returns Updated user profile.
 */
export const updateUserPreferences = (preferences: Partial<UserPreferences>) =>
  request<{ user: UserProfile }>('/api/users/me', 'PATCH', { preferences });

/**
 * Retrieves the current monetization status for the authenticated user.
 * Falls back to a local mock payload when the remote API is unavailable so
 * the client can still render paywall experiences in offline environments.
 *
 * @returns Monetization status including trial dates and chat usage counts.
 */
export const fetchMonetizationStatus = async (): Promise<MonetizationStatus> => {
  try {
    return await request<MonetizationStatus>('/api/users/me/monetization', 'GET');
  } catch (error) {
    console.warn('Backend API unavailable, using development fallback monetization status.');
    // Return unlimited access for development
    const now = new Date();
    const trialStart = new Date(now.getTime() - 1 * MS_PER_DAY);
    const trialEnd = new Date(now.getTime() + 365 * MS_PER_DAY); // 1 year trial
    return {
      trial_start_date: trialStart.toISOString(),
      trial_end_date: trialEnd.toISOString(),
      subscription_tier: 'pro', // Grant Pro tier in development
      subscription_id: 'dev-subscription',
      chat_queries_used_this_week: 0,
      chat_weekly_limit: 999999, // Unlimited
    };
  }
};
