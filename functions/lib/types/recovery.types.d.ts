/**
 * Recovery Score Types for Apex OS Phase 3
 *
 * These types define the recovery calculation system including baselines,
 * scores, and the full transparency breakdown for the "Why?" panel.
 *
 * Recovery Formula (peer-reviewed basis):
 * Recovery = (HRV_Score × 0.40) + (RHR_Score × 0.25) + (Sleep_Quality × 0.20) +
 *            (Sleep_Duration × 0.10) + (Respiratory_Rate × 0.05) - Temperature_Penalty
 *
 * @file functions/src/types/recovery.types.ts
 * @author Claude Opus 4.5 (Session 35)
 * @created December 4, 2025
 */
import { HrvMethod } from './wearable.types';
/**
 * Baseline confidence level based on sample count.
 * - low: < 7 days of data
 * - medium: 7-14 days of data
 * - high: 14+ days of data
 */
export type BaselineConfidence = 'low' | 'medium' | 'high';
/**
 * User's personalized baselines for recovery calculation.
 * Updated daily with rolling 14-day window.
 *
 * Stored in `user_baselines` table (one record per user).
 */
export interface UserBaseline {
    id?: string;
    userId: string;
    hrvLnMean: number;
    hrvLnStdDev: number;
    hrvCoefficientOfVariation: number;
    hrvMethod: HrvMethod;
    hrvSampleCount: number;
    rhrMean: number;
    rhrStdDev: number;
    rhrSampleCount: number;
    respiratoryRateMean: number;
    respiratoryRateStdDev: number;
    sleepDurationTarget: number;
    temperatureBaselineCelsius: number;
    menstrualCycleTracking: boolean;
    cycleDay: number | null;
    lastPeriodStart: Date | null;
    confidenceLevel: BaselineConfidence;
    lastUpdated: Date;
    createdAt: Date;
}
/**
 * Database row format for user_baselines (snake_case).
 */
export interface UserBaselineRow {
    id: string;
    user_id: string;
    hrv_ln_mean: number | null;
    hrv_ln_std_dev: number | null;
    hrv_coefficient_of_variation: number | null;
    hrv_method: string | null;
    hrv_sample_count: number;
    rhr_mean: number | null;
    rhr_std_dev: number | null;
    rhr_sample_count: number;
    respiratory_rate_mean: number | null;
    respiratory_rate_std_dev: number | null;
    sleep_duration_target_minutes: number | null;
    temperature_baseline_celsius: number | null;
    menstrual_cycle_tracking: boolean;
    cycle_day: number | null;
    last_period_start: string | null;
    confidence_level: string;
    last_updated: string;
    created_at: string;
}
/**
 * Recovery zone (traffic light system).
 * - red: 0-33 (take it easy)
 * - yellow: 34-66 (moderate activity)
 * - green: 67-100 (ready for high intensity)
 */
export type RecoveryZone = 'red' | 'yellow' | 'green';
/**
 * Illness risk level based on temperature and respiratory rate.
 */
export type IllnessRisk = 'none' | 'low' | 'medium' | 'high';
/**
 * Component weight in recovery formula.
 */
export type ComponentWeight = 0.40 | 0.25 | 0.20 | 0.10 | 0.05;
/**
 * HRV component breakdown.
 */
export interface HrvComponent {
    raw: number | null;
    score: number;
    vsBaseline: string;
    weight: 0.40;
}
/**
 * RHR component breakdown.
 */
export interface RhrComponent {
    raw: number | null;
    score: number;
    vsBaseline: string;
    weight: 0.25;
}
/**
 * Sleep quality component breakdown.
 */
export interface SleepQualityComponent {
    efficiency: number | null;
    deepPct: number | null;
    remPct: number | null;
    score: number;
    weight: 0.20;
}
/**
 * Sleep duration component breakdown.
 */
export interface SleepDurationComponent {
    hours: number | null;
    vsTarget: string;
    score: number;
    weight: 0.10;
}
/**
 * Respiratory rate component breakdown.
 */
export interface RespiratoryRateComponent {
    raw: number | null;
    score: number;
    vsBaseline: string;
    weight: 0.05;
}
/**
 * Temperature penalty (subtracts from score).
 */
export interface TemperaturePenalty {
    deviation: number | null;
    penalty: number;
}
/**
 * Full component breakdown for transparency.
 */
export interface RecoveryComponents {
    hrv: HrvComponent;
    rhr: RhrComponent;
    sleepQuality: SleepQualityComponent;
    sleepDuration: SleepDurationComponent;
    respiratoryRate: RespiratoryRateComponent;
    temperaturePenalty: TemperaturePenalty;
}
/**
 * Edge case detection for special circumstances.
 */
export interface EdgeCases {
    alcoholDetected: boolean;
    illnessRisk: IllnessRisk;
    travelDetected: boolean;
    menstrualPhaseAdjustment: boolean;
}
/**
 * Recovery calculation result with full transparency.
 * Stored in `recovery_scores` table.
 */
export interface RecoveryResult {
    score: number;
    confidence: number;
    zone: RecoveryZone;
    components: RecoveryComponents;
    edgeCases: EdgeCases;
    reasoning: string;
    recommendations: RecoveryRecommendation[];
    dataCompleteness: number;
    missingInputs: string[];
}
/**
 * Database row format for recovery_scores (snake_case).
 */
export interface RecoveryScoreRow {
    id: string;
    user_id: string;
    date: string;
    score: number;
    confidence: number;
    zone: string;
    components: RecoveryComponents;
    edge_cases: EdgeCases;
    reasoning: string | null;
    recommendations: RecoveryRecommendation[];
    data_completeness: number;
    missing_inputs: string[];
    created_at: string;
}
/**
 * Recommendation type.
 */
export type RecommendationType = 'training' | 'rest' | 'health' | 'recovery';
/**
 * Recovery-based recommendation for the user.
 */
export interface RecoveryRecommendation {
    type: RecommendationType;
    headline: string;
    body: string;
    protocols: string[];
    activateMVD?: boolean;
}
/**
 * Factors that affect confidence in recovery score.
 */
export interface ConfidenceFactors {
    dataRecency: number;
    sampleSize: number;
    correlationStrength: number;
    userEngagement: number;
    contextMatch: number;
}
/**
 * Calculate overall confidence from factors.
 */
export declare function calculateConfidence(factors: ConfidenceFactors): number;
/**
 * Determine recovery zone from score.
 */
export declare function determineZone(score: number): RecoveryZone;
/**
 * Determine baseline confidence from sample count.
 */
export declare function determineBaselineConfidence(sampleCount: number): BaselineConfidence;
/**
 * Convert UserBaseline to database row format.
 */
export declare function toUserBaselineRow(baseline: Partial<UserBaseline>): Partial<UserBaselineRow>;
/**
 * Convert database row to UserBaseline format.
 */
export declare function fromUserBaselineRow(row: UserBaselineRow): UserBaseline;
/**
 * Convert RecoveryResult to database row format.
 */
export declare function toRecoveryScoreRow(userId: string, date: string, result: RecoveryResult): Omit<RecoveryScoreRow, 'id' | 'created_at'>;
