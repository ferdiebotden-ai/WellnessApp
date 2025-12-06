/**
 * Baseline Service
 *
 * Manages 14-day rolling baselines for personalized recovery calculation.
 * Updates baselines daily with new wearable data and maintains statistical
 * accuracy using log-transformed values for HRV.
 *
 * @file functions/src/services/baselineService.ts
 * @author Claude Opus 4.5 (Session 40)
 * @created December 4, 2025
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { type UserBaseline, type BaselineConfidence } from '../types/recovery.types';
/**
 * Get user's baseline from database.
 */
export declare function getUserBaseline(supabase: SupabaseClient, userId: string): Promise<UserBaseline | null>;
/**
 * Update user's baseline with new data.
 * Called after each wearable sync.
 */
export declare function updateUserBaseline(supabase: SupabaseClient, userId: string): Promise<UserBaseline | null>;
/**
 * Initialize baseline for a new user.
 * Creates a baseline record with default values.
 */
export declare function initializeBaseline(supabase: SupabaseClient, userId: string): Promise<UserBaseline>;
/**
 * Update menstrual cycle tracking data.
 */
export declare function updateMenstrualTracking(supabase: SupabaseClient, userId: string, tracking: boolean, cycleDay?: number, lastPeriodStart?: Date): Promise<void>;
/**
 * Get baseline status for onboarding UI.
 */
export declare function getBaselineStatus(supabase: SupabaseClient, userId: string): Promise<{
    ready: boolean;
    daysCollected: number;
    daysRequired: number;
    confidenceLevel: BaselineConfidence;
    message: string;
}>;
