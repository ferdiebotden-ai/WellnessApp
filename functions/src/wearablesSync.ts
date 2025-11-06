import { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { extractBearerToken } from './utils/http';
import { verifyFirebaseToken } from './firebaseAdmin';
import { getServiceClient } from './supabaseClient';

type WearableSource = 'apple_health' | 'google_fit';
type WearableMetricType = 'sleep' | 'hrv' | 'rhr' | 'steps';

interface WearableMetricReading {
  metric: WearableMetricType;
  value: unknown;
  unit?: string;
  startDate?: string;
  endDate?: string;
  source?: WearableSource;
  metadata?: Record<string, unknown> | null;
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

function getFirebaseAuthErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const firebaseError = error as { code?: unknown; errorInfo?: { code?: unknown } };
  const directCode = typeof firebaseError.code === 'string' ? firebaseError.code : null;
  const nestedCode =
    firebaseError.errorInfo && typeof firebaseError.errorInfo.code === 'string'
      ? firebaseError.errorInfo.code
      : null;

  return directCode ?? nestedCode ?? null;
}

const INVALID_FIREBASE_TOKEN_CODES = new Set([
  'auth/invalid-id-token',
  'auth/id-token-expired',
  'auth/token-revoked',
  'auth/argument-error',
]);

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

async function updateUserHealthMetrics(client: SupabaseClient, userId: string): Promise<void> {
  const { data: history, error: historyError } = await client
    .from('wearable_data_archive')
    .select('hrv_score, sleep_hours, recorded_at')
    .eq('user_id', userId)
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
    .eq('id', userId)
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
    .eq('id', userId);

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

    let decoded: Awaited<ReturnType<typeof verifyFirebaseToken>>;
    try {
      decoded = await verifyFirebaseToken(token);
    } catch (firebaseError) {
      const authCode = getFirebaseAuthErrorCode(firebaseError);
      if (authCode && INVALID_FIREBASE_TOKEN_CODES.has(authCode)) {
        throw Object.assign(new Error('Invalid or expired authentication token'), { status: 401 });
      }

      throw firebaseError;
    }
    const { userId, source, capturedAt, metrics } = parsePayload(req.body);

    if (decoded.uid !== userId) {
      throw Object.assign(new Error('Authenticated user mismatch'), { status: 403 });
    }

    const normalized = normalizeWearableMetrics(metrics);
    const archiveRow: WearableArchiveRow = {
      user_id: userId,
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

    const supabase = getServiceClient();

    await insertArchiveRow(supabase, archiveRow);
    await updateUserHealthMetrics(supabase, userId);

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
