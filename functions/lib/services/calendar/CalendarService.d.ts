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
import { BusyBlock, CalendarProvider, MeetingLoadMetrics, DailyCalendarMetrics, CalendarIntegration } from '../../types/calendar.types';
import { CalendarRepository } from './CalendarRepository';
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
export declare class CalendarService {
    private repository;
    constructor(repository?: CalendarRepository);
    /**
     * Calculate meeting load metrics from an array of busy blocks.
     * This is the core algorithm for meeting load detection.
     *
     * @param busyBlocks - Array of busy time blocks
     * @param date - Date string in YYYY-MM-DD format
     * @returns Meeting load metrics
     */
    calculateMeetingLoad(busyBlocks: BusyBlock[], date: string): MeetingLoadMetrics;
    /**
     * Parse busy block strings into Date objects with validation.
     */
    private parseBusyBlocks;
    /**
     * Count meetings that are back-to-back (< 15 min gap between them).
     */
    private countBackToBackMeetings;
    /**
     * Sync device calendar data (busy blocks sent from client).
     * Calculates meeting load and stores metrics.
     *
     * @param userId - User ID
     * @param busyBlocks - Array of busy blocks from device calendar
     * @param date - Date in YYYY-MM-DD format
     */
    syncDeviceCalendar(userId: string, busyBlocks: BusyBlock[], date: string): Promise<SyncCalendarResult>;
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
    syncGoogleCalendar(userId: string, date: string): Promise<SyncCalendarResult>;
    /**
     * Get today's meeting load metrics for a user.
     * Returns null if no calendar is connected or no data available.
     *
     * @param userId - User ID
     * @param date - Date in YYYY-MM-DD format (defaults to today)
     */
    getTodayMetrics(userId: string, date?: string): Promise<MeetingLoadMetrics | null>;
    /**
     * Get meeting hours for today (for suppression engine).
     * Returns 0 if no calendar data available.
     *
     * @param userId - User ID
     */
    getMeetingHoursToday(userId: string): Promise<number>;
    /**
     * Check if today is a heavy calendar day (>= 4 hours).
     * Used by MVD detector.
     *
     * @param userId - User ID
     */
    isHeavyCalendarDay(userId: string): Promise<boolean>;
    /**
     * Get user's calendar integration status.
     */
    getIntegrationStatus(userId: string): Promise<{
        isConnected: boolean;
        provider: CalendarProvider | null;
        lastSyncAt: Date | null;
    }>;
    /**
     * Get all integrations for a user.
     */
    getIntegrations(userId: string): Promise<CalendarIntegration[]>;
    /**
     * Disconnect a calendar provider.
     */
    disconnectProvider(userId: string, provider: CalendarProvider): Promise<boolean>;
    /**
     * Disconnect all calendar integrations for a user.
     */
    disconnectAll(userId: string): Promise<boolean>;
    /**
     * Mark today's metrics as having triggered MVD.
     */
    markMVDActivated(userId: string, date?: string): Promise<boolean>;
    /**
     * Get average meeting hours per day over a period.
     */
    getAverageMeetingHours(userId: string, days?: number): Promise<number | null>;
    /**
     * Get count of heavy meeting days in a period.
     */
    countHeavyDays(userId: string, days?: number): Promise<number>;
    /**
     * Get recent daily metrics for trend display.
     */
    getRecentMetrics(userId: string, days?: number): Promise<DailyCalendarMetrics[]>;
}
export declare function getCalendarService(): CalendarService;
export default CalendarService;
