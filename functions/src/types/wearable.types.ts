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

// =============================================================================
// SOURCE TYPES
// =============================================================================

/**
 * Supported wearable data sources.
 * IMPORTANT: Google Fit is DEPRECATED (June 2025). Use Health Connect for Android.
 */
export type WearableSource =
  | 'oura'           // Oura Ring Gen 3/4 (cloud API)
  | 'apple_health'   // Apple HealthKit (on-device)
  | 'health_connect' // Android Health Connect (on-device, replaces Google Fit)
  | 'garmin'         // Garmin Connect (cloud API, requires commercial license)
  | 'fitbit'         // Fitbit (cloud API)
  | 'whoop'          // WHOOP (cloud API, enterprise partnership required)
  | 'manual';        // User-entered data (Lite Mode)

/**
 * Cloud wearable providers that require OAuth.
 * Used for wearable_integrations table.
 */
export type CloudWearableProvider = 'oura' | 'garmin' | 'fitbit' | 'whoop';

/**
 * On-device health APIs (no OAuth required).
 */
export type OnDeviceHealthSource = 'apple_health' | 'health_connect';

/**
 * HRV measurement methods - not directly comparable.
 */
export type HrvMethod = 'rmssd' | 'sdnn';

/**
 * Sync status for wearable integrations.
 */
export type SyncStatus = 'success' | 'failed' | 'pending';

// =============================================================================
// DAILY METRICS (Canonical Format)
// =============================================================================

/**
 * Normalized daily metrics from any wearable source.
 * This is the canonical format stored in Supabase `daily_metrics` table.
 *
 * All wearable sync services (Oura, HealthKit, etc.) normalize to this format.
 */
export interface DailyMetrics {
  id: string;
  userId: string;
  date: string;                         // YYYY-MM-DD format

  // Sleep metrics
  sleepDurationHours: number | null;    // Total sleep time in hours (e.g., 7.5)
  sleepEfficiency: number | null;       // Percentage (0-100)
  sleepOnsetMinutes: number | null;     // Time to fall asleep
  bedtimeStart: string | null;          // ISO 8601 timestamp
  bedtimeEnd: string | null;            // ISO 8601 timestamp

  // Sleep stages (percentages of total sleep)
  remPercentage: number | null;         // Target: 20-25%
  deepPercentage: number | null;        // Target: 15-25%
  lightPercentage: number | null;
  awakePercentage: number | null;

  // Heart metrics
  hrvAvg: number | null;                // RMSSD in milliseconds
  hrvMethod: HrvMethod | null;          // Track measurement method
  rhrAvg: number | null;                // Resting heart rate in bpm
  respiratoryRateAvg: number | null;    // Breaths per minute

  // Activity metrics
  steps: number | null;
  activeMinutes: number | null;
  activeCalories: number | null;

  // Temperature
  temperatureDeviation: number | null;  // Celsius deviation from baseline

  // Recovery (calculated by RecoveryEngine, not raw)
  recoveryScore: number | null;         // 0-100 (calculated by RecoveryEngine)
  recoveryConfidence: number | null;    // 0.0-1.0

