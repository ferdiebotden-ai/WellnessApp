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
import { WakeEvent, WakeDetectionMethod, WakeSourceMetrics, MorningAnchorSkipReason } from '../../types/wake.types';
/**
 * Input for creating a new wake event.
 */
export interface CreateWakeEventInput {
    userId: string;
    date: string;
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
export declare class WakeEventRepository {
    private supabase;
    constructor(supabaseClient?: SupabaseClient);
    /**
     * Create a new wake event.
     *
     * @param input - Wake event data
     * @returns Created wake event or error
     */
    create(input: CreateWakeEventInput): Promise<WakeEventQueryResult>;
    /**
     * Get wake event by ID.
     */
    getById(id: string): Promise<WakeEventQueryResult>;
    /**
     * Get today's wake event for a user.
     * Uses the date field to find today's event.
     *
     * @param userId - User ID
     * @param date - Date in YYYY-MM-DD format
     */
    getByUserAndDate(userId: string, date: string): Promise<WakeEventQueryResult>;
    /**
     * Check if a wake event already exists for today.
     *
     * @param userId - User ID
     * @param date - Date in YYYY-MM-DD format
     */
    existsForToday(userId: string, date: string): Promise<boolean>;
    /**
     * Mark wake event as having triggered Morning Anchor.
     *
     * @param id - Wake event ID
     * @param triggeredAt - When Morning Anchor was triggered
     */
    markTriggered(id: string, triggeredAt: Date): Promise<boolean>;
    /**
     * Mark wake event as skipped (Morning Anchor not triggered).
     *
     * @param id - Wake event ID
     * @param reason - Reason for skipping
     */
    markSkipped(id: string, reason: MorningAnchorSkipReason): Promise<boolean>;
    /**
     * Get recent wake events for a user (for pattern analysis).
     *
     * @param userId - User ID
     * @param limit - Maximum number of events to return
     */
    getRecentEvents(userId: string, limit?: number): Promise<WakeEventListResult>;
    /**
     * Get wake events where Morning Anchor was triggered.
     * Useful for analyzing trigger patterns.
     *
     * @param userId - User ID
     * @param limit - Maximum number of events to return
     */
    getTriggeredEvents(userId: string, limit?: number): Promise<WakeEventListResult>;
    /**
     * Calculate average wake time for a user.
     * Used for predicting wake time and scheduling.
     *
     * @param userId - User ID
     * @param days - Number of days to analyze
     */
    getAverageWakeTime(userId: string, days?: number): Promise<{
        hour: number;
        minute: number;
    } | null>;
    /**
     * Delete a wake event (for testing/admin purposes).
     *
     * @param id - Wake event ID
     */
    delete(id: string): Promise<boolean>;
    /**
     * Upsert a wake event (create or update if exists).
     * Uses user_id + date as the conflict key.
     *
     * @param input - Wake event data
     */
    upsert(input: CreateWakeEventInput): Promise<WakeEventQueryResult>;
}
export declare function getWakeEventRepository(): WakeEventRepository;
export default WakeEventRepository;
