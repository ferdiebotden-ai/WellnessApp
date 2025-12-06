"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TARGET_SLEEP_HOURS = exports.DEFAULT_CHECK_IN = exports.SKIPPED_CHECK_IN_CONFIDENCE = exports.MAX_CHECK_IN_CONFIDENCE = exports.CHECK_IN_WEIGHTS = exports.ENERGY_LEVEL_LABELS = exports.SLEEP_QUALITY_LABELS = exports.SLEEP_HOURS_MAP = void 0;
/**
 * Maps sleep hour ranges to representative values for calculation.
 */
exports.SLEEP_HOURS_MAP = {
    '<5': 4.5,
    '5-6': 5.5,
    '6-7': 6.5,
    '7-8': 7.5,
    '8+': 8.5,
};
/**
 * Display labels for sleep quality ratings.
 */
exports.SLEEP_QUALITY_LABELS = {
    1: 'Poor',
    2: 'Fair',
    3: 'Okay',
    4: 'Good',
    5: 'Great',
};
/**
 * Display labels for energy level ratings.
 */
exports.ENERGY_LEVEL_LABELS = {
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
exports.CHECK_IN_WEIGHTS = {
    sleepQuality: 0.40,
    sleepDuration: 0.35,
    energyLevel: 0.25,
};
/**
 * Maximum confidence for check-in scores.
 * Lower than wearable confidence (0.90) to be honest about data quality.
 */
exports.MAX_CHECK_IN_CONFIDENCE = 0.60;
/**
 * Confidence when user skips check-in (uses defaults).
 */
exports.SKIPPED_CHECK_IN_CONFIDENCE = 0.30;
// =============================================================================
// UTILITY TYPES
// =============================================================================
/**
 * Default values for skipped check-in.
 */
exports.DEFAULT_CHECK_IN = {
    sleepQuality: 3, // "Okay"
    sleepHours: '7-8', // Average
    energyLevel: 3, // "Moderate"
};
/**
 * Target sleep duration in hours (used for vs-target calculation).
 */
exports.TARGET_SLEEP_HOURS = 7.5;
