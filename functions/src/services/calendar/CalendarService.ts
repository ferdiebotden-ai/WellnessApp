/**
 * Calendar Service for Apex OS Phase 3
 *
 * Core service for calendar integration and meeting load calculation.
 * Handles both device calendar (client-sent busy blocks) and Google Calendar OAuth.
 *
 * Privacy-First: Only processes busy blocks (start/end times), never event details.
 *
 * @file functions/src/services/calendar/CalendarService.ts
 * @author Claude Opus 4.5 (Session 43)
 * @created December 5, 2025
 */

import {
  BusyBlock,
  CalendarProvider,
  MeetingLoadMetrics,
  DailyCalendarMetrics,
  MEETING_LOAD_THRESHOLDS,
  emptyMeetingLoadMetrics,
  CalendarIntegration,
} from '../../types/calendar.types';
import {
  CalendarRepository,
  getCalendarRepository,
  UpsertDailyMetricsInput,
} from './CalendarRepository';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of calculating meeting load.
 */
export interface CalculateMeetingLoadResult {
  metrics: MeetingLoadMetrics;
  error: string | null;
}

/**
 * Result of syncing calendar data.
 */
export interface SyncCalendarResult {
  success: boolean;
  metrics: MeetingLoadMetrics | null;
  mvdShouldActivate: boolean;
  error: string | null;
}

/**
 * Internal representation of a parsed busy block with Date objects.
 */
interface ParsedBlock {
  start: Date;
  end: Date;
  durationMinutes: number;
}

// =============================================================================
// CALENDAR SERVICE CLASS
// =============================================================================

export class CalendarService {
  private repository: CalendarRepository;

  constructor(repository?: CalendarRepository) {
    this.repository = repository || getCalendarRepository();
  }

  // ===========================================================================
  // MEETING LOAD CALCULATION
  // ===========================================================================

  /**
   * Calculate meeting load metrics from an array of busy blocks.
   * This is the core algorithm for meeting load detection.
   *
   * @param busyBlocks - Array of busy time blocks
   * @param date - Date string in YYYY-MM-DD format
   * @returns Meeting load metrics
   */
  calculateMeetingLoad(busyBlocks: BusyBlock[], date: string): MeetingLoadMetrics {
    // Empty calendar = empty metrics
    if (!busyBlocks || busyBlocks.length === 0) {
      return emptyMeetingLoadMetrics(date);
    }

    // Parse and validate busy blocks
    const parsed = this.parseBusyBlocks(busyBlocks);

    // Filter out invalid blocks
    const validBlocks = parsed.filter((block) => block.durationMinutes > 0);

    if (validBlocks.length === 0) {
      return emptyMeetingLoadMetrics(date);
    }

    // Sort by start time
    const sorted = validBlocks.sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    );

    // Calculate total hours
    const totalMinutes = sorted.reduce(
      (sum, block) => sum + block.durationMinutes,
      0
    );
    const totalHours = totalMinutes / 60;

    // Detect back-to-back meetings (< 15 min gap)
    const backToBackCount = this.countBackToBackMeetings(sorted);

    // Calculate meeting density (meetings per workday hour)
    const density = sorted.length / MEETING_LOAD_THRESHOLDS.WORKDAY_HOURS;

    // Determine threshold flags
    const heavyDay = totalHours >= MEETING_LOAD_THRESHOLDS.MODERATE_MAX;
    const overload = totalHours >= MEETING_LOAD_THRESHOLDS.OVERLOAD_THRESHOLD;

