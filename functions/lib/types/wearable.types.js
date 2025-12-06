"use strict";
/**
 * Wearable Data Types for Apex OS Phase 3
 *
 * These types define the canonical format for wearable data from any source.
 * All wearable sync services normalize to these interfaces before storage.
 *
 * @file functions/src/types/wearable.types.ts
 * @author Claude Opus 4.5 (Session 35)
 * @created December 4, 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDailyMetricsRow = toDailyMetricsRow;
exports.fromDailyMetricsRow = fromDailyMetricsRow;
// =============================================================================
// UTILITY TYPES
// =============================================================================
/**
 * Convert DailyMetrics to database row format.
 */
function toDailyMetricsRow(metrics) {
    return {
        id: metrics.id,
        user_id: metrics.userId,
        date: metrics.date,
        sleep_duration_hours: metrics.sleepDurationHours,
        sleep_efficiency: metrics.sleepEfficiency,
        sleep_onset_minutes: metrics.sleepOnsetMinutes,
        bedtime_start: metrics.bedtimeStart,
        bedtime_end: metrics.bedtimeEnd,
        rem_percentage: metrics.remPercentage,
        deep_percentage: metrics.deepPercentage,
        light_percentage: metrics.lightPercentage,
        awake_percentage: metrics.awakePercentage,
        hrv_avg: metrics.hrvAvg,
        hrv_method: metrics.hrvMethod,
        rhr_avg: metrics.rhrAvg,
        respiratory_rate_avg: metrics.respiratoryRateAvg,
        steps: metrics.steps,
        active_minutes: metrics.activeMinutes,
        active_calories: metrics.activeCalories,
        temperature_deviation: metrics.temperatureDeviation,
        recovery_score: metrics.recoveryScore,
        recovery_confidence: metrics.recoveryConfidence,
        wearable_source: metrics.wearableSource,
        raw_payload: metrics.rawPayload,
        synced_at: metrics.syncedAt?.toISOString(),
        created_at: metrics.createdAt?.toISOString(),
        updated_at: metrics.updatedAt?.toISOString(),
    };
}
/**
 * Convert database row to DailyMetrics format.
 */
function fromDailyMetricsRow(row) {
    return {
        id: row.id,
        userId: row.user_id,
        date: row.date,
        sleepDurationHours: row.sleep_duration_hours,
        sleepEfficiency: row.sleep_efficiency,
        sleepOnsetMinutes: row.sleep_onset_minutes,
        bedtimeStart: row.bedtime_start,
        bedtimeEnd: row.bedtime_end,
        remPercentage: row.rem_percentage,
        deepPercentage: row.deep_percentage,
        lightPercentage: row.light_percentage,
        awakePercentage: row.awake_percentage,
        hrvAvg: row.hrv_avg,
        hrvMethod: row.hrv_method,
        rhrAvg: row.rhr_avg,
        respiratoryRateAvg: row.respiratory_rate_avg,
        steps: row.steps,
        activeMinutes: row.active_minutes,
        activeCalories: row.active_calories,
        temperatureDeviation: row.temperature_deviation,
        recoveryScore: row.recovery_score,
        recoveryConfidence: row.recovery_confidence,
        wearableSource: row.wearable_source,
        rawPayload: row.raw_payload,
        syncedAt: new Date(row.synced_at),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}
