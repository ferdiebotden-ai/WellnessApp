"use strict";
/**
 * MVD Detector
 *
 * Core detection logic for Minimum Viable Day mode.
 * Evaluates 4 trigger conditions (calendar deferred to Phase 3).
 *
 * Priority Order:
 * 1. travel_detected -> travel MVD
 * 2. low_recovery -> full MVD
 * 3. manual_activation -> full MVD
 * 4. consistency_drop -> semi_active MVD
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 6
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectMVD = detectMVD;
exports.shouldExitMVD = shouldExitMVD;
exports.selectMVDType = selectMVDType;
exports.detectAndMaybeActivateMVD = detectAndMaybeActivateMVD;
exports.checkAndMaybeExitMVD = checkAndMaybeExitMVD;
exports.getMVDStatusSummary = getMVDStatusSummary;
const types_1 = require("./types");
const mvdDataFetcher_1 = require("./mvdDataFetcher");
const mvdStateManager_1 = require("./mvdStateManager");
const mvdProtocols_1 = require("./mvdProtocols");
/**
 * Detect if MVD should be activated based on current context
 *
 * @param context - MVD detection context with all relevant data
 * @returns Detection result with trigger, type, and reason
 */
function detectMVD(context) {
    // Manual activation takes precedence over automatic triggers
    if (context.isManualActivation) {
        return {
            shouldActivate: true,
            trigger: 'manual_activation',
            mvdType: 'full',
            exitCondition: `Recovery >${types_1.MVD_CONFIG.RECOVERY_EXIT_THRESHOLD}%`,
            reason: 'User activated "Tough Day" mode',
        };
    }
    // Priority 1: Travel detection (timezone shift)
    const travelResult = checkTravelTrigger(context);
    if (travelResult.shouldActivate) {
        return travelResult;
    }
    // Priority 2: Low recovery score
    const recoveryResult = checkLowRecoveryTrigger(context);
    if (recoveryResult.shouldActivate) {
        return recoveryResult;
    }
    // Priority 3: Heavy calendar day (>= 4 meeting hours)
    const calendarResult = checkHeavyCalendarTrigger(context);
    if (calendarResult.shouldActivate) {
        return calendarResult;
    }
    // Priority 4: Consistency drop (3+ days of <50% completion)
    const consistencyResult = checkConsistencyDropTrigger(context);
    if (consistencyResult.shouldActivate) {
        return consistencyResult;
    }
    // No triggers activated
    return {
        shouldActivate: false,
        trigger: null,
        mvdType: null,
        exitCondition: null,
        reason: 'No MVD triggers detected',
    };
}
/**
 * Check travel trigger: timezone change >2 hours
 */
function checkTravelTrigger(context) {
    const { userTimezone, deviceTimezone } = context;
    const offsetHours = (0, mvdDataFetcher_1.calculateTimezoneOffset)(userTimezone, deviceTimezone);
    if (offsetHours !== null && offsetHours >= types_1.MVD_CONFIG.TRAVEL_TIMEZONE_THRESHOLD) {
        return {
            shouldActivate: true,
            trigger: 'travel_detected',
            mvdType: 'travel',
            exitCondition: 'Return to home timezone or 3 days elapsed',
            reason: `Timezone shift detected: ${offsetHours}h offset (threshold: ${types_1.MVD_CONFIG.TRAVEL_TIMEZONE_THRESHOLD}h)`,
        };
    }
    return {
        shouldActivate: false,
        trigger: null,
        mvdType: null,
        exitCondition: null,
        reason: 'No timezone shift detected',
    };
}
/**
 * Check low recovery trigger: recovery score <35%
 */
function checkLowRecoveryTrigger(context) {
    const { recoveryScore } = context;
    if (recoveryScore !== null &&
        recoveryScore < types_1.MVD_CONFIG.LOW_RECOVERY_THRESHOLD) {
        return {
            shouldActivate: true,
            trigger: 'low_recovery',
            mvdType: 'full',
            exitCondition: `Recovery >${types_1.MVD_CONFIG.RECOVERY_EXIT_THRESHOLD}%`,
            reason: `Low recovery detected: ${recoveryScore}% (threshold: ${types_1.MVD_CONFIG.LOW_RECOVERY_THRESHOLD}%)`,
        };
    }
    return {
        shouldActivate: false,
        trigger: null,
        mvdType: null,
        exitCondition: null,
        reason: 'Recovery score within healthy range',
    };
}
/**
 * Check heavy calendar trigger: meeting hours >= 4
 * Added in Phase 3 Session 5.
 */
function checkHeavyCalendarTrigger(context) {
    const { meetingHoursToday } = context;
    // Skip if no calendar data available
    if (meetingHoursToday === null || meetingHoursToday === undefined) {
        return {
            shouldActivate: false,
            trigger: null,
            mvdType: null,
            exitCondition: null,
            reason: 'No calendar data available',
        };
    }
    if (meetingHoursToday >= types_1.MVD_CONFIG.HEAVY_CALENDAR_THRESHOLD) {
        return {
            shouldActivate: true,
            trigger: 'heavy_calendar',
            mvdType: 'full',
            exitCondition: 'End of calendar heavy day',
            reason: `Heavy calendar day: ${meetingHoursToday.toFixed(1)}h of meetings (threshold: ${types_1.MVD_CONFIG.HEAVY_CALENDAR_THRESHOLD}h)`,
        };
    }
    return {
        shouldActivate: false,
        trigger: null,
        mvdType: null,
        exitCondition: null,
        reason: `Calendar load within limits: ${meetingHoursToday.toFixed(1)}h`,
    };
}
/**
 * Check consistency drop trigger: <50% completion for 3+ consecutive days
 */
