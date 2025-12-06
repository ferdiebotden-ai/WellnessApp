/**
 * Calendar Repository for Apex OS Phase 3
 *
 * Handles database operations for calendar integrations and daily metrics.
 * Uses the `calendar_integrations` and `daily_calendar_metrics` tables.
 *
 * @file functions/src/services/calendar/CalendarRepository.ts
 * @author Claude Opus 4.5 (Session 43)
 * @created December 5, 2025
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { CalendarIntegration, CalendarProvider, CalendarSyncStatus, DailyCalendarMetrics, MeetingLoadMetrics } from '../../types/calendar.types';
/**
 * Input for creating a new calendar integration.
 */
export interface CreateCalendarIntegrationInput {
    userId: string;
    provider: CalendarProvider;
    accessTokenEncrypted?: string | null;
    refreshTokenEncrypted?: string | null;
    expiresAt?: Date | null;
}
/**
 * Input for updating calendar sync status.
 */
export interface UpdateSyncStatusInput {
    lastSyncAt: Date;
    lastSyncStatus: CalendarSyncStatus;
    lastSyncError?: string | null;
}
/**
 * Input for upserting daily calendar metrics.
 */
export interface UpsertDailyMetricsInput {
    userId: string;
    date: string;
    metrics: MeetingLoadMetrics;
    provider: CalendarProvider;
    mvdActivated?: boolean;
}
/**
 * Result of a single record query.
 */
export interface QueryResult<T> {
    data: T | null;
    error: string | null;
}
/**
 * Result of a list query.
 */
export interface ListResult<T> {
    data: T[];
    error: string | null;
}
export declare class CalendarRepository {
    private supabase;
    constructor(supabaseClient?: SupabaseClient);
    /**
     * Create a new calendar integration for a user.
     */
    createIntegration(input: CreateCalendarIntegrationInput): Promise<QueryResult<CalendarIntegration>>;
    /**
     * Get calendar integration by user ID and provider.
     */
    getIntegration(userId: string, provider: CalendarProvider): Promise<QueryResult<CalendarIntegration>>;
    /**
     * Get all calendar integrations for a user.
     */
    getIntegrationsByUser(userId: string): Promise<ListResult<CalendarIntegration>>;
    /**
     * Get any active calendar integration for a user.
     * Returns the first successfully synced integration.
     */
    getActiveIntegration(userId: string): Promise<QueryResult<CalendarIntegration>>;
    /**
     * Update calendar integration sync status.
     */
    updateSyncStatus(userId: string, provider: CalendarProvider, status: UpdateSyncStatusInput): Promise<boolean>;
    /**
     * Update OAuth tokens for a calendar integration.
     */
    updateTokens(userId: string, provider: CalendarProvider, accessTokenEncrypted: string, refreshTokenEncrypted: string | null, expiresAt: Date | null): Promise<boolean>;
    /**
     * Delete a calendar integration.
     */
    deleteIntegration(userId: string, provider: CalendarProvider): Promise<boolean>;
    /**
     * Delete all calendar integrations for a user.
     */
    deleteAllIntegrations(userId: string): Promise<boolean>;
    /**
     * Upsert a calendar integration (create or update).
     */
    upsertIntegration(input: CreateCalendarIntegrationInput): Promise<QueryResult<CalendarIntegration>>;
    /**
     * Upsert daily calendar metrics (create or update).
     */
    upsertDailyMetrics(input: UpsertDailyMetricsInput): Promise<QueryResult<DailyCalendarMetrics>>;
    /**
     * Get daily calendar metrics for a user and date.
     */
    getDailyMetrics(userId: string, date: string): Promise<QueryResult<DailyCalendarMetrics>>;
    /**
     * Get recent daily calendar metrics for trend analysis.
     */
    getRecentMetrics(userId: string, days?: number): Promise<ListResult<DailyCalendarMetrics>>;
    /**
     * Get heavy meeting days for a user.
     */
    getHeavyDays(userId: string, limit?: number): Promise<ListResult<DailyCalendarMetrics>>;
    /**
     * Mark daily metrics as having triggered MVD.
     */
    markMVDActivated(userId: string, date: string): Promise<boolean>;
    /**
     * Calculate average meeting hours over a period.
     */
    getAverageMeetingHours(userId: string, days?: number): Promise<number | null>;
    /**
     * Count heavy days in a period.
     */
    countHeavyDays(userId: string, days?: number): Promise<number>;
    /**
     * Delete daily metrics for a user and date.
     */
    deleteDailyMetrics(userId: string, date: string): Promise<boolean>;
}
export declare function getCalendarRepository(): CalendarRepository;
export default CalendarRepository;
