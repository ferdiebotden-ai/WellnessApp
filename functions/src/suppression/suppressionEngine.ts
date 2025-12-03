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

import {
  SuppressionContext,
  SuppressionResult,
  NudgePriority,
  SUPPRESSION_CONFIG,
} from './types';
import { SUPPRESSION_RULES } from './rules';

/**
 * Evaluate all suppression rules for a nudge
 *
 * @param context - Suppression context with user state and nudge info
 * @returns SuppressionResult with delivery decision and audit trail
 */
export function evaluateSuppression(context: SuppressionContext): SuppressionResult {
  const rulesChecked: string[] = [];
  let wasOverridden = false;
  let overriddenRule: string | undefined;

  // Evaluate rules in priority order
  for (const rule of SUPPRESSION_RULES) {
    rulesChecked.push(rule.id);
    const result = rule.check(context);

    if (result.suppress) {
      // Check if this rule can be overridden by the current nudge priority
      const canOverride =
        rule.canBeOverridden && rule.overrideBy.includes(context.nudgePriority);

      if (canOverride) {
        // Override applied - continue checking other rules
        wasOverridden = true;
        overriddenRule = rule.id;
        continue;
      }

      // Cannot override - suppress the nudge
      return {
        shouldDeliver: false,
        suppressedBy: rule.id,
        reason: result.reason,
        rulesChecked,
        wasOverridden,
        overriddenRule,
      };
    }
  }

  // All rules passed
  return {
    shouldDeliver: true,
    rulesChecked,
    wasOverridden,
    overriddenRule,
  };
}

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
export function buildSuppressionContext(params: {
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
}): SuppressionContext {
  return {
    nudgePriority: params.nudgePriority,
    confidenceScore: params.confidenceScore,
    userLocalHour: params.userLocalHour,
    user: {
      quiet_hours_start:
        params.userPreferences.quiet_hours_start ?? SUPPRESSION_CONFIG.DEFAULT_QUIET_START,
      quiet_hours_end:
        params.userPreferences.quiet_hours_end ?? SUPPRESSION_CONFIG.DEFAULT_QUIET_END,
      timezone: params.userPreferences.timezone,
    },
    nudgesDeliveredToday: params.nudgesDeliveredToday,
    lastNudgeDeliveredAt: params.lastNudgeDeliveredAt,
    dismissalsToday: params.dismissalsToday,
    meetingHoursToday: params.meetingHoursToday,
    // New fields for Part 2 rules (with sensible defaults)
    recoveryScore: params.recoveryScore ?? 100, // Default to healthy
    isMorningAnchor: params.isMorningAnchor ?? false,
    currentStreak: params.currentStreak ?? 0,
    mvdActive: params.mvdActive ?? false,
    isMvdApprovedNudge: params.isMvdApprovedNudge ?? false,
  };
}

/**
 * Get user's local hour from UTC time and timezone
 *
 * @param utcDate - UTC date to convert
 * @param timezone - IANA timezone string (e.g., 'America/New_York')
 * @returns Local hour (0-23)
 */
export function getUserLocalHour(utcDate: Date, timezone?: string): number {
  if (!timezone) {
    return utcDate.getUTCHours();
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    const localHour = parseInt(formatter.format(utcDate), 10);
    // Handle edge case where hour might be 24 (midnight)
    return localHour === 24 ? 0 : localHour;
  } catch {
    console.warn(`[SuppressionEngine] Invalid timezone: ${timezone}, falling back to UTC`);
    return utcDate.getUTCHours();
  }
}

/**
 * Parse quiet hours from string format (HH:MM) to hour number
 *
 * @param timeString - Time string in HH:MM format (e.g., '22:00')
 * @returns Hour number (0-23) or undefined if invalid
 */
export function parseQuietHour(timeString?: string): number | undefined {
  if (!timeString) return undefined;

  const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return undefined;

  const hour = parseInt(match[1], 10);
  return hour >= 0 && hour <= 23 ? hour : undefined;
}