function checkConsistencyDropTrigger(context) {
    const { completionHistory } = context;
    // Need at least CONSISTENCY_DAYS of data
    if (completionHistory.length < types_1.MVD_CONFIG.CONSISTENCY_DAYS) {
        return {
            shouldActivate: false,
            trigger: null,
            mvdType: null,
            exitCondition: null,
            reason: `Insufficient completion data: ${completionHistory.length} days (need ${types_1.MVD_CONFIG.CONSISTENCY_DAYS})`,
        };
    }
    // Check if all days are below threshold
    const allDaysBelowThreshold = completionHistory
        .slice(0, types_1.MVD_CONFIG.CONSISTENCY_DAYS)
        .every((rate) => rate < types_1.MVD_CONFIG.CONSISTENCY_THRESHOLD);
    if (allDaysBelowThreshold) {
        const avgCompletion = completionHistory
            .slice(0, types_1.MVD_CONFIG.CONSISTENCY_DAYS)
            .reduce((a, b) => a + b, 0) / types_1.MVD_CONFIG.CONSISTENCY_DAYS;
        return {
            shouldActivate: true,
            trigger: 'consistency_drop',
            mvdType: 'semi_active',
            exitCondition: `Complete >${types_1.MVD_CONFIG.CONSISTENCY_THRESHOLD}% of protocols for 2 consecutive days`,
            reason: `Consistency drop: avg ${Math.round(avgCompletion)}% over ${types_1.MVD_CONFIG.CONSISTENCY_DAYS} days (threshold: ${types_1.MVD_CONFIG.CONSISTENCY_THRESHOLD}%)`,
        };
    }
    return {
        shouldActivate: false,
        trigger: null,
        mvdType: null,
        exitCondition: null,
        reason: 'Completion rates within acceptable range',
    };
}
/**
 * Check if MVD should be exited based on recovery improvement
 *
 * @param recoveryScore - Current recovery score (0-100, null if unavailable)
 * @returns true if MVD should be deactivated
 */
function shouldExitMVD(recoveryScore) {
    // Keep MVD active if no recovery data
    if (recoveryScore === null) {
        return false;
    }
    // Exit if recovery is above threshold
    return recoveryScore > types_1.MVD_CONFIG.RECOVERY_EXIT_THRESHOLD;
}
/**
 * Select the appropriate MVD type based on trigger
 *
 * @param trigger - The trigger that activated MVD
 * @returns The MVD type to use
 */
function selectMVDType(trigger) {
    switch (trigger) {
        case 'travel_detected':
            return 'travel';
        case 'low_recovery':
        case 'manual_activation':
        case 'heavy_calendar': // Heavy meeting day = full MVD (Phase 3 Session 5)
            return 'full';
        case 'consistency_drop':
            return 'semi_active';
    }
}
/**
 * High-level function: Detect and maybe activate MVD for a user
 * Combines detection, state management, and logging
 *
 * @param context - MVD detection context
 * @returns Detection result with updated state
 */
async function detectAndMaybeActivateMVD(context) {
    const { userId } = context;
    // Check if already active
    const currentState = await (0, mvdStateManager_1.getMVDState)(userId);
    if (currentState?.mvd_active) {
        return {
            shouldActivate: false,
            trigger: currentState.trigger,
            mvdType: currentState.mvd_type,
            exitCondition: currentState.exit_condition,
            reason: 'MVD already active',
            wasActivated: false,
        };
    }
    // Run detection
    const result = detectMVD(context);
    if (result.shouldActivate && result.mvdType && result.trigger) {
        // Activate MVD
        await (0, mvdStateManager_1.activateMVD)(userId, result.mvdType, result.trigger, result.exitCondition ?? `Recovery >${types_1.MVD_CONFIG.RECOVERY_EXIT_THRESHOLD}%`);
        // Log to history for analytics
        await (0, mvdStateManager_1.logMVDActivation)(userId, result.mvdType, result.trigger);
        return {
            ...result,
            wasActivated: true,
        };
    }
    return {
        ...result,
        wasActivated: false,
    };
}
/**
 * High-level function: Check exit condition and maybe deactivate MVD
 *
 * @param userId - The user ID
 * @param recoveryScore - Current recovery score
 * @returns true if MVD was deactivated
 */
async function checkAndMaybeExitMVD(userId, recoveryScore) {
    const currentState = await (0, mvdStateManager_1.getMVDState)(userId);
    // Nothing to exit if not active
    if (!currentState?.mvd_active) {
        return false;
    }
    // Check exit condition
    if (shouldExitMVD(recoveryScore)) {
        await (0, mvdStateManager_1.deactivateMVD)(userId, `Recovery improved to ${recoveryScore}% (threshold: >${types_1.MVD_CONFIG.RECOVERY_EXIT_THRESHOLD}%)`);
        return true;
    }
    return false;
}
/**
 * Get a human-readable summary of current MVD status
 *
 * @param userId - The user ID
 * @returns Status summary string
 */
async function getMVDStatusSummary(userId) {
    const state = await (0, mvdStateManager_1.getMVDState)(userId);
    if (!state?.mvd_active) {
        return 'MVD not active - full protocol access available';
    }
    const typeName = state.mvd_type ?? 'unknown';
    const description = state.mvd_type
        ? (0, mvdProtocols_1.getMVDTypeDescription)(state.mvd_type)
        : '';
    return `MVD active (${typeName}): ${description}. Exit condition: ${state.exit_condition}`;
}
