/**
 * MVD Data Fetcher
 *
 * Fetches data from Supabase needed for MVD detection.
 * Queries: wearable_data_archive, protocol_logs, users
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 6
 */
import type { MVDDetectionContext } from './types';
/**
 * Get the latest recovery score for a user from wearable data
 *
 * @param userId - The user ID
 * @returns Recovery score (0-100) or null if no recent data
 */
export declare function getLatestRecoveryScore(userId: string): Promise<number | null>;
/**
 * Get protocol completion history for consistency drop detection
 *
 * @param userId - The user ID
 * @param days - Number of days to look back (default: 3)
 * @returns Array of completion percentages (0-100) for each day, most recent first
 */
export declare function getCompletionHistory(userId: string, days?: number): Promise<number[]>;
/**
 * Get user's stored timezone from preferences
 *
 * @param userId - The user ID
 * @returns IANA timezone string or null if not set
 */
export declare function getUserTimezone(userId: string): Promise<string | null>;
/**
 * Calculate timezone offset difference in hours
 *
 * @param tz1 - First timezone (IANA format, e.g., 'America/New_York')
 * @param tz2 - Second timezone (IANA format)
 * @returns Absolute difference in hours, or null if invalid timezones
 */
export declare function calculateTimezoneOffset(tz1: string | null, tz2: string | null): number | null;
/**
 * Get today's meeting hours from calendar integration
 * Returns null if no calendar is connected.
 *
 * Added in Phase 3 Session 5.
 *
 * @param userId - The user ID
 * @returns Meeting hours today or null if no calendar data
 */
export declare function getMeetingHoursToday(userId: string): Promise<number | null>;
/**
 * Build the full MVD detection context for a user
 *
 * @param userId - The user ID
 * @param deviceTimezone - Optional timezone from device/request header
 * @param isManualActivation - Whether this is a manual "Tough Day" activation
 * @returns Complete MVDDetectionContext
 */
export declare function buildMVDDetectionContext(userId: string, deviceTimezone?: string | null, isManualActivation?: boolean): Promise<MVDDetectionContext>;
/**
 * Check if user has sufficient data for MVD detection
 * Returns false if user is too new (no wearable data, no logs)
 *
 * @param context - The MVD detection context
 * @returns true if sufficient data exists
 */
export declare function hasSufficientDataForMVD(context: MVDDetectionContext): boolean;
