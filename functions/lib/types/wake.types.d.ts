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
/**
 * Methods used to detect wake events.
 * Listed in order of accuracy/preference.
 */
export type WakeDetectionMethod = 'hrv_spike' | 'movement' | 'phone_unlock' | 'manual';
/**
 * Wake event record.
 * Stored in `wake_events` table.
 */
export interface WakeEvent {
    id: string;
    userId: string;
    date: string;
    wakeTime: Date;
    detectionMethod: WakeDetectionMethod;
    confidence: number;
    morningAnchorTriggeredAt: Date | null;
    morningAnchorSkipped: boolean;
    skipReason: string | null;
    sourceMetrics: WakeSourceMetrics;
    createdAt: Date;
}
/**
 * Database row format for wake_events (snake_case).
 */
export interface WakeEventRow {
    id: string;
    user_id: string;
    date: string;
    wake_time: string;
    detection_method: string;
    confidence: number;
    morning_anchor_triggered_at: string | null;
    morning_anchor_skipped: boolean;
    skip_reason: string | null;
    source_metrics: WakeSourceMetrics;
    created_at: string;
}
/**
 * Source metrics union type.
 * Structure depends on detection method.
 */
export type WakeSourceMetrics = HrvSpikeMetrics | MovementMetrics | PhoneUnlockMetrics | ManualWakeMetrics;
/**
 * HRV spike detection metrics.
 * Wake is detected when HRV rises 20-40% from sleep baseline.
 */
export interface HrvSpikeMetrics {
    method: 'hrv_spike';
    preWakeHrv: number;
    postWakeHrv: number;
    deltaPercent: number;
    detectionWindowMinutes: number;
}
/**
 * Movement-based wake detection metrics.
 */
export interface MovementMetrics {
    method: 'movement';
    movementScore: number;
    durationSeconds: number;
    priorRestSeconds: number;
}
/**
 * Phone unlock detection metrics (Lite Mode).
 */
export interface PhoneUnlockMetrics {
    method: 'phone_unlock';
    firstUnlockTime: string;
    deviceTimezone: string;
    isWorkday: boolean;
}
/**
 * Manual wake indication metrics.
 */
export interface ManualWakeMetrics {
    method: 'manual';
    reportedAt: string;
    wakeTimeReported: string;
    source: 'app' | 'widget' | 'notification';
}
/**
 * Result of wake detection analysis.
 */
export interface WakeDetectionResult {
    detected: boolean;
    wakeTime: Date | null;
    method: WakeDetectionMethod | null;
    confidence: number;
    sourceMetrics: WakeSourceMetrics | null;
    morningAnchorWindow: {
        start: Date;
        end: Date;
        optimal: Date;
    } | null;
    analysisDetails: string;
}
/**
 * Morning Anchor trigger configuration.
 */
export interface MorningAnchorConfig {
    minDelayMinutes: number;
    maxDelayMinutes: number;
    optimalDelayMinutes: number;
    skipReasons: MorningAnchorSkipReason[];
}
/**
 * Reasons to skip Morning Anchor.
 */
export type MorningAnchorSkipReason = 'user_disabled' | 'already_triggered_today' | 'do_not_disturb' | 'travel_detected' | 'weekend_sleep_in' | 'no_protocols_active';
/**
 * Morning Anchor delivery status.
 */
export interface MorningAnchorDelivery {
    userId: string;
    date: string;
    wakeEventId: string;
    scheduledFor: Date;
    deliveredAt: Date | null;
    status: 'scheduled' | 'delivered' | 'skipped' | 'failed';
    skipReason: MorningAnchorSkipReason | null;
    nudgeIds: string[];
}
/**
 * Calculate confidence score based on detection method.
 */
export declare function getMethodConfidence(method: WakeDetectionMethod): number;
/**
 * Calculate Morning Anchor window from wake time.
 */
export declare function calculateMorningAnchorWindow(wakeTime: Date, config?: MorningAnchorConfig): {
    start: Date;
    end: Date;
    optimal: Date;
};
/**
 * Convert WakeEvent to database row format.
 */
export declare function toWakeEventRow(event: Partial<WakeEvent>): Partial<WakeEventRow>;
/**
 * Convert database row to WakeEvent format.
 */
export declare function fromWakeEventRow(row: WakeEventRow): WakeEvent;
/**
 * Type guard for HRV spike metrics.
 */
export declare function isHrvSpikeMetrics(metrics: WakeSourceMetrics): metrics is HrvSpikeMetrics;
/**
 * Type guard for movement metrics.
 */
export declare function isMovementMetrics(metrics: WakeSourceMetrics): metrics is MovementMetrics;
/**
 * Type guard for phone unlock metrics.
 */
export declare function isPhoneUnlockMetrics(metrics: WakeSourceMetrics): metrics is PhoneUnlockMetrics;
/**
 * Type guard for manual wake metrics.
 */
export declare function isManualWakeMetrics(metrics: WakeSourceMetrics): metrics is ManualWakeMetrics;
