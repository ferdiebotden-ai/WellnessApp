/**
 * useDataSourcePreference Hook
 *
 * Manages user preference for preferred wearable data source.
 * When multiple devices provide data for the same metric,
 * this preference determines which source takes priority.
 *
 * @file client/src/hooks/useDataSourcePreference.ts
 * @author Claude Opus 4.5 (Session 40)
 * @created December 4, 2025
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =============================================================================
// TYPES
// =============================================================================

export type DataSourceOption = 'latest' | 'apple_health' | 'oura' | 'whoop';

export interface DataSourcePreference {
  preferredSource: DataSourceOption;
  updatedAt: string;
}

const STORAGE_KEY = '@apex_data_source_preference';

const DEFAULT_PREFERENCE: DataSourcePreference = {
  preferredSource: 'latest',
  updatedAt: new Date().toISOString(),
};

// Human-readable labels for UI
export const DATA_SOURCE_LABELS: Record<DataSourceOption, string> = {
  latest: 'Latest Sync',
  apple_health: 'Apple Health',
  oura: 'Oura Ring',
  whoop: 'WHOOP',
};

export const DATA_SOURCE_DESCRIPTIONS: Record<DataSourceOption, string> = {
  latest: 'Use whichever device synced most recently',
  apple_health: 'Always prefer Apple Watch/iPhone data',
  oura: 'Always prefer Oura Ring data',
  whoop: 'Always prefer WHOOP data',
};

// =============================================================================
// HOOK
// =============================================================================

export interface UseDataSourcePreferenceResult {
  preference: DataSourceOption;
  loading: boolean;
  error: Error | null;
  setPreference: (source: DataSourceOption) => Promise<void>;
}

export function useDataSourcePreference(): UseDataSourcePreferenceResult {
  const [preference, setPreferenceState] = useState<DataSourceOption>('latest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: DataSourcePreference = JSON.parse(stored);
          setPreferenceState(parsed.preferredSource);
        }
      } catch (err) {
        console.error('[useDataSourcePreference] Failed to load:', err);
        setError(err instanceof Error ? err : new Error('Failed to load preference'));
      } finally {
        setLoading(false);
      }
    };

    void loadPreference();
  }, []);

  const setPreference = useCallback(async (source: DataSourceOption) => {
    try {
      const preference: DataSourcePreference = {
        preferredSource: source,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
      setPreferenceState(source);
      setError(null);
    } catch (err) {
      console.error('[useDataSourcePreference] Failed to save:', err);
      setError(err instanceof Error ? err : new Error('Failed to save preference'));
      throw err;
    }
  }, []);

  return {
    preference,
    loading,
    error,
    setPreference,
  };
}

export default useDataSourcePreference;
