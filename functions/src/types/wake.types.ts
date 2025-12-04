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

// =============================================================================
// WAKE DETECTION
// =============================================================================

/**
 * Methods used to detect wake events.
 * Listed in order of accuracy/preference.
 */
export type WakeDetectionMethod =
  | 'hrv_spike'      // HRV-based wake detection from wearable (most accurate)
  | 'movement'       // Movement spike from wearable
  | 'phone_unlock'   // First phone unlock of the day (Lite Mode)
  | 'manual';        // User manually indicated wake time

/**
 * Wake event record.
 * Stored in `wake_events` table.
 */
export interface WakeEvent {
  id: string;
  userId: string;
  date: string;                         // YYYY-MM-DD format

  // Wake detection
  wakeTime: Date;
  detectionMethod: WakeDetectionMethod;
  confidence: number;                   // 0.0-1.0

  // Morning Anchor trigger
  morningAnchorTriggeredAt: Date | null;
  morningAnchorSkipped: boolean;
  skipReason: string | null;

  // Source metrics (for debugging and ML training)
  sourceMetrics: WakeSourceMetrics;

  // Timestamps
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

// =============================================================================
// SOURCE METRICS
// =============================================================================

/**
 * Source metrics union type.
 * Structure depends on detection method.
 */
export type WakeSourceMetrics =
  | HrvSpikeMetrics
  | MovementMetrics
  | PhoneUnlockMetrics
  | ManualWakeMetrics;

/**
 * HRV spike detection metrics.
 * Wake is detected when HRV rises 20-40% from sleep baseline.
 */
export interface HrvSpikeMetrics {
  method: 'hrv_spike';
  preWakeHrv: number;                   // RMSSD before wake (sleep baseline)
  postWakeHrv: number;                  // RMSSD after wake
  deltaPercent: number;                 // Percentage change
  detectionWindowMinutes: number;       // Time window analyzed
}

/**
 * Movement-based wake detection metrics.
 */
export interface MovementMetrics {
  method: 'movement';
  movementScore: number;                // 0-100 intensity score
  durationSeconds: number;              // Duration of movement
  priorRestSeconds: number;             // How long was user resting before
}

/**
 * Phone unlock detection metrics (Lite Mode).
 */
export interface PhoneUnlockMetrics {
  method: 'phone_unlock';
  firstUnlockTime: string;              // ISO 8601 timestamp
  deviceTimezone: string;               // User's device timezone
  isWorkday: boolean;                   // Whether it's a workday
}

/**
 * Manual wake indication metrics.
 */
export interface ManualWakeMetrics {
  method: 'manual';
  reportedAt: string;                   // When user reported wake
  wakeTimeReported: string;             // What time user said they woke
  source: 'app' | 'widget' | 'notification';
}

// =============================================================================
// WAKE DETECTION RESULT
// =============================================================================

/**
 * Result of wake detection analysis.
 */
export interface WakeDetectionResult {
  detected: boolean;
  wakeTime: Date | null;
  method: WakeDetectionMethod | null;
  confidence: number;
  sourceMetrics: WakeSourceMetrics | null;

  // Recommendation
  morningAnchorWindow: {
    start: Date;                        // 5 minutes post-wake
    end: Date;                          // 15 minutes post-wake
    optimal: Date;                      // 8-10 minutes post-wake
  } | null;

  // Debug info
  analysisDetails: string;
}

// =============================================================================
// MORNING ANCHOR
// =============================================================================

/**
 * Morning Anchor trigger configuration.
 */
export interface MorningAnchorConfig {
  minDelayMinutes: number;              // Minimum wait after wake (default: 5)
  maxDelayMinutes: number;              // Maximum wait after wake (default: 15)
  optimalDelayMinutes: number;          // Optimal time to trigger (default: 8)
  skipReasons: MorningAnchorSkipReason[];
}

/**
 * Reasons to skip Morning Anchor.
 */
export type MorningAnchorSkipReason =
  | 'user_disabled'                     // User turned off Morning Anchor
  | 'already_triggered_today'           // Already triggered today
  | 'do_not_disturb'                    // DND mode active
  | 'travel_detected'                   // User is traveling (timezone change)
  | 'weekend_sleep_in'                  // Weekend + late wake time
  | 'no_protocols_active';              // No morning protocols to recommend

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
  nudgeIds: string[];                   // Nudges included in Morning Anchor
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate confidence score based on detection method.
 */
export function getMethodConfidence(method: WakeDetectionMethod): number {
  switch (method) {
    case 'hrv_spike':
      return 0.95;                      // Most accurate
    case 'movement':
      return 0.80;
    case 'phone_unlock':
      return 0.60;                      // Lite Mode fallback
    case 'manual':
      return 0.70;                      // User-reported
    default:
      return 0.50;
  }
}

/**
 * Calculate Morning Anchor window from wake time.
 */
export function calculateMorningAnchorWindow(
  wakeTime: Date,
  config: MorningAnchorConfig = {
    minDelayMinutes: 5,
    maxDelayMinutes: 15,
    optimalDelayMinutes: 8,
    skipReasons: [],
  }
): { start: Date; end: Date; optimal: Date } {
  return {
    start: new Date(wakeTime.getTime() + config.minDelayMinutes * 60 * 1000),
    end: new Date(wakeTime.getTime() + config.maxDelayMinutes * 60 * 1000),
    optimal: new Date(wakeTime.getTime() + config.optimalDelayMinutes * 60 * 1000),
  };
}

/**
 * Convert WakeEvent to database row format.
 */
export function toWakeEventRow(event: Partial<WakeEvent>): Partial<WakeEventRow> {
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
export function fromWakeEventRow(row: WakeEventRow): WakeEvent {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    wakeTime: new Date(row.wake_time),
    detectionMethod: row.detection_method as WakeDetectionMethod,
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
export function isHrvSpikeMetrics(metrics: WakeSourceMetrics): metrics is HrvSpikeMetrics {
  return (metrics as HrvSpikeMetrics).method === 'hrv_spike';
}

/**
 * Type guard for movement metrics.
 */
export function isMovementMetrics(metrics: WakeSourceMetrics): metrics is MovementMetrics {
  return (metrics as MovementMetrics).method === 'movement';
}

/**
 * Type guard for phone unlock metrics.
 */
export function isPhoneUnlockMetrics(metrics: WakeSourceMetrics): metrics is PhoneUnlockMetrics {
  return (metrics as PhoneUnlockMetrics).method === 'phone_unlock';
}

/**
 * Type guard for manual wake metrics.
 */
export function isManualWakeMetrics(metrics: WakeSourceMetrics): metrics is ManualWakeMetrics {
  return (metrics as ManualWakeMetrics).method === 'manual';
}
