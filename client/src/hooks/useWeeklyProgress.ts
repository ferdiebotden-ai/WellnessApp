/**
 * useWeeklyProgress
 *
 * Hook to fetch and calculate 7-day protocol adherence.
 * Returns top protocols sorted by completion count.
 *
 * @file client/src/hooks/useWeeklyProgress.ts
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { getFirebaseDb, isUsingMemoryPersistenceMode } from '../services/firebase';
import type { ProtocolProgress } from '../components/home/WeeklyProgressCard';

interface ProtocolLogDocument {
  protocol_id?: string;
  protocol_name?: string;
  completed_at?: Timestamp | Date | string | null;
  status?: string;
}

interface UseWeeklyProgressResult {
  /** Array of protocol progress sorted by completion count (descending) */
  protocols: ProtocolProgress[];
  /** Whether data is loading */
  loading: boolean;
  /** Error message if fetch failed */
  error?: string;
  /** Refresh the data */
  refresh: () => void;
}

/**
 * Parse a timestamp to Date
 */
const parseTimestamp = (value?: Timestamp | Date | string | null): Date | null => {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Get the start of 7 days ago (midnight)
 */
const getSevenDaysAgo = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const useWeeklyProgress = (userId?: string | null): UseWeeklyProgressResult => {
  const [protocols, setProtocols] = useState<ProtocolProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!userId) {
      setProtocols([]);
      setLoading(false);
      return;
    }

    // Short-circuit if Firestore is unavailable
    if (isUsingMemoryPersistenceMode()) {
      setProtocols([]);
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      setLoading(true);
      setError(undefined);

      try {
        const db = getFirebaseDb();
        const sevenDaysAgo = getSevenDaysAgo();

        // Query protocol_logs for the last 7 days
        // Note: Collection path may be 'protocol_logs' or 'users/{userId}/protocol_logs'
        // depending on schema. Adjust as needed.
        const logsRef = collection(db, 'users', userId, 'protocol_logs');
        const logsQuery = query(
          logsRef,
          where('completed_at', '>=', Timestamp.fromDate(sevenDaysAgo)),
          orderBy('completed_at', 'desc')
        );

        const snapshot = await getDocs(logsQuery);

        // Group by protocol and count completions
        const protocolMap = new Map<string, { name: string; days: Set<string> }>();

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as ProtocolLogDocument;
          const protocolId = data.protocol_id || doc.id;
          const protocolName = data.protocol_name || protocolId;
          const completedAt = parseTimestamp(data.completed_at);

          if (completedAt && data.status === 'completed') {
            // Use date string as key to count unique days
            const dateKey = completedAt.toISOString().split('T')[0];

            if (!protocolMap.has(protocolId)) {
              protocolMap.set(protocolId, { name: protocolName, days: new Set() });
            }
            protocolMap.get(protocolId)!.days.add(dateKey);
          }
        });

        // Convert to array and sort by completion count
        const progressArray: ProtocolProgress[] = Array.from(protocolMap.entries())
          .map(([id, { name, days }]) => ({
            id,
            name,
            completedDays: days.size,
            totalDays: 7,
          }))
          .sort((a, b) => b.completedDays - a.completedDays);

        setProtocols(progressArray);
      } catch (fetchError) {
        console.error('[useWeeklyProgress] Failed to fetch:', fetchError);
        // Don't show error to user, just return empty
        setProtocols([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [userId, refreshKey]);

  return { protocols, loading, error, refresh };
};

/**
 * Mock data for development/testing when Firestore isn't available
 */
export const useMockWeeklyProgress = (): UseWeeklyProgressResult => {
  const protocols = useMemo<ProtocolProgress[]>(
    () => [
      { id: 'morning_light', name: 'Morning Light', completedDays: 5, totalDays: 7 },
      { id: 'cold_exposure', name: 'Cold Exposure', completedDays: 3, totalDays: 7 },
      { id: 'breathwork', name: 'Breathwork', completedDays: 4, totalDays: 7 },
    ],
    []
  );

  return {
    protocols,
    loading: false,
    error: undefined,
    refresh: () => {},
  };
};

export default useWeeklyProgress;
