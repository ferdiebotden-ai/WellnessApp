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

interface RecoveryApiResponse {
  recovery: RecoveryScoreResponse | null;
  baseline: BaselineStatusResponse;
  yesterdayScore?: number | null;
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

  const token = await currentUser.getIdToken();

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
 * Transform API response to component-friendly format.
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

  const { trend, delta } = calculateTrend(response.recovery.score, response.yesterdayScore);

  // Transform components to display format
  const components: RecoveryComponent[] = [
    {
      label: 'HRV',
      score: response.recovery.components.hrv.score,
      detail: response.recovery.components.hrv.vsBaseline,
      weight: response.recovery.components.hrv.weight,
    },
    {
      label: 'Resting Heart Rate',
      score: response.recovery.components.rhr.score,
      detail: response.recovery.components.rhr.vsBaseline,
      weight: response.recovery.components.rhr.weight,
    },
    {
      label: 'Sleep Quality',
      score: response.recovery.components.sleepQuality.score,
      detail: formatSleepQualityDetail(response.recovery.components.sleepQuality),
      weight: response.recovery.components.sleepQuality.weight,
    },
    {
      label: 'Sleep Duration',
      score: response.recovery.components.sleepDuration.score,
      detail: response.recovery.components.sleepDuration.vsTarget,
      weight: response.recovery.components.sleepDuration.weight,
    },
  ];

  // Only add respiratory rate if available
  if (response.recovery.components.respiratoryRate.raw !== null) {
    components.push({
      label: 'Respiratory Rate',
      score: response.recovery.components.respiratoryRate.score,
      detail: response.recovery.components.respiratoryRate.vsBaseline,
      weight: response.recovery.components.respiratoryRate.weight,
    });
  }

  const data: RecoveryScoreData = {
    score: response.recovery.score,
    zone: response.recovery.zone,
    confidence: response.recovery.confidence,
    trend,
    trendDelta: delta,
    components,
    reasoning: response.recovery.reasoning,
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

// =============================================================================
// HOOK
// =============================================================================

export interface UseRecoveryScoreResult {
  data: RecoveryScoreData | null;
  baselineStatus: BaselineStatus;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
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

  const fetchRecoveryScore = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Fetch recovery data from API
      const response = await apiRequest<RecoveryApiResponse>(
        `/api/recovery?date=${today}`
      );

      const { data: recoveryData, baselineStatus: status } = transformRecoveryData(response);

      setData(recoveryData);
      setBaselineStatus(status);
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
  };
}

export default useRecoveryScore;
