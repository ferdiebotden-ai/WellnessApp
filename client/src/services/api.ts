import { getAuth } from 'firebase/auth';
import type { ModuleSummary } from '../types/module';
import type { MonetizationStatus } from '../types/monetization';
import type { WearableSyncPayload } from './wearables/aggregators';

type HttpMethod = 'GET' | 'POST' | 'DELETE';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com';

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

export const fetchCoreModules = () =>
  request<ModuleSummary[]>(`/api/modules?tier=core`, 'GET');

export const completeOnboarding = (primaryModuleId: string) =>
  request<{ success: boolean; trial_start_date: string; trial_end_date: string; primary_module_id: string }>(
    '/api/onboarding/complete',
    'POST',
    { primary_module_id: primaryModuleId }
  );

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
    console.warn('Unable to load monetization status, using fallback payload.', error);
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const trialStart = new Date(now.getTime() - 7 * msPerDay);
    const trialEnd = new Date(now.getTime() + 7 * msPerDay);
    return {
      trial_start_date: trialStart.toISOString(),
      trial_end_date: trialEnd.toISOString(),
      subscription_tier: 'trial',
      subscription_id: null,
      chat_queries_used_this_week: 0,
      chat_weekly_limit: 10,
    };
  }
};
