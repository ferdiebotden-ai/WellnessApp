/**
 * Suppression Rules (Part 1)
 *
 * First 5 rules for the suppression engine:
 * 1. daily_cap - Max 5 nudges per day
 * 2. quiet_hours - No nudges during sleep hours
 * 3. cooldown - 2-hour minimum between nudges
 * 4. fatigue_detection - Pause after 3+ dismissals
 * 5. meeting_awareness - Suppress during heavy meeting days
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 3
 */

import {
  SuppressionRule,
  SuppressionContext,
  SuppressionCheckResult,
  SUPPRESSION_CONFIG,
  RULE_IDS,
} from './types';

/**
 * Rule 1: Daily Cap
 * Maximum 5 nudges per day to prevent notification fatigue.
 * Can be overridden by CRITICAL nudges (allows +1 for critical).
 */
const dailyCapRule: SuppressionRule = {
  id: RULE_IDS.DAILY_CAP,
  name: 'Daily Cap',
  priority: 1,
  canBeOverridden: true,
  overrideBy: ['CRITICAL'],
  check: (context: SuppressionContext): SuppressionCheckResult => {
    if (context.nudgesDeliveredToday >= SUPPRESSION_CONFIG.DAILY_CAP) {
      return {
        suppress: true,
        reason: `Daily cap (${SUPPRESSION_CONFIG.DAILY_CAP}) reached`,
      };
    }
    return { suppress: false };
  },
};

/**
 * Rule 2: Quiet Hours
 * No nudges during user-configured sleep hours.
 * Cannot be overridden - sleep is sacred.
 */
const quietHoursRule: SuppressionRule = {
  id: RULE_IDS.QUIET_HOURS,
  name: 'Quiet Hours',
  priority: 2,
  canBeOverridden: false,
  overrideBy: [],
  check: (context: SuppressionContext): SuppressionCheckResult => {
    const hour = context.userLocalHour;
    const start = context.user.quiet_hours_start;
    const end = context.user.quiet_hours_end;

    // Handle wrap-around (e.g., 22:00 to 06:00)
    const inQuietHours =
      start > end
        ? hour >= start || hour < end // Wraps midnight
        : hour >= start && hour < end; // Same day range

    if (inQuietHours) {
      return {
        suppress: true,
        reason: `Quiet hours (${start}:00-${end}:00)`,
      };
    }
    return { suppress: false };
  },
};

/**
 * Rule 3: Cooldown Period
 * Minimum 2 hours between nudges to avoid overwhelming users.
 * Can be overridden by CRITICAL nudges.
 */
const cooldownRule: SuppressionRule = {
  id: RULE_IDS.COOLDOWN,
  name: 'Cooldown Period',
  priority: 3,
  canBeOverridden: true,
  overrideBy: ['CRITICAL'],
  check: (context: SuppressionContext): SuppressionCheckResult => {
    const { lastNudgeDeliveredAt } = context;

    if (lastNudgeDeliveredAt) {
      const elapsed = Date.now() - lastNudgeDeliveredAt.getTime();
      if (elapsed < SUPPRESSION_CONFIG.COOLDOWN_MS) {
        const minutesRemaining = Math.ceil(
          (SUPPRESSION_CONFIG.COOLDOWN_MS - elapsed) / (60 * 1000)
        );
        return {
          suppress: true,
          reason: `2-hour cooldown not elapsed (${minutesRemaining} min remaining)`,
        };
      }
    }
    return { suppress: false };
  },
};

/**
 * Rule 4: Fatigue Detection
 * Pause nudges after user dismisses 3+ nudges today.
 * Cannot be overridden - user has clearly indicated disinterest.
 */
const fatigueDetectionRule: SuppressionRule = {
  id: RULE_IDS.FATIGUE_DETECTION,
  name: 'Fatigue Detection',
  priority: 4,
  canBeOverridden: false,
  overrideBy: [],
  check: (context: SuppressionContext): SuppressionCheckResult => {
    if (context.dismissalsToday >= SUPPRESSION_CONFIG.FATIGUE_THRESHOLD) {
      return {
        suppress: true,
        reason: `${context.dismissalsToday}+ dismissals today - pausing until tomorrow`,
      };
    }
    return { suppress: false };
  },
};

/**
 * Rule 5: Meeting Awareness
 * Suppress STANDARD nudges on heavy meeting days (2+ hours).
 * Can be overridden by CRITICAL and ADAPTIVE nudges.
 */
const meetingAwarenessRule: SuppressionRule = {
  id: RULE_IDS.MEETING_AWARENESS,
  name: 'Meeting Awareness',
  priority: 5,
  canBeOverridden: true,
  overrideBy: ['CRITICAL', 'ADAPTIVE'],
  check: (context: SuppressionContext): SuppressionCheckResult => {
    if (
      context.meetingHoursToday >= SUPPRESSION_CONFIG.MEETING_HOURS_THRESHOLD &&
      context.nudgePriority === 'STANDARD'
    ) {
      return {
        suppress: true,
        reason: `${context.meetingHoursToday}+ meeting hours - suppressing STANDARD nudge`,
      };
    }
    return { suppress: false };
  },
};

/**
 * All suppression rules, sorted by priority (lower = checked first)
 */
export const SUPPRESSION_RULES: SuppressionRule[] = [
  dailyCapRule,
  quietHoursRule,
  cooldownRule,
  fatigueDetectionRule,
  meetingAwarenessRule,
].sort((a, b) => a.priority - b.priority);

/**
 * Get a rule by its ID
 * @param id - Rule ID to look up
 * @returns The rule if found, undefined otherwise
 */
export function getRuleById(id: string): SuppressionRule | undefined {
  return SUPPRESSION_RULES.find((rule) => rule.id === id);
}
