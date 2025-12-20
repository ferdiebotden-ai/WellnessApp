/**
 * useRecoveryScore Hook
 *
 * Fetches and manages recovery score data from the API.
 * Includes baseline status for onboarding UX.
 *
 * @file client/src/hooks/useRecoveryScore.ts
 * @author Claude Opus 4.5 (Session 40)
 * @created December 4, 2025
 */

import { useState, useEffect, useCallback } from 'react';
import { firebaseAuth } from '../services/firebase';
import type {
  RecoveryScoreData,
  BaselineStatus,
  RecoveryComponent,
} from '../components/RecoveryScoreCard';
import type { CheckInResult, QualityRating, SleepHoursOption, CheckInRecommendation } from '../types/checkIn';

// API base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com';

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

interface RecoveryScoreResponse {
  score: number;
  confidence: number;
  zone: 'red' | 'yellow' | 'green';
  components: {
    hrv: { raw: number | null; score: number; vsBaseline: string; weight: number };
    rhr: { raw: number | null; score: number; vsBaseline: string; weight: number };
    sleepQuality: { efficiency: number | null; deepPct: number | null; remPct: number | null; score: number; weight: number };
    sleepDuration: { hours: number | null; vsTarget: string; score: number; weight: number };
    respiratoryRate: { raw: number | null; score: number; vsBaseline: string; weight: number };
    temperaturePenalty: { deviation: number | null; penalty: number };
  };
  reasoning: string;
  dataCompleteness: number;
  missingInputs: string[];
}

interface BaselineStatusResponse {
  ready: boolean;
  daysCollected: number;
  daysRequired: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  message: string;
}

interface CheckInApiResponse {
  score: number;
  confidence: number;
  zone: 'red' | 'yellow' | 'green';
  components: {
    sleepQuality: { rating: number; label: string; score: number; weight: number };
    sleepDuration: { hours: number; option: string; score: number; vsTarget: string; weight: number };
    energyLevel: { rating: number; label: string; score: number; weight: number };
  };
  reasoning: string;
  recommendations: Array<{
    type: string;
    headline: string;
    body: string;
    protocols: string[];
  }>;
  isLiteMode: true;
  skipped: boolean;
}

interface RecoveryApiResponse {
  recovery: RecoveryScoreResponse | CheckInApiResponse | null;
  baseline: BaselineStatusResponse;
  yesterdayScore?: number | null;
  isLiteMode?: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Make authenticated API request.
 */
async function apiRequest<T>(path: string): Promise<T> {
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) {
    throw new Error('User is not authenticated');
  }

  // Get auth token with proper error handling
  let token: string;
  try {
    token = await currentUser.getIdToken();
  } catch (authError) {
    console.warn('[useRecoveryScore] Failed to get auth token:', authError);
    throw new Error('Authentication not ready - please try again');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = (errorPayload as { error?: string }).error || 'Failed to fetch recovery data';
    throw new Error(message);
  }

  return response.json();
}

/**
 * Calculate trend from yesterday's score.
 */
function calculateTrend(
  todayScore: number,
  yesterdayScore: number | null | undefined
): { trend: 'up' | 'down' | 'steady' | null; delta: number | undefined } {
  if (yesterdayScore === null || yesterdayScore === undefined) {
    return { trend: null, delta: undefined };
  }

  const delta = todayScore - yesterdayScore;

  if (delta > 5) {
    return { trend: 'up', delta };
  } else if (delta < -5) {
    return { trend: 'down', delta };
  } else {
    return { trend: 'steady', delta };
  }
}

/**
 * Transform wearable API response to component-friendly format.
 * Only called for non-Lite Mode responses (wearable data).
 */
function transformRecoveryData(
  response: RecoveryApiResponse
): { data: RecoveryScoreData | null; baselineStatus: BaselineStatus } {
  const baselineStatus: BaselineStatus = {
    ready: response.baseline.ready,
    daysCollected: response.baseline.daysCollected,
    daysRequired: response.baseline.daysRequired,
    message: response.baseline.message,
  };

  if (!response.recovery) {
    return { data: null, baselineStatus };
  }

  // Type assertion: We only call this for non-Lite Mode, so recovery is RecoveryScoreResponse
  const wearableData = response.recovery as RecoveryScoreResponse;

  const { trend, delta } = calculateTrend(wearableData.score, response.yesterdayScore);

  // Transform components to display format
  const components: RecoveryComponent[] = [
    {
      label: 'HRV',
      score: wearableData.components.hrv.score,
      detail: wearableData.components.hrv.vsBaseline,
      weight: wearableData.components.hrv.weight,
    },
    {
      label: 'Resting Heart Rate',
      score: wearableData.components.rhr.score,
      detail: wearableData.components.rhr.vsBaseline,
      weight: wearableData.components.rhr.weight,
    },
    {
      label: 'Sleep Quality',
      score: wearableData.components.sleepQuality.score,
      detail: formatSleepQualityDetail(wearableData.components.sleepQuality),
      weight: wearableData.components.sleepQuality.weight,
    },
    {
      label: 'Sleep Duration',
      score: wearableData.components.sleepDuration.score,
      detail: wearableData.components.sleepDuration.vsTarget,
      weight: wearableData.components.sleepDuration.weight,
    },
  ];

  // Only add respiratory rate if available
  if (wearableData.components.respiratoryRate.raw !== null) {
    components.push({
      label: 'Respiratory Rate',
      score: wearableData.components.respiratoryRate.score,
      detail: wearableData.components.respiratoryRate.vsBaseline,
      weight: wearableData.components.respiratoryRate.weight,
    });
  }

  const data: RecoveryScoreData = {
    score: wearableData.score,
    zone: wearableData.zone,
    confidence: wearableData.confidence,
    trend,
    trendDelta: delta,
    components,
    reasoning: wearableData.reasoning,
  };

  return { data, baselineStatus };
}