  // Metadata
  wearableSource: WearableSource;
  rawPayload: Record<string, unknown> | null;  // Store original for debugging
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database row format for daily_metrics (snake_case).
 * Use for direct Supabase queries.
 */
export interface DailyMetricsRow {
  id: string;
  user_id: string;
  date: string;
  sleep_duration_hours: number | null;
  sleep_efficiency: number | null;
  sleep_onset_minutes: number | null;
  bedtime_start: string | null;
  bedtime_end: string | null;
  rem_percentage: number | null;
  deep_percentage: number | null;
  light_percentage: number | null;
  awake_percentage: number | null;
  hrv_avg: number | null;
  hrv_method: string | null;
  rhr_avg: number | null;
  respiratory_rate_avg: number | null;
  steps: number | null;
  active_minutes: number | null;
  active_calories: number | null;
  temperature_deviation: number | null;
  recovery_score: number | null;
  recovery_confidence: number | null;
  wearable_source: string;
  raw_payload: Record<string, unknown> | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// WEARABLE INTEGRATIONS (OAuth)
// =============================================================================

/**
 * OAuth token storage for cloud wearable providers.
 * Tokens are encrypted at rest (AES-256).
 *
 * Stored in `wearable_integrations` table.
 */
export interface WearableIntegration {
  id: string;
  userId: string;
  provider: CloudWearableProvider;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  expiresAt: Date | null;
  scopes: string[];
  webhookChannelId: string | null;      // For providers with webhook support
  webhookResourceId: string | null;
  webhookExpiresAt: Date | null;
  lastSyncAt: Date | null;
  lastSyncStatus: SyncStatus;
  lastSyncError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database row format for wearable_integrations (snake_case).
 */
export interface WearableIntegrationRow {
  id: string;
  user_id: string;
  provider: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  expires_at: string | null;
  scopes: string[];
  webhook_channel_id: string | null;
  webhook_resource_id: string | null;
  webhook_expires_at: string | null;
  last_sync_at: string | null;
  last_sync_status: string;
  last_sync_error: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// WEBHOOK EVENTS
// =============================================================================

/**
 * Webhook event types from wearable providers.
 */
export type WebhookEventType =
  | 'sleep'
  | 'activity'
  | 'readiness'
  | 'hrv'
  | 'rhr'
  | 'workout';

/**
 * Webhook processing status.
 */
export type WebhookStatus = 'pending' | 'processed' | 'failed';

/**
 * Webhook event envelope received from wearable providers.
 * Used for idempotency and retry logic.
 */
export interface WebhookEvent {
  id: string;                           // Unique event ID for idempotency
  provider: CloudWearableProvider;
  userExternalId: string;               // Provider's user ID
  eventType: WebhookEventType;
  occurredAt: Date;
  rawPayload: unknown;                  // Provider-specific payload
  processedAt: Date | null;
  status: WebhookStatus;
}

// =============================================================================
// NORMALIZATION
// =============================================================================

/**
 * Result of normalizing wearable data from any source.
 */
export interface NormalizationResult {
  success: boolean;
  metrics: Partial<DailyMetrics>;
  warnings: string[];                   // Non-fatal issues (e.g., missing HRV)
  errors: string[];                     // Fatal issues (e.g., invalid data)
}

// =============================================================================
// OURA API TYPES
// Reference: https://cloud.ouraring.com/v2/docs
// =============================================================================

/**
 * Oura API v2 sleep response.
 */
export interface OuraSleepResponse {
  id: string;
  day: string;                          // YYYY-MM-DD
  bedtime_start: string;                // ISO 8601
  bedtime_end: string;                  // ISO 8601
  average_breath: number;               // Breaths per minute
  average_heart_rate: number;           // BPM
  average_hrv: number;                  // RMSSD in milliseconds
  awake_time: number;                   // Seconds
  deep_sleep_duration: number;          // Seconds
  efficiency: number;                   // Percentage (0-100)
  latency: number;                      // Sleep onset in seconds
  light_sleep_duration: number;         // Seconds
  lowest_heart_rate: number;            // BPM
  rem_sleep_duration: number;           // Seconds
  restless_periods: number;
  time_in_bed: number;                  // Seconds
  total_sleep_duration: number;         // Seconds
  type: 'long_sleep' | 'late_nap' | 'rest';
}

/**
 * Oura API v2 readiness response.
 */
export interface OuraReadinessResponse {
  id: string;
  day: string;
  score: number;                        // 0-100
  temperature_deviation: number | null; // Celsius
  temperature_trend_deviation: number | null;
  contributors: {
    activity_balance: number;
    body_temperature: number;
    hrv_balance: number;
    previous_day_activity: number;
    previous_night_sleep: number;
    recovery_index: number;
    resting_heart_rate: number;
    sleep_balance: number;
  };
}

/**
 * Oura API v2 daily activity response.
 */
export interface OuraActivityResponse {
  id: string;
  day: string;
  class_5_min: string;                  // Activity classification per 5 min
  score: number;
  active_calories: number;
  average_met_minutes: number;
  contributors: {
    meet_daily_targets: number;
    move_every_hour: number;
    recovery_time: number;
    stay_active: number;
    training_frequency: number;
    training_volume: number;
  };
  equivalent_walking_distance: number;
  high_activity_met_minutes: number;
  high_activity_time: number;           // Seconds
  inactivity_alerts: number;
  low_activity_met_minutes: number;
  low_activity_time: number;            // Seconds
  medium_activity_met_minutes: number;
  medium_activity_time: number;         // Seconds
  met: {
    interval: number;
    items: number[];
    timestamp: string;
  };
  meters_to_target: number;
  non_wear_time: number;                // Seconds
  resting_time: number;                 // Seconds
  sedentary_met_minutes: number;
  sedentary_time: number;               // Seconds
  steps: number;
  target_calories: number;
  target_meters: number;
  total_calories: number;
}

/**
 * Oura webhook notification payload.
 */
export interface OuraWebhookPayload {
  event_type: 'create' | 'update' | 'delete';
  data_type: 'sleep' | 'readiness' | 'daily_activity' | 'workout' | 'session';
  user_id: string;
  timestamp: string;
  data: {
    id: string;
    date?: string;
  };
}

// =============================================================================
// SYNC PAYLOAD (Client to Server)
// =============================================================================

/**
 * Payload sent from client to server for wearable sync.
 * Used by `/api/wearables/sync` endpoint.
 */
export interface WearableSyncPayload {
  userId: string;
  source: WearableSource;
  capturedAt: string;                   // ISO 8601 timestamp
  metrics: WearableMetricReading[];
}

/**
 * Individual metric reading from client.
 */
export interface WearableMetricReading {
  metric: 'sleep' | 'hrv' | 'rhr' | 'steps' | 'activity';
  value: number;
  unit: string;
  startDate: string;
  endDate: string;
  source: WearableSource;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Convert DailyMetrics to database row format.
 */
export function toDailyMetricsRow(metrics: Partial<DailyMetrics>): Partial<DailyMetricsRow> {
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
export function fromDailyMetricsRow(row: DailyMetricsRow): DailyMetrics {
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
    hrvMethod: row.hrv_method as HrvMethod | null,
    rhrAvg: row.rhr_avg,
    respiratoryRateAvg: row.respiratory_rate_avg,
    steps: row.steps,
    activeMinutes: row.active_minutes,
    activeCalories: row.active_calories,
    temperatureDeviation: row.temperature_deviation,
    recoveryScore: row.recovery_score,
    recoveryConfidence: row.recovery_confidence,
    wearableSource: row.wearable_source as WearableSource,
    rawPayload: row.raw_payload,
    syncedAt: new Date(row.synced_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
