/**
 * Correlations API Endpoint
 *
 * Returns user's protocol-outcome correlations from the most recent weekly synthesis.
 * Per PRD Section 5.8 - Correlation Dashboard.
 */

import { Request, Response } from 'express';
import type { PostgrestError } from '@supabase/supabase-js';
import { getServiceClient } from './supabaseClient';
import { authenticateRequest } from './users';
import { SYNTHESIS_CONFIG, ProtocolCorrelation, OutcomeMetric } from './synthesis/types';

/**
 * Response format for GET /api/users/me/correlations
 */
interface CorrelationsResponse {
  correlations: ClientCorrelation[];
  days_tracked: number;
  min_days_required: number;
}

/**
 * Client-friendly correlation format (matches PRD Section 5.8)
 */
interface ClientCorrelation {
  protocol: string;
  protocol_name: string;
  outcome: OutcomeMetric;
  outcome_name: string;
  r: number;
  p_value: number;
  is_significant: boolean;
  sample_size: number;
  direction: 'positive' | 'negative' | 'neutral';
  interpretation: string;
}

/**
 * Human-readable names for outcome metrics
 */
const OUTCOME_NAMES: Record<OutcomeMetric, string> = {
  sleep_hours: 'Sleep Duration',
  hrv_score: 'HRV Score',
  recovery_score: 'Recovery Score',
  resting_hr: 'Resting Heart Rate',
};

/**
 * Row shape from weekly_syntheses table
 */
interface WeeklySynthesisRow {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  metrics_summary: {
    correlations?: ProtocolCorrelation[];
    data_days_available?: number;
    [key: string]: unknown;
  } | null;
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
        return { status: 404, message: 'No correlations found' };
      }
      return { status: 400, message: maybePostgrest.message };
    }
  }

  return { status: 500, message: (error as Error).message };
}

/**
 * Transform backend ProtocolCorrelation to client-friendly format
 */
function toClientCorrelation(c: ProtocolCorrelation): ClientCorrelation {
  return {
    protocol: c.protocol,
    protocol_name: c.protocol_name,
    outcome: c.outcome,
    outcome_name: OUTCOME_NAMES[c.outcome],
    r: Math.round(c.correlation * 100) / 100, // Round to 2 decimals
    p_value: Math.round(c.p_value * 1000) / 1000, // Round to 3 decimals
    is_significant: c.is_significant,
    sample_size: c.sample_size,
    direction: c.direction,
    interpretation: c.interpretation,
  };
}

/**
 * GET /api/users/me/correlations
 *
 * Returns the user's protocol-outcome correlations from their most recent weekly synthesis.
 * If no synthesis exists, returns empty correlations with days_tracked = 0.
 */
export async function getUserCorrelations(req: Request, res: Response): Promise<void> {
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
      .select('id, user_id, week_start, week_end, metrics_summary')
      .eq('user_id', user.id)
      .order('week_end', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (synthesisError) {
      throw synthesisError;
    }

    // If no synthesis exists, return empty state
    if (!synthesis) {
      // Count protocol_logs to get days_tracked
      const { count: logCount, error: countError } = await supabase
        .from('protocol_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (countError) {
        console.error('[Correlations] Failed to count protocol logs:', countError);
      }

      const response: CorrelationsResponse = {
        correlations: [],
        days_tracked: logCount ?? 0,
        min_days_required: SYNTHESIS_CONFIG.MIN_CORRELATION_DAYS,
      };

      res.status(200).json(response);
      return;
    }

    // Extract correlations from metrics_summary
    const typedSynthesis = synthesis as WeeklySynthesisRow;
    const correlations = typedSynthesis.metrics_summary?.correlations ?? [];
    const daysTracked = typedSynthesis.metrics_summary?.data_days_available ?? 0;

    // Transform to client format and limit to top 5
    const clientCorrelations = correlations
      .slice(0, SYNTHESIS_CONFIG.MAX_CORRELATIONS)
      .map(toClientCorrelation);

    const response: CorrelationsResponse = {
      correlations: clientCorrelations,
      days_tracked: daysTracked,
      min_days_required: SYNTHESIS_CONFIG.MIN_CORRELATION_DAYS,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('[Correlations] Error:', error);
    const { status, message } = resolveError(error);
    res.status(status).json({ error: message });
  }
}
