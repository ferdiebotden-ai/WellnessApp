/**
 * Baseline Service
 *
 * Manages 14-day rolling baselines for personalized recovery calculation.
 * Updates baselines daily with new wearable data and maintains statistical
 * accuracy using log-transformed values for HRV.
 *
 * @file functions/src/services/baselineService.ts
 * @author Claude Opus 4.5 (Session 40)
 * @created December 4, 2025
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DailyMetricsRow, HrvMethod } from '../types/wearable.types';
import {
  type UserBaseline,
  type UserBaselineRow,
  type BaselineConfidence,
  fromUserBaselineRow,
  toUserBaselineRow,
  determineBaselineConfidence,
} from '../types/recovery.types';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Days of data used for baseline calculation */
const BASELINE_WINDOW_DAYS = 14;

/** Minimum days required for any baseline */
const MIN_DAYS_FOR_BASELINE = 3;

/** Default sleep duration target (7 hours in minutes) */
const DEFAULT_SLEEP_TARGET_MINUTES = 420;

/** Default temperature baseline (Celsius) */
const DEFAULT_TEMP_BASELINE = 36.5;

// =============================================================================
// STATISTICAL HELPERS
// =============================================================================

/**
 * Calculate mean of an array of numbers.
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation of an array of numbers.
 */
function stdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Calculate coefficient of variation (CV) as a percentage.
 */
function coefficientOfVariation(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  if (m === 0) return 0;
  const sd = stdDev(values, m);
  return (sd / m) * 100;
}

/**
 * Calculate 75th percentile of an array of numbers.
 */
function percentile75(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * 0.75);
  return sorted[Math.min(index, sorted.length - 1)];
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Get user's baseline from database.
 */
export async function getUserBaseline(
  supabase: SupabaseClient,
  userId: string
): Promise<UserBaseline | null> {
  const { data, error } = await supabase
    .from('user_baselines')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return fromUserBaselineRow(data as UserBaselineRow);
}

/**
 * Get daily metrics for baseline window (last 14 days).
 */
async function getBaselineWindowMetrics(
  supabase: SupabaseClient,
  userId: string
): Promise<DailyMetricsRow[]> {
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - BASELINE_WINDOW_DAYS);

  const { data, error } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', windowStart.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as DailyMetricsRow[];
}

/**
 * Calculate baseline statistics from daily metrics.
 */
function calculateBaselineStats(metrics: DailyMetricsRow[]): {
  hrvLnMean: number;
  hrvLnStdDev: number;
  hrvCV: number;
  hrvMethod: HrvMethod | null;
  hrvSampleCount: number;
  rhrMean: number;
  rhrStdDev: number;
  rhrSampleCount: number;
  respiratoryRateMean: number;
  respiratoryRateStdDev: number;
  sleepDurationTarget: number;
  temperatureBaseline: number;
} {
  // Extract HRV values (log-transformed)
  const hrvValues: number[] = [];
  let hrvMethod: HrvMethod | null = null;

  for (const m of metrics) {
    if (m.hrv_avg !== null && Number(m.hrv_avg) > 0) {
      hrvValues.push(Math.log(Number(m.hrv_avg)));
      // Track HRV method (use first one found, they should be consistent)
      if (!hrvMethod && m.hrv_method) {
        hrvMethod = m.hrv_method as HrvMethod;
      }
    }
  }

  const hrvLnMean = mean(hrvValues);
  const hrvLnStdDev = stdDev(hrvValues, hrvLnMean);
  // CV on original values, not log-transformed
  const originalHrvValues = hrvValues.map(v => Math.exp(v));
  const hrvCV = coefficientOfVariation(originalHrvValues);

  // Extract RHR values
  const rhrValues: number[] = [];
  for (const m of metrics) {
    if (m.rhr_avg !== null && Number(m.rhr_avg) > 0) {
      rhrValues.push(Number(m.rhr_avg));
    }
  }
  const rhrMean = mean(rhrValues);
  const rhrStdDev = stdDev(rhrValues, rhrMean);

  // Extract respiratory rate values
  const rrValues: number[] = [];
  for (const m of metrics) {
    if (m.respiratory_rate_avg !== null && Number(m.respiratory_rate_avg) > 0) {
      rrValues.push(Number(m.respiratory_rate_avg));
    }
  }
  const respiratoryRateMean = mean(rrValues);
  const respiratoryRateStdDev = stdDev(rrValues, respiratoryRateMean);

  // Calculate sleep duration target (75th percentile)
  const sleepMinutes: number[] = [];
  for (const m of metrics) {
    if (m.sleep_duration_hours !== null && Number(m.sleep_duration_hours) > 0) {
      sleepMinutes.push(Number(m.sleep_duration_hours) * 60);
    }
  }
  const sleepDurationTarget = sleepMinutes.length > 0
    ? percentile75(sleepMinutes)
    : DEFAULT_SLEEP_TARGET_MINUTES;

  // Temperature baseline (mean of available readings)
  const tempValues: number[] = [];
  for (const m of metrics) {
    if (m.temperature_deviation !== null) {
      // Temperature deviation is from wearable's baseline, so we just track our own
      // For now, use default
    }
  }
  const temperatureBaseline = DEFAULT_TEMP_BASELINE;

  return {
    hrvLnMean,
    hrvLnStdDev,
    hrvCV,
    hrvMethod,
    hrvSampleCount: hrvValues.length,
    rhrMean,
    rhrStdDev,
    rhrSampleCount: rhrValues.length,
    respiratoryRateMean,
    respiratoryRateStdDev,
    sleepDurationTarget,
    temperatureBaseline,
  };
}

