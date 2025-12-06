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
/**
 * Supported calendar providers.
 * - device: iOS EventKit / Android Calendar Provider (on-device)
 * - google_calendar: Google Calendar OAuth (cloud API)
 */
export type CalendarProvider = 'device' | 'google_calendar';
/**
 * Sync status for calendar integrations.
 */
export type CalendarSyncStatus = 'success' | 'failed' | 'pending' | 'not_connected';
/**
 * A single busy block from the calendar.
 * Privacy-first: Only contains start/end times, no event details.
 */
export interface BusyBlock {
    start: string;
    end: string;
}
/**
 * Meeting load metrics calculated from busy blocks.
 * This is the core output of calendar integration.
 */
export interface MeetingLoadMetrics {
    /** Date in YYYY-MM-DD format */
    date: string;
    /** Total meeting time in hours (e.g., 4.5) */
    totalHours: number;
    /** Number of meetings/busy blocks */
    meetingCount: number;
    /** Meetings with <15 min gap between them */
    backToBackCount: number;
    /** Meeting density: meetings per workday hour (9-hour window) */
    density: number;
    /** True if totalHours >= 4 (triggers MVD consideration) */
    heavyDay: boolean;
    /** True if totalHours >= 6 (triggers full MVD + message) */
    overload: boolean;
    /** When these metrics were calculated */
    calculatedAt: Date;
}
/**
 * Meeting load classification thresholds.
 * Reference: PHASE_III_IMPLEMENTATION_PLAN.md - Component 4
 */
export declare const MEETING_LOAD_THRESHOLDS: {
    /** 0-2 hours: Light day, full protocols */
    readonly LIGHT_MAX: 2;
    /** 2-4 hours: Moderate day, suppress STANDARD nudges */
    readonly MODERATE_MAX: 4;
    /** 4-6 hours: Heavy day, activate MVD */
    readonly HEAVY_MAX: 6;
    /** 6+ hours: Overload, full MVD + message */
    readonly OVERLOAD_THRESHOLD: 6;
    /** Gap below which meetings are considered back-to-back (minutes) */
    readonly BACK_TO_BACK_GAP: 15;
    /** Assumed workday hours for density calculation */
    readonly WORKDAY_HOURS: 9;
};
/**
 * Meeting load classification based on hours.
 */
export type MeetingLoadClassification = 'light' | 'moderate' | 'heavy' | 'overload';
/**
 * Classify meeting load based on total hours.
 */
export declare function classifyMeetingLoad(totalHours: number): MeetingLoadClassification;
/**
 * Calendar integration record for a user.
 * Stores provider connection state and OAuth tokens (encrypted).
 */
export interface CalendarIntegration {
    id: string;
    userId: string;
    provider: CalendarProvider;
    /** AES-256 encrypted access token (null for device provider) */
    accessTokenEncrypted: string | null;
    /** AES-256 encrypted refresh token (null for device provider) */
    refreshTokenEncrypted: string | null;
    /** Token expiration time */
    expiresAt: Date | null;
    /** Last successful sync timestamp */
    lastSyncAt: Date | null;
    /** Current sync status */
    lastSyncStatus: CalendarSyncStatus;
    /** Error message from last failed sync */
    lastSyncError: string | null;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Database row format for calendar_integrations (snake_case).
 */
export interface CalendarIntegrationRow {
    id: string;
    user_id: string;
    provider: string;
    access_token_encrypted: string | null;
    refresh_token_encrypted: string | null;
    expires_at: string | null;
    last_sync_at: string | null;
    last_sync_status: string;
    last_sync_error: string | null;
    created_at: string;
    updated_at: string;
}
/**
 * Daily calendar metrics stored for trend analysis.
 * One record per user per date.
 */
export interface DailyCalendarMetrics {
    id: string;
    userId: string;
    /** Date in YYYY-MM-DD format */
    date: string;
    /** Total meeting hours */
    meetingHours: number;
    /** Number of meetings */
    meetingCount: number;
    /** Back-to-back meeting count */
    backToBackCount: number;
    /** Meeting density (meetings per hour) */
    density: number;
    /** Whether this was classified as a heavy day (>= 4 hours) */
    heavyDay: boolean;
    /** Whether this was classified as overload (>= 6 hours) */
    overload: boolean;
    /** Whether MVD was activated due to heavy calendar */
    mvdActivated: boolean;
    /** Calendar provider that provided this data */
    provider: CalendarProvider;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Database row format for daily_calendar_metrics (snake_case).
 */
export interface DailyCalendarMetricsRow {
    id: string;
    user_id: string;
    date: string;
    meeting_hours: number;
    meeting_count: number;
    back_to_back_count: number;
    density: number;
    heavy_day: boolean;
    overload: boolean;
    mvd_activated: boolean;
    provider: string;
    created_at: string;
    updated_at: string;
}
/**
 * Request body for calendar sync endpoint.
 * Client sends busy blocks from device calendar.
 */
export interface CalendarSyncRequest {
    /** Which calendar provider is syncing */
    provider: CalendarProvider;
    /** Busy blocks for today (only for device provider) */
    busyBlocks?: BusyBlock[];
    /** User's timezone (IANA format, e.g., 'America/New_York') */
    timezone: string;
}
/**
 * Response from calendar sync endpoint.
 */
export interface CalendarSyncResponse {
    success: boolean;
    metrics: MeetingLoadMetrics | null;
    error?: string;
}
/**
 * Request body for Google Calendar OAuth callback.
 */
export interface GoogleCalendarConnectRequest {
    authCode: string;
    redirectUri: string;
}
/**
 * Response from calendar connection endpoints.
 */
export interface CalendarConnectResponse {
    success: boolean;
    provider: CalendarProvider;
    error?: string;
}
/**
 * Convert CalendarIntegration to database row format.
 */
export declare function toCalendarIntegrationRow(integration: Partial<CalendarIntegration>): Partial<CalendarIntegrationRow>;
/**
 * Convert database row to CalendarIntegration format.
 */
export declare function fromCalendarIntegrationRow(row: CalendarIntegrationRow): CalendarIntegration;
/**
 * Convert DailyCalendarMetrics to database row format.
 */
export declare function toDailyCalendarMetricsRow(metrics: Partial<DailyCalendarMetrics>): Partial<DailyCalendarMetricsRow>;
/**
 * Convert database row to DailyCalendarMetrics format.
 */
export declare function fromDailyCalendarMetricsRow(row: DailyCalendarMetricsRow): DailyCalendarMetrics;
/**
 * Create empty MeetingLoadMetrics for when no calendar is connected.
 */
export declare function emptyMeetingLoadMetrics(date: string): MeetingLoadMetrics;
