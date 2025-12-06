"use strict";
/**
 * Weekly Synthesis Types
 *
 * Defines interfaces and constants for weekly metrics aggregation and narrative generation.
 * These types support the Sunday Brief feature that summarizes user progress.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NARRATIVE_SECTIONS = exports.SYNTHESIS_CONFIG = exports.OUTCOME_METRIC_NAMES = exports.OUTCOME_EXPECTED_DIRECTION = void 0;
/**
 * Expected correlation direction for each outcome metric
 * Used to interpret whether a correlation is beneficial or concerning
 */
exports.OUTCOME_EXPECTED_DIRECTION = {
    sleep_hours: 'positive', // More sleep is better
    hrv_score: 'positive', // Higher HRV is better
    recovery_score: 'positive', // Higher recovery is better
    resting_hr: 'negative', // Lower resting HR is better
};
/**
 * Human-readable names for outcome metrics
 */
exports.OUTCOME_METRIC_NAMES = {
    sleep_hours: 'Sleep Duration',
    hrv_score: 'HRV Score',
    recovery_score: 'Recovery Score',
    resting_hr: 'Resting Heart Rate',
};
/**
 * Configuration constants for synthesis generation
 */
exports.SYNTHESIS_CONFIG = {
    /** Minimum days of data required to generate synthesis */
    MIN_DATA_DAYS: 4,
    /** Minimum days of data required for correlation analysis */
    MIN_CORRELATION_DAYS: 14,
    /** P-value threshold for statistical significance */
    CORRELATION_P_THRESHOLD: 0.05,
    /** Maximum correlations to include in synthesis */
    MAX_CORRELATIONS: 5,
    /** Days to look back for correlation analysis */
    CORRELATION_LOOKBACK_DAYS: 30,
    /** Target word count for narrative */
    TARGET_WORD_COUNT: 200,
    /** Minimum word count for narrative */
    MIN_WORD_COUNT: 150,
    /** Maximum word count for narrative */
    MAX_WORD_COUNT: 250,
};
/**
 * All narrative sections that should be present
 */
exports.NARRATIVE_SECTIONS = [
    'Win',
    'Watch',
    'Pattern',
    'Trajectory',
    'Experiment',
];
