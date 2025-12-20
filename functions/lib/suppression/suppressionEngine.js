"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateSuppression = evaluateSuppression;
exports.buildSuppressionContext = buildSuppressionContext;
exports.getUserLocalHour = getUserLocalHour;
exports.parseQuietHour = parseQuietHour;
exports.logSuppressionResult = logSuppressionResult;
const types_1 = require("./types");
const rules_1 = require("./rules");
const supabaseClient_1 = require("../supabaseClient");
/**
 * Evaluate all suppression rules for a nudge
 *
 * @param context - Suppression context with user state and nudge info
 * @returns SuppressionResult with delivery decision and audit trail
 */
function evaluateSuppression(context) {
    const rulesChecked = [];
    let wasOverridden = false;
    let overriddenRule;
    // Evaluate rules in priority order
    for (const rule of rules_1.SUPPRESSION_RULES) {
        rulesChecked.push(rule.id);
        const result = rule.check(context);
        if (result.suppress) {
            // Check if this rule can be overridden by the current nudge priority
            const canOverride = rule.canBeOverridden && rule.overrideBy.includes(context.nudgePriority);
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
function buildSuppressionContext(params) {
    return {
        nudgePriority: params.nudgePriority,
        confidenceScore: params.confidenceScore,
        userLocalHour: params.userLocalHour,
        user: {
            quiet_hours_start: params.userPreferences.quiet_hours_start ?? types_1.SUPPRESSION_CONFIG.DEFAULT_QUIET_START,
            quiet_hours_end: params.userPreferences.quiet_hours_end ?? types_1.SUPPRESSION_CONFIG.DEFAULT_QUIET_END,
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
function getUserLocalHour(utcDate, timezone) {
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
    }
    catch {
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
function parseQuietHour(timeString) {
    if (!timeString)
        return undefined;
    const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (!match)
        return undefined;
    const hour = parseInt(match[1], 10);
    return hour >= 0 && hour <= 23 ? hour : undefined;
}
/**
 * Log suppression result to nudge_delivery_log table for analytics
 *
 * @param params - Parameters for the log entry
 * @returns Promise resolving to the log entry ID, or null on failure
 *
 * Session 72: OPUS45 Brief Gap #3 - Nudge Delivery Logging
 */
async function logSuppressionResult(params) {
    const supabase = (0, supabaseClient_1.getServiceClient)();
    // Build context snapshot (sanitized for storage)
    const contextSnapshot = {
        nudgesDeliveredToday: params.context.nudgesDeliveredToday,
        userLocalHour: params.context.userLocalHour,
        dismissalsToday: params.context.dismissalsToday,
        meetingHoursToday: params.context.meetingHoursToday,
        recoveryScore: params.context.recoveryScore,
        currentStreak: params.context.currentStreak,
        mvdActive: params.context.mvdActive,
        isMorningAnchor: params.context.isMorningAnchor,
        confidenceScore: params.context.confidenceScore,
    };
    try {
        const { data, error } = await supabase
            .from('nudge_delivery_log')
            .insert({
            firebase_uid: params.firebaseUid,
            nudge_id: params.nudgeId,
            nudge_type: params.nudgeType,
            nudge_priority: params.nudgePriority,
            protocol_id: params.protocolId,
            should_deliver: params.result.shouldDeliver,
            suppressed_by: params.result.suppressedBy,
            suppression_reason: params.result.reason,
            rules_checked: params.result.rulesChecked,
            was_overridden: params.result.wasOverridden ?? false,
            overridden_rule: params.result.overriddenRule,
            context_snapshot: contextSnapshot,
        })
            .select('id')
            .single();
        if (error) {
            console.error('[SuppressionEngine] Failed to log suppression result:', error);
            return null;
        }
        return data?.id ?? null;
    }
    catch (err) {
        console.error('[SuppressionEngine] Exception logging suppression result:', err);
        return null;
    }
}
