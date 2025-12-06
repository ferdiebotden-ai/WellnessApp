"use strict";
/**
 * Wake Detection Types for Apex OS Phase 3
 *
 * These types define the wake detection system used to trigger the
 * Morning Anchor at the optimal 5-15 minute post-wake window.
 *
 * Detection methods (in priority order):
 * 1. HRV spike from wearable (most accurate)
 * 2. Movement spike from wearable
 * 3. Phone unlock (Lite Mode fallback)
 * 4. Manual user input
 *
 * @file functions/src/types/wake.types.ts
 * @author Claude Opus 4.5 (Session 35)
 * @created December 4, 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMethodConfidence = getMethodConfidence;
exports.calculateMorningAnchorWindow = calculateMorningAnchorWindow;
exports.toWakeEventRow = toWakeEventRow;
exports.fromWakeEventRow = fromWakeEventRow;
exports.isHrvSpikeMetrics = isHrvSpikeMetrics;
exports.isMovementMetrics = isMovementMetrics;
exports.isPhoneUnlockMetrics = isPhoneUnlockMetrics;
exports.isManualWakeMetrics = isManualWakeMetrics;
// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
/**
 * Calculate confidence score based on detection method.
 */
function getMethodConfidence(method) {
    switch (method) {
        case 'hrv_spike':
            return 0.95; // Most accurate
        case 'movement':
            return 0.80;
        case 'phone_unlock':
            return 0.60; // Lite Mode fallback
        case 'manual':
            return 0.70; // User-reported
        default:
            return 0.50;
    }
}
/**
 * Calculate Morning Anchor window from wake time.
 */
function calculateMorningAnchorWindow(wakeTime, config = {
    minDelayMinutes: 5,
    maxDelayMinutes: 15,
    optimalDelayMinutes: 8,
    skipReasons: [],
}) {
    return {
        start: new Date(wakeTime.getTime() + config.minDelayMinutes * 60 * 1000),
        end: new Date(wakeTime.getTime() + config.maxDelayMinutes * 60 * 1000),
        optimal: new Date(wakeTime.getTime() + config.optimalDelayMinutes * 60 * 1000),
    };
}
/**
 * Convert WakeEvent to database row format.
 */
function toWakeEventRow(event) {
    return {
        id: event.id,
        user_id: event.userId,
        date: event.date,
        wake_time: event.wakeTime?.toISOString(),
        detection_method: event.detectionMethod,
        confidence: event.confidence,
        morning_anchor_triggered_at: event.morningAnchorTriggeredAt?.toISOString() ?? null,
        morning_anchor_skipped: event.morningAnchorSkipped,
        skip_reason: event.skipReason,
        source_metrics: event.sourceMetrics,
        created_at: event.createdAt?.toISOString(),
    };
}
/**
 * Convert database row to WakeEvent format.
 */
function fromWakeEventRow(row) {
    return {
        id: row.id,
        userId: row.user_id,
        date: row.date,
        wakeTime: new Date(row.wake_time),
        detectionMethod: row.detection_method,
        confidence: row.confidence,
        morningAnchorTriggeredAt: row.morning_anchor_triggered_at
            ? new Date(row.morning_anchor_triggered_at)
            : null,
        morningAnchorSkipped: row.morning_anchor_skipped,
        skipReason: row.skip_reason,
        sourceMetrics: row.source_metrics,
        createdAt: new Date(row.created_at),
    };
}
/**
 * Type guard for HRV spike metrics.
 */
function isHrvSpikeMetrics(metrics) {
    return metrics.method === 'hrv_spike';
}
/**
 * Type guard for movement metrics.
 */
function isMovementMetrics(metrics) {
    return metrics.method === 'movement';
}
/**
 * Type guard for phone unlock metrics.
 */
function isPhoneUnlockMetrics(metrics) {
    return metrics.method === 'phone_unlock';
}
/**
 * Type guard for manual wake metrics.
 */
function isManualWakeMetrics(metrics) {
    return metrics.method === 'manual';
}
