/**
 * useHealthConnect Hook
 *
 * React hook wrapping the react-native-health-connect library.
 * Provides a clean interface for Health Connect integration with:
 * - Availability and SDK status checking
 * - Permission management
 * - Manual sync capability
 * - Data normalization via HealthConnectAdapter
 *
 * Mirrors the useHealthKit hook API for cross-platform consistency.
 *
 * @example
 * ```tsx
 * function HealthConnectSettings() {
 *   const {
 *     status,
 *     isAvailable,
 *     requestPermission,
 *     syncNow,
 *     lastSyncAt,
 *   } = useHealthConnect();
 *
 *   if (!isAvailable) {
 *     return <Text>Health Connect not available</Text>;
 *   }
 *
 *   return (
 *     <Button
 *       title={status === 'authorized' ? 'Sync Now' : 'Connect Health Connect'}
 *       onPress={status === 'authorized' ? syncNow : requestPermission}
 *     />
 *   );
 * }
 * ```
 *
 * @file client/src/hooks/useHealthConnect.ts
 * @author Claude Opus 4.5 (Session 50)
 * @created December 5, 2025
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  HealthConnectReading,
  HealthConnectAuthorizationStatus,
  DEFAULT_PERMISSIONS,
} from '../types/healthConnect';
import { HealthConnectAdapter } from '../services/health/HealthConnectAdapter';

// Storage keys
const STORAGE_KEY_LAST_SYNC = 'healthconnect_last_sync';
const STORAGE_KEY_PERMISSIONS_GRANTED = 'healthconnect_permissions_granted';

// Types for the hook
export interface UseHealthConnectReturn {
  /** Whether Health Connect is available on this device */
  isAvailable: boolean;
  /** Current authorization status */
  status: HealthConnectAuthorizationStatus;
  /** Whether the hook is loading */
  isLoading: boolean;
  /** Request Health Connect permissions */
  requestPermission: () => Promise<boolean>;
  /** Manually trigger a sync */
  syncNow: () => Promise<HealthConnectReading[]>;
  /** Whether a sync is in progress */
  isSyncing: boolean;
  /** Last sync timestamp */
  lastSyncAt: Date | null;
  /** Latest readings from last sync */
  latestReadings: HealthConnectReading[];
  /** Error message if any operation failed */
  error: string | null;
}

// Lazy-loaded library reference
let healthConnectLib: typeof import('react-native-health-connect') | null =
  null;

/**
 * Lazily load the Health Connect library.
 * Only loads on Android to avoid bundling issues on iOS.
 */
async function getHealthConnectLib() {
  if (healthConnectLib) return healthConnectLib;

  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    healthConnectLib = await import('react-native-health-connect');
    return healthConnectLib;
  } catch (err) {
    console.error('[useHealthConnect] Failed to load library:', err);
    return null;
  }
}

/**
 * React hook for Health Connect integration.
 * On non-Android platforms, returns safe fallback values.
 */
