/**
 * Calendar Types for Apex OS Client
 *
 * @file client/src/services/calendar/types.ts
 * @author Claude Opus 4.5 (Session 43)
 * @created December 5, 2025
 */

/**
 * Supported calendar providers.
 */
export type CalendarProvider = 'device' | 'google_calendar';

/**
 * Sync status for calendar integrations.
 */
export type CalendarSyncStatus =
  | 'success'
  | 'failed'
  | 'pending'
  | 'not_connected';

/**
 * A single busy block (start/end times only, privacy-first).
 */
export interface BusyBlock {
  start: string; // ISO 8601 timestamp
  end: string; // ISO 8601 timestamp
}

/**
 * Meeting load metrics returned from server.
 */
export interface MeetingLoadMetrics {
  date: string;
  totalHours: number;
  meetingCount: number;
  backToBackCount: number;
  density: number;
  heavyDay: boolean;
  overload: boolean;
  calculatedAt: string;
}

/**
 * Calendar integration status from server.
 */
export interface CalendarIntegrationStatus {
  isConnected: boolean;
  provider: CalendarProvider | null;
  lastSyncAt: string | null;
  integrations: Array<{
    provider: CalendarProvider;
    lastSyncStatus: CalendarSyncStatus;
    lastSyncAt: string | null;
    lastSyncError: string | null;
  }>;
}

/**
 * Response from calendar sync endpoint.
 */
export interface CalendarSyncResponse {
  success: boolean;
  metrics: MeetingLoadMetrics | null;
  mvdShouldActivate: boolean;
  error: string | null;
}

/**
 * Recent calendar metrics response.
 */
export interface RecentMetricsResponse {
  success: boolean;
  metrics: Array<{
    date: string;
    meetingHours: number;
    meetingCount: number;
    backToBackCount: number;
    density: number;
    heavyDay: boolean;
    overload: boolean;
    mvdActivated: boolean;
  }>;
  averageHours: number | null;
  heavyDayCount: number;
  error: string | null;
}
