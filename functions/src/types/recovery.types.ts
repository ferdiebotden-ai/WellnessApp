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

// =============================================================================
// USER BASELINES
// =============================================================================

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

  // HRV baseline (log-transformed for statistical accuracy)
  // HRV is log-normally distributed, so we use ln(RMSSD) for z-scores
  hrvLnMean: number;                    // Natural log of RMSSD mean
  hrvLnStdDev: number;                  // Std dev of ln(RMSSD)
  hrvCoefficientOfVariation: number;    // CV in percentage (normal: 2-20%)
  hrvMethod: HrvMethod;
  hrvSampleCount: number;

  // RHR baseline
  rhrMean: number;                      // BPM
  rhrStdDev: number;                    // Typically 2-4 bpm
  rhrSampleCount: number;

  // Respiratory rate baseline
  respiratoryRateMean: number;          // Breaths per minute
  respiratoryRateStdDev: number;

  // Sleep baseline
  sleepDurationTarget: number;          // Minutes (75th percentile of user's sleep)

  // Temperature baseline
  temperatureBaselineCelsius: number;

  // Menstrual cycle tracking (optional, for temperature adjustment)
  menstrualCycleTracking: boolean;
  cycleDay: number | null;              // 1-28
  lastPeriodStart: Date | null;

  // Metadata
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

// =============================================================================
// RECOVERY SCORE RESULT
// =============================================================================

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
  raw: number | null;                   // Actual value in ms
  score: number;                        // 0-100 normalized
  vsBaseline: string;                   // e.g., "+12% above baseline"
  weight: 0.40;
}

/**
 * RHR component breakdown.
 */
export interface RhrComponent {
  raw: number | null;                   // Actual value in bpm
  score: number;                        // 0-100 normalized
  vsBaseline: string;                   // e.g., "+2 bpm above baseline"
  weight: 0.25;
}

/**
 * Sleep quality component breakdown.
 */
export interface SleepQualityComponent {
  efficiency: number | null;            // 0-100%
  deepPct: number | null;               // Percentage of deep sleep
  remPct: number | null;                // Percentage of REM sleep
  score: number;                        // 0-100 normalized
  weight: 0.20;
}

/**
 * Sleep duration component breakdown.
 */
export interface SleepDurationComponent {
  hours: number | null;                 // Actual sleep hours
  vsTarget: string;                     // e.g., "-30 min from target"
  score: number;                        // 0-100 normalized
  weight: 0.10;
}

/**
 * Respiratory rate component breakdown.
 */
export interface RespiratoryRateComponent {
  raw: number | null;                   // Actual breaths per minute
  score: number;                        // 0-100 normalized
  vsBaseline: string;                   // e.g., "Normal range"
  weight: 0.05;
}

/**
 * Temperature penalty (subtracts from score).
 */
export interface TemperaturePenalty {
  deviation: number | null;             // Celsius deviation
  penalty: number;                      // 0 to -15 (negative only)
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
  alcoholDetected: boolean;             // High RHR + Low HRV + Low REM pattern
  illnessRisk: IllnessRisk;             // Elevated temp + respiratory rate
  travelDetected: boolean;              // Timezone/location change
  menstrualPhaseAdjustment: boolean;    // Luteal phase temperature adjustment
}

/**
 * Recovery calculation result with full transparency.
 * Stored in `recovery_scores` table.
 */
export interface RecoveryResult {
  score: number;                        // 0-100
  confidence: number;                   // 0.0-1.0
  zone: RecoveryZone;

  // Component breakdown (for "Why?" panel)
  components: RecoveryComponents;

  // Edge case detection
  edgeCases: EdgeCases;

  // Reasoning for "Why?" panel
  reasoning: string;
  recommendations: RecoveryRecommendation[];

