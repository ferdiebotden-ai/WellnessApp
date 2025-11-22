interface FeedbackAggregateRow {
    protocol_id: string | null;
    module_id: string | null;
    user_feedback: string | null;
    count: number | null;
}
export interface FeedbackSummaryEntry {
    protocolId: string | null;
    moduleId: string | null;
    total: number;
    counts: Record<string, number>;
}
export declare function groupFeedbackSummaries(rows: FeedbackAggregateRow[]): FeedbackSummaryEntry[];
export declare function formatFeedbackSummary(summaries: FeedbackSummaryEntry[], windowStart: Date | null, windowEnd: Date): string;
/**
 * Scheduled Google Cloud Function entry point that aggregates recent user feedback from the
 * `ai_audit_log` table and logs a summary report for the product team.
 */
export declare function analyzeNudgeFeedback(): Promise<void>;
export {};
