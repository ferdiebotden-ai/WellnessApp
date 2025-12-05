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

// =============================================================================
// INPUT TYPES
// =============================================================================

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
export const SLEEP_HOURS_MAP: Record<SleepHoursOption, number> = {
  '<5': 4.5,
  '5-6': 5.5,
  '6-7': 6.5,
  '7-8': 7.5,
  '8+': 8.5,
};

/**
 * Display labels for sleep quality ratings.
 */
export const SLEEP_QUALITY_LABELS: Record<QualityRating, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

/**
 * Display labels for energy level ratings.
 */
export const ENERGY_LEVEL_LABELS: Record<QualityRating, string> = {
  1: 'Exhausted',
  2: 'Low',
  3: 'Moderate',
  4: 'Good',
  5: 'Energized',
};

// =============================================================================
// COMPONENT WEIGHTS
// =============================================================================

/**
 * Component weights for Check-in Score calculation.
 * Total must equal 1.0.
 */
export const CHECK_IN_WEIGHTS = {
  sleepQuality: 0.40,
  sleepDuration: 0.35,
  energyLevel: 0.25,
} as const;

/**
 * Maximum confidence for check-in scores.
 * Lower than wearable confidence (0.90) to be honest about data quality.
 */
export const MAX_CHECK_IN_CONFIDENCE = 0.60;

/**
 * Confidence when user skips check-in (uses defaults).
 */
export const SKIPPED_CHECK_IN_CONFIDENCE = 0.30;

// =============================================================================
// CHECK-IN REQUEST/RESPONSE
// =============================================================================

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
  wakeTime?: string;       // ISO timestamp
  timezone?: string;       // IANA timezone
  skipped?: boolean;       // True if user skipped (use defaults)
}

/**
 * Check-in component breakdown for transparency.
 */
export interface CheckInComponents {
  sleepQuality: {
    rating: QualityRating;
    label: string;
    score: number;         // 0-100
    weight: 0.40;
  };
  sleepDuration: {
    hours: number;
    option: SleepHoursOption;
    score: number;         // 0-100
    vsTarget: string;      // e.g., "-1h from target"
    weight: 0.35;
  };
  energyLevel: {
    rating: QualityRating;
    label: string;
    score: number;         // 0-100
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
  protocols: string[];     // Protocol IDs to suggest
}

/**
 * Full check-in result with score and breakdown.
 */
export interface CheckInResult {
  score: number;                           // 0-100
  zone: RecoveryZone;                      // 'red' | 'yellow' | 'green'
  confidence: number;                      // 0-0.60 (capped)
  components: CheckInComponents;
  reasoning: string;                       // Human-readable explanation
  recommendations: CheckInRecommendation[];
  isLiteMode: true;                        // Distinguishes from wearable data
  skipped: boolean;                        // True if user skipped check-in
}

// =============================================================================
// DATABASE TYPES
// =============================================================================

/**
 * Check-in stored in daily_metrics.raw_payload (JSONB).
 */
export interface CheckInPayload {
  type: 'manual_check_in';
  version: 1;
  input: ManualCheckInInput;
  result: CheckInResult;
  submittedAt: string;     // ISO timestamp
  timezone: string;
}

/**
 * Database row for manual check-in (stored in daily_metrics).
 */
export interface ManualCheckInRow {
  id: string;
  user_id: string;
  date: string;            // YYYY-MM-DD
  wearable_source: 'manual';
  recovery_score: number;
  recovery_confidence: number;
  raw_payload: CheckInPayload;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

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

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Default values for skipped check-in.
 */
export const DEFAULT_CHECK_IN: ManualCheckInInput = {
  sleepQuality: 3,         // "Okay"
  sleepHours: '7-8',       // Average
  energyLevel: 3,          // "Moderate"
};

/**
 * Target sleep duration in hours (used for vs-target calculation).
 */
export const TARGET_SLEEP_HOURS = 7.5;
