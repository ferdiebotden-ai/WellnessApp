"use strict";
/**
 * Suppression Rules
 *
 * All 9 rules for the suppression engine, evaluated in priority order:
 * 1. daily_cap - Max 5 nudges per day
 * 2. quiet_hours - No nudges during sleep hours
 * 3. cooldown - 2-hour minimum between nudges
 * 4. fatigue_detection - Pause after 3+ dismissals
 * 5. meeting_awareness - Suppress during heavy meeting days
 * 6. low_recovery - Morning-only mode when recovery <30%
 * 7. streak_respect - Reduce frequency after 7-day streak
 * 8. low_confidence - Filter nudges with confidence <0.4
 * 9. mvd_active - Only MVD nudges when MVD mode active
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 3
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPRESSION_RULES = void 0;
exports.simpleHash = simpleHash;
exports.getRuleById = getRuleById;
const types_1 = require("./types");
/**
 * Rule 1: Daily Cap
 * Maximum 5 nudges per day to prevent notification fatigue.
 * Can be overridden by CRITICAL nudges (allows +1 for critical).
 */
const dailyCapRule = {
    id: types_1.RULE_IDS.DAILY_CAP,
    name: 'Daily Cap',
    priority: 1,
    canBeOverridden: true,
    overrideBy: ['CRITICAL'],
    check: (context) => {
        if (context.nudgesDeliveredToday >= types_1.SUPPRESSION_CONFIG.DAILY_CAP) {
            return {
                suppress: true,
                reason: `Daily cap (${types_1.SUPPRESSION_CONFIG.DAILY_CAP}) reached`,
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
const quietHoursRule = {
    id: types_1.RULE_IDS.QUIET_HOURS,
    name: 'Quiet Hours',
    priority: 2,
    canBeOverridden: false,
    overrideBy: [],
    check: (context) => {
        const hour = context.userLocalHour;
        const start = context.user.quiet_hours_start;
        const end = context.user.quiet_hours_end;
        // Handle wrap-around (e.g., 22:00 to 06:00)
        const inQuietHours = start > end
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
const cooldownRule = {
    id: types_1.RULE_IDS.COOLDOWN,
    name: 'Cooldown Period',
    priority: 3,
    canBeOverridden: true,
    overrideBy: ['CRITICAL'],
    check: (context) => {
        const { lastNudgeDeliveredAt } = context;
        if (lastNudgeDeliveredAt) {
            const elapsed = Date.now() - lastNudgeDeliveredAt.getTime();
            if (elapsed < types_1.SUPPRESSION_CONFIG.COOLDOWN_MS) {
                const minutesRemaining = Math.ceil((types_1.SUPPRESSION_CONFIG.COOLDOWN_MS - elapsed) / (60 * 1000));
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
const fatigueDetectionRule = {
    id: types_1.RULE_IDS.FATIGUE_DETECTION,
    name: 'Fatigue Detection',
    priority: 4,
    canBeOverridden: false,
    overrideBy: [],
    check: (context) => {
        if (context.dismissalsToday >= types_1.SUPPRESSION_CONFIG.FATIGUE_THRESHOLD) {
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
const meetingAwarenessRule = {
    id: types_1.RULE_IDS.MEETING_AWARENESS,
    name: 'Meeting Awareness',
    priority: 5,
    canBeOverridden: true,
    overrideBy: ['CRITICAL', 'ADAPTIVE'],
    check: (context) => {
        if (context.meetingHoursToday >= types_1.SUPPRESSION_CONFIG.MEETING_HOURS_THRESHOLD &&
            context.nudgePriority === 'STANDARD') {
            return {
                suppress: true,
                reason: `${context.meetingHoursToday}+ meeting hours - suppressing STANDARD nudge`,
            };
        }
        return { suppress: false };
    },
};
/**
 * Rule 6: Low Recovery Mode
 * When recovery score is below 30%, only deliver morning anchor protocols.
 * Non-morning nudges are suppressed to reduce cognitive load on recovery days.
 * Cannot be overridden - recovery takes priority.
 *
 * @example
 * // Recovery 25%, nudge at 2pm → suppressed
 * // Recovery 25%, morning anchor at 7am → allowed
 * // Recovery 50%, nudge at 2pm → allowed
 */
const lowRecoveryRule = {
    id: types_1.RULE_IDS.LOW_RECOVERY,
    name: 'Low Recovery Mode',
    priority: 6,
    canBeOverridden: false,
    overrideBy: [],
    check: (context) => {
        // Only apply if recovery is below threshold
        if (context.recoveryScore >= types_1.SUPPRESSION_CONFIG.LOW_RECOVERY_THRESHOLD) {
            return { suppress: false };
        }
        // Morning anchor protocols are exempt
        if (context.isMorningAnchor) {
            return { suppress: false };
        }
        // Check if current hour is within morning window (5am-10am)
        const isMorningHours = context.userLocalHour >= types_1.SUPPRESSION_CONFIG.MORNING_HOURS_START &&
            context.userLocalHour < types_1.SUPPRESSION_CONFIG.MORNING_HOURS_END;
        if (isMorningHours) {
            return { suppress: false };
        }
        return {
            suppress: true,
            reason: `Recovery ${context.recoveryScore}% (<${types_1.SUPPRESSION_CONFIG.LOW_RECOVERY_THRESHOLD}%) - morning-only mode`,
        };
    },
};
/**
 * Rule 7: Streak Respect
 * After 7+ consecutive days of protocol completion, reduce nudge frequency by 50%.
 * Users who have built momentum don't need as many nudges.
 * Cannot be overridden - earned autonomy.
 *
 * @example
 * // Streak 3 days → no suppression
 * // Streak 7 days → 50% chance of suppression
 * // Streak 14 days → 50% chance of suppression (same behavior)
 */
const streakRespectRule = {
    id: types_1.RULE_IDS.STREAK_RESPECT,
    name: 'Streak Respect',
    priority: 7,
    canBeOverridden: false,
    overrideBy: [],
    check: (context) => {
        // Only apply after streak threshold
        if (context.currentStreak < types_1.SUPPRESSION_CONFIG.STREAK_THRESHOLD) {
            return { suppress: false };
        }
        // 50% chance of suppression - user has earned less frequent nudges
        // Using deterministic hash based on date to ensure consistent behavior within a day
        const today = new Date().toISOString().split('T')[0];
        const hash = simpleHash(`${today}-${context.currentStreak}`);
        const shouldSuppress = hash % 2 === 0;
        if (shouldSuppress) {
            return {
                suppress: true,
                reason: `${context.currentStreak}-day streak - reducing frequency (earned autonomy)`,
            };
        }
        return { suppress: false };
    },
};
/**
 * Simple hash function for deterministic randomness
 * Used for streak_respect to ensure consistent behavior within a day
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}
/**
 * Rule 8: Low Confidence Filter
 * Filter out nudges with confidence score below 0.4.
 * Prevents delivery of uncertain or poorly-matched recommendations.
 * Cannot be overridden - quality gate.
 *
 * @example
 * // Confidence 0.35 → suppressed
 * // Confidence 0.40 → allowed (at threshold)
 * // Confidence 0.75 → allowed
 */
const lowConfidenceRule = {
    id: types_1.RULE_IDS.LOW_CONFIDENCE,
    name: 'Low Confidence Filter',
    priority: 8,
    canBeOverridden: false,
    overrideBy: [],
    check: (context) => {
        if (context.confidenceScore < types_1.SUPPRESSION_CONFIG.LOW_CONFIDENCE_THRESHOLD) {
            return {
                suppress: true,
                reason: `Confidence ${(context.confidenceScore * 100).toFixed(0)}% (<${types_1.SUPPRESSION_CONFIG.LOW_CONFIDENCE_THRESHOLD * 100}%) - below threshold`,
            };
        }
        return { suppress: false };
    },
};
/**
 * Rule 9: MVD Active
 * When Minimum Viable Day mode is active, only deliver MVD-approved nudges.
 * This protects users on difficult days from overwhelming information.
 * Cannot be overridden - user-initiated protection mode.
 *
 * @example
 * // MVD active, non-MVD nudge → suppressed
 * // MVD active, MVD-approved nudge → allowed
 * // MVD not active → allowed (rule doesn't apply)
 */
const mvdActiveRule = {
    id: types_1.RULE_IDS.MVD_ACTIVE,
    name: 'MVD Active',
    priority: 9,
    canBeOverridden: false,
    overrideBy: [],
    check: (context) => {
        // Only apply when MVD mode is active
        if (!context.mvdActive) {
            return { suppress: false };
        }
        // Allow MVD-approved nudges through
        if (context.isMvdApprovedNudge) {
            return { suppress: false };
        }
        return {
            suppress: true,
            reason: 'MVD mode active - only essential nudges allowed',
        };
    },
};
/**
 * All suppression rules, sorted by priority (lower = checked first)
 */
exports.SUPPRESSION_RULES = [
    dailyCapRule,
    quietHoursRule,
    cooldownRule,
    fatigueDetectionRule,
    meetingAwarenessRule,
    lowRecoveryRule,
    streakRespectRule,
    lowConfidenceRule,
    mvdActiveRule,
].sort((a, b) => a.priority - b.priority);
/**
 * Get a rule by its ID
 * @param id - Rule ID to look up
 * @returns The rule if found, undefined otherwise
 */
function getRuleById(id) {
    return exports.SUPPRESSION_RULES.find((rule) => rule.id === id);
}
