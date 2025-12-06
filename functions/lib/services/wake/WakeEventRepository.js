"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WakeEventRepository = void 0;
exports.getWakeEventRepository = getWakeEventRepository;
const supabaseClient_1 = require("../../supabaseClient");
const wake_types_1 = require("../../types/wake.types");
// =============================================================================
// REPOSITORY CLASS
// =============================================================================
class WakeEventRepository {
    constructor(supabaseClient) {
        this.supabase = supabaseClient || (0, supabaseClient_1.getServiceClient)();
    }
    /**
     * Create a new wake event.
     *
     * @param input - Wake event data
     * @returns Created wake event or error
     */
    async create(input) {
        const row = {
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
        return { data: (0, wake_types_1.fromWakeEventRow)(data), error: null };
    }
    /**
     * Get wake event by ID.
     */
    async getById(id) {
        const { data, error } = await this.supabase
            .from('wake_events')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            return { data: null, error: error.message };
        }
        return { data: (0, wake_types_1.fromWakeEventRow)(data), error: null };
    }
    /**
     * Get today's wake event for a user.
     * Uses the date field to find today's event.
     *
     * @param userId - User ID
     * @param date - Date in YYYY-MM-DD format
     */
    async getByUserAndDate(userId, date) {
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
        return { data: (0, wake_types_1.fromWakeEventRow)(data), error: null };
    }
    /**
     * Check if a wake event already exists for today.
     *
     * @param userId - User ID
     * @param date - Date in YYYY-MM-DD format
     */
    async existsForToday(userId, date) {
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
    async markTriggered(id, triggeredAt) {
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
    async markSkipped(id, reason) {
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
    async getRecentEvents(userId, limit = 14) {
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
            data: data.map(wake_types_1.fromWakeEventRow),
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
    async getTriggeredEvents(userId, limit = 30) {
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
            data: data.map(wake_types_1.fromWakeEventRow),
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
    async getAverageWakeTime(userId, days = 14) {
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
    async delete(id) {
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
    async upsert(input) {
        const row = {
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
        return { data: (0, wake_types_1.fromWakeEventRow)(data), error: null };
    }
}
exports.WakeEventRepository = WakeEventRepository;
// =============================================================================
// SINGLETON EXPORT
// =============================================================================
let repositoryInstance = null;
function getWakeEventRepository() {
    if (!repositoryInstance) {
        repositoryInstance = new WakeEventRepository();
    }
    return repositoryInstance;
}
// Also export class for testing
exports.default = WakeEventRepository;
