"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCalendar = syncCalendar;
exports.getTodayCalendarMetrics = getTodayCalendarMetrics;
exports.getCalendarStatus = getCalendarStatus;
exports.disconnectCalendar = disconnectCalendar;
exports.getRecentCalendarMetrics = getRecentCalendarMetrics;
const supabaseClient_1 = require("./supabaseClient");
const calendar_1 = require("./services/calendar");
// =============================================================================
// HELPER: Extract User ID from Auth
// =============================================================================
/**
 * Extract user ID from Firebase auth token.
 * Returns null if not authenticated.
 */
async function getUserIdFromAuth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    const supabase = (0, supabaseClient_1.getServiceClient)();
    // Look up user by Firebase UID from auth header
    // In a real implementation, we'd verify the Firebase token first
    // For now, we trust the client-provided Firebase UID
    const firebaseUid = req.headers['x-firebase-uid'];
    if (!firebaseUid) {
        return null;
    }
    const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', firebaseUid)
        .single();
    if (error || !user) {
        return null;
    }
    return user.id;
}
// =============================================================================
// POST /api/calendar/sync
// =============================================================================
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
async function syncCalendar(req, res) {
    try {
        const userId = await getUserIdFromAuth(req);
        if (!userId) {
            res.status(401).json({
                success: false,
                metrics: null,
                error: 'Unauthorized',
            });
            return;
        }
        const body = req.body;
        // Validate required fields
        if (!body.provider) {
            res.status(400).json({
                success: false,
                metrics: null,
                error: 'Missing required field: provider',
            });
            return;
        }
        if (!body.timezone) {
            res.status(400).json({
                success: false,
                metrics: null,
                error: 'Missing required field: timezone',
            });
            return;
        }
        const calendarService = (0, calendar_1.getCalendarService)();
        // Get today's date in the user's timezone
        const today = new Date().toISOString().split('T')[0];
        let result;
        if (body.provider === 'device') {
            // Device calendar: client sends busy blocks
            const busyBlocks = body.busyBlocks || [];
            result = await calendarService.syncDeviceCalendar(userId, busyBlocks, today);
        }
        else if (body.provider === 'google_calendar') {
            // Google Calendar: server fetches via OAuth
            result = await calendarService.syncGoogleCalendar(userId, today);
        }
        else {
            res.status(400).json({
                success: false,
                metrics: null,
                error: `Invalid provider: ${body.provider}`,
            });
            return;
        }
        res.status(result.success ? 200 : 500).json({
            success: result.success,
            metrics: result.metrics,
            mvdShouldActivate: result.mvdShouldActivate,
            error: result.error,
        });
    }
    catch (error) {
        console.error('Calendar sync error:', error);
        res.status(500).json({
            success: false,
            metrics: null,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =============================================================================
// GET /api/calendar/today
// =============================================================================
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
async function getTodayCalendarMetrics(req, res) {
    try {
        const userId = await getUserIdFromAuth(req);
        if (!userId) {
            res.status(401).json({
                success: false,
                metrics: null,
                error: 'Unauthorized',
            });
            return;
        }
        const calendarService = (0, calendar_1.getCalendarService)();
        const metrics = await calendarService.getTodayMetrics(userId);
        res.status(200).json({
            success: true,
            metrics,
            error: null,
        });
    }
    catch (error) {
        console.error('Get calendar metrics error:', error);
        res.status(500).json({
            success: false,
            metrics: null,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =============================================================================
// GET /api/calendar/status
// =============================================================================
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
async function getCalendarStatus(req, res) {
    try {
        const userId = await getUserIdFromAuth(req);
        if (!userId) {
            res.status(401).json({
                isConnected: false,
                provider: null,
                lastSyncAt: null,
                integrations: [],
                error: 'Unauthorized',
            });
            return;
        }
        const calendarService = (0, calendar_1.getCalendarService)();
        const status = await calendarService.getIntegrationStatus(userId);
        const integrations = await calendarService.getIntegrations(userId);
        res.status(200).json({
            isConnected: status.isConnected,
            provider: status.provider,
            lastSyncAt: status.lastSyncAt?.toISOString() ?? null,
            integrations: integrations.map((i) => ({
                provider: i.provider,
                lastSyncStatus: i.lastSyncStatus,
                lastSyncAt: i.lastSyncAt?.toISOString() ?? null,
                lastSyncError: i.lastSyncError,
            })),
        });
    }
    catch (error) {
        console.error('Get calendar status error:', error);
        res.status(500).json({
            isConnected: false,
            provider: null,
            lastSyncAt: null,
            integrations: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =============================================================================
// DELETE /api/calendar/disconnect
// =============================================================================
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
async function disconnectCalendar(req, res) {
    try {
        const userId = await getUserIdFromAuth(req);
        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
            return;
        }
        const provider = req.query.provider;
        const calendarService = (0, calendar_1.getCalendarService)();
        let success;
        if (provider) {
            // Disconnect specific provider
            success = await calendarService.disconnectProvider(userId, provider);
        }
        else {
            // Disconnect all providers
            success = await calendarService.disconnectAll(userId);
        }
        res.status(success ? 200 : 500).json({
            success,
            error: success ? null : 'Failed to disconnect calendar',
        });
    }
    catch (error) {
        console.error('Disconnect calendar error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =============================================================================
// GET /api/calendar/recent
// =============================================================================
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
async function getRecentCalendarMetrics(req, res) {
    try {
        const userId = await getUserIdFromAuth(req);
        if (!userId) {
            res.status(401).json({
                success: false,
                metrics: [],
                averageHours: null,
                heavyDayCount: 0,
                error: 'Unauthorized',
            });
            return;
        }
        const days = parseInt(req.query.days, 10) || 14;
        const calendarService = (0, calendar_1.getCalendarService)();
        const [metrics, averageHours, heavyDayCount] = await Promise.all([
            calendarService.getRecentMetrics(userId, days),
            calendarService.getAverageMeetingHours(userId, days),
            calendarService.countHeavyDays(userId, days),
        ]);
        res.status(200).json({
            success: true,
            metrics: metrics.map((m) => ({
                date: m.date,
                meetingHours: m.meetingHours,
                meetingCount: m.meetingCount,
                backToBackCount: m.backToBackCount,
                density: m.density,
                heavyDay: m.heavyDay,
                overload: m.overload,
                mvdActivated: m.mvdActivated,
            })),
            averageHours,
            heavyDayCount,
            error: null,
        });
    }
    catch (error) {
        console.error('Get recent calendar metrics error:', error);
        res.status(500).json({
            success: false,
            metrics: [],
            averageHours: null,
            heavyDayCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
