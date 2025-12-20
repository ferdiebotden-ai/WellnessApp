/**
 * Weekly Synthesis API Endpoint
 *
 * Returns user's latest weekly synthesis narrative and insights.
 * Per PRD Section 4.5 - Weekly Synthesis (5-section narrative).
 */
import { Request, Response } from 'express';
/**
 * Metrics summary from the synthesis
 */
interface MetricsSummary {
    protocol_adherence?: number;
    days_with_completion?: number;
    avg_recovery_score?: number | null;
    hrv_trend_percent?: number | null;
    sleep_quality_trend_percent?: number | null;
    total_protocols_completed?: number;
    data_days_available?: number;
    has_wearable_data?: boolean;
    protocol_breakdown?: Array<{
        protocol_id: string;
        name: string;
        completed_days: number;
        completion_rate: number;
    }>;
}
/**
 * Response format for GET /api/users/me/weekly-synthesis
 */
export interface WeeklySynthesisResponse {
    has_synthesis: boolean;
    synthesis: {
        id: string;
        week_start: string;
        week_end: string;
        narrative: string;
        win_of_week: string;
        area_to_watch: string;
        pattern_insight: string | null;
        trajectory_prediction: string | null;
        experiment: string;
        metrics: MetricsSummary;
        generated_at: string;
    } | null;
    days_tracked: number;
    min_days_required: number;
}
/**
 * GET /api/users/me/weekly-synthesis
 *
 * Returns the user's latest weekly synthesis narrative and insights.
 * If no synthesis exists, returns has_synthesis: false with days_tracked.
 */
export declare function getLatestWeeklySynthesis(req: Request, res: Response): Promise<void>;
export {};
