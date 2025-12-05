/**
 * Calendar Service Module Exports
 *
 * @file functions/src/services/calendar/index.ts
 */

// Service
export {
  CalendarService,
  getCalendarService,
  type CalculateMeetingLoadResult,
  type SyncCalendarResult,
} from './CalendarService';

// Repository
export {
  CalendarRepository,
  getCalendarRepository,
  type CreateCalendarIntegrationInput,
  type UpdateSyncStatusInput,
  type UpsertDailyMetricsInput,
  type QueryResult,
  type ListResult,
} from './CalendarRepository';

// Re-export types for convenience
export {
  type BusyBlock,
  type CalendarProvider,
  type CalendarSyncStatus,
  type MeetingLoadMetrics,
  type CalendarIntegration,
  type DailyCalendarMetrics,
  type CalendarSyncRequest,
  type CalendarSyncResponse,
  type GoogleCalendarConnectRequest,
  type CalendarConnectResponse,
  type MeetingLoadClassification,
  MEETING_LOAD_THRESHOLDS,
  classifyMeetingLoad,
  emptyMeetingLoadMetrics,
} from '../../types/calendar.types';
