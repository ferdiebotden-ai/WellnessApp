/**
 * Health History API Endpoint
 *
 * GET /api/health/history?days=7|14|30
 *
 * Returns historical health data for the authenticated user.
 * Used for trend charts in the Health Dashboard.
 *
 * @file functions/src/healthHistory.ts
 * @author Claude Opus 4.5 (Session 85)
 * @created December 26, 2025
 */

import { Request, Response } from 'express';
import { getServiceClient } from './supabaseClient';
import { authenticateRequest } from './users';

// =============================================================================
// TYPES
// =============================================================================

interface DayMetrics {
  date: string;
  sleep: {
    durationHours: number | null;
    efficiency: number | null;
    deepPct: number | null;
    remPct: number | null;
  };
  hrv: {
    avg: number | null;
    method: 'rmssd' | 'sdnn' | null;
  };
  rhr: {
    avg: number | null;
  };
  steps: number | null;
  activeCalories: number | null;
  recoveryScore: number | null;
}

interface HealthHistoryResponse {
  days: DayMetrics[];
  dateRange: {
    start: string;
    end: string;
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Transform raw database row to client-friendly format.
 */
function transformMetricsRow(row: Record<string, unknown>): DayMetrics {
  return {
    date: row.date as string,
    sleep: {
      durationHours: row.sleep_duration_hours != null
        ? parseFloat(String(row.sleep_duration_hours))
        : null,
      efficiency: row.sleep_efficiency != null
        ? parseInt(String(row.sleep_efficiency), 10)
        : null,
      deepPct: row.deep_percentage != null
        ? parseInt(String(row.deep_percentage), 10)
        : null,
      remPct: row.rem_percentage != null
        ? parseInt(String(row.rem_percentage), 10)
        : null,
    },
    hrv: {
      avg: row.hrv_avg != null ? parseFloat(String(row.hrv_avg)) : null,
      method: (row.hrv_method as 'rmssd' | 'sdnn' | null) ?? null,
    },
    rhr: {
      avg: row.rhr_avg != null ? parseFloat(String(row.rhr_avg)) : null,
    },
    steps: row.steps != null ? parseInt(String(row.steps), 10) : null,
    activeCalories: row.active_calories != null
      ? parseInt(String(row.active_calories), 10)
      : null,
    recoveryScore: row.recovery_score != null
      ? parseInt(String(row.recovery_score), 10)
      : null,
  };
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

/**
 * GET /api/health/history?days=7|14|30
 *
 * Returns historical health data for the authenticated user.
 */
export async function getHealthHistory(req: Request, res: Response): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { uid } = await authenticateRequest(req);
    const daysParam = req.query.days as string | undefined;

    // Parse and validate days parameter
    const daysRaw = parseInt(daysParam || '7', 10);
    const validDays = [7, 14, 30];
    const days = validDays.includes(daysRaw) ? daysRaw : 7;

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

    // 2. Calculate date range
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (days - 1));

    const endDateStr = today.toISOString().split('T')[0];
    const startDateStr = startDate.toISOString().split('T')[0];

    // 3. Fetch historical data
    const { data: metricsRows, error: metricsError } = await serviceClient
      .from('daily_metrics')
      .select(`
        date,
        sleep_duration_hours,
        sleep_efficiency,
        deep_percentage,
        rem_percentage,
        hrv_avg,
        hrv_method,
        rhr_avg,
        steps,
        active_calories,
        recovery_score
      `)
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true });

    if (metricsError) {
      console.error('[getHealthHistory] Query error:', metricsError);
      res.status(500).json({ error: 'Failed to fetch health history' });
      return;
    }

    // 4. Transform data
    const daysData: DayMetrics[] = (metricsRows || []).map(transformMetricsRow);

    // 5. Return response
    const response: HealthHistoryResponse = {
      days: daysData,
      dateRange: {
        start: startDateStr,
        end: endDateStr,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('[getHealthHistory] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
}
