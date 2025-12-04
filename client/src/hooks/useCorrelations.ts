import { useState, useEffect, useCallback } from 'react';
import { fetchCorrelations } from '../services/api';
import type { Correlation, CorrelationsResponse } from '../types/correlations';

interface UseCorrelationsResult {
  correlations: Correlation[];
  daysTracked: number;
  minDaysRequired: number;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

/**
 * Hook to fetch and manage protocol-outcome correlations.
 * Returns correlations from the most recent weekly synthesis.
 */
export const useCorrelations = (): UseCorrelationsResult => {
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [daysTracked, setDaysTracked] = useState(0);
  const [minDaysRequired, setMinDaysRequired] = useState(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response: CorrelationsResponse = await fetchCorrelations();
      setCorrelations(response.correlations);
      setDaysTracked(response.days_tracked);
      setMinDaysRequired(response.min_days_required);
    } catch (err) {
      console.error('Failed to load correlations:', err);
      setError(err instanceof Error ? err : new Error('Failed to load correlations'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return {
    correlations,
    daysTracked,
    minDaysRequired,
    loading,
    error,
    reload: loadData,
  };
};
