/**
 * Calendar Service for Apex OS Client
 *
 * Handles device calendar access and server sync for meeting load detection.
 * Privacy-first: Only sends busy blocks (start/end times), never event details.
 *
 * @file client/src/services/calendar/CalendarService.ts
 * @author Claude Opus 4.5 (Session 43)
 * @created December 5, 2025
 */

import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BusyBlock,
  CalendarProvider,
  CalendarSyncResponse,
  CalendarIntegrationStatus,
  MeetingLoadMetrics,
  RecentMetricsResponse,
} from './types';
import {
  syncCalendar,
  fetchTodayCalendarMetrics,
  fetchCalendarStatus,
  disconnectCalendar,
  fetchRecentCalendarMetrics,
} from '../api';

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEYS = {
  CONNECTED_PROVIDER: 'calendar_connected_provider',
  LAST_SYNC_AT: 'calendar_last_sync_at',
};

/**
 * Get the user's current timezone using Intl API.
 * Falls back to UTC if timezone cannot be determined.
 */
function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

// =============================================================================
// CALENDAR SERVICE CLASS
// =============================================================================

export class CalendarService {
  private _isAvailable: boolean | null = null;

  // ===========================================================================
  // PLATFORM AVAILABILITY
  // ===========================================================================

  /**
   * Check if calendar is available on this platform.
   * Returns false on web, true on iOS/Android.
   */
  async isAvailable(): Promise<boolean> {
    if (this._isAvailable !== null) {
      return this._isAvailable;
    }

    // Calendar not available on web
    if (Platform.OS === 'web') {
      this._isAvailable = false;
      return false;
    }

    // Check if expo-calendar module is available
    try {
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT
      );
      this._isAvailable = true;
      return true;
    } catch {
      this._isAvailable = false;
      return false;
    }
  }

  // ===========================================================================
  // PERMISSIONS
  // ===========================================================================

  /**
   * Check current calendar permission status.
   */
  async getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    if (Platform.OS === 'web') {
      return 'denied';
    }

    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      return status as 'granted' | 'denied' | 'undetermined';
    } catch {
      return 'denied';
    }
  }

  /**
   * Request calendar permission from the user.
   * Returns true if permission was granted.
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  // ===========================================================================
  // DEVICE CALENDAR ACCESS
  // ===========================================================================

  /**
   * Get all calendars on the device.
   */
  async getCalendars(): Promise<Calendar.Calendar[]> {
    if (Platform.OS === 'web') {
      return [];
    }

    try {
      return await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    } catch {
      return [];
    }
  }

  /**
   * Get today's events from all calendars (as busy blocks).
   * Privacy-first: Only returns start/end times, not event details.
   *
   * @param timezone - User's timezone (IANA format)
   */
  async getTodayBusyBlocks(timezone: string): Promise<BusyBlock[]> {
    if (Platform.OS === 'web') {
      return [];
    }

    const permission = await this.getPermissionStatus();
    if (permission !== 'granted') {
      return [];
    }

    try {
      const calendars = await this.getCalendars();
      if (calendars.length === 0) {
        return [];
      }

      // Get start and end of today in user's timezone
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      // Get events from all calendars
      const calendarIds = calendars.map((c) => c.id);
      const events = await Calendar.getEventsAsync(
        calendarIds,
        startOfDay,
        endOfDay
      );

      // Convert to busy blocks (privacy-first: only start/end times)
      const busyBlocks: BusyBlock[] = events
        .filter((event) => {
          // Skip all-day events (they're typically not "meetings")
          if (event.allDay) return false;
          // Skip events with no start/end time
          if (!event.startDate || !event.endDate) return false;
          return true;
        })
        .map((event) => ({
          start: new Date(event.startDate).toISOString(),
          end: new Date(event.endDate).toISOString(),
        }));

      return busyBlocks;
    } catch (error) {
      console.error('Error getting busy blocks:', error);
      return [];
    }
  }

  // ===========================================================================
  // SERVER SYNC
  // ===========================================================================

  /**
   * Sync device calendar with the server.
   * Sends busy blocks (not event details) to calculate meeting load.
   *
   * @param timezone - User's timezone (IANA format), defaults to device timezone
   */
  async syncDeviceCalendar(timezone?: string): Promise<CalendarSyncResponse> {
    try {
      const tz = timezone || getUserTimezone();
      // Get today's busy blocks from device
      const busyBlocks = await this.getTodayBusyBlocks(tz);

      // Send to server
      const response = await syncCalendar({
        provider: 'device' as CalendarProvider,
        busyBlocks,
        timezone: tz,
      });

      if (response.success) {
        // Store sync state
        await AsyncStorage.setItem(STORAGE_KEYS.CONNECTED_PROVIDER, 'device');
        await AsyncStorage.setItem(
          STORAGE_KEYS.LAST_SYNC_AT,
          new Date().toISOString()
        );
      }

      return response;
    } catch (error) {
      console.error('Calendar sync error:', error);
      return {
        success: false,
        metrics: null,
        mvdShouldActivate: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      };
    }
  }

  /**
   * Trigger Google Calendar sync (server-side OAuth).
   * Note: This requires the user to have connected Google Calendar via OAuth.
   *
   * @param timezone - User's timezone (IANA format), defaults to device timezone
   */
  async syncGoogleCalendar(timezone?: string): Promise<CalendarSyncResponse> {
    try {
      const tz = timezone || getUserTimezone();
      const response = await syncCalendar({
        provider: 'google_calendar' as CalendarProvider,
        timezone: tz,
      });

      if (response.success) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CONNECTED_PROVIDER,
          'google_calendar'
        );
        await AsyncStorage.setItem(
          STORAGE_KEYS.LAST_SYNC_AT,
          new Date().toISOString()
        );
      }

      return response;
    } catch (error) {
      console.error('Google Calendar sync error:', error);
      return {
        success: false,
        metrics: null,
        mvdShouldActivate: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      };
    }
  }

  // ===========================================================================
  // DATA ACCESS
  // ===========================================================================

  /**
   * Get today's meeting load metrics from the server.
   */
  async getTodayMetrics(): Promise<MeetingLoadMetrics | null> {
    try {
      const response = await fetchTodayCalendarMetrics();
      return response.metrics;
    } catch (error) {
      console.error('Error fetching calendar metrics:', error);
      return null;
    }
  }

  /**
   * Get calendar integration status from the server.
   */
  async getStatus(): Promise<CalendarIntegrationStatus> {
    try {
      return await fetchCalendarStatus();
    } catch (error) {
      console.error('Error fetching calendar status:', error);
      return {
        isConnected: false,
        provider: null,
        lastSyncAt: null,
        integrations: [],
      };
    }
  }

  /**
   * Get recent calendar metrics for trend display.
   *
   * @param days - Number of days to fetch (default: 14)
   */
  async getRecentMetrics(days: number = 14): Promise<RecentMetricsResponse> {
    try {
      return await fetchRecentCalendarMetrics(days);
    } catch (error) {
      console.error('Error fetching recent calendar metrics:', error);
      return {
        success: false,
        metrics: [],
        averageHours: null,
        heavyDayCount: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch',
      };
    }
  }

  // ===========================================================================
  // DISCONNECT
  // ===========================================================================

  /**
   * Disconnect a calendar provider.
   *
   * @param provider - Provider to disconnect (optional, disconnects all if not specified)
   */
  async disconnect(provider?: CalendarProvider): Promise<boolean> {
    try {
      const response = await disconnectCalendar(provider);

      if (response.success) {
        await AsyncStorage.removeItem(STORAGE_KEYS.CONNECTED_PROVIDER);
        await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC_AT);
      }

      return response.success;
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      return false;
    }
  }

  // ===========================================================================
  // LOCAL STATE
  // ===========================================================================

  /**
   * Get locally stored connection state (for quick UI checks).
   */
  async getLocalConnectionState(): Promise<{
    provider: CalendarProvider | null;
    lastSyncAt: string | null;
  }> {
    const [provider, lastSyncAt] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.CONNECTED_PROVIDER),
      AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC_AT),
    ]);

    return {
      provider: (provider as CalendarProvider) || null,
      lastSyncAt,
    };
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let serviceInstance: CalendarService | null = null;

export function getCalendarService(): CalendarService {
  if (!serviceInstance) {
    serviceInstance = new CalendarService();
  }
  return serviceInstance;
}

export default CalendarService;
