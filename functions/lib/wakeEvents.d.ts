/**
 * Wake Events API Handler
 *
 * Handles wake detection events from clients and triggers Morning Anchor nudges.
 *
 * POST /api/wake-events
 * - Receives wake detection from HealthKit or phone unlock
 * - Validates and processes wake event
 * - Triggers Morning Anchor if appropriate
 *
 * @file functions/src/wakeEvents.ts
 * @author Claude Opus 4.5 (Session 42)
 * @created December 5, 2025
 */
import { Request, Response } from 'express';
/**
 * POST /api/wake-events
 *
 * Receives wake detection events from the client and triggers Morning Anchor.
 *
 * Request body:
 * {
 *   "source": "healthkit" | "phone_unlock" | "manual",
 *   "wake_time": "2025-12-05T06:30:00Z",
 *   "user_confirmed_at": "2025-12-05T06:31:00Z", // Optional, for phone unlock
 *   "sleep_start_time": "2025-12-04T22:00:00Z",  // Optional, for nap detection
 *   "timezone": "America/New_York"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "wake_event_id": "uuid",
 *   "morning_anchor_triggered": true,
 *   "nudge_id": "firestore-doc-id",
 *   "message": "Morning Anchor triggered successfully"
 * }
 */
export declare function createWakeEvent(req: Request, res: Response): Promise<void>;
/**
 * GET /api/wake-events/today
 *
 * Get today's wake event for the authenticated user.
 */
export declare function getTodayWakeEvent(req: Request, res: Response): Promise<void>;
