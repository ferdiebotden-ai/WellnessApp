"use strict";
/**
 * Today Metrics Types
 *
 * Types for the todayMetrics Firestore document.
 * This document is synced after HealthKit background delivery
 * and enables real-time dashboard updates.
 *
 * Reference: Phase 3 Session 6 - Real-time Sync
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDataCompleteness = calculateDataCompleteness;
exports.formatVsBaseline = formatVsBaseline;
/**
 * Calculate data completeness based on available fields.
 */
function calculateDataCompleteness(doc) {
    const fields = [
        doc.recovery?.score != null,
        doc.sleep?.durationHours != null,
        doc.sleep?.efficiency != null,
        doc.hrv?.avg != null,
        doc.rhr?.avg != null,
        doc.steps != null,
    ];
    const filledCount = fields.filter(Boolean).length;
    return filledCount / fields.length;
}
/**
 * Format baseline comparison string.
 * Returns null if no baseline available.
 */
function formatVsBaseline(current, baseline, higherIsBetter = true) {
    if (current == null || baseline == null || baseline === 0) {
        return null;
    }
    const diff = current - baseline;
    const pctDiff = Math.round((diff / baseline) * 100);
    if (Math.abs(pctDiff) < 5) {
        return 'On track';
    }
    const direction = pctDiff > 0 ? 'above' : 'below';
    const quality = higherIsBetter
        ? (pctDiff > 0 ? 'good' : 'low')
        : (pctDiff > 0 ? 'elevated' : 'good');
    return `${Math.abs(pctDiff)}% ${direction} baseline (${quality})`;
}
