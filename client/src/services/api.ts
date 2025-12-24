import { firebaseAuth } from './firebase';
import type { ModuleSummary } from '../types/module';
import type { MonetizationStatus } from '../types/monetization';
import type { CorrelationsResponse } from '../types/correlations';
import type { UserPreferences, UserProfile } from '../types/user';
import type { WearableSyncPayload } from './wearables/aggregators';
import type { OnboardingCompletePayload, StarterProtocol } from '../types/onboarding';
import type { ProtocolDetail, PersonalizedProtocolResponse } from '../types/protocol';
import { DEFAULT_USER_PROTOCOL_DATA, DEFAULT_CONFIDENCE_RESULT } from '../types/protocol';

type HttpMethod = 'GET' | 'POST' | 'DELETE' | 'PATCH';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Log API configuration on startup (helps debug TestFlight issues)
console.log(`[API] Base URL configured: ${API_BASE_URL}`);

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
    console.warn(`[API] Request to ${path} failed: User not authenticated`);
    throw new Error('User is not authenticated');
  }

  // Get auth token with defensive error handling
  let token: string;
  try {
    token = await currentUser.getIdToken();
  } catch (tokenError) {
    console.warn(`[API] Failed to get auth token for ${path}:`, tokenError);
    throw new Error('Authentication not ready - please try again');
  }

  const url = `${API_BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
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
      console.warn(`[API] Request failed: ${method} ${path} → ${response.status}: ${message}`);
      throw new Error(message);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();

    // Defensive: Validate response is valid JSON object/array
    if (data === null || data === undefined) {
      console.warn(`[API] Empty response from ${method} ${path}`);
      return {} as T;
    }

    return data as T;
  } catch (fetchError) {
    // Log network errors with context
    if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
      console.error(`[API] Network error for ${method} ${path}:`, fetchError.message);
    }
    throw fetchError;
  }
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
      enrolled_protocol_count: number;
    }>('/api/onboarding/complete', 'POST', {
      primary_goal: payload.primary_goal,
      wearable_source: payload.wearable_source ?? null,
      primary_module_id: payload.primary_module_id,
      biometrics: biometricsPayload,
      selected_protocol_ids: payload.selected_protocol_ids ?? [],
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
      enrolled_protocol_count: payload.selected_protocol_ids?.length ?? 0,
    };
  }
};

/**
 * Fetches starter protocols for a given module.
 * Used during onboarding to show users which protocols they can add.
 * @param moduleId Module ID to fetch starter protocols for
 * @returns Array of starter protocols with schedule suggestions
 */
export const fetchStarterProtocols = async (moduleId: string): Promise<StarterProtocol[]> => {
  try {
    return await request<StarterProtocol[]>(
      `/api/modules/${moduleId}/starter-protocols`,
      'GET'
    );
  } catch (error) {
    console.warn('Starter protocols API unavailable, using fallback data', error);
    // Fallback starter protocols based on module
    // IDs match database: protocol_1_morning_light, protocol_2_evening_light, etc.
    const fallbackProtocols: Record<string, StarterProtocol[]> = {
      mod_sleep: [
        { id: 'protocol_1_morning_light', name: 'Morning Light Exposure', short_name: 'Morning Light', summary: 'Get 10-30 min of outdoor light within 60 min of waking', category: 'Foundation', default_time: '07:00' },
        { id: 'protocol_2_evening_light', name: 'Evening Light Management', short_name: 'Evening Light', summary: 'Dim lights and minimize blue light 2-3h before sleep', category: 'Foundation', default_time: '21:00' },
        { id: 'protocol_10_nsdr', name: 'NSDR Session', short_name: 'NSDR', summary: 'Non-Sleep Deep Rest to enhance recovery and reduce stress', category: 'Recovery', default_time: '13:00' },
      ],
      mod_morning_routine: [
        { id: 'protocol_1_morning_light', name: 'Morning Light Exposure', short_name: 'Morning Light', summary: 'Get 10-30 min of outdoor light within 60 min of waking', category: 'Foundation', default_time: '07:00' },
        { id: 'protocol_4_hydration', name: 'Hydration & Electrolytes', short_name: 'Hydration', summary: '16-32 oz water with electrolytes within 30 min of waking', category: 'Foundation', default_time: '07:15' },
        { id: 'protocol_6_morning_movement', name: 'Morning Movement', short_name: 'Movement', summary: 'Light Zone 2 movement within 30-90 min of waking', category: 'Performance', default_time: '07:30' },
      ],
      mod_focus_productivity: [
        { id: 'protocol_5_caffeine_timing', name: 'Caffeine Timing & Cutoff', short_name: 'Caffeine', summary: 'Delay caffeine 90-120 min post-wake, cutoff 8-10h before bed', category: 'Performance', default_time: '09:00' },
        { id: 'protocol_11_breathwork', name: 'Breathwork & HRV Regulation', short_name: 'Breathwork', summary: 'Controlled breathing to rebalance autonomic tone', category: 'Recovery', default_time: '13:00' },
        { id: 'protocol_16_focus', name: 'Focus & Information Diet', short_name: 'Deep Work', summary: 'Structured deep work blocks with notification batching', category: 'Optimization', default_time: '10:00' },
      ],
    };
    return fallbackProtocols[moduleId] ?? [];
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
 * Sends wearable readings to the Apex OS API for synchronization.
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
// WEEKLY SYNTHESIS API
// =============================================================================

/**
 * Metrics summary from the weekly synthesis
 */
export interface WeeklySynthesisMetrics {
  protocol_adherence?: number;
  days_with_completion?: number;
  avg_recovery_score?: number | null;
  hrv_trend_percent?: number | null;
  sleep_quality_trend_percent?: number | null;
  total_protocols_completed?: number;
  data_days_available?: number;
  has_wearable_data?: boolean;
  protocol_breakdown?: Array<{
    protocol_id: string;
    name: string;
    completed_days: number;
    completion_rate: number;
  }>;
}

/**
 * Weekly synthesis data from the API
 */
export interface WeeklySynthesis {
  id: string;
  week_start: string;
  week_end: string;
  narrative: string;
  win_of_week: string;
  area_to_watch: string;
  pattern_insight: string | null;
  trajectory_prediction: string | null;
  experiment: string;
  metrics: WeeklySynthesisMetrics;
  generated_at: string;
}

/**
 * Response format for GET /api/users/me/weekly-synthesis
 */
export interface WeeklySynthesisResponse {
  has_synthesis: boolean;
  synthesis: WeeklySynthesis | null;
  days_tracked: number;
  min_days_required: number;
}

/**
 * Retrieves the user's latest weekly synthesis narrative.
 * Falls back to empty synthesis when the API is unavailable.
 *
 * @returns Weekly synthesis response with narrative and metrics.
 */
export const fetchWeeklySynthesis = async (): Promise<WeeklySynthesisResponse> => {
  try {
    return await request<WeeklySynthesisResponse>('/api/users/me/weekly-synthesis', 'GET');
  } catch (error) {
    console.warn('Backend API unavailable, returning empty synthesis.');
    return {
      has_synthesis: false,
      synthesis: null,
      days_tracked: 0,
      min_days_required: 4,
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

// =============================================================================
// PROTOCOL ENROLLMENT API
// =============================================================================

/**
 * Enrolled protocol with schedule info and protocol details.
 */
export interface EnrolledProtocol {
  id: string;
  protocol_id: string;
  module_id: string | null;
  default_time_utc: string;
  enrolled_at: string;
  protocol: {
    id: string;
    name: string;
    short_name: string;
    category: string;
    summary: string;
    duration_minutes: number | null;
    frequency_per_week: number | null;
  };
}

/**
 * Response from enrolling in a protocol.
 */
export interface EnrollProtocolResponse {
  enrolled: boolean;
  protocol_id: string;
  protocol_name: string;
  default_time: string;
}

/**
 * Response from unenrolling from a protocol.
 */
export interface UnenrollProtocolResponse {
  enrolled: boolean;
  protocol_id: string;
}

/**
 * Enrolls the user in a protocol with intelligent default timing.
 * @param protocolId Protocol ID to enroll in
 * @param options Optional enrollment options
 * @param options.moduleId Optional module ID for context
 * @param options.time Optional custom time in "HH:MM" format (UTC)
 * @returns Enrollment response with default schedule time
 */
export const enrollInProtocol = (
  protocolId: string,
  options?: { moduleId?: string; time?: string }
) => {
  const body: Record<string, string> = {};
  if (options?.moduleId) body.module_id = options.moduleId;
  if (options?.time) body.time = options.time;

  return request<EnrollProtocolResponse>(
    `/api/protocols/${protocolId}/enroll`,
    'POST',
    Object.keys(body).length > 0 ? body : {}
  );
};

/**
 * Unenrolls the user from a protocol (soft delete).
 * @param protocolId Protocol ID to unenroll from
 * @returns Unenrollment response
 */
export const unenrollFromProtocol = (protocolId: string) =>
  request<UnenrollProtocolResponse>(`/api/protocols/${protocolId}/enroll`, 'DELETE');

/**
 * Fetches all protocols the user is enrolled in.
 * @returns Array of enrolled protocols with schedule info and details
 */
export const fetchEnrolledProtocols = async (): Promise<EnrolledProtocol[]> => {
  try {
    return await request<EnrolledProtocol[]>('/api/user/enrolled-protocols', 'GET');
  } catch (error) {
    console.warn('Failed to fetch enrolled protocols:', error);
    return [];
  }
};

// ============================================================================
// MVD (Minimum Viable Day) API
// ============================================================================

export interface MVDStatus {
  active: boolean;
  type: 'low_recovery' | 'travel' | 'heavy_calendar' | 'consistency_drop' | 'manual' | null;
  reason: string | null;
  activated_at: string | null;
  expires_at: string | null;
}

/**
 * Fetches the current MVD status for the user.
 * @returns MVD status object
 */
export const getMVDStatus = async (): Promise<MVDStatus> => {
  try {
    return await request<MVDStatus>('/api/mvd/status', 'GET');
  } catch (error) {
    console.warn('Failed to fetch MVD status:', error);
    return { active: false, type: null, reason: null, activated_at: null, expires_at: null };
  }
};

/**
 * Manually activates MVD mode ("I'm struggling today").
 * @returns Success response
 */
export const activateMVD = () =>
  request<{ success: boolean; message: string }>('/api/mvd/activate', 'POST');

/**
 * Deactivates MVD mode ("I'm good now").
 * @returns Success response
 */
export const deactivateMVD = () =>
  request<{ success: boolean; message: string }>('/api/mvd/deactivate', 'POST');
