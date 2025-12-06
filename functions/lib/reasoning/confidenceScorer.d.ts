/**
 * Confidence Scorer
 *
 * Calculates multi-factor confidence scores for nudge recommendations.
 * Each factor is independently scored (0-1), then weighted to produce
 * an overall confidence. Scores < 0.4 trigger suppression.
 *
 * Reference: APEX_OS_PRD_FINAL_v6.md - Reasoning Layer
 */
import { ConfidenceScore, NudgeContext, TimeOfDay } from './types';
/**
 * Calculate overall confidence score for a nudge recommendation
 *
 * @param context - All context needed for scoring
 * @returns ConfidenceScore with overall, factors, suppression flag, and reasoning
 */
export declare function calculateConfidence(context: NudgeContext): ConfidenceScore;
/**
 * Helper to determine time of day from hour
 *
 * @param hour - Hour in 24h format (0-23)
 * @returns TimeOfDay category
 */
export declare function getTimeOfDay(hour: number): TimeOfDay;
