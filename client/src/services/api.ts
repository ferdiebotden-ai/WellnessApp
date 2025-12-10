import { firebaseAuth } from './firebase';
import type { ModuleSummary } from '../types/module';
import type { MonetizationStatus } from '../types/monetization';
import type { CorrelationsResponse } from '../types/correlations';
import type { UserPreferences, UserProfile } from '../types/user';
import type { WearableSyncPayload } from './wearables/aggregators';
import type { OnboardingCompletePayload } from '../types/onboarding';
import type { ProtocolDetail, PersonalizedProtocolResponse } from '../types/protocol';
import { DEFAULT_USER_PROTOCOL_DATA, DEFAULT_CONFIDENCE_RESULT } from '../types/protocol';

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
  const currentUser = firebaseAuth.currentUser;
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

export interface UpdatePrimaryModuleResponse {
  success: boolean;
  module_id: string;
  module_name: string;
}

/**
 * Updates the user's primary module.
 * @param moduleId The module ID to set as primary
 * @returns Response with success status and module details
 */
export const updatePrimaryModule = (moduleId: string) =>
  request<UpdatePrimaryModuleResponse>('/api/modules/enrollment', 'PATCH', {
    module_id: moduleId,
  });

/**
 * Syncs the current Firebase user with Supabase.
 * Creates a Supabase user record if one doesn't exist, or returns the existing one.
 *
 * This bridges Firebase Auth (authentication) with Supabase (data storage).
 * The returned user_id is the Supabase UUID, not the Firebase UID.
 *
 * Call this after signup/login to ensure the user exists in the database.
 * This endpoint is idempotent - safe to call multiple times.
 *
 * @returns Object containing the Supabase user_id (UUID) and whether a new user was created
 */
export const syncUser = async (): Promise<{ user_id: string; created: boolean }> => {
  try {
    return await request<{ user_id: string; created: boolean }>('/api/users/sync', 'POST');
  } catch (error) {
    console.warn('[syncUser] Failed to sync user with backend:', error);
    // Re-throw so caller knows sync failed - they may want to retry
    throw error;
  }
};

/**
 * Completes onboarding with goal, biometrics, and optional wearable selection.
 * Accepts the new conversational onboarding payload with primary_goal, biometrics, and wearable_source.
 */
