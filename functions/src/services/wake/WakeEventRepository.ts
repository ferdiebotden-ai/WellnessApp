/**
 * Wake Event Repository for Apex OS Phase 3
 *
 * Handles database operations for wake events stored in Supabase.
 * Uses the `wake_events` table created in Session 1 migration.
 *
 * @file functions/src/services/wake/WakeEventRepository.ts
 * @author Claude Opus 4.5 (Session 42)
 * @created December 5, 2025
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getServiceClient } from '../../supabaseClient';
import {
  WakeEvent,
  WakeEventRow,
  WakeDetectionMethod,
  WakeSourceMetrics,
  MorningAnchorSkipReason,
  fromWakeEventRow,
  toWakeEventRow,
} from '../../types/wake.types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Input for creating a new wake event.
 */
export interface CreateWakeEventInput {
  userId: string;
  date: string; // YYYY-MM-DD
  wakeTime: Date;
  detectionMethod: WakeDetectionMethod;
  confidence: number;
  sourceMetrics: WakeSourceMetrics;
}

/**
 * Result of wake event query.
 */
export interface WakeEventQueryResult {
  data: WakeEvent | null;
  error: string | null;
}

/**
 * Result of wake event list query.
 */
export interface WakeEventListResult {
  data: WakeEvent[];
  error: string | null;
}

// =============================================================================
// REPOSITORY CLASS
// =============================================================================

export class WakeEventRepository {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || getServiceClient();
  }

  /**
   * Create a new wake event.
   *
   * @param input - Wake event data
   * @returns Created wake event or error
   */
  async create(input: CreateWakeEventInput): Promise<WakeEventQueryResult> {
    const row: Partial<WakeEventRow> = {
      user_id: input.userId,
      date: input.date,
      wake_time: input.wakeTime.toISOString(),
      detection_method: input.detectionMethod,
      confidence: input.confidence,
      morning_anchor_triggered_at: null,
      morning_anchor_skipped: false,
      skip_reason: null,
      source_metrics: input.sourceMetrics,
    };

    const { data, error } = await this.supabase
      .from('wake_events')
      .insert(row)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (already exists for today)
      if (error.code === '23505') {
        return {
          data: null,
          error: 'Wake event already exists for this user and date',
        };
      }
      return { data: null, error: error.message };
    }

    return { data: fromWakeEventRow(data as WakeEventRow), error: null };
  }

  /**
   * Get wake event by ID.
   */
  async getById(id: string): Promise<WakeEventQueryResult> {
    const { data, error } = await this.supabase
      .from('wake_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: fromWakeEventRow(data as WakeEventRow), error: null };
  }

  /**
   * Get today's wake event for a user.
   * Uses the date field to find today's event.
   *
   * @param userId - User ID
   * @param date - Date in YYYY-MM-DD format
   */
  async getByUserAndDate(
    userId: string,
    date: string
  ): Promise<WakeEventQueryResult> {
    const { data, error } = await this.supabase
      .from('wake_events')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error) {
      // PGRST116 = no rows found (not an error for our use case)
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      return { data: null, error: error.message };
    }

    return { data: fromWakeEventRow(data as WakeEventRow), error: null };
  }

  /**
   * Check if a wake event already exists for today.
   *
   * @param userId - User ID
   * @param date - Date in YYYY-MM-DD format
   */
  async existsForToday(userId: string, date: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('wake_events')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    return !error && data !== null;
  }

  /**
   * Mark wake event as having triggered Morning Anchor.
   *
   * @param id - Wake event ID
   * @param triggeredAt - When Morning Anchor was triggered
   */
  async markTriggered(id: string, triggeredAt: Date): Promise<boolean> {
    const { error } = await this.supabase
      .from('wake_events')
      .update({
        morning_anchor_triggered_at: triggeredAt.toISOString(),
        morning_anchor_skipped: false,
        skip_reason: null,
      })
      .eq('id', id);

    return !error;
  }

  /**
   * Mark wake event as skipped (Morning Anchor not triggered).
   *
   * @param id - Wake event ID
   * @param reason - Reason for skipping
   */
  async markSkipped(id: string, reason: MorningAnchorSkipReason): Promise<boolean> {
    const { error } = await this.supabase
      .from('wake_events')
      .update({
        morning_anchor_skipped: true,
        skip_reason: reason,
        morning_anchor_triggered_at: null,
      })
      .eq('id', id);

    return !error;
  }

  /**
   * Get recent wake events for a user (for pattern analysis).
   *
   * @param userId - User ID
   * @param limit - Maximum number of events to return
   */
  async getRecentEvents(
    userId: string,
    limit: number = 14
  ): Promise<WakeEventListResult> {
    const { data, error } = await this.supabase
      .from('wake_events')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: [], error: error.message };
    }

    return {
      data: (data as WakeEventRow[]).map(fromWakeEventRow),
      error: null,
    };
  }

  /**
   * Get wake events where Morning Anchor was triggered.
   * Useful for analyzing trigger patterns.
   *
   * @param userId - User ID
   * @param limit - Maximum number of events to return
   */
  async getTriggeredEvents(
    userId: string,
    limit: number = 30
  ): Promise<WakeEventListResult> {
    const { data, error } = await this.supabase
      .from('wake_events')
      .select('*')
      .eq('user_id', userId)
      .not('morning_anchor_triggered_at', 'is', null)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: [], error: error.message };
    }

    return {
      data: (data as WakeEventRow[]).map(fromWakeEventRow),
      error: null,
    };
  }

  /**
   * Calculate average wake time for a user.
   * Used for predicting wake time and scheduling.
   *
   * @param userId - User ID
   * @param days - Number of days to analyze
   */
  async getAverageWakeTime(
    userId: string,
    days: number = 14
  ): Promise<{ hour: number; minute: number } | null> {
    const { data, error } = await this.supabase
      .from('wake_events')
      .select('wake_time')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(days);

    if (error || !data || data.length === 0) {
      return null;
    }

    // Calculate average minutes since midnight
    const totalMinutes = data.reduce((sum, row) => {
      const wakeTime = new Date(row.wake_time);
      return sum + wakeTime.getHours() * 60 + wakeTime.getMinutes();
    }, 0);

    const avgMinutes = Math.round(totalMinutes / data.length);

    return {
      hour: Math.floor(avgMinutes / 60),
      minute: avgMinutes % 60,
    };
  }

  /**
   * Delete a wake event (for testing/admin purposes).
   *
   * @param id - Wake event ID
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('wake_events')
      .delete()
      .eq('id', id);

    return !error;
  }

  /**
   * Upsert a wake event (create or update if exists).
   * Uses user_id + date as the conflict key.
   *
   * @param input - Wake event data
   */
  async upsert(input: CreateWakeEventInput): Promise<WakeEventQueryResult> {
    const row: Partial<WakeEventRow> = {
      user_id: input.userId,
      date: input.date,
      wake_time: input.wakeTime.toISOString(),
      detection_method: input.detectionMethod,
      confidence: input.confidence,
      source_metrics: input.sourceMetrics,
    };

    const { data, error } = await this.supabase
      .from('wake_events')
      .upsert(row, {
        onConflict: 'user_id,date',
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: fromWakeEventRow(data as WakeEventRow), error: null };
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let repositoryInstance: WakeEventRepository | null = null;

export function getWakeEventRepository(): WakeEventRepository {
  if (!repositoryInstance) {
    repositoryInstance = new WakeEventRepository();
  }
  return repositoryInstance;
}

// Also export class for testing
export default WakeEventRepository;
