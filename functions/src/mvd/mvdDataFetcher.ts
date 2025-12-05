/**
 * MVD Data Fetcher
 *
 * Fetches data from Supabase needed for MVD detection.
 * Queries: wearable_data_archive, protocol_logs, users
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 6
 */

import { getServiceClient } from '../supabaseClient';
import type { MVDDetectionContext } from './types';
import { MVD_CONFIG } from './types';
import { getCalendarService } from '../services/calendar';

/**
 * Get the latest recovery score for a user from wearable data
 *
 * @param userId - The user ID
 * @returns Recovery score (0-100) or null if no recent data
 */
export async function getLatestRecoveryScore(
  userId: string
): Promise<number | null> {
  const supabase = getServiceClient();

  // Get the most recent wearable data within last 24 hours
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from('wearable_data_archive')
    .select('readiness_score')
    .eq('user_id', userId)
    .gte('recorded_at', twentyFourHoursAgo)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data.readiness_score ?? null;
}

/**
 * Get protocol completion history for consistency drop detection
 *
 * @param userId - The user ID
 * @param days - Number of days to look back (default: 3)
 * @returns Array of completion percentages (0-100) for each day, most recent first
 */
export async function getCompletionHistory(
  userId: string,
  days: number = MVD_CONFIG.CONSISTENCY_DAYS
): Promise<number[]> {
  const supabase = getServiceClient();

  // Calculate date range
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);

  // Query protocol logs for completed vs total
  const { data: logs, error } = await supabase
    .from('protocol_logs')
    .select('completed_at, was_completed')
    .eq('user_id', userId)
    .gte('completed_at', startDate.toISOString())
    .order('completed_at', { ascending: false });

  if (error || !logs || logs.length === 0) {
    // No data = treat as 0% completion for all days
    return Array(days).fill(0);
  }

  // Group by day and calculate completion rate
  const dailyStats: Map<string, { completed: number; total: number }> =
    new Map();

  for (const log of logs) {
    const dateKey = new Date(log.completed_at).toISOString().split('T')[0];
    const existing = dailyStats.get(dateKey) ?? { completed: 0, total: 0 };
    existing.total += 1;
    if (log.was_completed) {
      existing.completed += 1;
    }
    dailyStats.set(dateKey, existing);
  }

  // Convert to completion percentages, most recent first
  const result: number[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];

    const stats = dailyStats.get(dateKey);
    if (stats && stats.total > 0) {
      result.push(Math.round((stats.completed / stats.total) * 100));
    } else {
      // No protocols logged = treat as 0% (not 100%)
      result.push(0);
    }
  }

  return result;
}

/**
 * Get user's stored timezone from preferences
 *
 * @param userId - The user ID
 * @returns IANA timezone string or null if not set
 */
export async function getUserTimezone(userId: string): Promise<string | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('users')
    .select('timezone')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.timezone ?? null;
}

/**
 * Calculate timezone offset difference in hours
 *
 * @param tz1 - First timezone (IANA format, e.g., 'America/New_York')
 * @param tz2 - Second timezone (IANA format)
 * @returns Absolute difference in hours, or null if invalid timezones
 */
export function calculateTimezoneOffset(
  tz1: string | null,
  tz2: string | null
): number | null {
  if (!tz1 || !tz2) {
    return null;
  }

  try {
    const now = new Date();

    // Get offset in minutes for each timezone
    const offset1 = getTimezoneOffsetMinutes(now, tz1);
    const offset2 = getTimezoneOffsetMinutes(now, tz2);

    if (offset1 === null || offset2 === null) {
      return null;
    }

    // Return absolute difference in hours
    return Math.abs(offset1 - offset2) / 60;
  } catch {
    return null;
  }
}

/**
 * Helper: Get timezone offset in minutes for a given date and timezone
 */
function getTimezoneOffsetMinutes(date: Date, timezone: string): number | null {
  try {
    // Get local time string in the target timezone
    const localStr = date.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });

    // Parse the local time
    const [datePart, timePart] = localStr.split(', ');
    const [month, day, year] = datePart.split('/').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);

    // Create a date in UTC with the "local" time values
    const localDate = new Date(
      Date.UTC(year, month - 1, day, hour, minute)
    );

    // Offset is the difference from actual UTC
    return (localDate.getTime() - date.getTime()) / (1000 * 60);
  } catch {
    return null;
  }
}

/**
 * Get today's meeting hours from calendar integration
 * Returns null if no calendar is connected.
 *
 * Added in Phase 3 Session 5.
 *
 * @param userId - The user ID
 * @returns Meeting hours today or null if no calendar data
 */
export async function getMeetingHoursToday(
  userId: string
): Promise<number | null> {
  try {
    const calendarService = getCalendarService();
    return await calendarService.getMeetingHoursToday(userId);
  } catch {
    // Calendar not connected or error - return null
    return null;
  }
}

/**
 * Build the full MVD detection context for a user
 *
 * @param userId - The user ID
 * @param deviceTimezone - Optional timezone from device/request header
 * @param isManualActivation - Whether this is a manual "Tough Day" activation
 * @returns Complete MVDDetectionContext
 */
export async function buildMVDDetectionContext(
  userId: string,
  deviceTimezone: string | null = null,
  isManualActivation: boolean = false
): Promise<MVDDetectionContext> {
  // Fetch all data in parallel (including calendar data)
  const [recoveryScore, completionHistory, userTimezone, meetingHoursToday] =
    await Promise.all([
      getLatestRecoveryScore(userId),
      getCompletionHistory(userId, MVD_CONFIG.CONSISTENCY_DAYS),
      getUserTimezone(userId),
      getMeetingHoursToday(userId),
    ]);

  return {
    userId,
    recoveryScore,
    userTimezone,
    deviceTimezone,
    completionHistory,
    isManualActivation,
    meetingHoursToday,
  };
}

/**
 * Check if user has sufficient data for MVD detection
 * Returns false if user is too new (no wearable data, no logs)
 *
 * @param context - The MVD detection context
 * @returns true if sufficient data exists
 */
export function hasSufficientDataForMVD(context: MVDDetectionContext): boolean {
  // Need at least recovery data OR completion history
  const hasRecoveryData = context.recoveryScore !== null;
  const hasCompletionData = context.completionHistory.some((rate) => rate > 0);

  return hasRecoveryData || hasCompletionData;
}
