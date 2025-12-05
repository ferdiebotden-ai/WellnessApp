/**
 * Today Metrics Types
 *
 * Types for the todayMetrics Firestore document.
 * This document is synced after HealthKit background delivery
 * and enables real-time dashboard updates.
 *
 * Reference: Phase 3 Session 6 - Real-time Sync
 */

import type { RecoveryZone } from './recovery.types';

/**
 * Recovery data in the todayMetrics document.
 */
export interface TodayMetricsRecovery {
  /** Calculated recovery score (0-100) */
  score: number;
  /** Zone classification */
  zone: RecoveryZone;
  /** Confidence level (0-1) */
  confidence: number;
  /** Human-readable reasoning */
  reasoning: string;
  /** Component scores for transparency */
  components?: {
    /** HRV component score */
    hrv: number | null;
    /** Resting heart rate component score */
    rhr: number | null;
    /** Sleep quality component score */
    sleepQuality: number | null;
    /** Sleep duration component score */
    sleepDuration: number | null;
  };
}

/**
 * Sleep data in the todayMetrics document.
 */
export interface TodayMetricsSleep {
  /** Total sleep duration in hours */
  durationHours: number | null;
  /** Sleep efficiency percentage (0-100) */
  efficiency: number | null;
  /** Deep sleep percentage */
  deepPct: number | null;
  /** REM sleep percentage */
  remPct: number | null;
  /** Bedtime start ISO string */
  bedtimeStart: string | null;
  /** Bedtime end ISO string */
  bedtimeEnd: string | null;
}

/**
 * HRV data in the todayMetrics document.
 */
export interface TodayMetricsHrv {
  /** Average HRV value */
  avg: number | null;
  /** Measurement method */
  method: 'rmssd' | 'sdnn' | 'unknown' | null;
  /** Comparison to user's baseline */
  vsBaseline: string | null;
}

/**
 * Resting heart rate data in the todayMetrics document.
 */
export interface TodayMetricsRhr {
  /** Average resting heart rate */
  avg: number | null;
  /** Comparison to user's baseline */
  vsBaseline: string | null;
}

/**
 * Full todayMetrics document structure stored in Firestore.
 * Path: todayMetrics/{userId}
 */
export interface TodayMetricsDocument {
  /** Date of the metrics (YYYY-MM-DD) */
  date: string;
  /** User ID (matches Firestore document ID) */
  userId: string;
  /** ISO timestamp of last sync */
  lastSyncedAt: string;

  /** Recovery score and components */
  recovery: TodayMetricsRecovery | null;

  /** Sleep metrics */
  sleep: TodayMetricsSleep;

  /** Heart rate variability */
  hrv: TodayMetricsHrv;

  /** Resting heart rate */
  rhr: TodayMetricsRhr;

  /** Step count for the day */
  steps: number | null;

  /** Active calories burned */
  activeCalories: number | null;

  /** Data completeness score (0-1) */
  dataCompleteness: number;

  /** Source of the wearable data */
  wearableSource: string | null;
}

/**
 * Partial update for todayMetrics document.
 * Used when only some fields need updating.
 */
export type TodayMetricsPartialUpdate = Partial<
  Omit<TodayMetricsDocument, 'userId' | 'date'>
>;

/**
 * Calculate data completeness based on available fields.
 */
export function calculateDataCompleteness(doc: Partial<TodayMetricsDocument>): number {
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
export function formatVsBaseline(
  current: number | null | undefined,
  baseline: number | null | undefined,
  higherIsBetter: boolean = true
): string | null {
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
