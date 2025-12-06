import { Request, Response } from 'express';
import type { HrvMethod } from './types/wearable.types';
type WearableSource = 'apple_health' | 'google_fit';
type WearableMetricType = 'sleep' | 'hrv' | 'rhr' | 'steps' | 'activeCalories';
interface WearableMetricReading {
    metric: WearableMetricType;
    value: unknown;
    unit?: string;
    startDate?: string;
    endDate?: string;
    source?: WearableSource;
    metadata?: Record<string, unknown> | null;
    /** HRV method: Apple uses SDNN, Health Connect may provide RMSSD */
    hrvMethod?: HrvMethod;
    /** Sleep stage for sleep readings */
    sleepStage?: string;
}
interface NormalizedWearableMetrics {
    rmssd: number | null;
    sdnn: number | null;
    hrvScore: number | null;
    sleepHours: number | null;
    restingHeartRate: number | null;
    steps: number | null;
    readinessScore: number | null;
}
/**
 * Normalizes raw wearable readings into aggregated metrics used by downstream analytics.
 * Converts HRV metrics into a common RMSSD baseline, sums sleep duration, and derives
 * readiness scores that blend sleep and HRV signals.
 */
declare function normalizeWearableMetrics(metrics: WearableMetricReading[]): NormalizedWearableMetrics;
type ArchiveHistoryRow = {
    hrv_score: number | null;
    sleep_hours: number | null;
    recorded_at: string | null;
};
/**
 * Calculates a 7-day moving average of recorded sleep hours.
 * Entries lacking sleep data are ignored.
 */
declare function computeSleepTrend(rows: ArchiveHistoryRow[]): number | null;
/**
 * Calculates the percentage change between the recent 7-day HRV average and the
 * remaining historical baseline. Returns null when insufficient data exists.
 */
declare function computeHrvImprovement(rows: ArchiveHistoryRow[]): number | null;
/**
 * Authenticated endpoint handler that ingests wearable batches, normalizes metrics,
 * archives the payload, and refreshes derived user health trends.
 */
export declare function syncWearableData(req: Request, res: Response): Promise<void>;
export { normalizeWearableMetrics, computeSleepTrend, computeHrvImprovement, };
