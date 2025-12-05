/**
 * CalendarService Unit Tests
 *
 * Tests for calendar integration, meeting load detection, and privacy-first design.
 *
 * @file client/src/services/calendar/CalendarService.test.ts
 * @author Claude Opus 4.5 (Session 43)
 * @created December 5, 2025
 */

// Mock platform first
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((options: Record<string, unknown>) => options.ios),
  },
}));

// Mock expo-calendar
jest.mock('expo-calendar', () => ({
  getCalendarsAsync: jest.fn(),
  getCalendarPermissionsAsync: jest.fn(),
  requestCalendarPermissionsAsync: jest.fn(),
  getEventsAsync: jest.fn(),
  EntityTypes: {
    EVENT: 'event',
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock API functions
jest.mock('../api', () => ({
  syncCalendar: jest.fn(),
  fetchTodayCalendarMetrics: jest.fn(),
  fetchCalendarStatus: jest.fn(),
  disconnectCalendar: jest.fn(),
  fetchRecentCalendarMetrics: jest.fn(),
}));

import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarService, getCalendarService } from './CalendarService';
import {
  syncCalendar,
  fetchTodayCalendarMetrics,
  fetchCalendarStatus,
  disconnectCalendar,
  fetchRecentCalendarMetrics,
} from '../api';

describe('CalendarService', () => {
  let service: CalendarService;

  const mockedCalendar = Calendar as jest.Mocked<typeof Calendar>;
  const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  const mockedSyncCalendar = syncCalendar as jest.MockedFunction<typeof syncCalendar>;
  const mockedFetchTodayMetrics = fetchTodayCalendarMetrics as jest.MockedFunction<
    typeof fetchTodayCalendarMetrics
  >;
  const mockedFetchCalendarStatus = fetchCalendarStatus as jest.MockedFunction<
    typeof fetchCalendarStatus
  >;
  const mockedDisconnectCalendar = disconnectCalendar as jest.MockedFunction<
    typeof disconnectCalendar
  >;
  const mockedFetchRecentMetrics = fetchRecentCalendarMetrics as jest.MockedFunction<
    typeof fetchRecentCalendarMetrics
  >;

  const advancePlatform = (os: 'ios' | 'android' | 'web') => {
    (Platform as unknown as { OS: string }).OS = os;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    advancePlatform('ios');
    service = new CalendarService();
  });

  // ===========================================================================
  // PLATFORM AVAILABILITY TESTS
  // ===========================================================================

  describe('isAvailable', () => {
    it('returns false on web platform', async () => {
      advancePlatform('web');
      service = new CalendarService();

      const result = await service.isAvailable();

      expect(result).toBe(false);
    });

    it('returns true on iOS when calendars exist', async () => {
      advancePlatform('ios');
      service = new CalendarService();
      mockedCalendar.getCalendarsAsync.mockResolvedValue([
        { id: '1', title: 'Calendar 1' } as Calendar.Calendar,
      ]);

      const result = await service.isAvailable();

      expect(result).toBe(true);
      expect(mockedCalendar.getCalendarsAsync).toHaveBeenCalledWith('event');
    });

    it('returns true on Android when calendars exist', async () => {
      advancePlatform('android');
      service = new CalendarService();
      mockedCalendar.getCalendarsAsync.mockResolvedValue([
        { id: '1', title: 'Calendar 1' } as Calendar.Calendar,
      ]);

      const result = await service.isAvailable();

      expect(result).toBe(true);
    });

    it('returns false when calendar access fails', async () => {
      advancePlatform('ios');
      service = new CalendarService();
      mockedCalendar.getCalendarsAsync.mockRejectedValue(new Error('Access denied'));

      const result = await service.isAvailable();

      expect(result).toBe(false);
    });

    it('caches availability result', async () => {
      mockedCalendar.getCalendarsAsync.mockResolvedValue([
        { id: '1', title: 'Calendar 1' } as Calendar.Calendar,
      ]);

      await service.isAvailable();
      await service.isAvailable();

      expect(mockedCalendar.getCalendarsAsync).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // PERMISSION TESTS
  // ===========================================================================

  describe('getPermissionStatus', () => {
    it('returns denied on web platform', async () => {
      advancePlatform('web');
      service = new CalendarService();

      const result = await service.getPermissionStatus();

      expect(result).toBe('denied');
    });

    it('returns granted when permission is authorized', async () => {
      mockedCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'granted' as Calendar.PermissionStatus,
        expires: 'never',
        granted: true,
        canAskAgain: true,
      });

      const result = await service.getPermissionStatus();

      expect(result).toBe('granted');
    });

    it('returns undetermined when permission not yet requested', async () => {
      mockedCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'undetermined' as Calendar.PermissionStatus,
        expires: 'never',
        granted: false,
        canAskAgain: true,
      });

      const result = await service.getPermissionStatus();

      expect(result).toBe('undetermined');
    });

    it('returns denied when permission check fails', async () => {
      mockedCalendar.getCalendarPermissionsAsync.mockRejectedValue(new Error('Error'));

      const result = await service.getPermissionStatus();

      expect(result).toBe('denied');
    });
  });

  describe('requestPermission', () => {
    it('returns false on web platform', async () => {
      advancePlatform('web');
      service = new CalendarService();

      const result = await service.requestPermission();

      expect(result).toBe(false);
    });

    it('returns true when permission is granted', async () => {
      mockedCalendar.requestCalendarPermissionsAsync.mockResolvedValue({
        status: 'granted' as Calendar.PermissionStatus,
        expires: 'never',
        granted: true,
        canAskAgain: true,
      });

      const result = await service.requestPermission();

      expect(result).toBe(true);
    });

    it('returns false when permission is denied', async () => {
      mockedCalendar.requestCalendarPermissionsAsync.mockResolvedValue({
        status: 'denied' as Calendar.PermissionStatus,
        expires: 'never',
        granted: false,
        canAskAgain: false,
      });

      const result = await service.requestPermission();

      expect(result).toBe(false);
    });
  });

  // ===========================================================================
  // BUSY BLOCKS TESTS
  // ===========================================================================

  describe('getTodayBusyBlocks', () => {
    it('returns empty array on web platform', async () => {
      advancePlatform('web');
      service = new CalendarService();

      const result = await service.getTodayBusyBlocks('America/New_York');

      expect(result).toEqual([]);
    });

    it('returns empty array when permission not granted', async () => {
      mockedCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'denied' as Calendar.PermissionStatus,
        expires: 'never',
        granted: false,
        canAskAgain: false,
      });

      const result = await service.getTodayBusyBlocks('America/New_York');

      expect(result).toEqual([]);
    });

    it('extracts busy blocks from calendar events', async () => {
      const startTime = new Date('2023-01-01T09:00:00.000Z');
      const endTime = new Date('2023-01-01T10:00:00.000Z');

      mockedCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'granted' as Calendar.PermissionStatus,
        expires: 'never',
        granted: true,
        canAskAgain: true,
      });
      mockedCalendar.getCalendarsAsync.mockResolvedValue([
        { id: 'cal-1', title: 'Work' } as Calendar.Calendar,
      ]);
      mockedCalendar.getEventsAsync.mockResolvedValue([
        {
          id: 'event-1',
          title: 'Team Meeting', // This should NOT be in the output (privacy-first)
          startDate: startTime.toISOString(),
          endDate: endTime.toISOString(),
          allDay: false,
        } as unknown as Calendar.Event,
      ]);

      const result = await service.getTodayBusyBlocks('America/New_York');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        start: startTime.toISOString(),
        end: endTime.toISOString(),
      });
      // Verify privacy: no event title or details in output
      expect(result[0]).not.toHaveProperty('title');
      expect(result[0]).not.toHaveProperty('description');
    });

    it('filters out all-day events', async () => {
      mockedCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'granted' as Calendar.PermissionStatus,
        expires: 'never',
        granted: true,
        canAskAgain: true,
      });
      mockedCalendar.getCalendarsAsync.mockResolvedValue([
        { id: 'cal-1', title: 'Work' } as Calendar.Calendar,
      ]);
      mockedCalendar.getEventsAsync.mockResolvedValue([
        {
          id: 'event-1',
          startDate: '2023-01-01T00:00:00.000Z',
          endDate: '2023-01-02T00:00:00.000Z',
          allDay: true, // Should be filtered out
        } as unknown as Calendar.Event,
        {
          id: 'event-2',
          startDate: '2023-01-01T14:00:00.000Z',
          endDate: '2023-01-01T15:00:00.000Z',
          allDay: false,
        } as unknown as Calendar.Event,
      ]);

      const result = await service.getTodayBusyBlocks('America/New_York');

      expect(result).toHaveLength(1);
      expect(result[0]?.start).toBe('2023-01-01T14:00:00.000Z');
    });

    it('returns empty array when no calendars exist', async () => {
      mockedCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'granted' as Calendar.PermissionStatus,
        expires: 'never',
        granted: true,
        canAskAgain: true,
      });
      mockedCalendar.getCalendarsAsync.mockResolvedValue([]);

      const result = await service.getTodayBusyBlocks('America/New_York');

      expect(result).toEqual([]);
    });
  });

  // ===========================================================================
  // SYNC TESTS
  // ===========================================================================

  describe('syncDeviceCalendar', () => {
    beforeEach(() => {
      mockedCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'granted' as Calendar.PermissionStatus,
        expires: 'never',
        granted: true,
        canAskAgain: true,
      });
      mockedCalendar.getCalendarsAsync.mockResolvedValue([
        { id: 'cal-1', title: 'Work' } as Calendar.Calendar,
      ]);
      mockedCalendar.getEventsAsync.mockResolvedValue([]);
    });

    it('syncs busy blocks to server and stores state on success', async () => {
      mockedSyncCalendar.mockResolvedValue({
        success: true,
        metrics: {
          date: '2023-01-01',
          totalHours: 4,
          meetingCount: 3,
          backToBackCount: 1,
          density: 0.44,
          heavyDay: true,
          overload: false,
          calculatedAt: '2023-01-01T12:00:00.000Z',
        },
        mvdShouldActivate: true,
        error: null,
      });

      const result = await service.syncDeviceCalendar();

      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'calendar_connected_provider',
        'device'
      );
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'calendar_last_sync_at',
        expect.any(String)
      );
    });

    it('returns error response on sync failure', async () => {
      mockedSyncCalendar.mockRejectedValue(new Error('Network error'));

      const result = await service.syncDeviceCalendar();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('syncGoogleCalendar', () => {
    it('calls sync API with google_calendar provider', async () => {
      mockedSyncCalendar.mockResolvedValue({
        success: true,
        metrics: null,
        mvdShouldActivate: false,
        error: null,
      });

      await service.syncGoogleCalendar();

      expect(mockedSyncCalendar).toHaveBeenCalledWith({
        provider: 'google_calendar',
        timezone: expect.any(String),
      });
    });
  });

  // ===========================================================================
  // DATA ACCESS TESTS
  // ===========================================================================

  describe('getTodayMetrics', () => {
    it('returns metrics from server', async () => {
      const mockMetrics = {
        date: '2023-01-01',
        totalHours: 5.5,
        meetingCount: 4,
        backToBackCount: 2,
        density: 0.61,
        heavyDay: true,
        overload: false,
        calculatedAt: '2023-01-01T12:00:00.000Z',
      };
      mockedFetchTodayMetrics.mockResolvedValue({
        success: true,
        metrics: mockMetrics,
        error: null,
      });

      const result = await service.getTodayMetrics();

      expect(result).toEqual(mockMetrics);
    });

    it('returns null on error', async () => {
      mockedFetchTodayMetrics.mockRejectedValue(new Error('Server error'));

      const result = await service.getTodayMetrics();

      expect(result).toBeNull();
    });
  });

  describe('getStatus', () => {
    it('returns integration status from server', async () => {
      const mockStatus = {
        isConnected: true,
        provider: 'device' as const,
        lastSyncAt: '2023-01-01T12:00:00.000Z',
        integrations: [],
      };
      mockedFetchCalendarStatus.mockResolvedValue(mockStatus);

      const result = await service.getStatus();

      expect(result).toEqual(mockStatus);
    });

    it('returns disconnected status on error', async () => {
      mockedFetchCalendarStatus.mockRejectedValue(new Error('Server error'));

      const result = await service.getStatus();

      expect(result.isConnected).toBe(false);
      expect(result.provider).toBeNull();
    });
  });

  describe('getRecentMetrics', () => {
    it('fetches metrics for specified number of days', async () => {
      mockedFetchRecentMetrics.mockResolvedValue({
        success: true,
        metrics: [],
        averageHours: 3.5,
        heavyDayCount: 2,
        error: null,
      });

      await service.getRecentMetrics(7);

      expect(mockedFetchRecentMetrics).toHaveBeenCalledWith(7);
    });
  });

  // ===========================================================================
  // DISCONNECT TESTS
  // ===========================================================================

  describe('disconnect', () => {
    it('clears local storage on successful disconnect', async () => {
      mockedDisconnectCalendar.mockResolvedValue({
        success: true,
        error: null,
      });

      const result = await service.disconnect('device');

      expect(result).toBe(true);
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('calendar_connected_provider');
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('calendar_last_sync_at');
    });

    it('returns false on disconnect failure', async () => {
      mockedDisconnectCalendar.mockRejectedValue(new Error('Failed'));

      const result = await service.disconnect();

      expect(result).toBe(false);
    });
  });

  // ===========================================================================
  // SINGLETON TESTS
  // ===========================================================================

  describe('getCalendarService', () => {
    it('returns singleton instance', () => {
      const instance1 = getCalendarService();
      const instance2 = getCalendarService();

      expect(instance1).toBe(instance2);
    });
  });
});
