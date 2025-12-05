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

// =============================================================================
// PROVIDER TYPES
// =============================================================================

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

// =============================================================================
// BUSY BLOCK (Privacy-First Unit)
// =============================================================================

/**
 * A single busy block from the calendar.
 * Privacy-first: Only contains start/end times, no event details.
 */
export interface BusyBlock {
  start: string;  // ISO 8601 timestamp
  end: string;    // ISO 8601 timestamp
}

// =============================================================================
// MEETING LOAD METRICS (Calculated Daily)
// =============================================================================

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

// =============================================================================
// MEETING LOAD THRESHOLDS
// =============================================================================

/**
 * Meeting load classification thresholds.
 * Reference: PHASE_III_IMPLEMENTATION_PLAN.md - Component 4
 */
export const MEETING_LOAD_THRESHOLDS = {
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
} as const;

/**
 * Meeting load classification based on hours.
 */
export type MeetingLoadClassification = 'light' | 'moderate' | 'heavy' | 'overload';

/**
 * Classify meeting load based on total hours.
 */
export function classifyMeetingLoad(totalHours: number): MeetingLoadClassification {
  if (totalHours <= MEETING_LOAD_THRESHOLDS.LIGHT_MAX) return 'light';
  if (totalHours <= MEETING_LOAD_THRESHOLDS.MODERATE_MAX) return 'moderate';
  if (totalHours < MEETING_LOAD_THRESHOLDS.OVERLOAD_THRESHOLD) return 'heavy';
  return 'overload';
}

// =============================================================================
// CALENDAR INTEGRATION (Per-User Connection)
// =============================================================================

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

// =============================================================================
// DAILY CALENDAR METRICS (Stored for Trends)
// =============================================================================

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

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

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

// =============================================================================
// CONVERSION UTILITIES
// =============================================================================

/**
 * Convert CalendarIntegration to database row format.
 */
export function toCalendarIntegrationRow(
  integration: Partial<CalendarIntegration>
): Partial<CalendarIntegrationRow> {
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
export function fromCalendarIntegrationRow(
  row: CalendarIntegrationRow
): CalendarIntegration {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider as CalendarProvider,
    accessTokenEncrypted: row.access_token_encrypted,
    refreshTokenEncrypted: row.refresh_token_encrypted,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at) : null,
    lastSyncStatus: row.last_sync_status as CalendarSyncStatus,
    lastSyncError: row.last_sync_error,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert DailyCalendarMetrics to database row format.
 */
export function toDailyCalendarMetricsRow(
  metrics: Partial<DailyCalendarMetrics>
): Partial<DailyCalendarMetricsRow> {
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
export function fromDailyCalendarMetricsRow(
  row: DailyCalendarMetricsRow
): DailyCalendarMetrics {
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
    provider: row.provider as CalendarProvider,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Create empty MeetingLoadMetrics for when no calendar is connected.
 */
export function emptyMeetingLoadMetrics(date: string): MeetingLoadMetrics {
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
