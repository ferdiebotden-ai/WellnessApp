"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateConfidence = calculateConfidence;
exports.determineZone = determineZone;
exports.determineBaselineConfidence = determineBaselineConfidence;
exports.toUserBaselineRow = toUserBaselineRow;
exports.fromUserBaselineRow = fromUserBaselineRow;
exports.toRecoveryScoreRow = toRecoveryScoreRow;
/**
 * Calculate overall confidence from factors.
 */
function calculateConfidence(factors) {
    const weights = {
        dataRecency: 0.30,
        sampleSize: 0.25,
        correlationStrength: 0.20,
        userEngagement: 0.15,
        contextMatch: 0.10,
    };
    return (factors.dataRecency * weights.dataRecency +
        factors.sampleSize * weights.sampleSize +
        factors.correlationStrength * weights.correlationStrength +
        factors.userEngagement * weights.userEngagement +
        factors.contextMatch * weights.contextMatch);
}
// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
/**
 * Determine recovery zone from score.
 */
function determineZone(score) {
    if (score >= 67)
        return 'green';
    if (score >= 34)
        return 'yellow';
    return 'red';
}
/**
 * Determine baseline confidence from sample count.
 */
function determineBaselineConfidence(sampleCount) {
    if (sampleCount >= 14)
        return 'high';
    if (sampleCount >= 7)
        return 'medium';
    return 'low';
}
/**
 * Convert UserBaseline to database row format.
 */
function toUserBaselineRow(baseline) {
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
function fromUserBaselineRow(row) {
    return {
        id: row.id,
        userId: row.user_id,
        hrvLnMean: row.hrv_ln_mean ?? 0,
        hrvLnStdDev: row.hrv_ln_std_dev ?? 0,
        hrvCoefficientOfVariation: row.hrv_coefficient_of_variation ?? 0,
        hrvMethod: row.hrv_method ?? 'rmssd',
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
        confidenceLevel: row.confidence_level,
        lastUpdated: new Date(row.last_updated),
        createdAt: new Date(row.created_at),
    };
}
/**
 * Convert RecoveryResult to database row format.
 */
function toRecoveryScoreRow(userId, date, result) {
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
