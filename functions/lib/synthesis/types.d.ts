/**
 * Weekly Synthesis Types
 *
 * Defines interfaces and constants for weekly metrics aggregation and narrative generation.
 * These types support the Sunday Brief feature that summarizes user progress.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 5
 */
/**
 * Outcome metrics that can be correlated with protocol adherence
 */
export type OutcomeMetric = 'sleep_hours' | 'hrv_score' | 'recovery_score' | 'resting_hr';
/**
 * Expected correlation direction for each outcome metric
 * Used to interpret whether a correlation is beneficial or concerning
 */
export declare const OUTCOME_EXPECTED_DIRECTION: Record<OutcomeMetric, 'positive' | 'negative'>;
/**
 * Human-readable names for outcome metrics
 */
export declare const OUTCOME_METRIC_NAMES: Record<OutcomeMetric, string>;
/**
 * Configuration constants for synthesis generation
 */
export declare const SYNTHESIS_CONFIG: {
    /** Minimum days of data required to generate synthesis */
    readonly MIN_DATA_DAYS: 4;
    /** Minimum days of data required for correlation analysis */
    readonly MIN_CORRELATION_DAYS: 14;
    /** P-value threshold for statistical significance */
    readonly CORRELATION_P_THRESHOLD: 0.05;
    /** Maximum correlations to include in synthesis */
    readonly MAX_CORRELATIONS: 5;
    /** Days to look back for correlation analysis */
    readonly CORRELATION_LOOKBACK_DAYS: 30;
    /** Target word count for narrative */
    readonly TARGET_WORD_COUNT: 200;
    /** Minimum word count for narrative */
    readonly MIN_WORD_COUNT: 150;
    /** Maximum word count for narrative */
    readonly MAX_WORD_COUNT: 250;
};
/**
 * Breakdown of a single protocol's completion stats for the week
 */
export interface ProtocolBreakdown {
    /** Protocol identifier */
    protocol_id: string;
    /** Human-readable protocol name */
    name: string;
    /** Number of unique days the protocol was completed (0-7) */
    completed_days: number;
    /** Total completions (may exceed 7 if done multiple times per day) */
    total_completions: number;
    /** Average duration in minutes (null if not tracked) */
    avg_duration_minutes: number | null;
    /** Completion rate as percentage (completed_days / 7 * 100) */
    completion_rate: number;
}
/**
 * Statistical correlation between a protocol and an outcome metric
 */
export interface ProtocolCorrelation {
    /** Protocol identifier */
    protocol: string;
    /** Human-readable protocol name */
    protocol_name: string;
    /** Outcome metric being correlated */
    outcome: OutcomeMetric;
    /** Pearson correlation coefficient (-1 to 1) */
    correlation: number;
    /** Two-tailed p-value for statistical significance */
    p_value: number;
    /** Whether correlation is statistically significant (p < 0.05) */
    is_significant: boolean;
    /** Number of data points used in calculation */
    sample_size: number;
    /** Correlation direction */
    direction: 'positive' | 'negative' | 'neutral';
    /** Human-readable interpretation */
    interpretation: string;
}
/**
 * Week-over-week comparison metrics
 */
export interface WeekOverWeekComparison {
    /** Change in protocol adherence percentage (positive = improvement) */
    protocol_adherence_change: number | null;
    /** Change in total protocols completed (positive = more) */
    protocols_completed_change: number | null;
    /** Change in average recovery score (positive = improvement) */
    recovery_score_change: number | null;
}
/**
 * Complete weekly metrics aggregation for a user
 * This is the main data structure passed to narrative generation
 */
export interface WeeklyMetrics {
    /** User identifier */
    user_id: string;
    /** Start of week (Monday) as ISO date string */
    week_start: string;
    /** End of week (Sunday) as ISO date string */
    week_end: string;
    /** Overall protocol adherence percentage (0-100) */
    protocol_adherence: number;
    /** Number of unique days with at least one protocol completion (0-7) */
    days_with_completion: number;
    /** Total protocol completions across the week */
    total_protocols_completed: number;
    /** Average recovery score for the week (0-100, null if no wearable data) */
    avg_recovery_score: number | null;
    /** HRV trend as percentage change from prior week (null if insufficient data) */
    hrv_trend_percent: number | null;
    /** Sleep quality trend as percentage change from prior week (null if insufficient data) */
    sleep_quality_trend_percent: number | null;
    /** Per-protocol completion statistics */
    protocol_breakdown: ProtocolBreakdown[];
    /** Statistically significant correlations between protocols and outcomes */
    correlations: ProtocolCorrelation[];
    /** Number of days with any data in this week */
    data_days_available: number;
    /** Whether wearable data was available for this week */
    has_wearable_data: boolean;
    /** Comparison with prior week's metrics */
    week_over_week: WeekOverWeekComparison;
    /** ISO timestamp when metrics were generated */
    generated_at: string;
}
/**
 * Raw row from protocol_logs table query
 */
export interface ProtocolLogRow {
    id: string;
    user_id: string;
    protocol_id: string;
    module_id: string | null;
    source: 'schedule' | 'manual' | 'nudge' | 'auto';
    status: 'completed' | 'skipped' | 'partial';
    logged_at: string;
    duration_minutes: number | null;
}
/**
 * Raw row from wearable_data_archive table query
 */
export interface WearableDataRow {
    id: string;
    user_id: string;
    source: string;
    recorded_at: string;
    hrv_score: number | null;
    hrv_rmssd_ms: number | null;
    sleep_hours: number | null;
    resting_hr_bpm: number | null;
    readiness_score: number | null;
}
/**
 * Protocol name lookup result
 */
export interface ProtocolNameRow {
    id: string;
    name: string;
}
/**
 * Enrolled protocol from module_enrollment + module_protocol_map join
 */
export interface EnrolledProtocolRow {
    protocol_id: string;
    module_id: string;
}
/**
 * The 5 required sections in a weekly synthesis narrative
 */
export type NarrativeSection = 'Win' | 'Watch' | 'Pattern' | 'Trajectory' | 'Experiment';
/**
 * All narrative sections that should be present
 */
export declare const NARRATIVE_SECTIONS: NarrativeSection[];
/**
 * Result of weekly synthesis narrative generation
 * Stored in weekly_syntheses table
 */
export interface WeeklySynthesisResult {
    /** User identifier */
    user_id: string;
    /** Start of week (Monday) as ISO date string */
    week_start: string;
    /** End of week (Sunday) as ISO date string */
    week_end: string;
    /** AI-generated narrative (~200 words with 5 sections) */
    narrative: string;
    /** Snapshot of WeeklyMetrics at generation time */
    metrics_snapshot: WeeklyMetrics;
    /** ISO timestamp when synthesis was generated */
    generated_at: string;
    /** Word count of narrative */
    word_count: number;
    /** Sections detected in narrative (ideally all 5) */
    sections_detected: NarrativeSection[];
}
/**
 * User context needed for narrative generation
 */
export interface UserSynthesisContext {
    /** User's display name for personalization */
    display_name: string;
    /** User's primary wellness goal */
    primary_goal?: string;
    /** IANA timezone string (e.g., 'America/New_York') */
    timezone?: string;
}
/**
 * Push notification message for weekly synthesis
 */
export interface SynthesisNotification {
    /** Expo Push Token */
    to: string;
    /** Notification title */
    title: string;
    /** Notification body */
    body: string;
    /** Additional data payload */
    data: {
        type: 'weekly_synthesis';
        synthesis_id: string;
    };
    /** Sound setting */
    sound: 'default' | null;
}
