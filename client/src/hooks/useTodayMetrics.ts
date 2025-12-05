/**
 * useTodayMetrics Hook
 *
 * Real-time Firestore listener for today's health metrics.
 * Updates dashboard recovery score without polling.
 *
 * Reference: Phase 3 Session 6 - Real-time Sync
 */

import { useEffect, useState } from 'react';
import { doc, onSnapshot, type FirestoreError } from 'firebase/firestore';
import { getFirebaseDb, isUsingMemoryPersistenceMode } from '../services/firebase';

/**
 * Recovery zone classification.
 */
export type RecoveryZone = 'red' | 'yellow' | 'green';

/**
 * Recovery data from Firestore.
 */
export interface TodayMetricsRecovery {
  score: number;
  zone: RecoveryZone;
  confidence: number;
  reasoning: string;
  components?: {
    hrv: number | null;
    rhr: number | null;
    sleepQuality: number | null;
    sleepDuration: number | null;
  };
}

/**
 * Sleep data from Firestore.
 */
export interface TodayMetricsSleep {
  durationHours: number | null;
  efficiency: number | null;
  deepPct: number | null;
  remPct: number | null;
  bedtimeStart: string | null;
  bedtimeEnd: string | null;
}

/**
 * HRV data from Firestore.
 */
export interface TodayMetricsHrv {
  avg: number | null;
  method: 'rmssd' | 'sdnn' | 'unknown' | null;
  vsBaseline: string | null;
}

/**
 * RHR data from Firestore.
 */
export interface TodayMetricsRhr {
  avg: number | null;
  vsBaseline: string | null;
}

/**
 * Full today metrics document from Firestore.
 */
export interface TodayMetrics {
  date: string;
  userId: string;
  lastSyncedAt: string;
  recovery: TodayMetricsRecovery | null;
  sleep: TodayMetricsSleep;
  hrv: TodayMetricsHrv;
  rhr: TodayMetricsRhr;
  steps: number | null;
  activeCalories: number | null;
  dataCompleteness: number;
  wearableSource: string | null;
}

/**
 * Return type for useTodayMetrics hook.
 */
export interface UseTodayMetricsReturn {
  /** Today's metrics (null if not loaded or unavailable) */
  metrics: TodayMetrics | null;
  /** Whether the data is currently loading */
  loading: boolean;
  /** Error message if subscription failed */
  error: string | undefined;
}

/**
 * Hook for real-time today's metrics from Firestore.
 *
 * Subscribes to the todayMetrics/{userId} document and updates
 * automatically when the server pushes changes.
 *
 * @param userId - User ID to subscribe to
 * @returns { metrics, loading, error }
 *
 * @example
 * const { metrics, loading } = useTodayMetrics(userId);
 * if (metrics?.recovery) {
 *   console.log(`Recovery: ${metrics.recovery.score} (${metrics.recovery.zone})`);
 * }
 */
export function useTodayMetrics(userId?: string | null): UseTodayMetricsReturn {
  const [metrics, setMetrics] = useState<TodayMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    // No user ID - return empty state
    if (!userId) {
      setMetrics(null);
      setLoading(false);
      return;
    }

    // Memory-only mode - Firestore not available
    if (isUsingMemoryPersistenceMode()) {
      setMetrics(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);

    // Subscribe to todayMetrics/{userId} document
    const docRef = doc(getFirebaseDb(), 'todayMetrics', userId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as TodayMetrics;
          setMetrics(data);
        } else {
          // Document doesn't exist yet (no metrics synced)
          setMetrics(null);
        }
        setLoading(false);
      },
      (firestoreError: FirestoreError) => {
        console.error('[useTodayMetrics] Firestore error:', firestoreError.message);
        // Don't show error to user - just return null metrics
        setError(undefined);
        setMetrics(null);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return { metrics, loading, error };
}

/**
 * Helper to get recovery display info from metrics.
 */
export function getRecoveryDisplay(metrics: TodayMetrics | null): {
  score: number | null;
  zone: RecoveryZone | null;
  label: string;
  color: string;
} {
  if (!metrics?.recovery) {
    return {
      score: null,
      zone: null,
      label: 'No data',
      color: '#6C7688', // textMuted
    };
  }

  const { score, zone } = metrics.recovery;

  const zoneConfig = {
    red: { label: 'Take it easy', color: '#FF5A5F' },
    yellow: { label: 'Moderate day', color: '#EFBF5B' },
    green: { label: 'Ready to push', color: '#4CE1A5' },
  };

  return {
    score,
    zone,
    label: zoneConfig[zone].label,
    color: zoneConfig[zone].color,
  };
}

export default useTodayMetrics;
