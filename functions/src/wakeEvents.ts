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
import { extractBearerToken } from './utils/http';
import { verifyFirebaseToken } from './firebaseAdmin';
import { getServiceClient } from './supabaseClient';
import {
  getWakeDetector,
  getWakeEventRepository,
  getMorningAnchorService,
  WakeDetectionInput,
} from './services/wake';
import {
  WakeSourceMetrics,
  PhoneUnlockMetrics,
  HrvSpikeMetrics,
  ManualWakeMetrics,
} from './types/wake.types';

// =============================================================================
// TYPES
// =============================================================================

interface WakeEventPayload {
  source: 'healthkit' | 'phone_unlock' | 'manual';
  wake_time: string; // ISO 8601
  user_confirmed_at?: string; // ISO 8601 (for phone unlock confirmation)
  sleep_start_time?: string; // ISO 8601 (for nap detection)
  timezone: string; // IANA timezone
}

// =============================================================================
// VALIDATION
// =============================================================================

function isValidSource(source: unknown): source is 'healthkit' | 'phone_unlock' | 'manual' {
  return source === 'healthkit' || source === 'phone_unlock' || source === 'manual';
}

function isValidTimezone(timezone: unknown): timezone is string {
  if (typeof timezone !== 'string') return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

function isValidISODate(dateStr: unknown): dateStr is string {
  if (typeof dateStr !== 'string') return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// =============================================================================
// HANDLER
// =============================================================================

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
export async function createWakeEvent(req: Request, res: Response): Promise<void> {
  try {
    // 1. Authenticate user
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Missing authorization token' });
      return;
    }

    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken) {
      res.status(401).json({ error: 'Invalid authorization token' });
      return;
    }

    const firebaseUid = decodedToken.uid;

    // 2. Get user ID from Supabase
    const supabase = getServiceClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, preferences')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (userError || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userId = user.id;
    const userTimezone = user.preferences?.timezone || 'UTC';

    // 3. Validate request body
    const body = req.body as WakeEventPayload;

    if (!isValidSource(body.source)) {
      res.status(400).json({
        error: 'Invalid source. Must be "healthkit", "phone_unlock", or "manual"',
      });
      return;
    }

    if (!isValidISODate(body.wake_time)) {
      res.status(400).json({ error: 'Invalid wake_time. Must be ISO 8601 format' });
      return;
    }

    const timezone = body.timezone || userTimezone;
    if (!isValidTimezone(timezone)) {
      res.status(400).json({ error: 'Invalid timezone. Must be IANA timezone' });
      return;
    }

    // 4. Check if wake event already exists for today
    const wakeDate = new Date(body.wake_time).toISOString().split('T')[0];
    const wakeRepo = getWakeEventRepository();
    const existsAlready = await wakeRepo.existsForToday(userId, wakeDate);

    if (existsAlready) {
      // Return existing event info without error
      const { data: existing } = await wakeRepo.getByUserAndDate(userId, wakeDate);
      res.status(200).json({
        success: true,
        wake_event_id: existing?.id,
        morning_anchor_triggered: !!existing?.morningAnchorTriggeredAt,
        already_exists: true,
        message: 'Wake event already recorded for today',
      });
      return;
    }

    // 5. Run wake detection
    const wakeDetector = getWakeDetector();
    const detectionInput: WakeDetectionInput = {
      userId,
      source: body.source,
      timezone,
      sleepEndTime: body.source === 'healthkit' ? new Date(body.wake_time) : undefined,
      sleepStartTime: body.sleep_start_time ? new Date(body.sleep_start_time) : undefined,
      phoneUnlockTime: body.source === 'phone_unlock' ? new Date(body.wake_time) : undefined,
      userConfirmedAt: body.user_confirmed_at ? new Date(body.user_confirmed_at) : undefined,
      reportedWakeTime: body.source === 'manual' ? new Date(body.wake_time) : undefined,
    };

    const detection = wakeDetector.detect(detectionInput);

    if (!detection.detected) {
      res.status(200).json({
        success: false,
        detected: false,
        reason: detection.reason,
        message: 'Wake not detected - may be too early, too late, or a nap',
      });
      return;
    }

    // 6. Build source metrics
    const sourceMetrics = buildSourceMetrics(body, detection);

    // 7. Create wake event in database
    const { data: wakeEvent, error: createError } = await wakeRepo.create({
      userId,
      date: wakeDate,
      wakeTime: detection.wakeTime!,
      detectionMethod: detection.method!,
      confidence: detection.effectiveConfidence,
      sourceMetrics,
    });

    if (createError || !wakeEvent) {
      res.status(500).json({
        error: 'Failed to create wake event',
        details: createError,
      });
      return;
    }

    // 8. Get recovery score for Morning Anchor context
    const { data: recoveryData } = await supabase
      .from('recovery_scores')
      .select('overall_score')
      .eq('user_id', userId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    const recoveryScore = recoveryData?.overall_score ?? undefined;

    // 9. Trigger Morning Anchor if appropriate
    const morningAnchorService = getMorningAnchorService();
    const anchorResult = await morningAnchorService.triggerMorningAnchor({
      wakeEvent,
      userId,
      recoveryScore,
      timezone,
    });

    // 10. Return result
    res.status(200).json({
      success: true,
      wake_event_id: wakeEvent.id,
      detected: true,
      detection_method: detection.method,
      confidence: detection.effectiveConfidence,
      wake_time: detection.wakeTime?.toISOString(),
      morning_anchor_triggered: anchorResult.triggered,
      morning_anchor_skipped: anchorResult.skipped,
      skip_reason: anchorResult.skipReason,
      nudge_id: anchorResult.nudgeId,
      scheduled_for: anchorResult.scheduledFor?.toISOString(),
      message: anchorResult.triggered
        ? 'Wake detected and Morning Anchor triggered'
        : anchorResult.skipped
          ? `Morning Anchor skipped: ${anchorResult.skipReason}`
          : 'Wake detected but Morning Anchor not triggered',
    });
  } catch (error) {
    console.error('[WakeEvents] Error processing wake event:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/wake-events/today
 *
 * Get today's wake event for the authenticated user.
 */
export async function getTodayWakeEvent(req: Request, res: Response): Promise<void> {
  try {
    // 1. Authenticate user
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Missing authorization token' });
      return;
    }

    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken) {
      res.status(401).json({ error: 'Invalid authorization token' });
      return;
    }

    const firebaseUid = decodedToken.uid;

    // 2. Get user ID from Supabase
    const supabase = getServiceClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (userError || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // 3. Get today's date in user's timezone (or UTC)
    const today = new Date().toISOString().split('T')[0];

    // 4. Query wake event
    const wakeRepo = getWakeEventRepository();
    const { data: wakeEvent, error } = await wakeRepo.getByUserAndDate(user.id, today);

    if (error) {
      res.status(500).json({ error: 'Failed to fetch wake event', details: error });
      return;
    }

    if (!wakeEvent) {
      res.status(200).json({
        found: false,
        message: 'No wake event recorded for today',
      });
      return;
    }

    res.status(200).json({
      found: true,
      wake_event: {
        id: wakeEvent.id,
        date: wakeEvent.date,
        wake_time: wakeEvent.wakeTime.toISOString(),
        detection_method: wakeEvent.detectionMethod,
        confidence: wakeEvent.confidence,
        morning_anchor_triggered_at: wakeEvent.morningAnchorTriggeredAt?.toISOString(),
        morning_anchor_skipped: wakeEvent.morningAnchorSkipped,
        skip_reason: wakeEvent.skipReason,
      },
    });
  } catch (error) {
    console.error('[WakeEvents] Error fetching today wake event:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Build source metrics from payload and detection result.
 */
function buildSourceMetrics(
  payload: WakeEventPayload,
  detection: ReturnType<ReturnType<typeof getWakeDetector>['detect']>
): WakeSourceMetrics {
  switch (payload.source) {
    case 'healthkit':
      return {
        method: 'hrv_spike',
        preWakeHrv: 0,
        postWakeHrv: 0,
        deltaPercent: 0,
        detectionWindowMinutes: 30,
      } as HrvSpikeMetrics;

    case 'phone_unlock':
      return {
        method: 'phone_unlock',
        firstUnlockTime: payload.wake_time,
        deviceTimezone: payload.timezone,
        isWorkday: isWorkday(new Date(payload.wake_time)),
      } as PhoneUnlockMetrics;

    case 'manual':
      return {
        method: 'manual',
        reportedAt: new Date().toISOString(),
        wakeTimeReported: payload.wake_time,
        source: 'app',
      } as ManualWakeMetrics;

    default:
      return detection.sourceMetrics || {
        method: 'manual',
        reportedAt: new Date().toISOString(),
        wakeTimeReported: payload.wake_time,
        source: 'app',
      } as ManualWakeMetrics;
  }
}

/**
 * Check if date is a workday (Monday-Friday).
 */
function isWorkday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}