export function useHealthConnect(): UseHealthConnectReturn {
  // State
  const [isAvailable, setIsAvailable] = useState(false);
  const [status, setStatus] =
    useState<HealthConnectAuthorizationStatus>('notDetermined');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [latestReadings, setLatestReadings] = useState<HealthConnectReading[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  // Initialize on mount
  useEffect(() => {
    if (Platform.OS !== 'android') {
      setIsLoading(false);
      setStatus('unavailable');
      return;
    }

    const initialize = async () => {
      try {
        const lib = await getHealthConnectLib();
        if (!lib) {
          setStatus('unavailable');
          setIsLoading(false);
          return;
        }

        // Initialize the Health Connect SDK
        const isInitialized = await lib.initialize();
        if (!isInitialized) {
          setStatus('unavailable');
          setIsLoading(false);
          return;
        }

        // Check SDK availability status
        const sdkStatus = await lib.getSdkStatus();

        if (sdkStatus === lib.SdkAvailabilityStatus.SDK_UNAVAILABLE) {
          setIsAvailable(false);
          setStatus('unavailable');
        } else if (
          sdkStatus === lib.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
        ) {
          setIsAvailable(false);
          setStatus('unavailable');
          setError('Health Connect app needs to be updated');
        } else {
          setIsAvailable(true);

          // Check if permissions were previously granted
          const permissionsGranted = await AsyncStorage.getItem(
            STORAGE_KEY_PERMISSIONS_GRANTED
          );
          if (permissionsGranted === 'true') {
            // Verify permissions are still valid by attempting to get granted permissions
            try {
              const granted = await lib.getGrantedPermissions();
              if (granted && granted.length > 0) {
                setStatus('authorized');
              } else {
                setStatus('notDetermined');
                await AsyncStorage.removeItem(STORAGE_KEY_PERMISSIONS_GRANTED);
              }
            } catch {
              setStatus('notDetermined');
            }
          } else {
            setStatus('notDetermined');
          }
        }

        // Load last sync time
        const lastSync = await AsyncStorage.getItem(STORAGE_KEY_LAST_SYNC);
        if (lastSync) {
          setLastSyncAt(new Date(lastSync));
        }

        setIsLoading(false);
      } catch (err) {
        console.error('[useHealthConnect] Failed to initialize:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to initialize Health Connect'
        );
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !isAvailable) {
      return false;
    }

    setError(null);

    try {
      const lib = await getHealthConnectLib();
      if (!lib) {
        setError('Health Connect library not available');
        return false;
      }

      // Request permissions for all default record types
      const grantedPermissions = await lib.requestPermission(DEFAULT_PERMISSIONS);

      // requestPermission returns an array-like object with granted permissions
      const hasPermissions = grantedPermissions &&
        (Array.isArray(grantedPermissions) ? grantedPermissions.length > 0 : Object.keys(grantedPermissions).length > 0);

      if (hasPermissions) {
        setStatus('authorized');
        await AsyncStorage.setItem(STORAGE_KEY_PERMISSIONS_GRANTED, 'true');
        return true;
      } else {
        // Check if user has denied twice (permanent lockout)
        // We can't detect this directly, so we just mark as denied
        setStatus('denied');
        return false;
      }
    } catch (err) {
      console.error('[useHealthConnect] Permission request failed:', err);
      setError(
        err instanceof Error ? err.message : 'Permission request failed'
      );
      setStatus('denied');
      return false;
    }
  }, [isAvailable]);

  // Manual sync
  const syncNow = useCallback(async (): Promise<HealthConnectReading[]> => {
    if (Platform.OS !== 'android' || !isAvailable || status !== 'authorized') {
      return [];
    }

    setError(null);
    setIsSyncing(true);

    try {
      const lib = await getHealthConnectLib();
      if (!lib) {
        setIsSyncing(false);
        return [];
      }

      const now = new Date();
      // Query data from the last 24 hours
      const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const timeRangeFilter = {
        operator: 'between' as const,
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
      };

      const allReadings: HealthConnectReading[] = [];

      // Type assertion helper for readRecords API (handles type mismatch between versions)
      type ReadRecordsParams = Parameters<typeof lib.readRecords>;
      const readRecordsCompat = async (recordType: string, options: { timeRangeFilter: typeof timeRangeFilter }) => {
        // The library accepts (recordType, options) but types may vary between versions
        return lib.readRecords(recordType as ReadRecordsParams[0], options as ReadRecordsParams[1]);
      };

      // Fetch HRV data
      try {
        const hrvRecords = await readRecordsCompat('HeartRateVariabilityRmssd', {
          timeRangeFilter,
        });
        if (hrvRecords?.records) {
          const converted = HealthConnectAdapter.convertHrvRecords(
            hrvRecords.records as any[]
          );
          allReadings.push(...converted);
        }
      } catch (err) {
        console.warn('[useHealthConnect] Failed to read HRV:', err);
      }

      // Fetch RHR data
      try {
        const rhrRecords = await readRecordsCompat('RestingHeartRate', {
          timeRangeFilter,
        });
        if (rhrRecords?.records) {
          const converted = HealthConnectAdapter.convertRhrRecords(
            rhrRecords.records as any[]
          );
          allReadings.push(...converted);
        }
      } catch (err) {
        console.warn('[useHealthConnect] Failed to read RHR:', err);
      }

      // Fetch Sleep data
      try {
        const sleepRecords = await readRecordsCompat('SleepSession', {
          timeRangeFilter,
        });
        if (sleepRecords?.records) {
          const converted = HealthConnectAdapter.convertSleepRecords(
            sleepRecords.records as any[]
          );
          allReadings.push(...converted);
        }
      } catch (err) {
        console.warn('[useHealthConnect] Failed to read Sleep:', err);
      }

      // Fetch Steps data
      try {
        const stepsRecords = await readRecordsCompat('Steps', {
          timeRangeFilter,
        });
        if (stepsRecords?.records) {
          const converted = HealthConnectAdapter.convertStepsRecords(
            stepsRecords.records as any[]
          );
          allReadings.push(...converted);
        }
      } catch (err) {
        console.warn('[useHealthConnect] Failed to read Steps:', err);
      }

      // Fetch Active Calories data
      try {
        const caloriesRecords = await readRecordsCompat('ActiveCaloriesBurned', {
          timeRangeFilter,
        });
        if (caloriesRecords?.records) {
          const converted = HealthConnectAdapter.convertActiveCaloriesRecords(
            caloriesRecords.records as any[]
          );
          allReadings.push(...converted);
        }
      } catch (err) {
        console.warn('[useHealthConnect] Failed to read Calories:', err);
      }

      // Update state
      setLastSyncAt(now);
      setLatestReadings(allReadings);
      await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, now.toISOString());

      setIsSyncing(false);
      return allReadings;
    } catch (err) {
      console.error('[useHealthConnect] Sync failed:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
      setIsSyncing(false);
      return [];
    }
  }, [isAvailable, status]);

  return {
    isAvailable,
    status,
    isLoading,
    requestPermission,
    syncNow,
    isSyncing,
    lastSyncAt,
    latestReadings,
    error,
  };
}

export default useHealthConnect;
