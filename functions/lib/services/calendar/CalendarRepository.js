"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarRepository = void 0;
exports.getCalendarRepository = getCalendarRepository;
const supabaseClient_1 = require("../../supabaseClient");
const calendar_types_1 = require("../../types/calendar.types");
// =============================================================================
// REPOSITORY CLASS
// =============================================================================
class CalendarRepository {
    constructor(supabaseClient) {
        this.supabase = supabaseClient || (0, supabaseClient_1.getServiceClient)();
    }
    // ===========================================================================
    // CALENDAR INTEGRATIONS
    // ===========================================================================
    /**
     * Create a new calendar integration for a user.
     */
    async createIntegration(input) {
        const row = {
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
            data: (0, calendar_types_1.fromCalendarIntegrationRow)(data),
            error: null,
        };
    }
    /**
     * Get calendar integration by user ID and provider.
     */
    async getIntegration(userId, provider) {
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
            data: (0, calendar_types_1.fromCalendarIntegrationRow)(data),
            error: null,
        };
    }
    /**
     * Get all calendar integrations for a user.
     */
    async getIntegrationsByUser(userId) {
        const { data, error } = await this.supabase
            .from('calendar_integrations')
            .select('*')
            .eq('user_id', userId);
        if (error) {
            return { data: [], error: error.message };
        }
        return {
            data: data.map(calendar_types_1.fromCalendarIntegrationRow),
            error: null,
        };
    }
    /**
     * Get any active calendar integration for a user.
     * Returns the first successfully synced integration.
     */
    async getActiveIntegration(userId) {
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
            data: (0, calendar_types_1.fromCalendarIntegrationRow)(data),
            error: null,
        };
    }
    /**
     * Update calendar integration sync status.
     */
    async updateSyncStatus(userId, provider, status) {
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
    async updateTokens(userId, provider, accessTokenEncrypted, refreshTokenEncrypted, expiresAt) {
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
    async deleteIntegration(userId, provider) {
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
    async deleteAllIntegrations(userId) {
        const { error } = await this.supabase
            .from('calendar_integrations')
            .delete()
            .eq('user_id', userId);
        return !error;
    }
    /**
     * Upsert a calendar integration (create or update).
     */
    async upsertIntegration(input) {
        const row = {
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
            data: (0, calendar_types_1.fromCalendarIntegrationRow)(data),
            error: null,
        };
    }
    // ===========================================================================
    // DAILY CALENDAR METRICS
    // ===========================================================================
    /**
     * Upsert daily calendar metrics (create or update).
     */
    async upsertDailyMetrics(input) {
        const row = {
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
            data: (0, calendar_types_1.fromDailyCalendarMetricsRow)(data),
            error: null,
        };
    }
    /**
     * Get daily calendar metrics for a user and date.
     */
    async getDailyMetrics(userId, date) {
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
            data: (0, calendar_types_1.fromDailyCalendarMetricsRow)(data),
            error: null,
        };
    }
    /**
     * Get recent daily calendar metrics for trend analysis.
     */
    async getRecentMetrics(userId, days = 14) {
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
            data: data.map(calendar_types_1.fromDailyCalendarMetricsRow),
            error: null,
        };
    }
    /**
     * Get heavy meeting days for a user.
     */
    async getHeavyDays(userId, limit = 30) {
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
            data: data.map(calendar_types_1.fromDailyCalendarMetricsRow),
            error: null,
        };
    }
    /**
     * Mark daily metrics as having triggered MVD.
     */
    async markMVDActivated(userId, date) {
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
    async getAverageMeetingHours(userId, days = 14) {
        const { data, error } = await this.supabase
            .from('daily_calendar_metrics')
            .select('meeting_hours')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(days);
        if (error || !data || data.length === 0) {
            return null;
        }
        const total = data.reduce((sum, row) => sum + row.meeting_hours, 0);
        return total / data.length;
    }
    /**
     * Count heavy days in a period.
     */
    async countHeavyDays(userId, days = 30) {
        const { count, error } = await this.supabase
            .from('daily_calendar_metrics')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('heavy_day', true)
            .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0]);
        if (error) {
            return 0;
        }
        return count ?? 0;
    }
    /**
     * Delete daily metrics for a user and date.
     */
    async deleteDailyMetrics(userId, date) {
        const { error } = await this.supabase
            .from('daily_calendar_metrics')
            .delete()
            .eq('user_id', userId)
            .eq('date', date);
        return !error;
    }
}
exports.CalendarRepository = CalendarRepository;
// =============================================================================
// SINGLETON EXPORT
// =============================================================================
let repositoryInstance = null;
function getCalendarRepository() {
    if (!repositoryInstance) {
        repositoryInstance = new CalendarRepository();
    }
    return repositoryInstance;
}
exports.default = CalendarRepository;
