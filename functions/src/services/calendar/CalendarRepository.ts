/**
 * Calendar Repository for Apex OS Phase 3
 *
 * Handles database operations for calendar integrations and daily metrics.
 * Uses the `calendar_integrations` and `daily_calendar_metrics` tables.
 *
 * @file functions/src/services/calendar/CalendarRepository.ts
 * @author Claude Opus 4.5 (Session 43)
 * @created December 5, 2025
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getServiceClient } from '../../supabaseClient';
import {
  CalendarIntegration,
  CalendarIntegrationRow,
  CalendarProvider,
  CalendarSyncStatus,
  DailyCalendarMetrics,
  DailyCalendarMetricsRow,
  MeetingLoadMetrics,
  fromCalendarIntegrationRow,
  fromDailyCalendarMetricsRow,
} from '../../types/calendar.types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Input for creating a new calendar integration.
 */
export interface CreateCalendarIntegrationInput {
  userId: string;
  provider: CalendarProvider;
  accessTokenEncrypted?: string | null;
  refreshTokenEncrypted?: string | null;
  expiresAt?: Date | null;
}

/**
 * Input for updating calendar sync status.
 */
export interface UpdateSyncStatusInput {
  lastSyncAt: Date;
  lastSyncStatus: CalendarSyncStatus;
  lastSyncError?: string | null;
}

/**
 * Input for upserting daily calendar metrics.
 */
export interface UpsertDailyMetricsInput {
  userId: string;
  date: string;
  metrics: MeetingLoadMetrics;
  provider: CalendarProvider;
  mvdActivated?: boolean;
}

/**
 * Result of a single record query.
 */
export interface QueryResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Result of a list query.
 */
export interface ListResult<T> {
  data: T[];
  error: string | null;
}

// =============================================================================
// REPOSITORY CLASS
// =============================================================================

