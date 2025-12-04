import { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { extractBearerToken } from './utils/http';
import { verifyFirebaseToken } from './firebaseAdmin';
import { getServiceClient } from './supabaseClient';
import type { DailyMetricsRow, HrvMethod, WearableSource as WearableSourceType } from './types/wearable.types';

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

interface WearableSyncPayload {
  user_id?: unknown;
  source?: unknown;
  captured_at?: unknown;
  metrics?: unknown;
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
 * Aggregated daily metrics for the daily_metrics table (Phase 3 canonical format).
 */
interface DailyMetricsNormalized {
  sleepDurationHours: number | null;
  sleepEfficiency: number | null;
  bedtimeStart: string | null;
  bedtimeEnd: string | null;
  remPercentage: number | null;
  deepPercentage: number | null;
  lightPercentage: number | null;
  awakePercentage: number | null;
  hrvAvg: number | null;
  hrvMethod: HrvMethod | null;
  rhrAvg: number | null;
  steps: number | null;
  activeCalories: number | null;
}

interface WearableArchiveRow {
  user_id: string;
  source: WearableSource;
  recorded_at: string;
  hrv_score: number | null;
  hrv_rmssd_ms: number | null;
  hrv_sdnn_ms: number | null;
  sleep_hours: number | null;
  resting_hr_bpm: number | null;
  steps: number | null;
  readiness_score: number | null;
  raw_payload: unknown;
}

const HRV_SDNN_TO_RMSSD_FACTOR = 0.85;
const RMSSD_MIN = 20;
const RMSSD_MAX = 120;
const SLEEP_TREND_WINDOW = 7;
const HISTORY_LOOKBACK = 30;

function isWearableMetricReading(value: unknown): value is WearableMetricReading {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const reading = value as WearableMetricReading;
  return typeof reading.metric === 'string' && 'value' in reading;
}

function parsePayload(body: unknown): {
  userId: string;
  source: WearableSource;
  capturedAt: string;
  metrics: WearableMetricReading[];
} {
  const payload = body as WearableSyncPayload;

  if (typeof payload?.user_id !== 'string' || payload.user_id.length === 0) {
    throw Object.assign(new Error('Invalid or missing user_id'), { status: 400 });
  }

  if (payload.source !== 'apple_health' && payload.source !== 'google_fit') {
    throw Object.assign(new Error('Unsupported wearable source'), { status: 400 });
  }

  if (typeof payload.captured_at !== 'string') {
    throw Object.assign(new Error('Invalid captured_at timestamp'), { status: 400 });
  }

  const capturedDate = new Date(payload.captured_at);
  if (Number.isNaN(capturedDate.getTime())) {
    throw Object.assign(new Error('Invalid captured_at timestamp'), { status: 400 });
  }

  if (!Array.isArray(payload.metrics) || payload.metrics.length === 0) {
    throw Object.assign(new Error('Metrics payload is required'), { status: 400 });
  }

  const readings = payload.metrics.filter(isWearableMetricReading) as WearableMetricReading[];

  if (readings.length === 0) {
    throw Object.assign(new Error('Metrics payload is required'), { status: 400 });
  }

  return {
    userId: payload.user_id,
    source: payload.source,
    capturedAt: capturedDate.toISOString(),
    metrics: readings,
  };
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}

function normalizeHrvMetrics(metrics: WearableMetricReading[]): {
  rmssd: number | null;
  sdnn: number | null;
  score: number | null;
} {
  const rmssdValues: number[] = [];
  const sdnnValues: number[] = [];

  for (const reading of metrics) {
    const numericValue = typeof reading.value === 'number' ? reading.value : Number(reading.value);
    if (!Number.isFinite(numericValue)) {
      continue;
    }

    if (reading.source === 'apple_health') {
      const sdnn = numericValue;
      const rmssd = Number.parseFloat((sdnn * HRV_SDNN_TO_RMSSD_FACTOR).toFixed(2));
      rmssdValues.push(rmssd);
      sdnnValues.push(Number.parseFloat(sdnn.toFixed(2)));
      continue;
    }

    if (reading.source === 'google_fit') {
      const rmssd = Number.parseFloat(numericValue.toFixed(2));
      rmssdValues.push(rmssd);

      const metadataSdnn = reading.metadata?.sdnn;
      if (typeof metadataSdnn === 'number' && Number.isFinite(metadataSdnn)) {
        sdnnValues.push(Number.parseFloat(metadataSdnn.toFixed(2)));
      }
      continue;
    }
  }

  const rmssdAverage = average(rmssdValues);
  const sdnnAverage = average(sdnnValues);

  let score: number | null = null;
  if (rmssdAverage !== null) {
    const normalized = Math.min(1, Math.max(0, (rmssdAverage - RMSSD_MIN) / (RMSSD_MAX - RMSSD_MIN)));
    score = Math.round(normalized * 100);
  }

  return {
    rmssd: rmssdAverage !== null ? Number.parseFloat(rmssdAverage.toFixed(2)) : null,
    sdnn: sdnnAverage !== null ? Number.parseFloat(sdnnAverage.toFixed(2)) : null,
    score,
  };
}

/**
 * Normalizes raw wearable readings into aggregated metrics used by downstream analytics.
 * Converts HRV metrics into a common RMSSD baseline, sums sleep duration, and derives
 * readiness scores that blend sleep and HRV signals.
 */
function normalizeWearableMetrics(metrics: WearableMetricReading[]): NormalizedWearableMetrics {
  const sleepMinutes: number[] = [];
  const hrvReadings: WearableMetricReading[] = [];
  const restingHeartRates: number[] = [];
  const stepsTotals: number[] = [];

  for (const reading of metrics) {
    const numericValue = typeof reading.value === 'number' ? reading.value : Number(reading.value);
    if (!Number.isFinite(numericValue)) {
      continue;
    }

    switch (reading.metric) {
      case 'sleep': {
        sleepMinutes.push(numericValue);
        break;
      }
      case 'hrv': {
        hrvReadings.push(reading);
        break;
      }
      case 'rhr': {
        restingHeartRates.push(numericValue);
        break;
      }
      case 'steps': {
        stepsTotals.push(numericValue);
        break;
      }
      default:
        break;
    }
  }

  const sleepTotalMinutes = sleepMinutes.reduce((total, value) => total + value, 0);
  const normalizedSleep = sleepMinutes.length > 0 ? Number.parseFloat((sleepTotalMinutes / 60).toFixed(2)) : null;

  const { rmssd, sdnn, score } = normalizeHrvMetrics(hrvReadings);

  const resting = average(restingHeartRates);
  const normalizedResting = resting !== null ? Number.parseFloat(resting.toFixed(1)) : null;

  const steps = stepsTotals.length > 0 ? Math.round(stepsTotals.reduce((total, value) => total + value, 0)) : null;

  const hrvComponent = score !== null ? score / 100 : null;
  const sleepComponent = normalizedSleep !== null ? Math.min(normalizedSleep / 8, 1) : null;

  let readinessScore: number | null = null;
  if (hrvComponent !== null || sleepComponent !== null) {
    const hrvContribution = hrvComponent ?? 0.5;
    const sleepContribution = sleepComponent ?? 0.5;
    readinessScore = Math.round((hrvContribution * 0.6 + sleepContribution * 0.4) * 100);
  }

  return {
    rmssd,
    sdnn,
    hrvScore: score,
    sleepHours: normalizedSleep,
    restingHeartRate: normalizedResting,
    steps,
    readinessScore,
  };
}

async function insertArchiveRow(
  client: SupabaseClient,
  row: WearableArchiveRow,
): Promise<void> {
  const { error } = await client.from('wearable_data_archive').insert(row);
  if (error) {
    throw Object.assign(new Error(`Failed to persist wearable archive: ${error.message}`), { status: 500 });
  }
}

/**
 * Map sleep stage string to category.
 */
function getSleepCategory(stage: string | undefined): 'deep' | 'light' | 'rem' | 'awake' | null {
  if (!stage) return null;
  const normalized = stage.toLowerCase();
  if (normalized.includes('deep')) return 'deep';
  if (normalized.includes('rem')) return 'rem';
  if (normalized.includes('awake')) return 'awake';
  if (normalized.includes('core') || normalized.includes('light') || normalized.includes('asleep')) return 'light';
  return null;
}

/**
 * Normalize wearable readings into DailyMetricsNormalized format for Phase 3 daily_metrics table.
 *
 * Key implementation notes:
 * - Apple HealthKit provides HRV as SDNN (24h aggregate), NOT RMSSD
 * - Do NOT convert SDNN to RMSSD - they measure different things
 * - Store hrvMethod to track the measurement method
 */
function normalizeToDailyMetrics(
  metrics: WearableMetricReading[],
  source: WearableSource
): DailyMetricsNormalized {
  const sleepReadings: WearableMetricReading[] = [];
  const hrvValues: number[] = [];
  const rhrValues: number[] = [];
  const stepsValues: number[] = [];
  const activeCaloriesValues: number[] = [];
  let hrvMethod: HrvMethod | null = null;

  for (const reading of metrics) {
    const numericValue = typeof reading.value === 'number' ? reading.value : Number(reading.value);
    if (!Number.isFinite(numericValue)) continue;

    switch (reading.metric) {
      case 'sleep':
        sleepReadings.push(reading);
        break;
      case 'hrv':
        hrvValues.push(numericValue);
        // Track HRV method: Apple uses SDNN, Health Connect may use RMSSD
        if (!hrvMethod) {
          hrvMethod = reading.hrvMethod ?? (source === 'apple_health' ? 'sdnn' : 'rmssd');
        }
        break;
      case 'rhr':
        rhrValues.push(numericValue);
        break;
      case 'steps':
        stepsValues.push(numericValue);
        break;
      case 'activeCalories':
        activeCaloriesValues.push(numericValue);
        break;
    }
  }

  // Aggregate sleep data
  let sleepDurationHours: number | null = null;
  let bedtimeStart: string | null = null;
  let bedtimeEnd: string | null = null;
  let deepMinutes = 0;
  let lightMinutes = 0;
  let remMinutes = 0;
  let awakeMinutes = 0;
  let totalSleepMinutes = 0;

  if (sleepReadings.length > 0) {
    // Sort by start date to find bedtime boundaries
    const sorted = sleepReadings
      .filter((r) => r.startDate && r.endDate)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());

    if (sorted.length > 0) {
      bedtimeStart = sorted[0].startDate!;
      bedtimeEnd = sorted[sorted.length - 1].endDate!;
    }

    for (const reading of sleepReadings) {
      const minutes = typeof reading.value === 'number' ? reading.value : Number(reading.value);
      if (!Number.isFinite(minutes)) continue;

      const category = getSleepCategory(reading.sleepStage);
      totalSleepMinutes += minutes;

      switch (category) {
        case 'deep':
          deepMinutes += minutes;
          break;
        case 'light':
          lightMinutes += minutes;
          break;
        case 'rem':
          remMinutes += minutes;
          break;
        case 'awake':
          awakeMinutes += minutes;
          break;
      }
    }

    sleepDurationHours = totalSleepMinutes > 0
      ? Number.parseFloat((totalSleepMinutes / 60).toFixed(2))
      : null;
  }

  // Calculate sleep stage percentages
  const actualSleepMinutes = deepMinutes + lightMinutes + remMinutes;
  const remPercentage = actualSleepMinutes > 0
    ? Math.round((remMinutes / actualSleepMinutes) * 100)
    : null;
  const deepPercentage = actualSleepMinutes > 0
    ? Math.round((deepMinutes / actualSleepMinutes) * 100)
    : null;
  const lightPercentage = actualSleepMinutes > 0
    ? Math.round((lightMinutes / actualSleepMinutes) * 100)
    : null;
  const awakePercentage = totalSleepMinutes > 0
    ? Math.round((awakeMinutes / totalSleepMinutes) * 100)
    : null;

  // Sleep efficiency: actual sleep / time in bed
  const sleepEfficiency = totalSleepMinutes > 0 && actualSleepMinutes > 0
    ? Math.round((actualSleepMinutes / totalSleepMinutes) * 100)
    : null;

  // Average HRV (stored as-is, no conversion)
  const hrvAvg = hrvValues.length > 0
    ? Number.parseFloat((hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length).toFixed(2))
    : null;

  // Average RHR
  const rhrAvg = rhrValues.length > 0
    ? Number.parseFloat((rhrValues.reduce((a, b) => a + b, 0) / rhrValues.length).toFixed(1))
    : null;

  // Total steps
  const steps = stepsValues.length > 0
    ? Math.round(stepsValues.reduce((a, b) => a + b, 0))
    : null;

  // Total active calories
  const activeCalories = activeCaloriesValues.length > 0
    ? Math.round(activeCaloriesValues.reduce((a, b) => a + b, 0))
    : null;

  return {
    sleepDurationHours,
    sleepEfficiency,
    bedtimeStart,
    bedtimeEnd,
    remPercentage,
    deepPercentage,
    lightPercentage,
    awakePercentage,
    hrvAvg,
    hrvMethod,
    rhrAvg,
    steps,
    activeCalories,
  };
}

/**
 * Upsert daily metrics into the daily_metrics table (Phase 3 canonical format).
 * Uses user_id + date as unique key.
 */
async function upsertDailyMetrics(
  client: SupabaseClient,
  userId: string,
  date: string,
  source: WearableSource,
  normalized: DailyMetricsNormalized,
  rawPayload: WearableMetricReading[]
): Promise<void> {
  const row: Partial<DailyMetricsRow> = {
    user_id: userId,
    date,
    sleep_duration_hours: normalized.sleepDurationHours,
    sleep_efficiency: normalized.sleepEfficiency,
    bedtime_start: normalized.bedtimeStart,
    bedtime_end: normalized.bedtimeEnd,
    rem_percentage: normalized.remPercentage,
    deep_percentage: normalized.deepPercentage,
    light_percentage: normalized.lightPercentage,
    awake_percentage: normalized.awakePercentage,
    hrv_avg: normalized.hrvAvg,
    hrv_method: normalized.hrvMethod,
    rhr_avg: normalized.rhrAvg,
    steps: normalized.steps,
    active_calories: normalized.activeCalories,
    wearable_source: source === 'apple_health' ? 'apple_health' : 'health_connect',
    raw_payload: rawPayload as unknown as Record<string, unknown>,
    synced_at: new Date().toISOString(),
  };

  const { error } = await client
    .from('daily_metrics')
    .upsert(row, {
      onConflict: 'user_id,date',
      ignoreDuplicates: false,
    });

  if (error) {
    console.error('[WearablesSync] Failed to upsert daily_metrics:', error.message);
    // Don't throw - daily_metrics is supplementary, archive is primary
  }
}

type ArchiveHistoryRow = {
  hrv_score: number | null;
  sleep_hours: number | null;
  recorded_at: string | null;
};

/**
 * Calculates a 7-day moving average of recorded sleep hours.
 * Entries lacking sleep data are ignored.
 */
function computeSleepTrend(rows: ArchiveHistoryRow[]): number | null {
  const window = rows.slice(0, SLEEP_TREND_WINDOW);
  const values = window
    .map((row) => (typeof row.sleep_hours === 'number' ? row.sleep_hours : null))
    .filter((value): value is number => value !== null && Number.isFinite(value));

  const avg = average(values);
  return avg !== null ? Number.parseFloat(avg.toFixed(2)) : null;
}

/**
 * Calculates the percentage change between the recent 7-day HRV average and the
 * remaining historical baseline. Returns null when insufficient data exists.
 */
function computeHrvImprovement(rows: ArchiveHistoryRow[]): number | null {
  const recentWindow = rows.slice(0, SLEEP_TREND_WINDOW);
  const baselineWindow = rows.slice(SLEEP_TREND_WINDOW);

  const recentValues = recentWindow
    .map((row) => (typeof row.hrv_score === 'number' ? row.hrv_score : null))
    .filter((value): value is number => value !== null && Number.isFinite(value));

  const baselineValues = baselineWindow
    .map((row) => (typeof row.hrv_score === 'number' ? row.hrv_score : null))
    .filter((value): value is number => value !== null && Number.isFinite(value));

  const recent = average(recentValues);
  if (recent === null) {
    return null;
  }

  const baseline = average(baselineValues);
  if (baseline === null || baseline === 0) {
    return 0;
  }

  const improvement = ((recent - baseline) / baseline) * 100;
  return Number.parseFloat(improvement.toFixed(2));
}

async function updateUserHealthMetrics(client: SupabaseClient, supabaseUserId: string): Promise<void> {
  const { data: history, error: historyError } = await client
    .from('wearable_data_archive')
    .select('hrv_score, sleep_hours, recorded_at')
    .eq('user_id', supabaseUserId)
    .order('recorded_at', { ascending: false })
    .limit(HISTORY_LOOKBACK);

  if (historyError) {
    throw Object.assign(new Error(`Failed to query wearable archive: ${historyError.message}`), { status: 500 });
  }

  const historyRows: ArchiveHistoryRow[] = Array.isArray(history) ? history : [];
  const sleepTrend = computeSleepTrend(historyRows);
  const hrvImprovement = computeHrvImprovement(historyRows);

  const { data: userRow, error: userError } = await client
    .from('users')
    .select('healthMetrics')
    .eq('id', supabaseUserId)
    .single();

  if (userError) {
    throw Object.assign(new Error(`Failed to load user metrics: ${userError.message}`), { status: 500 });
  }

  const existingMetrics = (userRow?.healthMetrics ?? {}) as Record<string, unknown>;
  const updatedMetrics: Record<string, unknown> = { ...existingMetrics };

  if (sleepTrend !== null) {
    updatedMetrics.sleepQualityTrend = sleepTrend;
  }

  if (hrvImprovement !== null) {
    updatedMetrics.hrvImprovementPct = hrvImprovement;
  }

  const { error: updateError } = await client
    .from('users')
    .update({ healthMetrics: updatedMetrics })
    .eq('id', supabaseUserId);

  if (updateError) {
    throw Object.assign(new Error(`Failed to update user metrics: ${updateError.message}`), { status: 500 });
  }
}

/**
 * Authenticated endpoint handler that ingests wearable batches, normalizes metrics,
 * archives the payload, and refreshes derived user health trends.
 */
export async function syncWearableData(req: Request, res: Response): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw Object.assign(new Error('Missing bearer token'), { status: 401 });
    }

    const decoded = await verifyFirebaseToken(token);
    const { userId, source, capturedAt, metrics } = parsePayload(req.body);

    // userId from payload should match the Firebase UID from the token
    if (decoded.uid !== userId) {
      throw Object.assign(new Error('Authenticated user mismatch'), { status: 403 });
    }

    const supabase = getServiceClient();

    // Look up the user's Supabase UUID from their Firebase UID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', decoded.uid)
      .single();

    if (userError || !user) {
      throw Object.assign(new Error('User not found'), { status: 404 });
    }

    const supabaseUserId = user.id;

    const normalized = normalizeWearableMetrics(metrics);
    const archiveRow: WearableArchiveRow = {
      user_id: supabaseUserId,  // Use Supabase UUID, not Firebase UID
      source,
      recorded_at: capturedAt,
      hrv_score: normalized.hrvScore,
      hrv_rmssd_ms: normalized.rmssd,
      hrv_sdnn_ms: normalized.sdnn,
      sleep_hours: normalized.sleepHours,
      resting_hr_bpm: normalized.restingHeartRate,
      steps: normalized.steps,
      readiness_score: normalized.readinessScore,
      raw_payload: metrics,
    };

    await insertArchiveRow(supabase, archiveRow);

    // Phase 3: Dual-write to daily_metrics table for Recovery Engine
    const dateStr = capturedAt.split('T')[0]; // Extract YYYY-MM-DD from ISO timestamp
    const dailyNormalized = normalizeToDailyMetrics(metrics, source);
    await upsertDailyMetrics(supabase, supabaseUserId, dateStr, source, dailyNormalized, metrics);

    await updateUserHealthMetrics(supabase, supabaseUserId);

    res.status(200).json({ success: true });
  } catch (error) {
    const status = typeof (error as { status?: unknown }).status === 'number' ? (error as { status: number }).status : 500;
    const message = (error as Error).message ?? 'Internal Server Error';
    if (status >= 500) {
      console.error('[WearablesSync] Failure handling wearable payload', error);
    }
    res.status(status).json({ error: message });
  }
}

export {
  normalizeWearableMetrics,
  computeSleepTrend,
  computeHrvImprovement,
};
