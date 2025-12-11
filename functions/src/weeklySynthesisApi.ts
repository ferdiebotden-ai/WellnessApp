/**
 * Weekly Synthesis API Endpoint
 *
 * Returns user's latest weekly synthesis narrative and insights.
 * Per PRD Section 4.5 - Weekly Synthesis (5-section narrative).
 */

import { Request, Response } from 'express';
import type { PostgrestError } from '@supabase/supabase-js';
import { getServiceClient } from './supabaseClient';
import { authenticateRequest } from './users';
import { SYNTHESIS_CONFIG } from './synthesis/types';

/**
 * Metrics summary from the synthesis
 */
interface MetricsSummary {
  protocol_adherence?: number;
  days_with_completion?: number;
  avg_recovery_score?: number | null;
  hrv_trend_percent?: number | null;
  sleep_quality_trend_percent?: number | null;
  total_protocols_completed?: number;
  data_days_available?: number;
  has_wearable_data?: boolean;
  protocol_breakdown?: Array<{
    protocol_id: string;
    name: string;
    completed_days: number;
    completion_rate: number;
  }>;
}

/**
 * Response format for GET /api/users/me/weekly-synthesis
 */
export interface WeeklySynthesisResponse {
  has_synthesis: boolean;
  synthesis: {
    id: string;
    week_start: string;
    week_end: string;
    narrative: string;
    win_of_week: string;
    area_to_watch: string;
    pattern_insight: string | null;
    trajectory_prediction: string | null;
    experiment: string;
    metrics: MetricsSummary;
    generated_at: string;
  } | null;
  days_tracked: number;
  min_days_required: number;
}

/**
 * Row shape from weekly_syntheses table
 */
interface WeeklySynthesisRow {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  narrative: string;
  win_of_week: string;
  area_to_watch: string;
  pattern_insight: string | null;
  trajectory_prediction: string | null;
  experiment: string;
  metrics_summary: MetricsSummary | null;
  generated_at: string;
  read_at: string | null;
}

function resolveError(error: unknown): { status: number; message: string } {
  if (typeof error === 'object' && error !== null) {
    const maybeStatus = (error as { status?: number }).status;
    if (typeof maybeStatus === 'number') {
      return { status: maybeStatus, message: (error as Error).message };
    }

    const maybePostgrest = error as PostgrestError;
    if (typeof maybePostgrest.code === 'string') {
      if (maybePostgrest.code === 'PGRST116') {
        return { status: 404, message: 'No synthesis found' };
      }
      return { status: 400, message: maybePostgrest.message };
    }
  }

  return { status: 500, message: (error as Error).message };
}

/**
 * GET /api/users/me/weekly-synthesis
 *
 * Returns the user's latest weekly synthesis narrative and insights.
 * If no synthesis exists, returns has_synthesis: false with days_tracked.
 */
export async function getLatestWeeklySynthesis(req: Request, res: Response): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // Authenticate and get Firebase UID
    const { uid } = await authenticateRequest(req);
    const supabase = getServiceClient();

    // Get user's Supabase ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', uid)
      .single();

    if (userError || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Fetch most recent weekly synthesis
    const { data: synthesis, error: synthesisError } = await supabase
      .from('weekly_syntheses')
      .select(`
        id,
        user_id,
        week_start,
        week_end,
        narrative,
        win_of_week,
        area_to_watch,
        pattern_insight,
        trajectory_prediction,
        experiment,
        metrics_summary,
        generated_at,
        read_at
      `)
      .eq('user_id', user.id)
      .order('week_end', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (synthesisError) {
      throw synthesisError;
    }

    // Count days with protocol completions for progress indication
    const { count: logCount } = await supabase
      .from('protocol_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const daysTracked = logCount ?? 0;

    // If no synthesis exists, return empty state
    if (!synthesis) {
      const response: WeeklySynthesisResponse = {
        has_synthesis: false,
        synthesis: null,
        days_tracked: daysTracked,
        min_days_required: SYNTHESIS_CONFIG.MIN_DATA_DAYS,
      };

      res.status(200).json(response);
      return;
    }

    // Mark as read if this is the first read
    const typedSynthesis = synthesis as WeeklySynthesisRow;
    if (!typedSynthesis.read_at) {
      await supabase
        .from('weekly_syntheses')
        .update({ read_at: new Date().toISOString() })
        .eq('id', typedSynthesis.id);
    }

    // Return the full synthesis
    const response: WeeklySynthesisResponse = {
      has_synthesis: true,
      synthesis: {
        id: typedSynthesis.id,
        week_start: typedSynthesis.week_start,
        week_end: typedSynthesis.week_end,
        narrative: typedSynthesis.narrative,
        win_of_week: typedSynthesis.win_of_week,
        area_to_watch: typedSynthesis.area_to_watch,
        pattern_insight: typedSynthesis.pattern_insight,
        trajectory_prediction: typedSynthesis.trajectory_prediction,
        experiment: typedSynthesis.experiment,
        metrics: typedSynthesis.metrics_summary ?? {},
        generated_at: typedSynthesis.generated_at,
      },
      days_tracked: daysTracked,
      min_days_required: SYNTHESIS_CONFIG.MIN_DATA_DAYS,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('[WeeklySynthesis API] Error:', error);
    const { status, message } = resolveError(error);
    res.status(status).json({ error: message });
  }
}