    return {
      date,
      totalHours: Math.round(totalHours * 100) / 100, // Round to 2 decimals
      meetingCount: sorted.length,
      backToBackCount,
      density: Math.round(density * 100) / 100,
      heavyDay,
      overload,
      calculatedAt: new Date(),
    };
  }

  /**
   * Parse busy block strings into Date objects with validation.
   */
  private parseBusyBlocks(busyBlocks: BusyBlock[]): ParsedBlock[] {
    return busyBlocks
      .map((block) => {
        try {
          const start = new Date(block.start);
          const end = new Date(block.end);

          // Validate dates
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return null;
          }

          // Calculate duration
          const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

          return {
            start,
            end,
            durationMinutes,
          };
        } catch {
          return null;
        }
      })
      .filter((block): block is ParsedBlock => block !== null);
  }

  /**
   * Count meetings that are back-to-back (< 15 min gap between them).
   */
  private countBackToBackMeetings(sorted: ParsedBlock[]): number {
    let count = 0;

    for (let i = 1; i < sorted.length; i++) {
      const prevBlock = sorted[i - 1];
      const currBlock = sorted[i];

      const gapMinutes =
        (currBlock.start.getTime() - prevBlock.end.getTime()) / (1000 * 60);

      if (gapMinutes < MEETING_LOAD_THRESHOLDS.BACK_TO_BACK_GAP) {
        count++;
      }
    }

    return count;
  }

  // ===========================================================================
  // CALENDAR SYNC
  // ===========================================================================

  /**
   * Sync device calendar data (busy blocks sent from client).
   * Calculates meeting load and stores metrics.
   *
   * @param userId - User ID
   * @param busyBlocks - Array of busy blocks from device calendar
   * @param date - Date in YYYY-MM-DD format
   */
  async syncDeviceCalendar(
    userId: string,
    busyBlocks: BusyBlock[],
    date: string
  ): Promise<SyncCalendarResult> {
    try {
      // Calculate meeting load
      const metrics = this.calculateMeetingLoad(busyBlocks, date);

      // Upsert integration record (mark as device provider)
      await this.repository.upsertIntegration({
        userId,
        provider: 'device',
      });

      // Update sync status
      await this.repository.updateSyncStatus(userId, 'device', {
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
      });

      // Store daily metrics
      const metricsInput: UpsertDailyMetricsInput = {
        userId,
        date,
        metrics,
        provider: 'device',
        mvdActivated: false, // Will be updated by MVD detector
      };

      await this.repository.upsertDailyMetrics(metricsInput);

      return {
        success: true,
        metrics,
        mvdShouldActivate: metrics.heavyDay,
        error: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      // Update sync status with error
      await this.repository.updateSyncStatus(userId, 'device', {
        lastSyncAt: new Date(),
        lastSyncStatus: 'failed',
        lastSyncError: message,
      });

      return {
        success: false,
        metrics: null,
        mvdShouldActivate: false,
        error: message,
      };
    }
  }

  /**
   * Sync Google Calendar using OAuth (server-side fetch).
   * This would call Google Calendar FreeBusy API.
   *
   * Note: Full implementation requires googleapis package and token management.
   * For MVP, we support device calendar; Google Calendar is a stretch goal.
   *
   * @param userId - User ID
   * @param date - Date in YYYY-MM-DD format
   */
  async syncGoogleCalendar(
    userId: string,
    date: string
  ): Promise<SyncCalendarResult> {
    try {
      // Get Google Calendar integration
      const { data: integration, error: integrationError } =
        await this.repository.getIntegration(userId, 'google_calendar');

      if (integrationError || !integration) {
        return {
          success: false,
          metrics: null,
          mvdShouldActivate: false,
          error: 'Google Calendar not connected',
        };
      }

      // Check if token is expired
      if (integration.expiresAt && integration.expiresAt < new Date()) {
        // TODO: Refresh token using googleapis
        return {
          success: false,
          metrics: null,
          mvdShouldActivate: false,
          error: 'Google Calendar token expired - please reconnect',
        };
      }

      // TODO: Implement Google Calendar FreeBusy API call
      // For now, return a placeholder that indicates Google sync is not yet implemented
      return {
        success: false,
        metrics: null,
        mvdShouldActivate: false,
        error:
          'Google Calendar sync not yet implemented - use device calendar',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      await this.repository.updateSyncStatus(userId, 'google_calendar', {
        lastSyncAt: new Date(),
        lastSyncStatus: 'failed',
        lastSyncError: message,
      });

      return {
        success: false,
        metrics: null,
        mvdShouldActivate: false,
        error: message,
      };
    }
  }

  // ===========================================================================
  // DATA ACCESS
  // ===========================================================================

  /**
   * Get today's meeting load metrics for a user.
   * Returns null if no calendar is connected or no data available.
   *
   * @param userId - User ID
   * @param date - Date in YYYY-MM-DD format (defaults to today)
   */
  async getTodayMetrics(
    userId: string,
    date?: string
  ): Promise<MeetingLoadMetrics | null> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await this.repository.getDailyMetrics(
      userId,
      targetDate
    );

    if (error || !data) {
      return null;
    }

    // Convert DailyCalendarMetrics to MeetingLoadMetrics
    return {
      date: data.date,
      totalHours: data.meetingHours,
      meetingCount: data.meetingCount,
      backToBackCount: data.backToBackCount,
      density: data.density,
      heavyDay: data.heavyDay,
      overload: data.overload,
      calculatedAt: data.updatedAt,
    };
  }

  /**
   * Get meeting hours for today (for suppression engine).
   * Returns 0 if no calendar data available.
   *
   * @param userId - User ID
   */
  async getMeetingHoursToday(userId: string): Promise<number> {
    const metrics = await this.getTodayMetrics(userId);
    return metrics?.totalHours ?? 0;
  }

  /**
   * Check if today is a heavy calendar day (>= 4 hours).
   * Used by MVD detector.
   *
   * @param userId - User ID
   */
  async isHeavyCalendarDay(userId: string): Promise<boolean> {
    const metrics = await this.getTodayMetrics(userId);
    return metrics?.heavyDay ?? false;
  }

  /**
   * Get user's calendar integration status.
   */
  async getIntegrationStatus(userId: string): Promise<{
    isConnected: boolean;
    provider: CalendarProvider | null;
    lastSyncAt: Date | null;
  }> {
    const { data } = await this.repository.getActiveIntegration(userId);

    if (!data) {
      return {
        isConnected: false,
        provider: null,
        lastSyncAt: null,
      };
    }

    return {
      isConnected: true,
      provider: data.provider,
      lastSyncAt: data.lastSyncAt,
    };
  }

  /**
   * Get all integrations for a user.
   */
  async getIntegrations(userId: string): Promise<CalendarIntegration[]> {
    const { data } = await this.repository.getIntegrationsByUser(userId);
    return data;
  }

  /**
   * Disconnect a calendar provider.
   */
  async disconnectProvider(
    userId: string,
    provider: CalendarProvider
  ): Promise<boolean> {
    return this.repository.deleteIntegration(userId, provider);
  }

  /**
   * Disconnect all calendar integrations for a user.
   */
  async disconnectAll(userId: string): Promise<boolean> {
    return this.repository.deleteAllIntegrations(userId);
  }

  // ===========================================================================
  // MVD INTEGRATION
  // ===========================================================================

  /**
   * Mark today's metrics as having triggered MVD.
   */
  async markMVDActivated(userId: string, date?: string): Promise<boolean> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.repository.markMVDActivated(userId, targetDate);
  }

  // ===========================================================================
  // ANALYTICS
  // ===========================================================================

  /**
   * Get average meeting hours per day over a period.
   */
  async getAverageMeetingHours(
    userId: string,
    days: number = 14
  ): Promise<number | null> {
    return this.repository.getAverageMeetingHours(userId, days);
  }

  /**
   * Get count of heavy meeting days in a period.
   */
  async countHeavyDays(userId: string, days: number = 30): Promise<number> {
    return this.repository.countHeavyDays(userId, days);
  }

  /**
   * Get recent daily metrics for trend display.
   */
  async getRecentMetrics(
    userId: string,
    days: number = 14
  ): Promise<DailyCalendarMetrics[]> {
    const { data } = await this.repository.getRecentMetrics(userId, days);
    return data;
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
