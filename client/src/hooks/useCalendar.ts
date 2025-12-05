/**
 * useCalendar Hook for Apex OS
 *
 * Manages calendar integration state, permissions, and sync operations.
 * Provides a clean interface for UI components to interact with calendar data.
 *
 * @file client/src/hooks/useCalendar.ts
 * @author Claude Opus 4.5 (Session 43)
 * @created December 5, 2025
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getCalendarService,
  CalendarService,
} from '../services/calendar/CalendarService';
import {
  CalendarProvider,
  MeetingLoadMetrics,
  CalendarIntegrationStatus,
} from '../services/calendar/types';

// =============================================================================
// TYPES
// =============================================================================

export interface UseCalendarReturn {
  // Availability
  isAvailable: boolean;
  isLoading: boolean;

  // Permission
  permissionStatus: 'granted' | 'denied' | 'undetermined' | 'checking';
  requestPermission: () => Promise<boolean>;

  // Connection state
  isConnected: boolean;
  provider: CalendarProvider | null;
  lastSyncAt: Date | null;
  integrations: CalendarIntegrationStatus['integrations'];

  // Sync
  syncNow: (provider?: CalendarProvider) => Promise<boolean>;
  isSyncing: boolean;

  // Data
  todayMetrics: MeetingLoadMetrics | null;
  isHeavyDay: boolean;
  isOverload: boolean;

  // Disconnect
  disconnect: (provider?: CalendarProvider) => Promise<boolean>;

  // Error
  error: string | null;
  clearError: () => void;

  // Refresh
  refresh: () => Promise<void>;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useCalendar(): UseCalendarReturn {
  const [service] = useState<CalendarService>(() => getCalendarService());

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Availability
  const [isAvailable, setIsAvailable] = useState(false);

  // Permission
  const [permissionStatus, setPermissionStatus] = useState<
    'granted' | 'denied' | 'undetermined' | 'checking'
  >('checking');

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<CalendarProvider | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [integrations, setIntegrations] = useState<
    CalendarIntegrationStatus['integrations']
  >([]);

  // Data
  const [todayMetrics, setTodayMetrics] = useState<MeetingLoadMetrics | null>(
    null
  );

  // Error
  const [error, setError] = useState<string | null>(null);

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        // Check availability
        const available = await service.isAvailable();
        setIsAvailable(available);

        if (available) {
          // Check permission
          const permission = await service.getPermissionStatus();
          setPermissionStatus(permission);
        } else {
          setPermissionStatus('denied');
        }

        // Fetch status from server
        const status = await service.getStatus();
        setIsConnected(status.isConnected);
        setProvider(status.provider);
        setLastSyncAt(status.lastSyncAt ? new Date(status.lastSyncAt) : null);
        setIntegrations(status.integrations);

        // Fetch today's metrics if connected
        if (status.isConnected) {
          const metrics = await service.getTodayMetrics();
          setTodayMetrics(metrics);
        }
      } catch (err) {
        console.error('Calendar init error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [service]);

  // ===========================================================================
  // PERMISSION
  // ===========================================================================

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await service.requestPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      return granted;
    } catch (err) {
      console.error('Permission request error:', err);
      setError(err instanceof Error ? err.message : 'Permission request failed');
      return false;
    }
  }, [service]);

  // ===========================================================================
  // SYNC
  // ===========================================================================

  const syncNow = useCallback(
    async (syncProvider?: CalendarProvider): Promise<boolean> => {
      setIsSyncing(true);
      setError(null);

      try {
        const targetProvider = syncProvider || provider || 'device';

        const result =
          targetProvider === 'device'
            ? await service.syncDeviceCalendar()
            : await service.syncGoogleCalendar();

        if (result.success && result.metrics) {
          setTodayMetrics(result.metrics);
          setIsConnected(true);
          setProvider(targetProvider);
          setLastSyncAt(new Date());
        } else {
          setError(result.error || 'Sync failed');
        }

        return result.success;
      } catch (err) {
        console.error('Sync error:', err);
        setError(err instanceof Error ? err.message : 'Sync failed');
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [service, provider]
  );

  // ===========================================================================
  // DISCONNECT
  // ===========================================================================

  const disconnect = useCallback(
    async (disconnectProvider?: CalendarProvider): Promise<boolean> => {
      try {
        const success = await service.disconnect(disconnectProvider);

        if (success) {
          if (!disconnectProvider) {
            // Disconnected all
            setIsConnected(false);
            setProvider(null);
            setLastSyncAt(null);
            setIntegrations([]);
            setTodayMetrics(null);
          } else {
            // Refresh status
            const status = await service.getStatus();
            setIsConnected(status.isConnected);
            setProvider(status.provider);
            setIntegrations(status.integrations);
          }
        }

        return success;
      } catch (err) {
        console.error('Disconnect error:', err);
        setError(err instanceof Error ? err.message : 'Disconnect failed');
        return false;
      }
    },
    [service]
  );

  // ===========================================================================
  // REFRESH
  // ===========================================================================

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Refresh status
      const status = await service.getStatus();
      setIsConnected(status.isConnected);
      setProvider(status.provider);
      setLastSyncAt(status.lastSyncAt ? new Date(status.lastSyncAt) : null);
      setIntegrations(status.integrations);

      // Refresh metrics
      if (status.isConnected) {
        const metrics = await service.getTodayMetrics();
        setTodayMetrics(metrics);
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ===========================================================================
  // DERIVED VALUES
  // ===========================================================================

  const isHeavyDay = todayMetrics?.heavyDay ?? false;
  const isOverload = todayMetrics?.overload ?? false;

  // ===========================================================================
  // RETURN
  // ===========================================================================

  return {
    // Availability
    isAvailable,
    isLoading,

    // Permission
    permissionStatus,
    requestPermission,

    // Connection state
    isConnected,
    provider,
    lastSyncAt,
    integrations,

    // Sync
    syncNow,
    isSyncing,

    // Data
    todayMetrics,
    isHeavyDay,
    isOverload,

    // Disconnect
    disconnect,

    // Error
    error,
    clearError,

    // Refresh
    refresh,
  };
}

export default useCalendar;
