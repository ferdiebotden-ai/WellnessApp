/**
 * Manual Check-in API Endpoints
 *
 * POST /api/manual-check-in — Submit a morning check-in
 * GET /api/manual-check-in/today — Get today's check-in
 *
 * These endpoints handle manual wellness check-ins for Lite Mode users
 * (users without wearables). Check-ins collect sleep quality, sleep hours,
 * and energy level to produce a "Check-in Score".
 *
 * @file functions/src/manualCheckIn.ts
 * @author Claude Opus 4.5 (Session 49)
 * @created December 5, 2025
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getServiceClient } from './supabaseClient';
import { authenticateRequest } from './users';
import { calculateCheckInScore, validateCheckInInput } from './services/checkInScore';
import {
  ManualCheckInRequest,
  ManualCheckInInput,
  CheckInResult,
  CheckInPayload,
  GetCheckInResponse,
  SubmitCheckInResponse,
} from './types/checkIn.types';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function resolveError(error: unknown): { status: number; message: string } {
  if (typeof error === 'object' && error !== null) {
    const maybeStatus = (error as { status?: number }).status;
    if (typeof maybeStatus === 'number') {
      return { status: maybeStatus, message: (error as Error).message };
    }
  }
  return { status: 500, message: (error as Error).message };
}

/**
 * Get today's date in YYYY-MM-DD format.
 */
function getToday(timezone?: string): string {
  // If timezone provided, try to use it for date calculation
  // For simplicity, we use UTC date
  return new Date().toISOString().split('T')[0];
}

// =============================================================================
// POST /api/manual-check-in
// =============================================================================

/**
 * Submit a manual check-in.
 *
 * Request body:
 * - sleepQuality: 1-5 (required)
 * - sleepHours: '<5' | '5-6' | '6-7' | '7-8' | '8+' (required)
 * - energyLevel: 1-5 (required)
 * - wakeTime: ISO timestamp (optional)
 * - timezone: IANA timezone (optional)
 * - skipped: boolean (optional, use defaults if true)
 */
export async function submitManualCheckIn(req: Request, res: Response): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { uid } = await authenticateRequest(req);
    const body = req.body as ManualCheckInRequest;

    const serviceClient = getServiceClient();

    // 1. Get Supabase user by Firebase UID
    const { data: user, error: userError } = await serviceClient
      .from('users')
      .select('id')
      .eq('firebase_uid', uid)
      .single();

    if (userError || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userId = user.id as string;

    // 2. Handle skipped check-in
    const skipped = body.skipped === true;

    // 3. Validate input if not skipped
    if (!skipped) {
      const validationError = validateCheckInInput(body);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }
    }

    // 4. Build input
    const input: ManualCheckInInput = skipped
      ? { sleepQuality: 3, sleepHours: '7-8', energyLevel: 3 }
      : {
          sleepQuality: body.sleepQuality,
          sleepHours: body.sleepHours,
          energyLevel: body.energyLevel,
        };

    // 5. Calculate check-in score
    const result: CheckInResult = calculateCheckInScore(input, skipped);

    // 6. Build payload for storage
    const today = getToday(body.timezone);
    const now = new Date().toISOString();

    const payload: CheckInPayload = {
      type: 'manual_check_in',
      version: 1,
      input,
      result,
      submittedAt: now,
      timezone: body.timezone || 'UTC',
    };

    // 7. Upsert into daily_metrics
    const { error: upsertError } = await serviceClient
      .from('daily_metrics')
      .upsert(
        {
          id: uuidv4(),
          user_id: userId,
          date: today,
          wearable_source: 'manual',
          recovery_score: result.score,
          recovery_confidence: result.confidence,
          raw_payload: payload,
          created_at: now,
          updated_at: now,
        },
        {
          onConflict: 'user_id,date',
          ignoreDuplicates: false,
        }
      );

    if (upsertError) {
      console.error('[submitManualCheckIn] Upsert error:', upsertError);
      throw upsertError;
    }

    // 8. Return result
    const response: SubmitCheckInResponse = {
      success: true,
      checkIn: result,
      date: today,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('[submitManualCheckIn] Error:', error);
    const { status, message } = resolveError(error);
    res.status(status).json({ error: message });
  }
}

// =============================================================================
// GET /api/manual-check-in/today
// =============================================================================

/**
 * Get today's check-in for the authenticated user.
 */
export async function getTodayCheckIn(req: Request, res: Response): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { uid } = await authenticateRequest(req);
    const timezone = req.query.timezone as string | undefined;

    const serviceClient = getServiceClient();

    // 1. Get Supabase user by Firebase UID
    const { data: user, error: userError } = await serviceClient
      .from('users')
      .select('id')
      .eq('firebase_uid', uid)
      .single();

    if (userError || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userId = user.id as string;
    const today = getToday(timezone);

    // 2. Query for today's manual check-in
    const { data: metrics, error: metricsError } = await serviceClient
      .from('daily_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .eq('wearable_source', 'manual')
      .single();

    if (metricsError && metricsError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      console.error('[getTodayCheckIn] Query error:', metricsError);
      throw metricsError;
    }

    // 3. Extract check-in result if exists
    if (metrics && metrics.raw_payload) {
      const payload = metrics.raw_payload as CheckInPayload;
      if (payload.type === 'manual_check_in' && payload.result) {
        const response: GetCheckInResponse = {
          hasCheckedIn: true,
          checkIn: payload.result,
          date: today,
        };
        res.status(200).json(response);
        return;
      }
    }

    // 4. No check-in found
    const response: GetCheckInResponse = {
      hasCheckedIn: false,
      checkIn: null,
      date: today,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('[getTodayCheckIn] Error:', error);
    const { status, message } = resolveError(error);
    res.status(status).json({ error: message });
  }
}
