/**
 * Calendar Sync API Handlers for Apex OS Phase 3
 *
 * Endpoints for calendar integration, sync, and meeting load queries.
 * Privacy-first: Only processes busy blocks, never event details.
 *
 * @file functions/src/calendarSync.ts
 * @author Claude Opus 4.5 (Session 43)
 * @created December 5, 2025
 */
import { Request, Response } from 'express';
/**
 * Sync calendar data (busy blocks from client or trigger Google sync).
 *
 * Request body:
 * {
 *   provider: 'device' | 'google_calendar',
 *   busyBlocks?: Array<{ start: string, end: string }>,  // For device provider
 *   timezone: string  // IANA timezone (e.g., 'America/New_York')
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   metrics: MeetingLoadMetrics | null,
 *   error?: string
 * }
 */
export declare function syncCalendar(req: Request, res: Response): Promise<void>;
/**
 * Get today's meeting load metrics for the authenticated user.
 *
 * Response:
 * {
 *   success: boolean,
 *   metrics: MeetingLoadMetrics | null,
 *   error?: string
 * }
 */
export declare function getTodayCalendarMetrics(req: Request, res: Response): Promise<void>;
/**
 * Get calendar integration status for the authenticated user.
 *
 * Response:
 * {
 *   isConnected: boolean,
 *   provider: CalendarProvider | null,
 *   lastSyncAt: string | null,
 *   integrations: Array<{ provider, lastSyncStatus, lastSyncAt }>
 * }
 */
export declare function getCalendarStatus(req: Request, res: Response): Promise<void>;
/**
 * Disconnect a calendar provider for the authenticated user.
 *
 * Query params:
 * - provider: 'device' | 'google_calendar' (optional, disconnects all if not specified)
 *
 * Response:
 * {
 *   success: boolean,
 *   error?: string
 * }
 */
export declare function disconnectCalendar(req: Request, res: Response): Promise<void>;
/**
 * Get recent calendar metrics for trend analysis.
 *
 * Query params:
 * - days: number (default: 14)
 *
 * Response:
 * {
 *   success: boolean,
 *   metrics: DailyCalendarMetrics[],
 *   averageHours: number | null,
 *   heavyDayCount: number,
 *   error?: string
 * }
 */
export declare function getRecentCalendarMetrics(req: Request, res: Response): Promise<void>;