export class CalendarRepository {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || getServiceClient();
  }

  // ===========================================================================
  // CALENDAR INTEGRATIONS
  // ===========================================================================

  /**
   * Create a new calendar integration for a user.
   */
  async createIntegration(
    input: CreateCalendarIntegrationInput
  ): Promise<QueryResult<CalendarIntegration>> {
    const row: Partial<CalendarIntegrationRow> = {
      user_id: input.userId,
      provider: input.provider,
      access_token_encrypted: input.accessTokenEncrypted ?? null,
      refresh_token_encrypted: input.refreshTokenEncrypted ?? null,
      expires_at: input.expiresAt?.toISOString() ?? null,
      last_sync_status: 'pending',
      last_sync_error: null,
    };

    const { data, error } = await this.supabase
      .from('calendar_integrations')
      .insert(row)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return {
          data: null,
          error: 'Calendar integration already exists for this user and provider',
        };
      }
      return { data: null, error: error.message };
    }

    return {
      data: fromCalendarIntegrationRow(data as CalendarIntegrationRow),
      error: null,
    };
  }

  /**
   * Get calendar integration by user ID and provider.
   */
  async getIntegration(
    userId: string,
    provider: CalendarProvider
  ): Promise<QueryResult<CalendarIntegration>> {
    const { data, error } = await this.supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error) {
      // PGRST116 = no rows found
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      return { data: null, error: error.message };
    }

    return {
      data: fromCalendarIntegrationRow(data as CalendarIntegrationRow),
      error: null,
    };
  }

  /**
   * Get all calendar integrations for a user.
   */
  async getIntegrationsByUser(
    userId: string
  ): Promise<ListResult<CalendarIntegration>> {
    const { data, error } = await this.supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return { data: [], error: error.message };
    }

    return {
      data: (data as CalendarIntegrationRow[]).map(fromCalendarIntegrationRow),
      error: null,
    };
  }

  /**
   * Get any active calendar integration for a user.
   * Returns the first successfully synced integration.
   */
  async getActiveIntegration(
    userId: string
  ): Promise<QueryResult<CalendarIntegration>> {
    const { data, error } = await this.supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('last_sync_status', 'success')
      .order('last_sync_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      return { data: null, error: error.message };
    }

    return {
      data: fromCalendarIntegrationRow(data as CalendarIntegrationRow),
      error: null,
    };
  }

  /**
   * Update calendar integration sync status.
   */
  async updateSyncStatus(
    userId: string,
    provider: CalendarProvider,
    status: UpdateSyncStatusInput
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('calendar_integrations')
      .update({
        last_sync_at: status.lastSyncAt.toISOString(),
        last_sync_status: status.lastSyncStatus,
        last_sync_error: status.lastSyncError ?? null,
      })
      .eq('user_id', userId)
      .eq('provider', provider);

    return !error;
  }

  /**
   * Update OAuth tokens for a calendar integration.
   */
  async updateTokens(
    userId: string,
    provider: CalendarProvider,
    accessTokenEncrypted: string,
    refreshTokenEncrypted: string | null,
    expiresAt: Date | null
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('calendar_integrations')
      .update({
        access_token_encrypted: accessTokenEncrypted,
        refresh_token_encrypted: refreshTokenEncrypted,
        expires_at: expiresAt?.toISOString() ?? null,
      })
      .eq('user_id', userId)
      .eq('provider', provider);

    return !error;
  }

  /**
   * Delete a calendar integration.
   */
  async deleteIntegration(
    userId: string,
    provider: CalendarProvider
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('calendar_integrations')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    return !error;
  }

  /**
   * Delete all calendar integrations for a user.
   */
  async deleteAllIntegrations(userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('calendar_integrations')
      .delete()
      .eq('user_id', userId);

    return !error;
  }

  /**
   * Upsert a calendar integration (create or update).
   */
  async upsertIntegration(
    input: CreateCalendarIntegrationInput
  ): Promise<QueryResult<CalendarIntegration>> {
    const row: Partial<CalendarIntegrationRow> = {
      user_id: input.userId,
      provider: input.provider,
      access_token_encrypted: input.accessTokenEncrypted ?? null,
      refresh_token_encrypted: input.refreshTokenEncrypted ?? null,
      expires_at: input.expiresAt?.toISOString() ?? null,
      last_sync_status: 'pending',
    };

    const { data, error } = await this.supabase
      .from('calendar_integrations')
      .upsert(row, { onConflict: 'user_id,provider' })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: fromCalendarIntegrationRow(data as CalendarIntegrationRow),
      error: null,
    };
  }

  // ===========================================================================
  // DAILY CALENDAR METRICS
  // ===========================================================================

  /**
   * Upsert daily calendar metrics (create or update).
   */
  async upsertDailyMetrics(
    input: UpsertDailyMetricsInput
  ): Promise<QueryResult<DailyCalendarMetrics>> {
    const row: Partial<DailyCalendarMetricsRow> = {
      user_id: input.userId,
      date: input.date,
      meeting_hours: input.metrics.totalHours,
      meeting_count: input.metrics.meetingCount,
      back_to_back_count: input.metrics.backToBackCount,
      density: input.metrics.density,
      heavy_day: input.metrics.heavyDay,
      overload: input.metrics.overload,
      mvd_activated: input.mvdActivated ?? false,
      provider: input.provider,
    };

    const { data, error } = await this.supabase
      .from('daily_calendar_metrics')
      .upsert(row, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: fromDailyCalendarMetricsRow(data as DailyCalendarMetricsRow),
      error: null,
    };
  }

  /**
   * Get daily calendar metrics for a user and date.
   */
  async getDailyMetrics(
    userId: string,
    date: string
  ): Promise<QueryResult<DailyCalendarMetrics>> {
    const { data, error } = await this.supabase
      .from('daily_calendar_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      return { data: null, error: error.message };
    }

    return {
      data: fromDailyCalendarMetricsRow(data as DailyCalendarMetricsRow),
      error: null,
    };
  }

  /**
   * Get recent daily calendar metrics for trend analysis.
   */
  async getRecentMetrics(
    userId: string,
    days: number = 14
  ): Promise<ListResult<DailyCalendarMetrics>> {
    const { data, error } = await this.supabase
      .from('daily_calendar_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(days);

    if (error) {
      return { data: [], error: error.message };
    }

    return {
      data: (data as DailyCalendarMetricsRow[]).map(fromDailyCalendarMetricsRow),
      error: null,
    };
  }

  /**
   * Get heavy meeting days for a user.
   */
  async getHeavyDays(
    userId: string,
    limit: number = 30
  ): Promise<ListResult<DailyCalendarMetrics>> {
    const { data, error } = await this.supabase
      .from('daily_calendar_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('heavy_day', true)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: [], error: error.message };
    }

    return {
      data: (data as DailyCalendarMetricsRow[]).map(fromDailyCalendarMetricsRow),
      error: null,
    };
  }

  /**
   * Mark daily metrics as having triggered MVD.
   */
  async markMVDActivated(userId: string, date: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('daily_calendar_metrics')
      .update({ mvd_activated: true })
      .eq('user_id', userId)
      .eq('date', date);

    return !error;
  }

  /**
   * Calculate average meeting hours over a period.
   */
  async getAverageMeetingHours(
    userId: string,
    days: number = 14
  ): Promise<number | null> {
    const { data, error } = await this.supabase
      .from('daily_calendar_metrics')
      .select('meeting_hours')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(days);

    if (error || !data || data.length === 0) {
      return null;
    }

    const total = data.reduce(
      (sum, row) => sum + (row.meeting_hours as number),
      0
    );
    return total / data.length;
  }

  /**
   * Count heavy days in a period.
   */
  async countHeavyDays(userId: string, days: number = 30): Promise<number> {
    const { count, error } = await this.supabase
      .from('daily_calendar_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('heavy_day', true)
      .gte(
        'date',
        new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
      );

    if (error) {
      return 0;
    }

    return count ?? 0;
  }

  /**
   * Delete daily metrics for a user and date.
   */
  async deleteDailyMetrics(userId: string, date: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('daily_calendar_metrics')
      .delete()
      .eq('user_id', userId)
      .eq('date', date);

    return !error;
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let repositoryInstance: CalendarRepository | null = null;

export function getCalendarRepository(): CalendarRepository {
  if (!repositoryInstance) {
    repositoryInstance = new CalendarRepository();
  }
  return repositoryInstance;
}

export default CalendarRepository;
