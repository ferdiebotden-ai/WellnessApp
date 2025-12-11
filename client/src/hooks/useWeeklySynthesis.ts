import { useState, useEffect, useCallback } from 'react';
import { fetchWeeklySynthesis, type WeeklySynthesis, type WeeklySynthesisMetrics } from '../services/api';

interface UseWeeklySynthesisResult {
  /** Whether a synthesis exists for this user */
  hasSynthesis: boolean;
  /** The synthesis data (null if no synthesis exists) */
  synthesis: WeeklySynthesis | null;
  /** Number of days the user has tracked protocols */
  daysTracked: number;
  /** Minimum days required before synthesis can be generated */
  minDaysRequired: number;
  /** Whether the data is currently loading */
  loading: boolean;
  /** Error if the request failed */
  error: Error | null;
  /** Reload the data */
  reload: () => Promise<void>;
}

/**
 * Hook to fetch and manage weekly synthesis narrative.
 * Returns the latest weekly synthesis with 5 sections (Win, Watch, Pattern, Trajectory, Experiment).
 *
 * Per PRD Section 4.5 - Weekly Synthesis
 */
export const useWeeklySynthesis = (): UseWeeklySynthesisResult => {
  const [hasSynthesis, setHasSynthesis] = useState(false);
  const [synthesis, setSynthesis] = useState<WeeklySynthesis | null>(null);
  const [daysTracked, setDaysTracked] = useState(0);
  const [minDaysRequired, setMinDaysRequired] = useState(4);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWeeklySynthesis();
      setHasSynthesis(response.has_synthesis);
      setSynthesis(response.synthesis);
      setDaysTracked(response.days_tracked);
      setMinDaysRequired(response.min_days_required);
    } catch (err) {
      console.error('Failed to load weekly synthesis:', err);
      setError(err instanceof Error ? err : new Error('Failed to load weekly synthesis'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return {
    hasSynthesis,
    synthesis,
    daysTracked,
    minDaysRequired,
    loading,
    error,
    reload: loadData,
  };
};

// Re-export types for convenience
export type { WeeklySynthesis, WeeklySynthesisMetrics };
