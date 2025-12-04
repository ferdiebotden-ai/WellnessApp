/**
 * useHealthKit Hook
 *
 * React hook wrapping the native expo-healthkit-observer module.
 * Provides a clean interface for HealthKit integration with:
 * - Authorization status tracking
 * - Background delivery management
 * - Manual sync capability
 * - Real-time data update subscription
 *
 * @example
 * ```tsx
 * function HealthKitSettings() {
 *   const {
 *     status,
 *     isAvailable,
 *     requestPermission,
 *     enableBackgroundDelivery,
 *     syncNow,
 *     lastSyncAt,
 *   } = useHealthKit();
 *
 *   if (!isAvailable) {
 *     return <Text>HealthKit not available</Text>;
 *   }
 *
 *   return (
 *     <Button
 *       title={status === 'authorized' ? 'Sync Now' : 'Connect HealthKit'}
 *       onPress={status === 'authorized' ? syncNow : requestPermission}
 *     />
 *   );
 * }
 * ```
 *
 * @file client/src/hooks/useHealthKit.ts
 * @author Claude Opus 4.5 (Session 37)
 * @created December 4, 2025
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import types - the actual module will only load on iOS
import type {
  HealthKitAuthorizationStatus,
  HealthKitReading,
  HealthKitDataUpdateEvent,
} from '../../../modules/expo-healthkit-observer/src/types';

// Storage keys
const STORAGE_KEY_BACKGROUND_ENABLED = 'healthkit_background_enabled';
const STORAGE_KEY_LAST_SYNC = 'healthkit_last_sync';

// Types for the hook
export interface UseHealthKitReturn {
  /** Whether HealthKit is available on this device */
  isAvailable: boolean;
  /** Current authorization status */
  status: HealthKitAuthorizationStatus;
  /** Whether the hook is loading */
  isLoading: boolean;
  /** Request HealthKit authorization */
  requestPermission: () => Promise<boolean>;
  /** Enable background delivery for automatic sync */
  enableBackgroundDelivery: () => Promise<boolean>;
  /** Disable background delivery */
  disableBackgroundDelivery: () => Promise<void>;
  /** Whether background delivery is enabled */
  isBackgroundEnabled: boolean;
  /** Manually trigger a sync */
  syncNow: () => Promise<HealthKitReading[]>;
  /** Whether a sync is in progress */
  isSyncing: boolean;
  /** Last sync timestamp */
  lastSyncAt: Date | null;
  /** Latest readings from last sync or background update */
  latestReadings: HealthKitReading[];
  /** Error message if any operation failed */
  error: string | null;
}

/**
 * React hook for HealthKit integration.
 * On non-iOS platforms, returns safe fallback values.
 */
export function useHealthKit(): UseHealthKitReturn {
  // State
  const [isAvailable, setIsAvailable] = useState(false);
  const [status, setStatus] = useState<HealthKitAuthorizationStatus>('notDetermined');
  const [isLoading, setIsLoading] = useState(true);
  const [isBackgroundEnabled, setIsBackgroundEnabled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [latestReadings, setLatestReadings] = useState<HealthKitReading[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs for module and subscription
  const moduleRef = useRef<typeof import('../../../modules/expo-healthkit-observer/src') | null>(null);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);

  // Load module and initialize
  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setIsLoading(false);
      setStatus('unavailable');
      return;
    }

    const initialize = async () => {
      try {
        // Dynamically import the module
        const ExpoHealthKitObserver = await import('../../../modules/expo-healthkit-observer/src');
        moduleRef.current = ExpoHealthKitObserver;

        // Check availability
        const available = ExpoHealthKitObserver.isAvailable();
        setIsAvailable(available);

        if (!available) {
          setStatus('unavailable');
          setIsLoading(false);
          return;
        }

        // Get authorization status
        const authStatus = ExpoHealthKitObserver.getAuthorizationStatus();
        setStatus(authStatus);

        // Load stored preferences
        const [bgEnabled, lastSync] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_BACKGROUND_ENABLED),
          AsyncStorage.getItem(STORAGE_KEY_LAST_SYNC),
        ]);

        setIsBackgroundEnabled(bgEnabled === 'true');
        if (lastSync) {
          setLastSyncAt(new Date(lastSync));
        }

        // Subscribe to data updates
        subscriptionRef.current = ExpoHealthKitObserver.addDataUpdateListener(
          (data: HealthKitDataUpdateEvent) => {
            setLatestReadings((prev) => [data, ...prev.slice(0, 99)]);
          }
        );

        setIsLoading(false);
      } catch (err) {
        console.error('[useHealthKit] Failed to initialize:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize HealthKit');
        setIsLoading(false);
      }
    };

    initialize();

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!moduleRef.current || !isAvailable) {
      return false;
    }

    setError(null);

    try {
      const granted = await moduleRef.current.requestAuthorization();

      if (granted) {
        setStatus('authorized');
      } else {
        setStatus('denied');
      }

      return granted;
    } catch (err) {
      console.error('[useHealthKit] Authorization failed:', err);
      setError(err instanceof Error ? err.message : 'Authorization failed');
      setStatus('denied');
      return false;
    }
  }, [isAvailable]);

  // Enable background delivery
  const enableBackgroundDelivery = useCallback(async (): Promise<boolean> => {
    if (!moduleRef.current || !isAvailable || status !== 'authorized') {
      return false;
    }

    setError(null);

    try {
      const { DEFAULT_OBSERVABLE_TYPES, UPDATE_FREQUENCIES } = moduleRef.current;

      const success = await moduleRef.current.startObserving(
        DEFAULT_OBSERVABLE_TYPES,
        UPDATE_FREQUENCIES.IMMEDIATE
      );

      if (success) {
        setIsBackgroundEnabled(true);
        await AsyncStorage.setItem(STORAGE_KEY_BACKGROUND_ENABLED, 'true');
      }

      return success;
    } catch (err) {
      console.error('[useHealthKit] Failed to enable background delivery:', err);
      setError(err instanceof Error ? err.message : 'Failed to enable background delivery');
      return false;
    }
  }, [isAvailable, status]);

  // Disable background delivery
  const disableBackgroundDelivery = useCallback(async (): Promise<void> => {
    if (!moduleRef.current) {
      return;
    }

    try {
      moduleRef.current.stopObserving();
      setIsBackgroundEnabled(false);
      await AsyncStorage.setItem(STORAGE_KEY_BACKGROUND_ENABLED, 'false');
    } catch (err) {
      console.error('[useHealthKit] Failed to disable background delivery:', err);
    }
  }, []);

  // Manual sync
  const syncNow = useCallback(async (): Promise<HealthKitReading[]> => {
    if (!moduleRef.current || !isAvailable || status !== 'authorized') {
      return [];
    }

    setError(null);
    setIsSyncing(true);

    try {
      const readings = await moduleRef.current.syncNow();

      const now = new Date();
      setLastSyncAt(now);
      setLatestReadings(readings);
      await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, now.toISOString());

      setIsSyncing(false);
      return readings;
    } catch (err) {
      console.error('[useHealthKit] Sync failed:', err);
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
    enableBackgroundDelivery,
    disableBackgroundDelivery,
    isBackgroundEnabled,
    syncNow,
    isSyncing,
    lastSyncAt,
    latestReadings,
    error,
  };
}

export default useHealthKit;
