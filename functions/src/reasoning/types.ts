/**
 * Confidence Scoring Types
 *
 * Used by the nudge engine to evaluate recommendation quality
 * before delivery. Each factor contributes to overall confidence.
 *
 * Reference: APEX_OS_PRD_FINAL_v6.md - Reasoning Layer
 */

import { ScoredMemory } from '../memory';
import { ProtocolSearchResult } from '../protocolSearch';

/**
 * Evidence level mapping for protocol strength scoring
 */
export type EvidenceLevel = 'Very High' | 'High' | 'Moderate' | 'Emerging';

/**
 * User's primary wellness goal (from onboarding)
 */
export type PrimaryGoal =
  | 'better_sleep'
  | 'more_energy'
  | 'sharper_focus'
  | 'faster_recovery';

/**
 * Time of day categories for timing-based scoring
 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Individual scoring factors that contribute to overall confidence
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
 * Factor weights - must sum to 1.0
 */
export const CONFIDENCE_WEIGHTS: Record<keyof ConfidenceFactors, number> = {
  protocol_fit: 0.25,
  memory_support: 0.25,
  timing_fit: 0.2,
  conflict_risk: 0.15,
  evidence_strength: 0.15,
};

/**
 * Evidence level to score mapping
 */
export const EVIDENCE_SCORES: Record<EvidenceLevel, number> = {
  'Very High': 1.0,
  High: 0.8,
  Moderate: 0.6,
  Emerging: 0.4,
};

/**
 * Confidence threshold for nudge suppression
 */
export const CONFIDENCE_SUPPRESSION_THRESHOLD = 0.4;

/**
 * Complete confidence score with factors and reasoning
 */
export interface ConfidenceScore {
  /** Overall weighted confidence (0-1) */
  overall: number;

  /** Individual factor scores */
  factors: ConfidenceFactors;

  /** True if overall < 0.4 - nudge should not be delivered */
  should_suppress: boolean;

  /** Human-readable explanation of the score */
  reasoning: string;
}

/**
 * Context needed for confidence calculation
 */
export interface NudgeContext {
  /** User ID */
  user_id: string;

  /** User's primary wellness goal */
  primary_goal: PrimaryGoal;

  /** Current focus module */
  module_id: string;

  /** Current hour in UTC */
  current_hour_utc: number;

  /** Categorized time of day */
  time_of_day: TimeOfDay;

  /** Recovery/readiness score from wearables (0-100) */
  recovery_score?: number;

  /** HRV deviation from baseline (percentage) */
  hrv_baseline_deviation?: number;

  /** The protocol being recommended */
  protocol: ProtocolSearchResult;

  /** Retrieved memories for this context */
  memories: ScoredMemory[];

  /** Other protocols being recommended in same batch (for conflict detection) */
  other_protocols?: ProtocolSearchResult[];
}

/**
 * Goal to optimal module mapping for protocol_fit calculation
 */
export const GOAL_MODULE_MAPPING: Record<PrimaryGoal, string[]> = {
  better_sleep: ['sleep_optimization', 'recovery', 'stress_management'],
  more_energy: ['energy_optimization', 'morning_routine', 'performance'],
  sharper_focus: ['cognitive_performance', 'focus_optimization', 'performance'],
  faster_recovery: ['recovery', 'stress_management', 'sleep_optimization'],
};

/**
 * Keywords associated with each goal for protocol name/benefit matching
 */
export const GOAL_KEYWORDS: Record<PrimaryGoal, string[]> = {
  better_sleep: ['sleep', 'evening', 'recovery', 'melatonin', 'light', 'nsdr'],
  more_energy: ['morning', 'energy', 'caffeine', 'light', 'exercise', 'hydration'],
  sharper_focus: ['focus', 'cognitive', 'attention', 'caffeine', 'nsdr'],
  faster_recovery: ['recovery', 'nsdr', 'breathing', 'cold', 'hrv', 'sleep'],
};

/**
 * Protocol category to optimal time-of-day mapping
 */
export const CATEGORY_TIME_MAPPING: Record<string, TimeOfDay[]> = {
  Foundation: ['morning', 'evening'],
  Performance: ['morning', 'afternoon'],
  Recovery: ['afternoon', 'evening', 'night'],
  Optimization: ['morning', 'afternoon', 'evening'],
  Meta: ['morning', 'evening'],
};
