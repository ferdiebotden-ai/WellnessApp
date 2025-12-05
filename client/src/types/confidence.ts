/**
 * Confidence Factor Types for Reasoning Breakdown
 *
 * Defines the 5-factor confidence scoring system used by the nudge engine.
 * These factors explain WHY a recommendation has a certain confidence level.
 *
 * Reference: functions/src/reasoning/types.ts
 *
 * @file client/src/types/confidence.ts
 * @author Claude Opus 4.5 (Session 46)
 * @created December 5, 2025
 */

// =============================================================================
// CORE TYPES (Mirror backend: functions/src/reasoning/types.ts)
// =============================================================================

/**
 * Individual scoring factors that contribute to overall confidence.
 * Each factor is scored 0-1, then weighted to produce overall confidence.
 */
export interface ConfidenceFactors {
  /** How well protocol matches user's primary goal (0-1) */
  protocol_fit: number;
  /** Number of supporting memories for this recommendation (0-1) */
  memory_support: number;
  /** How appropriate is the timing (time of day, recovery level) (0-1) */
  timing_fit: number;
  /** Inverse of protocol conflict probability (0-1) */
  conflict_risk: number;
  /** Protocol's evidence level (Very High=1, High=0.8, etc.) (0-1) */
  evidence_strength: number;
}

/**
 * Confidence level for UI display.
 * Mapped from overall score: High >= 0.7, Medium >= 0.4, Low < 0.4
 */
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

// =============================================================================
// FACTOR METADATA
// =============================================================================

/**
 * Factor key type for iteration.
 */
export type ConfidenceFactorKey = keyof ConfidenceFactors;

/**
 * Human-readable labels for each factor.
 */
export const CONFIDENCE_FACTOR_LABELS: Record<ConfidenceFactorKey, string> = {
  protocol_fit: 'Protocol Fit',
  memory_support: 'Memory Support',
  timing_fit: 'Timing Fit',
  conflict_risk: 'Conflict Risk',
  evidence_strength: 'Evidence',
};

/**
 * Short descriptions for each factor (for tooltips/accessibility).
 */
export const CONFIDENCE_FACTOR_DESCRIPTIONS: Record<ConfidenceFactorKey, string> = {
  protocol_fit: 'How well this matches your primary wellness goal',
  memory_support: 'Past positive experiences with similar protocols',
  timing_fit: 'Appropriateness for current time and recovery state',
  conflict_risk: 'Low conflict with other active protocols',
  evidence_strength: 'Scientific evidence supporting this protocol',
};

/**
 * Factor weights (must sum to 1.0).
 * Mirrors backend CONFIDENCE_WEIGHTS constant.
 */
export const CONFIDENCE_FACTOR_WEIGHTS: Record<ConfidenceFactorKey, number> = {
  protocol_fit: 0.25,
  memory_support: 0.25,
  timing_fit: 0.20,
  conflict_risk: 0.15,
  evidence_strength: 0.15,
};

/**
 * Factor display order (for consistent UI rendering).
 */
export const CONFIDENCE_FACTOR_ORDER: ConfidenceFactorKey[] = [
  'protocol_fit',
  'memory_support',
  'timing_fit',
  'conflict_risk',
  'evidence_strength',
];

// =============================================================================
// DEFAULTS
// =============================================================================

/**
 * Default confidence factors (neutral scores).
 */
export const DEFAULT_CONFIDENCE_FACTORS: ConfidenceFactors = {
  protocol_fit: 0.5,
  memory_support: 0.5,
  timing_fit: 0.5,
  conflict_risk: 0.5,
  evidence_strength: 0.5,
};