/**
 * Format sleep quality detail string.
 */
function formatSleepQualityDetail(sleepQuality: {
  efficiency: number | null;
  deepPct: number | null;
  remPct: number | null;
}): string {
  const parts: string[] = [];

  if (sleepQuality.efficiency !== null) {
    parts.push(`Eff: ${sleepQuality.efficiency}%`);
  }
  if (sleepQuality.deepPct !== null) {
    parts.push(`Deep: ${sleepQuality.deepPct}%`);
  }
  if (sleepQuality.remPct !== null) {
    parts.push(`REM: ${sleepQuality.remPct}%`);
  }

  return parts.length > 0 ? parts.join(', ') : 'No data';
}

/**
 * Transform CheckInApiResponse to CheckInResult.
 */
function transformCheckInData(apiResponse: CheckInApiResponse): CheckInResult {
  return {
    score: apiResponse.score,
    confidence: apiResponse.confidence,
    zone: apiResponse.zone,
    components: {
      sleepQuality: {
        rating: apiResponse.components.sleepQuality.rating as QualityRating,
        label: apiResponse.components.sleepQuality.label,
        score: apiResponse.components.sleepQuality.score,
        weight: apiResponse.components.sleepQuality.weight,
      },
      sleepDuration: {
        hours: apiResponse.components.sleepDuration.hours,
        option: apiResponse.components.sleepDuration.option as SleepHoursOption,
        score: apiResponse.components.sleepDuration.score,
        vsTarget: apiResponse.components.sleepDuration.vsTarget,
        weight: apiResponse.components.sleepDuration.weight,
      },
      energyLevel: {
        rating: apiResponse.components.energyLevel.rating as QualityRating,
        label: apiResponse.components.energyLevel.label,
        score: apiResponse.components.energyLevel.score,
        weight: apiResponse.components.energyLevel.weight,
      },
    },
    reasoning: apiResponse.reasoning,
    skipped: apiResponse.skipped,
    isLiteMode: true,
    recommendations: apiResponse.recommendations.map((rec) => ({
      type: rec.type as CheckInRecommendation['type'],
      headline: rec.headline,
      body: rec.body,
      protocols: rec.protocols,
    })),
  };
}

// =============================================================================
// HOOK
// =============================================================================

export interface UseRecoveryScoreResult {
  data: RecoveryScoreData | null;
  baselineStatus: BaselineStatus;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  /** True if user is in Lite Mode (manual check-in, no wearable) */
  isLiteMode: boolean;
  /** Transformed check-in data for Lite Mode users */
  checkInData: CheckInResult | null;
}

/**
 * Hook to fetch and manage recovery score data.
 *
 * @param userId - The user's ID (for cache invalidation)
 * @returns Recovery score data, baseline status, loading state, and refresh function
 */
export function useRecoveryScore(userId?: string): UseRecoveryScoreResult {
  const [data, setData] = useState<RecoveryScoreData | null>(null);
  const [baselineStatus, setBaselineStatus] = useState<BaselineStatus>({
    ready: false,
    daysCollected: 0,
    daysRequired: 7,
    message: 'Loading...',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [checkInData, setCheckInData] = useState<CheckInResult | null>(null);

  const fetchRecoveryScore = useCallback(async () => {
    // Guard: Ensure user is authenticated before making API call
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      console.log('[useRecoveryScore] No authenticated user, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Fetch recovery data from API
      const response = await apiRequest<RecoveryApiResponse>(
        `/api/recovery?date=${today}`
      );

      // Check if this is Lite Mode response
      const liteMode = response.isLiteMode === true;
      setIsLiteMode(liteMode);

      if (liteMode && response.recovery && 'isLiteMode' in response.recovery) {
        // Lite Mode: Transform and store check-in data
        const transformed = transformCheckInData(response.recovery as CheckInApiResponse);
        setCheckInData(transformed);
        setData(null); // No wearable recovery data
        setBaselineStatus({
          ready: true,
          daysCollected: 0,
          daysRequired: 0,
          message: response.baseline.message,
        });
      } else {
        // Wearable Mode: Transform recovery data
        setCheckInData(null);
        const { data: recoveryData, baselineStatus: status } = transformRecoveryData(response);
        setData(recoveryData);
        setBaselineStatus(status);
      }
    } catch (err) {
      console.error('[useRecoveryScore] Failed to fetch:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));

      // Set default baseline status on error
      setBaselineStatus({
        ready: false,
        daysCollected: 0,
        daysRequired: 7,
        message: 'Unable to load recovery data',
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch on mount and when userId changes
  useEffect(() => {
    void fetchRecoveryScore();
  }, [fetchRecoveryScore]);

  return {
    data,
    baselineStatus,
    loading,
    error,
    refresh: fetchRecoveryScore,
    isLiteMode,
    checkInData,
  };
}

export default useRecoveryScore;