  // Data quality
  dataCompleteness: number;             // 0-100 (what % of inputs were available)
  missingInputs: string[];              // e.g., ['respiratoryRate', 'temperature']
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

// =============================================================================
// RECOMMENDATIONS
// =============================================================================

/**
 * Recommendation type.
 */
export type RecommendationType = 'training' | 'rest' | 'health' | 'recovery';

/**
 * Recovery-based recommendation for the user.
 */
export interface RecoveryRecommendation {
  type: RecommendationType;
  headline: string;                     // e.g., "Green light for intense training"
  body: string;                         // Detailed explanation
  protocols: string[];                  // Protocol IDs to activate
  activateMVD?: boolean;                // Whether to activate Minimum Viable Day
}

// =============================================================================
// CONFIDENCE FACTORS
// =============================================================================

/**
 * Factors that affect confidence in recovery score.
 */
export interface ConfidenceFactors {
  dataRecency: number;                  // 0-1: Data from last 12h vs 48h+
  sampleSize: number;                   // 0-1: Baseline sample count
  correlationStrength: number;          // 0-1: Historical correlation
  userEngagement: number;               // 0-1: Protocol adherence rate
  contextMatch: number;                 // 0-1: Calendar/location match
}

/**
 * Calculate overall confidence from factors.
 */
export function calculateConfidence(factors: ConfidenceFactors): number {
  const weights = {
    dataRecency: 0.30,
    sampleSize: 0.25,
    correlationStrength: 0.20,
    userEngagement: 0.15,
    contextMatch: 0.10,
  };

  return (
    factors.dataRecency * weights.dataRecency +
    factors.sampleSize * weights.sampleSize +
    factors.correlationStrength * weights.correlationStrength +
    factors.userEngagement * weights.userEngagement +
    factors.contextMatch * weights.contextMatch
  );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Determine recovery zone from score.
 */
export function determineZone(score: number): RecoveryZone {
  if (score >= 67) return 'green';
  if (score >= 34) return 'yellow';
  return 'red';
}

/**
 * Determine baseline confidence from sample count.
 */
export function determineBaselineConfidence(sampleCount: number): BaselineConfidence {
  if (sampleCount >= 14) return 'high';
  if (sampleCount >= 7) return 'medium';
  return 'low';
}

/**
 * Convert UserBaseline to database row format.
 */
export function toUserBaselineRow(baseline: Partial<UserBaseline>): Partial<UserBaselineRow> {
  return {
    id: baseline.id,
    user_id: baseline.userId,
    hrv_ln_mean: baseline.hrvLnMean,
    hrv_ln_std_dev: baseline.hrvLnStdDev,
    hrv_coefficient_of_variation: baseline.hrvCoefficientOfVariation,
    hrv_method: baseline.hrvMethod,
    hrv_sample_count: baseline.hrvSampleCount,
    rhr_mean: baseline.rhrMean,
    rhr_std_dev: baseline.rhrStdDev,
    rhr_sample_count: baseline.rhrSampleCount,
    respiratory_rate_mean: baseline.respiratoryRateMean,
    respiratory_rate_std_dev: baseline.respiratoryRateStdDev,
    sleep_duration_target_minutes: baseline.sleepDurationTarget,
    temperature_baseline_celsius: baseline.temperatureBaselineCelsius,
    menstrual_cycle_tracking: baseline.menstrualCycleTracking,
    cycle_day: baseline.cycleDay,
    last_period_start: baseline.lastPeriodStart?.toISOString().split('T')[0],
    confidence_level: baseline.confidenceLevel,
    last_updated: baseline.lastUpdated?.toISOString(),
    created_at: baseline.createdAt?.toISOString(),
  };
}

/**
 * Convert database row to UserBaseline format.
 */
export function fromUserBaselineRow(row: UserBaselineRow): UserBaseline {
  return {
    id: row.id,
    userId: row.user_id,
    hrvLnMean: row.hrv_ln_mean ?? 0,
    hrvLnStdDev: row.hrv_ln_std_dev ?? 0,
    hrvCoefficientOfVariation: row.hrv_coefficient_of_variation ?? 0,
    hrvMethod: (row.hrv_method as HrvMethod) ?? 'rmssd',
    hrvSampleCount: row.hrv_sample_count,
    rhrMean: row.rhr_mean ?? 0,
    rhrStdDev: row.rhr_std_dev ?? 0,
    rhrSampleCount: row.rhr_sample_count,
    respiratoryRateMean: row.respiratory_rate_mean ?? 0,
    respiratoryRateStdDev: row.respiratory_rate_std_dev ?? 0,
    sleepDurationTarget: row.sleep_duration_target_minutes ?? 420, // Default 7 hours
    temperatureBaselineCelsius: row.temperature_baseline_celsius ?? 36.5,
    menstrualCycleTracking: row.menstrual_cycle_tracking,
    cycleDay: row.cycle_day,
    lastPeriodStart: row.last_period_start ? new Date(row.last_period_start) : null,
    confidenceLevel: row.confidence_level as BaselineConfidence,
    lastUpdated: new Date(row.last_updated),
    createdAt: new Date(row.created_at),
  };
}

/**
 * Convert RecoveryResult to database row format.
 */
export function toRecoveryScoreRow(
  userId: string,
  date: string,
  result: RecoveryResult
): Omit<RecoveryScoreRow, 'id' | 'created_at'> {
  return {
    user_id: userId,
    date,
    score: result.score,
    confidence: result.confidence,
    zone: result.zone,
    components: result.components,
    edge_cases: result.edgeCases,
    reasoning: result.reasoning,
    recommendations: result.recommendations,
    data_completeness: result.dataCompleteness,
    missing_inputs: result.missingInputs,
  };
}
