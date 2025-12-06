"use strict";
/**
 * Calendar Integration Types for Apex OS Phase 3
 *
 * These types define calendar data structures for meeting load detection
 * and MVD (Minimum Viable Day) activation on heavy meeting days.
 *
 * Privacy-First: We only store busy blocks and aggregate metrics,
 * never meeting titles, attendees, or locations.
 *
 * @file functions/src/types/calendar.types.ts
 * @author Claude Opus 4.5 (Session 43)
 * @created December 5, 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEETING_LOAD_THRESHOLDS = void 0;
exports.classifyMeetingLoad = classifyMeetingLoad;
exports.toCalendarIntegrationRow = toCalendarIntegrationRow;
exports.fromCalendarIntegrationRow = fromCalendarIntegrationRow;
exports.toDailyCalendarMetricsRow = toDailyCalendarMetricsRow;
exports.fromDailyCalendarMetricsRow = fromDailyCalendarMetricsRow;
exports.emptyMeetingLoadMetrics = emptyMeetingLoadMetrics;
// =============================================================================
// MEETING LOAD THRESHOLDS
// =============================================================================
/**
 * Meeting load classification thresholds.
 * Reference: PHASE_III_IMPLEMENTATION_PLAN.md - Component 4
 */
exports.MEETING_LOAD_THRESHOLDS = {
    /** 0-2 hours: Light day, full protocols */
    LIGHT_MAX: 2,
    /** 2-4 hours: Moderate day, suppress STANDARD nudges */
    MODERATE_MAX: 4,
    /** 4-6 hours: Heavy day, activate MVD */
    HEAVY_MAX: 6,
    /** 6+ hours: Overload, full MVD + message */
    OVERLOAD_THRESHOLD: 6,
    /** Gap below which meetings are considered back-to-back (minutes) */
    BACK_TO_BACK_GAP: 15,
    /** Assumed workday hours for density calculation */
    WORKDAY_HOURS: 9,
};
/**
 * Classify meeting load based on total hours.
 */
function classifyMeetingLoad(totalHours) {
    if (totalHours <= exports.MEETING_LOAD_THRESHOLDS.LIGHT_MAX)
        return 'light';
    if (totalHours <= exports.MEETING_LOAD_THRESHOLDS.MODERATE_MAX)
        return 'moderate';
    if (totalHours < exports.MEETING_LOAD_THRESHOLDS.OVERLOAD_THRESHOLD)
        return 'heavy';
    return 'overload';
}
// =============================================================================
// CONVERSION UTILITIES
// =============================================================================
/**
 * Convert CalendarIntegration to database row format.
 */
function toCalendarIntegrationRow(integration) {
    return {
        id: integration.id,
        user_id: integration.userId,
        provider: integration.provider,
        access_token_encrypted: integration.accessTokenEncrypted,
        refresh_token_encrypted: integration.refreshTokenEncrypted,
        expires_at: integration.expiresAt?.toISOString() ?? null,
        last_sync_at: integration.lastSyncAt?.toISOString() ?? null,
        last_sync_status: integration.lastSyncStatus,
        last_sync_error: integration.lastSyncError,
        created_at: integration.createdAt?.toISOString(),
        updated_at: integration.updatedAt?.toISOString(),
    };
}
/**
 * Convert database row to CalendarIntegration format.
 */
function fromCalendarIntegrationRow(row) {
    return {
        id: row.id,
        userId: row.user_id,
        provider: row.provider,
        accessTokenEncrypted: row.access_token_encrypted,
        refreshTokenEncrypted: row.refresh_token_encrypted,
        expiresAt: row.expires_at ? new Date(row.expires_at) : null,
        lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at) : null,
        lastSyncStatus: row.last_sync_status,
        lastSyncError: row.last_sync_error,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}
/**
 * Convert DailyCalendarMetrics to database row format.
 */
function toDailyCalendarMetricsRow(metrics) {
    return {
        id: metrics.id,
        user_id: metrics.userId,
        date: metrics.date,
        meeting_hours: metrics.meetingHours,
        meeting_count: metrics.meetingCount,
        back_to_back_count: metrics.backToBackCount,
        density: metrics.density,
        heavy_day: metrics.heavyDay,
        overload: metrics.overload,
        mvd_activated: metrics.mvdActivated,
        provider: metrics.provider,
        created_at: metrics.createdAt?.toISOString(),
        updated_at: metrics.updatedAt?.toISOString(),
    };
}
/**
 * Convert database row to DailyCalendarMetrics format.
 */
function fromDailyCalendarMetricsRow(row) {
    return {
        id: row.id,
        userId: row.user_id,
        date: row.date,
        meetingHours: row.meeting_hours,
        meetingCount: row.meeting_count,
        backToBackCount: row.back_to_back_count,
        density: row.density,
        heavyDay: row.heavy_day,
        overload: row.overload,
        mvdActivated: row.mvd_activated,
        provider: row.provider,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}
/**
 * Create empty MeetingLoadMetrics for when no calendar is connected.
 */
function emptyMeetingLoadMetrics(date) {
    return {
        date,
        totalHours: 0,
        meetingCount: 0,
        backToBackCount: 0,
        density: 0,
        heavyDay: false,
        overload: false,
        calculatedAt: new Date(),
    };
}