export const completeOnboarding = async (payload: OnboardingCompletePayload) => {
  try {
    // Serialize biometrics with birthDate as ISO string for the backend
    const biometricsPayload = payload.biometrics
      ? {
          birthDate: payload.biometrics.birthDate?.toISOString() ?? null,
          biologicalSex: payload.biometrics.biologicalSex,
          heightCm: payload.biometrics.heightCm,
          weightKg: payload.biometrics.weightKg,
          timezone: payload.biometrics.timezone,
        }
      : null;

    return await request<{
      success: boolean;
      trial_start_date: string;
      trial_end_date: string;
      primary_module_id: string;
      primary_goal: string;
      wearable_source: string | null;
      has_biometrics: boolean;
      timezone: string;
    }>('/api/onboarding/complete', 'POST', {
      primary_goal: payload.primary_goal,
      wearable_source: payload.wearable_source ?? null,
      primary_module_id: payload.primary_module_id,
      biometrics: biometricsPayload,
    });
  } catch (error) {
    console.warn('Backend API unavailable, simulating onboarding completion.', error);
    const now = new Date();
    const trialStart = now.toISOString();
    const trialEnd = new Date(now.getTime() + 14 * MS_PER_DAY).toISOString();
    return {
      success: true,
      trial_start_date: trialStart,
      trial_end_date: trialEnd,
      primary_module_id: payload.primary_module_id ?? '',
      primary_goal: payload.primary_goal,
      wearable_source: payload.wearable_source ?? null,
      has_biometrics: !!payload.biometrics,
      timezone: payload.biometrics?.timezone ?? 'UTC',
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
 * Protocol search result from RAG-powered semantic search.
 */
export interface ProtocolSearchResult {
  id: string;
  name: string | null;
  description: string | null;
  category: string | null;
  tier_required: string | null;
  benefits: string | null;
  constraints: string | null;
  citations: string[];
  score: number;
}

/**
 * Searches protocols using RAG-powered semantic search via Pinecone.
 * @param query Natural language search query (e.g., "improve my sleep")
 * @param limit Maximum number of results to return (default: 5, max: 20)
 * @returns Array of protocol search results ranked by relevance score
 */
export const searchProtocols = (query: string, limit?: number) =>
  request<ProtocolSearchResult[]>(
    `/api/protocols/search?q=${encodeURIComponent(query)}&limit=${limit || 5}`,
    'GET'
  );

/**
 * Fetches a single protocol by ID with basic details.
 * Falls back to search API if dedicated endpoint fails.
 * @param protocolId Protocol ID to fetch
 * @returns Protocol detail object
 */
export const fetchProtocolById = async (protocolId: string): Promise<ProtocolDetail> => {
  try {
    // Try personalized endpoint first (returns more data)
    const response = await fetchPersonalizedProtocol(protocolId);
    return response.protocol;
  } catch {
    // Fallback to search API
    const results = await searchProtocols(protocolId, 10);
    const match = results.find((r) => r.id === protocolId);

    if (!match) {
      throw new Error(`Protocol not found: ${protocolId}`);
    }

    return {
      id: match.id,
      name: match.name ?? '',
      description: match.description ?? undefined,
      citations: match.citations,
      category: (match.category as ProtocolDetail['category']) ?? undefined,
      tier_required: match.tier_required ?? undefined,
      benefits: match.benefits ?? undefined,
      constraints: match.constraints ?? undefined,
    };
  }
};

/**
 * Fetches personalized protocol data including user-specific information.
 * Returns enriched protocol, user adherence data, and confidence scoring.
 *
 * @param protocolId Protocol ID to fetch
 * @param userId Optional user ID (for testing, normally uses auth token)
 * @returns Personalized protocol response with enrichment and user data
 */
export const fetchPersonalizedProtocol = async (
  protocolId: string,
  userId?: string
): Promise<PersonalizedProtocolResponse> => {
  try {
    const queryParams = userId ? `?user_id=${userId}` : '';
    return await request<PersonalizedProtocolResponse>(
      `/api/protocols/${protocolId}/personalized${queryParams}`,
      'GET'
    );
  } catch (error) {
    console.warn('Personalized protocol API unavailable, returning defaults');

    // Fallback to search API for protocol data
    const results = await searchProtocols(protocolId, 10);
    const match = results.find((r) => r.id === protocolId);

    if (!match) {
      throw new Error(`Protocol not found: ${protocolId}`);
    }

    return {
      protocol: {
        id: match.id,
        name: match.name ?? '',
        description: match.description ?? undefined,
        citations: match.citations,
        category: (match.category as ProtocolDetail['category']) ?? undefined,
        tier_required: match.tier_required ?? undefined,
        benefits: match.benefits ?? undefined,
        constraints: match.constraints ?? undefined,
      },
      user_data: DEFAULT_USER_PROTOCOL_DATA,
      confidence: DEFAULT_CONFIDENCE_RESULT,
    };
  }
};

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

export interface BiometricUpdatePayload {
  birth_date?: string | null;
  biological_sex?: 'male' | 'female' | 'prefer_not_to_say' | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  timezone?: string | null;
}

/**
 * Updates user biometric profile (age, sex, height, weight, timezone).
 * @param biometrics Biometric fields to update.
 * @returns Updated user profile.
 */
export const updateUserBiometrics = (biometrics: BiometricUpdatePayload) =>
  request<{ user: UserProfile }>('/api/users/me', 'PATCH', biometrics);

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

/**
 * Retrieves protocol-outcome correlations for the authenticated user.
 * Falls back to empty correlations when the API is unavailable.
 *
 * @returns Correlations response with top correlations and days tracked.
 */
export const fetchCorrelations = async (): Promise<CorrelationsResponse> => {
  try {
    return await request<CorrelationsResponse>('/api/users/me/correlations', 'GET');
  } catch (error) {
    console.warn('Backend API unavailable, returning empty correlations.');
    return {
      correlations: [],
      days_tracked: 0,
      min_days_required: 14,
    };
  }
};

// =============================================================================
// CALENDAR API
// =============================================================================

import type {
  BusyBlock,
  CalendarProvider,
  CalendarSyncResponse,
  CalendarIntegrationStatus,
  MeetingLoadMetrics,
  RecentMetricsResponse,
} from './calendar/types';

export const syncCalendar = (payload: {
  provider: CalendarProvider;
  busyBlocks?: BusyBlock[];
  timezone: string;
}) => request<CalendarSyncResponse>('/api/calendar/sync', 'POST', payload);

export const fetchTodayCalendarMetrics = () =>
  request<{
    success: boolean;
    metrics: MeetingLoadMetrics | null;
    error: string | null;
  }>('/api/calendar/today', 'GET');

export const fetchCalendarStatus = () =>
  request<CalendarIntegrationStatus>('/api/calendar/status', 'GET');

export const disconnectCalendar = (provider?: CalendarProvider) => {
  const url = provider
    ? `/api/calendar/disconnect?provider=${provider}`
    : '/api/calendar/disconnect';
  return request<{ success: boolean; error: string | null }>(url, 'DELETE');
};

export const fetchRecentCalendarMetrics = (days: number = 14) =>
  request<RecentMetricsResponse>(`/api/calendar/recent?days=${days}`, 'GET');
