"use strict";
/**
 * Confidence Scoring Types
 *
 * Used by the nudge engine to evaluate recommendation quality
 * before delivery. Each factor contributes to overall confidence.
 *
 * Reference: APEX_OS_PRD_FINAL_v6.md - Reasoning Layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORY_TIME_MAPPING = exports.GOAL_KEYWORDS = exports.GOAL_MODULE_MAPPING = exports.CONFIDENCE_SUPPRESSION_THRESHOLD = exports.EVIDENCE_SCORES = exports.CONFIDENCE_WEIGHTS = void 0;
/**
 * Factor weights - must sum to 1.0
 */
exports.CONFIDENCE_WEIGHTS = {
    protocol_fit: 0.25,
    memory_support: 0.25,
    timing_fit: 0.2,
    conflict_risk: 0.15,
    evidence_strength: 0.15,
};
/**
 * Evidence level to score mapping
 */
exports.EVIDENCE_SCORES = {
    'Very High': 1.0,
    High: 0.8,
    Moderate: 0.6,
    Emerging: 0.4,
};
/**
 * Confidence threshold for nudge suppression
 */
exports.CONFIDENCE_SUPPRESSION_THRESHOLD = 0.4;
/**
 * Goal to optimal module mapping for protocol_fit calculation
 */
exports.GOAL_MODULE_MAPPING = {
    better_sleep: ['sleep_optimization', 'recovery', 'stress_management'],
    more_energy: ['energy_optimization', 'morning_routine', 'performance'],
    sharper_focus: ['cognitive_performance', 'focus_optimization', 'performance'],
    faster_recovery: ['recovery', 'stress_management', 'sleep_optimization'],
};
/**
 * Keywords associated with each goal for protocol name/benefit matching
 */
exports.GOAL_KEYWORDS = {
    better_sleep: ['sleep', 'evening', 'recovery', 'melatonin', 'light', 'nsdr'],
    more_energy: ['morning', 'energy', 'caffeine', 'light', 'exercise', 'hydration'],
    sharper_focus: ['focus', 'cognitive', 'attention', 'caffeine', 'nsdr'],
    faster_recovery: ['recovery', 'nsdr', 'breathing', 'cold', 'hrv', 'sleep'],
};
/**
 * Protocol category to optimal time-of-day mapping
 */
exports.CATEGORY_TIME_MAPPING = {
    Foundation: ['morning', 'evening'],
    Performance: ['morning', 'afternoon'],
    Recovery: ['afternoon', 'evening', 'night'],
    Optimization: ['morning', 'afternoon', 'evening'],
    Meta: ['morning', 'evening'],
};
