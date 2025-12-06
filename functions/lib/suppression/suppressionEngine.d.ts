/**
 * Suppression Engine
 *
 * Evaluates nudges against suppression rules in priority order.
 * Supports override logic for high-priority nudges.
 *
 * Algorithm:
 * 1. Sort rules by priority (lower = first)
 * 2. For each rule, check if it wants to suppress
 * 3. If suppress AND (canBeOverridden AND nudgePriority in overrideBy) => continue
 * 4. If suppress AND cannot override => return suppressed
 * 5. If no rules suppress => return shouldDeliver: true
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 3
 */
import { SuppressionContext, SuppressionResult, NudgePriority } from './types';
/**
 * Evaluate all suppression rules for a nudge
 *
 * @param context - Suppression context with user state and nudge info
 * @returns SuppressionResult with delivery decision and audit trail
 */
export declare function evaluateSuppression(context: SuppressionContext): SuppressionResult;
/**
 * Helper to build suppression context from various sources
 *
 * @param params - Parameters to build context from
 * @returns Complete SuppressionContext ready for evaluation
 *
 * @example
 * const context = buildSuppressionContext({
 *   nudgePriority: 'STANDARD',
 *   confidenceScore: 0.75,
 *   userLocalHour: 14,
 *   userPreferences: { timezone: 'America/New_York' },
 *   nudgesDeliveredToday: 2,
 *   lastNudgeDeliveredAt: new Date(),
 *   dismissalsToday: 0,
 *   meetingHoursToday: 1,
 *   recoveryScore: 65,
 *   isMorningAnchor: false,
 *   currentStreak: 5,
 *   mvdActive: false,
 *   isMvdApprovedNudge: false,
 * });
 */
export declare function buildSuppressionContext(params: {
    nudgePriority: NudgePriority;
    confidenceScore: number;
    userLocalHour: number;
    userPreferences: {
        quiet_hours_start?: number;
        quiet_hours_end?: number;
        timezone?: string;
    };
    nudgesDeliveredToday: number;
    lastNudgeDeliveredAt: Date | null;
    dismissalsToday: number;
    meetingHoursToday: number;
    /** Recovery score from wearable (0-100), defaults to 100 (healthy) */
    recoveryScore?: number;
    /** Whether this is a morning anchor protocol */
    isMorningAnchor?: boolean;
    /** User's current protocol completion streak */
    currentStreak?: number;
    /** Whether MVD mode is active */
    mvdActive?: boolean;
    /** Whether this nudge is approved for MVD mode */
    isMvdApprovedNudge?: boolean;
}): SuppressionContext;
/**
 * Get user's local hour from UTC time and timezone
 *
 * @param utcDate - UTC date to convert
 * @param timezone - IANA timezone string (e.g., 'America/New_York')
 * @returns Local hour (0-23)
 */
export declare function getUserLocalHour(utcDate: Date, timezone?: string): number;
/**
 * Parse quiet hours from string format (HH:MM) to hour number
 *
 * @param timeString - Time string in HH:MM format (e.g., '22:00')
 * @returns Hour number (0-23) or undefined if invalid
 */
export declare function parseQuietHour(timeString?: string): number | undefined;