/**
 * Update user's baseline with new data.
 * Called after each wearable sync.
 */
export async function updateUserBaseline(
  supabase: SupabaseClient,
  userId: string
): Promise<UserBaseline | null> {
  // Get metrics for baseline window
  const metrics = await getBaselineWindowMetrics(supabase, userId);

  if (metrics.length < MIN_DAYS_FOR_BASELINE) {
    // Not enough data yet
    return null;
  }

  // Calculate statistics
  const stats = calculateBaselineStats(metrics);

  // Determine confidence level
  const confidenceLevel = determineBaselineConfidence(stats.hrvSampleCount);

  // Build baseline object
  const baseline: Partial<UserBaseline> = {
    userId,
    hrvLnMean: stats.hrvLnMean,
    hrvLnStdDev: stats.hrvLnStdDev,
    hrvCoefficientOfVariation: stats.hrvCV,
    hrvMethod: stats.hrvMethod ?? 'rmssd',
    hrvSampleCount: stats.hrvSampleCount,
    rhrMean: stats.rhrMean,
    rhrStdDev: stats.rhrStdDev,
    rhrSampleCount: stats.rhrSampleCount,
    respiratoryRateMean: stats.respiratoryRateMean,
    respiratoryRateStdDev: stats.respiratoryRateStdDev,
    sleepDurationTarget: stats.sleepDurationTarget,
    temperatureBaselineCelsius: stats.temperatureBaseline,
    confidenceLevel,
    lastUpdated: new Date(),
  };

  // Convert to database row format
  const row = toUserBaselineRow(baseline);
  row.last_updated = new Date().toISOString();

  // Upsert into database
  const { data, error } = await supabase
    .from('user_baselines')
    .upsert(
      {
        user_id: userId,
        hrv_ln_mean: row.hrv_ln_mean,
        hrv_ln_std_dev: row.hrv_ln_std_dev,
        hrv_coefficient_of_variation: row.hrv_coefficient_of_variation,
        hrv_method: row.hrv_method,
        hrv_sample_count: row.hrv_sample_count,
        rhr_mean: row.rhr_mean,
        rhr_std_dev: row.rhr_std_dev,
        rhr_sample_count: row.rhr_sample_count,
        respiratory_rate_mean: row.respiratory_rate_mean,
        respiratory_rate_std_dev: row.respiratory_rate_std_dev,
        sleep_duration_target_minutes: row.sleep_duration_target_minutes,
        temperature_baseline_celsius: row.temperature_baseline_celsius,
        confidence_level: row.confidence_level,
        last_updated: row.last_updated,
      },
      {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    console.error('[BaselineService] Failed to upsert baseline:', error.message);
    return null;
  }

  return fromUserBaselineRow(data as UserBaselineRow);
}

/**
 * Initialize baseline for a new user.
 * Creates a baseline record with default values.
 */
export async function initializeBaseline(
  supabase: SupabaseClient,
  userId: string
): Promise<UserBaseline> {
  const now = new Date();

  const defaultBaseline: UserBaseline = {
    userId,
    hrvLnMean: 0,
    hrvLnStdDev: 0,
    hrvCoefficientOfVariation: 0,
    hrvMethod: 'rmssd',
    hrvSampleCount: 0,
    rhrMean: 0,
    rhrStdDev: 0,
    rhrSampleCount: 0,
    respiratoryRateMean: 14, // Normal adult RR
    respiratoryRateStdDev: 0,
    sleepDurationTarget: DEFAULT_SLEEP_TARGET_MINUTES,
    temperatureBaselineCelsius: DEFAULT_TEMP_BASELINE,
    menstrualCycleTracking: false,
    cycleDay: null,
    lastPeriodStart: null,
    confidenceLevel: 'low',
    lastUpdated: now,
    createdAt: now,
  };

  const row = toUserBaselineRow(defaultBaseline);

  const { error } = await supabase
    .from('user_baselines')
    .upsert(
      {
        user_id: userId,
        hrv_ln_mean: row.hrv_ln_mean,
        hrv_ln_std_dev: row.hrv_ln_std_dev,
        hrv_coefficient_of_variation: row.hrv_coefficient_of_variation,
        hrv_method: row.hrv_method,
        hrv_sample_count: row.hrv_sample_count ?? 0,
        rhr_mean: row.rhr_mean,
        rhr_std_dev: row.rhr_std_dev,
        rhr_sample_count: row.rhr_sample_count ?? 0,
        respiratory_rate_mean: row.respiratory_rate_mean,
        respiratory_rate_std_dev: row.respiratory_rate_std_dev,
        sleep_duration_target_minutes: row.sleep_duration_target_minutes,
        temperature_baseline_celsius: row.temperature_baseline_celsius,
        menstrual_cycle_tracking: row.menstrual_cycle_tracking ?? false,
        cycle_day: row.cycle_day,
        last_period_start: row.last_period_start,
        confidence_level: row.confidence_level ?? 'low',
        last_updated: now.toISOString(),
        created_at: now.toISOString(),
      },
      {
        onConflict: 'user_id',
        ignoreDuplicates: true, // Don't overwrite existing
      }
    );

  if (error) {
    console.error('[BaselineService] Failed to initialize baseline:', error.message);
  }

  return defaultBaseline;
}

/**
 * Update menstrual cycle tracking data.
 */
export async function updateMenstrualTracking(
  supabase: SupabaseClient,
  userId: string,
  tracking: boolean,
  cycleDay?: number,
  lastPeriodStart?: Date
): Promise<void> {
  const { error } = await supabase
    .from('user_baselines')
    .update({
      menstrual_cycle_tracking: tracking,
      cycle_day: cycleDay ?? null,
      last_period_start: lastPeriodStart?.toISOString().split('T')[0] ?? null,
      last_updated: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('[BaselineService] Failed to update menstrual tracking:', error.message);
  }
}

/**
 * Get baseline status for onboarding UI.
 */
export async function getBaselineStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  ready: boolean;
  daysCollected: number;
  daysRequired: number;
  confidenceLevel: BaselineConfidence;
  message: string;
}> {
  const baseline = await getUserBaseline(supabase, userId);

  const daysRequired = 7;

  if (!baseline) {
    return {
      ready: false,
      daysCollected: 0,
      daysRequired,
      confidenceLevel: 'low',
      message: 'Sync your wearable to start building your baseline',
    };
  }

  const daysCollected = baseline.hrvSampleCount;
  const ready = baseline.confidenceLevel !== 'low';

  if (ready) {
    return {
      ready: true,
      daysCollected,
      daysRequired,
      confidenceLevel: baseline.confidenceLevel,
      message: baseline.confidenceLevel === 'high'
        ? 'Baseline established (14+ days)'
        : 'Baseline ready (7+ days)',
    };
  }

  return {
    ready: false,
    daysCollected,
    daysRequired,
    confidenceLevel: baseline.confidenceLevel,
    message: `Building baseline... Day ${daysCollected}/${daysRequired}`,
  };
}
