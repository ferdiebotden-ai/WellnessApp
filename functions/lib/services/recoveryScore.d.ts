/**
 * Recovery Score Service
 *
 * Calculates recovery scores from daily wearable metrics using a weighted
 * algorithm based on HRV, RHR, sleep quality, and other biometric data.
 *
 * Formula (peer-reviewed basis):
 * Recovery = (HRV × 0.40) + (RHR × 0.25) + (SleepQuality × 0.20) +
 *            (SleepDuration × 0.10) + (RespiratoryRate × 0.05) - TempPenalty
 *
 * @file functions/src/services/recoveryScore.ts
 * @author Claude Opus 4.5 (Session 40)
 * @created December 4, 2025
 */
import type { DailyMetricsRow, HrvMethod } from '../types/wearable.types';
import { type UserBaseline, type RecoveryResult, type TemperaturePenalty, type EdgeCases, type RecoveryRecommendation, type RecoveryZone } from '../types/recovery.types';
/** Default component weights (sum to 1.0) */
export declare const COMPONENT_WEIGHTS: {
    readonly hrv: 0.4;
    readonly rhr: 0.25;
    readonly sleepQuality: 0.2;
    readonly sleepDuration: 0.1;
    readonly respiratoryRate: 0.05;
};
/**
 * Input for recovery score calculation.
 */
export interface RecoveryInput {
    dailyMetrics: DailyMetricsRow;
    userBaseline: UserBaseline;
    yesterdayRecovery?: number | null;
    preferredSource?: string | null;
}
/**
 * Component score result with metadata.
 */
interface ComponentScore {
    raw: number | null;
    score: number;
    vsBaseline: string;
    available: boolean;
}
/**
 * Calculate HRV score (40% weight).
 * Uses log-transformed Z-score against 14-day baseline.
 */
export declare function calculateHrvScore(hrvAvg: number | null, hrvMethod: HrvMethod | null, baseline: UserBaseline): ComponentScore;
/**
 * Calculate RHR score (25% weight).
 * Uses inverse Z-score (lower RHR = better).
 */
export declare function calculateRhrScore(rhrAvg: number | null, baseline: UserBaseline): ComponentScore;
/**
 * Calculate sleep quality score (20% weight).
 * Composite of efficiency, deep sleep %, and REM %.
 */
export declare function calculateSleepQualityScore(efficiency: number | null, deepPct: number | null, remPct: number | null): ComponentScore & {
    efficiency: number | null;
    deepPct: number | null;
    remPct: number | null;
};
/**
 * Calculate sleep duration score (10% weight).
 * Based on ratio to personalized target (75th percentile).
 */
export declare function calculateSleepDurationScore(sleepHours: number | null, targetMinutes: number): ComponentScore & {
    hours: number | null;
    vsTarget: string;
};
/**
 * Calculate respiratory rate score (5% weight).
 * Z-score against baseline.
 */
export declare function calculateRespiratoryRateScore(rrAvg: number | null, baseline: UserBaseline): ComponentScore;
/**
 * Calculate temperature penalty (0 to -15 points).
 * Only applies as a penalty (never a boost).
 */
export declare function calculateTemperaturePenalty(tempDeviation: number | null, menstrualTracking: boolean, cycleDay: number | null): TemperaturePenalty;
/**
 * Detect edge cases from biometric patterns.
 */
export declare function detectEdgeCases(metrics: DailyMetricsRow, baseline: UserBaseline): EdgeCases;
/**
 * Generate recommendations based on recovery score and zone.
 */
export declare function generateRecommendations(score: number, zone: RecoveryZone, edgeCases: EdgeCases): RecoveryRecommendation[];
/**
 * Calculate complete recovery score from daily metrics and baseline.
 */
export declare function calculateRecoveryScore(input: RecoveryInput): RecoveryResult;
/**
 * Check if we should calculate recovery (baseline requirements met).
 */
export declare function shouldCalculateRecovery(baseline: UserBaseline | null): boolean;
/**
 * Get baseline status message for UI display during onboarding.
 */
export declare function getBaselineStatus(baseline: UserBaseline | null): {
    ready: boolean;
    daysCollected: number;
    daysRequired: number;
    message: string;
};
export {};
