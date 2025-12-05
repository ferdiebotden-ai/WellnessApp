/**
 * useCalendar Hook Unit Tests
 *
 * Tests for the calendar integration React hook.
 *
 * @file client/src/hooks/useCalendar.test.ts
 * @author Claude Opus 4.5 (Session 43)
 * @created December 5, 2025
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCalendar } from './useCalendar';
import { getCalendarService } from '../services/calendar/CalendarService';

// Mock the CalendarService
jest.mock('../services/calendar/CalendarService', () => ({
  getCalendarService: jest.fn(),
  CalendarService: jest.fn(),
}));

describe('useCalendar', () => {
  const mockService = {
    isAvailable: jest.fn(),
    getPermissionStatus: jest.fn(),
    requestPermission: jest.fn(),
    getStatus: jest.fn(),
    getTodayMetrics: jest.fn(),
    syncDeviceCalendar: jest.fn(),
    syncGoogleCalendar: jest.fn(),
    disconnect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getCalendarService as jest.Mock).mockReturnValue(mockService);

    // Default mock implementations
    mockService.isAvailable.mockResolvedValue(true);
    mockService.getPermissionStatus.mockResolvedValue('granted');
    mockService.getStatus.mockResolvedValue({
      isConnected: false,
      provider: null,
      lastSyncAt: null,
      integrations: [],
    });
    mockService.getTodayMetrics.mockResolvedValue(null);
  });

  // ===========================================================================
  // INITIALIZATION TESTS
  // ===========================================================================

  describe('initialization', () => {
    it('initializes with loading state', () => {
      const { result } = renderHook(() => useCalendar());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.permissionStatus).toBe('checking');
    });

    it('loads availability and permission status on mount', async () => {
      mockService.isAvailable.mockResolvedValue(true);
      mockService.getPermissionStatus.mockResolvedValue('granted');

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAvailable).toBe(true);
      expect(result.current.permissionStatus).toBe('granted');
    });

    it('sets unavailable state when calendar not available', async () => {
      mockService.isAvailable.mockResolvedValue(false);

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAvailable).toBe(false);
      expect(result.current.permissionStatus).toBe('denied');
    });

    it('loads connected status from server', async () => {
      mockService.getStatus.mockResolvedValue({
        isConnected: true,
        provider: 'device',
        lastSyncAt: '2023-01-01T12:00:00.000Z',
        integrations: [
          {
            provider: 'device',
            lastSyncStatus: 'success',
            lastSyncAt: '2023-01-01T12:00:00.000Z',
            lastSyncError: null,
          },
        ],
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.provider).toBe('device');
      expect(result.current.lastSyncAt).toBeInstanceOf(Date);
    });

    it('loads today metrics when connected', async () => {
      const mockMetrics = {
        date: '2023-01-01',
        totalHours: 4,
        meetingCount: 3,
        backToBackCount: 1,
        density: 0.44,
        heavyDay: true,
        overload: false,
        calculatedAt: '2023-01-01T12:00:00.000Z',
      };

      mockService.getStatus.mockResolvedValue({
        isConnected: true,
        provider: 'device',
        lastSyncAt: '2023-01-01T12:00:00.000Z',
        integrations: [],
      });
      mockService.getTodayMetrics.mockResolvedValue(mockMetrics);

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.todayMetrics).toEqual(mockMetrics);
      expect(result.current.isHeavyDay).toBe(true);
      expect(result.current.isOverload).toBe(false);
    });
  });

  // ===========================================================================
  // PERMISSION TESTS
  // ===========================================================================

  describe('requestPermission', () => {
    it('requests permission and updates state', async () => {
      mockService.requestPermission.mockResolvedValue(true);

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let granted: boolean;
      await act(async () => {
        granted = await result.current.requestPermission();
      });

      expect(granted!).toBe(true);
      expect(result.current.permissionStatus).toBe('granted');
    });

    it('handles permission denial', async () => {
      mockService.requestPermission.mockResolvedValue(false);

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let granted: boolean;
      await act(async () => {
        granted = await result.current.requestPermission();
      });

      expect(granted!).toBe(false);
      expect(result.current.permissionStatus).toBe('denied');
    });

    it('sets error on permission request failure', async () => {
      mockService.requestPermission.mockRejectedValue(new Error('Permission error'));

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  // ===========================================================================
  // SYNC TESTS
  // ===========================================================================

  describe('syncNow', () => {
    beforeEach(() => {
      mockService.getStatus.mockResolvedValue({
        isConnected: true,
        provider: 'device',
        lastSyncAt: null,
        integrations: [],
      });
    });

    it('syncs device calendar and updates state', async () => {
      const mockMetrics = {
        date: '2023-01-01',
        totalHours: 5,
        meetingCount: 4,
        backToBackCount: 2,
        density: 0.55,
        heavyDay: true,
        overload: false,
        calculatedAt: '2023-01-01T12:00:00.000Z',
      };

      mockService.syncDeviceCalendar.mockResolvedValue({
        success: true,
        metrics: mockMetrics,
        mvdShouldActivate: true,
        error: null,
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.syncNow('device');
      });

      expect(success!).toBe(true);
      expect(result.current.todayMetrics).toEqual(mockMetrics);
      expect(result.current.isConnected).toBe(true);
      expect(result.current.provider).toBe('device');
    });

    it('sets syncing state during sync', async () => {
      mockService.syncDeviceCalendar.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          success: true,
          metrics: null,
          mvdShouldActivate: false,
          error: null,
        }), 100))
      );

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start sync
      act(() => {
        result.current.syncNow('device');
      });

      expect(result.current.isSyncing).toBe(true);

      // Wait for sync to complete
      await waitFor(() => {
        expect(result.current.isSyncing).toBe(false);
      });
    });

    it('handles sync failure with error', async () => {
      mockService.syncDeviceCalendar.mockResolvedValue({
        success: false,
        metrics: null,
        mvdShouldActivate: false,
        error: 'Sync failed',
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.syncNow('device');
      });

      expect(result.current.error).toBe('Sync failed');
    });

    it('uses current provider when no provider specified', async () => {
      mockService.syncDeviceCalendar.mockResolvedValue({
        success: true,
        metrics: null,
        mvdShouldActivate: false,
        error: null,
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.syncNow();
      });

      // Should default to device when no provider set
      expect(mockService.syncDeviceCalendar).toHaveBeenCalled();
    });

    it('syncs Google Calendar when provider is google_calendar', async () => {
      mockService.getStatus.mockResolvedValue({
        isConnected: true,
        provider: 'google_calendar',
        lastSyncAt: null,
        integrations: [],
      });
      mockService.syncGoogleCalendar.mockResolvedValue({
        success: true,
        metrics: null,
        mvdShouldActivate: false,
        error: null,
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.syncNow('google_calendar');
      });

      expect(mockService.syncGoogleCalendar).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // DISCONNECT TESTS
  // ===========================================================================

  describe('disconnect', () => {
    beforeEach(() => {
      mockService.getStatus.mockResolvedValue({
        isConnected: true,
        provider: 'device',
        lastSyncAt: '2023-01-01T12:00:00.000Z',
        integrations: [
          {
            provider: 'device',
            lastSyncStatus: 'success',
            lastSyncAt: '2023-01-01T12:00:00.000Z',
            lastSyncError: null,
          },
        ],
      });
    });

    it('disconnects and clears state', async () => {
      mockService.disconnect.mockResolvedValue(true);

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.provider).toBeNull();
      expect(result.current.lastSyncAt).toBeNull();
      expect(result.current.todayMetrics).toBeNull();
    });

    it('disconnects specific provider and refreshes status', async () => {
      mockService.disconnect.mockResolvedValue(true);
      mockService.getStatus.mockResolvedValueOnce({
        isConnected: true,
        provider: 'device',
        lastSyncAt: '2023-01-01T12:00:00.000Z',
        integrations: [
          {
            provider: 'device',
            lastSyncStatus: 'success',
            lastSyncAt: '2023-01-01T12:00:00.000Z',
            lastSyncError: null,
          },
        ],
      }).mockResolvedValueOnce({
        isConnected: false,
        provider: null,
        lastSyncAt: null,
        integrations: [],
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.disconnect('device');
      });

      expect(mockService.getStatus).toHaveBeenCalledTimes(2);
    });

    it('handles disconnect failure', async () => {
      mockService.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  // ===========================================================================
  // ERROR HANDLING TESTS
  // ===========================================================================

  describe('error handling', () => {
    it('sets error on initialization failure', async () => {
      mockService.isAvailable.mockRejectedValue(new Error('Init error'));

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('clears error when clearError is called', async () => {
      mockService.syncDeviceCalendar.mockResolvedValue({
        success: false,
        metrics: null,
        mvdShouldActivate: false,
        error: 'Sync failed',
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.syncNow('device');
      });

      expect(result.current.error).toBe('Sync failed');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  // ===========================================================================
  // REFRESH TESTS
  // ===========================================================================

  describe('refresh', () => {
    it('refreshes status and metrics', async () => {
      const mockMetrics = {
        date: '2023-01-01',
        totalHours: 3,
        meetingCount: 2,
        backToBackCount: 0,
        density: 0.33,
        heavyDay: false,
        overload: false,
        calculatedAt: '2023-01-01T12:00:00.000Z',
      };

      mockService.getStatus.mockResolvedValue({
        isConnected: true,
        provider: 'device',
        lastSyncAt: '2023-01-01T12:00:00.000Z',
        integrations: [],
      });
      mockService.getTodayMetrics.mockResolvedValue(mockMetrics);

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Modify mock responses for refresh
      mockService.getTodayMetrics.mockResolvedValue({
        ...mockMetrics,
        totalHours: 6,
        heavyDay: true,
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.todayMetrics?.totalHours).toBe(6);
      expect(result.current.isHeavyDay).toBe(true);
    });
  });

  // ===========================================================================
  // DERIVED VALUES TESTS
  // ===========================================================================

  describe('derived values', () => {
    it('calculates isHeavyDay from metrics', async () => {
      mockService.getStatus.mockResolvedValue({
        isConnected: true,
        provider: 'device',
        lastSyncAt: null,
        integrations: [],
      });
      mockService.getTodayMetrics.mockResolvedValue({
        date: '2023-01-01',
        totalHours: 5,
        meetingCount: 4,
        backToBackCount: 2,
        density: 0.55,
        heavyDay: true,
        overload: false,
        calculatedAt: '2023-01-01T12:00:00.000Z',
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isHeavyDay).toBe(true);
      expect(result.current.isOverload).toBe(false);
    });

    it('calculates isOverload from metrics', async () => {
      mockService.getStatus.mockResolvedValue({
        isConnected: true,
        provider: 'device',
        lastSyncAt: null,
        integrations: [],
      });
      mockService.getTodayMetrics.mockResolvedValue({
        date: '2023-01-01',
        totalHours: 7,
        meetingCount: 6,
        backToBackCount: 4,
        density: 0.77,
        heavyDay: true,
        overload: true,
        calculatedAt: '2023-01-01T12:00:00.000Z',
      });

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isHeavyDay).toBe(true);
      expect(result.current.isOverload).toBe(true);
    });

    it('returns false for heavy/overload when no metrics', async () => {
      mockService.getStatus.mockResolvedValue({
        isConnected: false,
        provider: null,
        lastSyncAt: null,
        integrations: [],
      });
      mockService.getTodayMetrics.mockResolvedValue(null);

      const { result } = renderHook(() => useCalendar());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isHeavyDay).toBe(false);
      expect(result.current.isOverload).toBe(false);
    });
  });
});
