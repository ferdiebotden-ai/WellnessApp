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
export type PrimaryGoal = 'better_sleep' | 'more_energy' | 'sharper_focus' | 'faster_recovery';
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
export declare const CONFIDENCE_WEIGHTS: Record<keyof ConfidenceFactors, number>;
/**
 * Evidence level to score mapping
 */
export declare const EVIDENCE_SCORES: Record<EvidenceLevel, number>;
/**
 * Confidence threshold for nudge suppression
 */
export declare const CONFIDENCE_SUPPRESSION_THRESHOLD = 0.4;
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
export declare const GOAL_MODULE_MAPPING: Record<PrimaryGoal, string[]>;
/**
 * Keywords associated with each goal for protocol name/benefit matching
 */
export declare const GOAL_KEYWORDS: Record<PrimaryGoal, string[]>;
/**
 * Protocol category to optimal time-of-day mapping
 */
export declare const CATEGORY_TIME_MAPPING: Record<string, TimeOfDay[]>;
