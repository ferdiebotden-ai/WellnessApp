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
/**
 * Supported wearable data sources.
 * IMPORTANT: Google Fit is DEPRECATED (June 2025). Use Health Connect for Android.
 */
export type WearableSource = 'oura' | 'apple_health' | 'health_connect' | 'garmin' | 'fitbit' | 'whoop' | 'manual';
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
/**
 * Normalized daily metrics from any wearable source.
 * This is the canonical format stored in Supabase `daily_metrics` table.
 *
 * All wearable sync services (Oura, HealthKit, etc.) normalize to this format.
 */
export interface DailyMetrics {
    id: string;
    userId: string;
    date: string;
    sleepDurationHours: number | null;
    sleepEfficiency: number | null;
    sleepOnsetMinutes: number | null;
    bedtimeStart: string | null;
    bedtimeEnd: string | null;
    remPercentage: number | null;
    deepPercentage: number | null;
    lightPercentage: number | null;
    awakePercentage: number | null;
    hrvAvg: number | null;
    hrvMethod: HrvMethod | null;
    rhrAvg: number | null;
    respiratoryRateAvg: number | null;
    steps: number | null;
    activeMinutes: number | null;
    activeCalories: number | null;
    temperatureDeviation: number | null;
    recoveryScore: number | null;
    recoveryConfidence: number | null;
    wearableSource: WearableSource;
    rawPayload: Record<string, unknown> | null;
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
    webhookChannelId: string | null;
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
/**
 * Webhook event types from wearable providers.
 */
export type WebhookEventType = 'sleep' | 'activity' | 'readiness' | 'hrv' | 'rhr' | 'workout';
/**
 * Webhook processing status.
 */
export type WebhookStatus = 'pending' | 'processed' | 'failed';
/**
 * Webhook event envelope received from wearable providers.
 * Used for idempotency and retry logic.
 */
export interface WebhookEvent {
    id: string;
    provider: CloudWearableProvider;
    userExternalId: string;
    eventType: WebhookEventType;
    occurredAt: Date;
    rawPayload: unknown;
    processedAt: Date | null;
    status: WebhookStatus;
}
/**
 * Result of normalizing wearable data from any source.
 */
export interface NormalizationResult {
    success: boolean;
    metrics: Partial<DailyMetrics>;
    warnings: string[];
    errors: string[];
}
/**
 * Oura API v2 sleep response.
 */
export interface OuraSleepResponse {
    id: string;
    day: string;
    bedtime_start: string;
    bedtime_end: string;
    average_breath: number;
    average_heart_rate: number;
    average_hrv: number;
    awake_time: number;
    deep_sleep_duration: number;
    efficiency: number;
    latency: number;
    light_sleep_duration: number;
    lowest_heart_rate: number;
    rem_sleep_duration: number;
    restless_periods: number;
    time_in_bed: number;
    total_sleep_duration: number;
    type: 'long_sleep' | 'late_nap' | 'rest';
}
/**
 * Oura API v2 readiness response.
 */
export interface OuraReadinessResponse {
    id: string;
    day: string;
    score: number;
    temperature_deviation: number | null;
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
    class_5_min: string;
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
    high_activity_time: number;
    inactivity_alerts: number;
    low_activity_met_minutes: number;
    low_activity_time: number;
    medium_activity_met_minutes: number;
    medium_activity_time: number;
    met: {
        interval: number;
        items: number[];
        timestamp: string;
    };
    meters_to_target: number;
    non_wear_time: number;
    resting_time: number;
    sedentary_met_minutes: number;
    sedentary_time: number;
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
/**
 * Payload sent from client to server for wearable sync.
 * Used by `/api/wearables/sync` endpoint.
 */
export interface WearableSyncPayload {
    userId: string;
    source: WearableSource;
    capturedAt: string;
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
/**
 * Convert DailyMetrics to database row format.
 */
export declare function toDailyMetricsRow(metrics: Partial<DailyMetrics>): Partial<DailyMetricsRow>;
/**
 * Convert database row to DailyMetrics format.
 */
export declare function fromDailyMetricsRow(row: DailyMetricsRow): DailyMetrics;
