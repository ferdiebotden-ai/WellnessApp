/**
 * Check-in Score Calculator for Lite Mode
 *
 * Calculates a simplified wellness score from manual user inputs.
 * Used for users without wearables who complete a morning check-in.
 *
 * Formula:
 * Score = (SleepQuality × 0.40) + (SleepDuration × 0.35) + (Energy × 0.25)
 *
 * Key differences from wearable Recovery Score:
 * - Only 3 components (vs 5 biometric + temperature penalty)
 * - Max confidence = 0.60 (vs 0.90 for wearables)
 * - No edge case detection (alcohol, illness, travel)
 * - Simpler recommendations (zone-based only)
 *
 * @file functions/src/services/checkInScore.ts
 * @author Claude Opus 4.5 (Session 49)
 * @created December 5, 2025
 */
import { ManualCheckInInput, CheckInResult, CheckInComponents, CheckInRecommendation, QualityRating } from '../types/checkIn.types';
import { RecoveryZone } from '../types/recovery.types';
/**
 * Convert quality rating (1-5) to score (0-100).
 * Linear mapping: 1→20, 2→40, 3→60, 4→80, 5→100
 */
export declare function ratingToScore(rating: QualityRating): number;
/**
 * Calculate sleep duration score based on hours vs target.
 *
 * Scoring:
 * - At target (7.5h): 100 points
 * - Each hour below: -15 points
 * - Each hour above: -5 points (oversleep is less penalized)
 * - Minimum score: 20
 *
 * @param hours - Actual sleep hours
 * @param target - Target sleep hours (default 7.5)
 */
export declare function calculateSleepDurationScore(hours: number, target?: number): {
    score: number;
    vsTarget: string;
};
/**
 * Build component breakdown for transparency.
 */
export declare function buildComponents(input: ManualCheckInInput): CheckInComponents;
/**
 * Generate recommendations based on zone.
 */
export declare function generateRecommendations(zone: RecoveryZone, components: CheckInComponents): CheckInRecommendation[];
/**
 * Generate human-readable reasoning string.
 */
export declare function generateReasoning(score: number, zone: RecoveryZone, components: CheckInComponents, skipped: boolean): string;
/**
 * Calculate Check-in Score from manual inputs.
 *
 * @param input - User's check-in answers
 * @param skipped - Whether the user skipped (uses defaults)
 * @returns Full CheckInResult with score, breakdown, and recommendations
 */
export declare function calculateCheckInScore(input?: ManualCheckInInput, skipped?: boolean): CheckInResult;
/**
 * Validate check-in input.
 * @returns Error message if invalid, null if valid
 */
export declare function validateCheckInInput(input: unknown): string | null;
