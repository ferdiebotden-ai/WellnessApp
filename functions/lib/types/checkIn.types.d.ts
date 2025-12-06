/**
 * Manual Check-in Types for Lite Mode
 *
 * These types define the manual wellness check-in system for users
 * without wearables. Produces a "Check-in Score" (distinct from
 * wearable-based "Recovery Score").
 *
 * Check-in Score Formula:
 * Score = (SleepQuality × 0.40) + (SleepDuration × 0.35) + (Energy × 0.25)
 *
 * Confidence is capped at 0.60 (vs 0.90 for wearables) to be honest
 * about data quality from self-reported inputs.
 *
 * @file functions/src/types/checkIn.types.ts
 * @author Claude Opus 4.5 (Session 49)
 * @created December 5, 2025
 */
import { RecoveryZone, RecommendationType } from './recovery.types';
/**
 * Quality rating scale (1-5).
 * Used for sleep quality and energy level.
 */
export type QualityRating = 1 | 2 | 3 | 4 | 5;
/**
 * Sleep duration options (categorical).
 * Using ranges instead of exact hours for faster input.
 */
export type SleepHoursOption = '<5' | '5-6' | '6-7' | '7-8' | '8+';
/**
 * Maps sleep hour ranges to representative values for calculation.
 */
export declare const SLEEP_HOURS_MAP: Record<SleepHoursOption, number>;
/**
 * Display labels for sleep quality ratings.
 */
export declare const SLEEP_QUALITY_LABELS: Record<QualityRating, string>;
/**
 * Display labels for energy level ratings.
 */
export declare const ENERGY_LEVEL_LABELS: Record<QualityRating, string>;
/**
 * Component weights for Check-in Score calculation.
 * Total must equal 1.0.
 */
export declare const CHECK_IN_WEIGHTS: {
    readonly sleepQuality: 0.4;
    readonly sleepDuration: 0.35;
    readonly energyLevel: 0.25;
};
/**
 * Maximum confidence for check-in scores.
 * Lower than wearable confidence (0.90) to be honest about data quality.
 */
export declare const MAX_CHECK_IN_CONFIDENCE = 0.6;
/**
 * Confidence when user skips check-in (uses defaults).
 */
export declare const SKIPPED_CHECK_IN_CONFIDENCE = 0.3;
/**
 * Manual check-in input from user.
 */
export interface ManualCheckInInput {
    sleepQuality: QualityRating;
    sleepHours: SleepHoursOption;
    energyLevel: QualityRating;
}
/**
 * API request body for submitting a check-in.
 */
export interface ManualCheckInRequest {
    sleepQuality: QualityRating;
    sleepHours: SleepHoursOption;
    energyLevel: QualityRating;
    wakeTime?: string;
    timezone?: string;
    skipped?: boolean;
}
/**
 * Check-in component breakdown for transparency.
 */
export interface CheckInComponents {
    sleepQuality: {
        rating: QualityRating;
        label: string;
        score: number;
        weight: 0.40;
    };
    sleepDuration: {
        hours: number;
        option: SleepHoursOption;
        score: number;
        vsTarget: string;
        weight: 0.35;
    };
    energyLevel: {
        rating: QualityRating;
        label: string;
        score: number;
        weight: 0.25;
    };
}
/**
 * Recommendation based on check-in score.
 */
export interface CheckInRecommendation {
    type: RecommendationType;
    headline: string;
    body: string;
    protocols: string[];
}
/**
 * Full check-in result with score and breakdown.
 */
export interface CheckInResult {
    score: number;
    zone: RecoveryZone;
    confidence: number;
    components: CheckInComponents;
    reasoning: string;
    recommendations: CheckInRecommendation[];
    isLiteMode: true;
    skipped: boolean;
}
/**
 * Check-in stored in daily_metrics.raw_payload (JSONB).
 */
export interface CheckInPayload {
    type: 'manual_check_in';
    version: 1;
    input: ManualCheckInInput;
    result: CheckInResult;
    submittedAt: string;
    timezone: string;
}
/**
 * Database row for manual check-in (stored in daily_metrics).
 */
export interface ManualCheckInRow {
    id: string;
    user_id: string;
    date: string;
    wearable_source: 'manual';
    recovery_score: number;
    recovery_confidence: number;
    raw_payload: CheckInPayload;
    created_at: string;
    updated_at: string;
}
/**
 * Response from GET /api/manual-check-in/today
 */
export interface GetCheckInResponse {
    hasCheckedIn: boolean;
    checkIn: CheckInResult | null;
    date: string;
}
/**
 * Response from POST /api/manual-check-in
 */
export interface SubmitCheckInResponse {
    success: boolean;
    checkIn: CheckInResult;
    date: string;
}
/**
 * Default values for skipped check-in.
 */
export declare const DEFAULT_CHECK_IN: ManualCheckInInput;
/**
 * Target sleep duration in hours (used for vs-target calculation).
 */
export declare const TARGET_SLEEP_HOURS = 7.5;
