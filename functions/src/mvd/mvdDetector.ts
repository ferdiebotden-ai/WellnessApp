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

import type {
  MVDDetectionContext,
  MVDDetectionResult,
  MVDTrigger,
  MVDType,
} from './types';
import { MVD_CONFIG } from './types';
import { calculateTimezoneOffset } from './mvdDataFetcher';
import {
  activateMVD,
  deactivateMVD,
  getMVDState,
  logMVDActivation,
} from './mvdStateManager';
import { getMVDTypeDescription } from './mvdProtocols';

/**
 * Detect if MVD should be activated based on current context
 *
 * @param context - MVD detection context with all relevant data
 * @returns Detection result with trigger, type, and reason
 */
export function detectMVD(context: MVDDetectionContext): MVDDetectionResult {
  // Manual activation takes precedence over automatic triggers
  if (context.isManualActivation) {
    return {
      shouldActivate: true,
      trigger: 'manual_activation',
      mvdType: 'full',
      exitCondition: `Recovery >${MVD_CONFIG.RECOVERY_EXIT_THRESHOLD}%`,
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

  // Note: heavy_calendar trigger would be Priority 3
  // Deferred to Phase 3 - requires Calendar API integration
  // TODO: Implement heavy_calendar trigger when Calendar API is available

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
function checkTravelTrigger(context: MVDDetectionContext): MVDDetectionResult {
  const { userTimezone, deviceTimezone } = context;

  const offsetHours = calculateTimezoneOffset(userTimezone, deviceTimezone);

  if (offsetHours !== null && offsetHours >= MVD_CONFIG.TRAVEL_TIMEZONE_THRESHOLD) {
    return {
      shouldActivate: true,
      trigger: 'travel_detected',
      mvdType: 'travel',
      exitCondition: 'Return to home timezone or 3 days elapsed',
      reason: `Timezone shift detected: ${offsetHours}h offset (threshold: ${MVD_CONFIG.TRAVEL_TIMEZONE_THRESHOLD}h)`,
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
function checkLowRecoveryTrigger(
  context: MVDDetectionContext
): MVDDetectionResult {
  const { recoveryScore } = context;

  if (
    recoveryScore !== null &&
    recoveryScore < MVD_CONFIG.LOW_RECOVERY_THRESHOLD
  ) {
    return {
      shouldActivate: true,
      trigger: 'low_recovery',
      mvdType: 'full',
      exitCondition: `Recovery >${MVD_CONFIG.RECOVERY_EXIT_THRESHOLD}%`,
      reason: `Low recovery detected: ${recoveryScore}% (threshold: ${MVD_CONFIG.LOW_RECOVERY_THRESHOLD}%)`,
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
 * Check consistency drop trigger: <50% completion for 3+ consecutive days
 */
function checkConsistencyDropTrigger(
  context: MVDDetectionContext
): MVDDetectionResult {
  const { completionHistory } = context;

  // Need at least CONSISTENCY_DAYS of data
  if (completionHistory.length < MVD_CONFIG.CONSISTENCY_DAYS) {
    return {
      shouldActivate: false,
      trigger: null,
      mvdType: null,
      exitCondition: null,
      reason: `Insufficient completion data: ${completionHistory.length} days (need ${MVD_CONFIG.CONSISTENCY_DAYS})`,
    };
  }

  // Check if all days are below threshold
  const allDaysBelowThreshold = completionHistory
    .slice(0, MVD_CONFIG.CONSISTENCY_DAYS)
    .every((rate) => rate < MVD_CONFIG.CONSISTENCY_THRESHOLD);

  if (allDaysBelowThreshold) {
    const avgCompletion =
      completionHistory
        .slice(0, MVD_CONFIG.CONSISTENCY_DAYS)
        .reduce((a, b) => a + b, 0) / MVD_CONFIG.CONSISTENCY_DAYS;

    return {
      shouldActivate: true,
      trigger: 'consistency_drop',
      mvdType: 'semi_active',
      exitCondition: `Complete >${MVD_CONFIG.CONSISTENCY_THRESHOLD}% of protocols for 2 consecutive days`,
      reason: `Consistency drop: avg ${Math.round(avgCompletion)}% over ${MVD_CONFIG.CONSISTENCY_DAYS} days (threshold: ${MVD_CONFIG.CONSISTENCY_THRESHOLD}%)`,
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
export function shouldExitMVD(recoveryScore: number | null): boolean {
  // Keep MVD active if no recovery data
  if (recoveryScore === null) {
    return false;
  }

  // Exit if recovery is above threshold
  return recoveryScore > MVD_CONFIG.RECOVERY_EXIT_THRESHOLD;
}

/**
 * Select the appropriate MVD type based on trigger
 *
 * @param trigger - The trigger that activated MVD
 * @returns The MVD type to use
 */
export function selectMVDType(trigger: MVDTrigger): MVDType {
  switch (trigger) {
    case 'travel_detected':
      return 'travel';
    case 'low_recovery':
    case 'manual_activation':
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
export async function detectAndMaybeActivateMVD(
  context: MVDDetectionContext
): Promise<MVDDetectionResult & { wasActivated: boolean }> {
  const { userId } = context;

  // Check if already active
  const currentState = await getMVDState(userId);
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
    await activateMVD(
      userId,
      result.mvdType,
      result.trigger,
      result.exitCondition ?? `Recovery >${MVD_CONFIG.RECOVERY_EXIT_THRESHOLD}%`
    );

    // Log to history for analytics
    await logMVDActivation(userId, result.mvdType, result.trigger);

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
export async function checkAndMaybeExitMVD(
  userId: string,
  recoveryScore: number | null
): Promise<boolean> {
  const currentState = await getMVDState(userId);

  // Nothing to exit if not active
  if (!currentState?.mvd_active) {
    return false;
  }

  // Check exit condition
  if (shouldExitMVD(recoveryScore)) {
    await deactivateMVD(
      userId,
      `Recovery improved to ${recoveryScore}% (threshold: >${MVD_CONFIG.RECOVERY_EXIT_THRESHOLD}%)`
    );
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
export async function getMVDStatusSummary(userId: string): Promise<string> {
  const state = await getMVDState(userId);

  if (!state?.mvd_active) {
    return 'MVD not active - full protocol access available';
  }

  const typeName = state.mvd_type ?? 'unknown';
  const description = state.mvd_type
    ? getMVDTypeDescription(state.mvd_type)
    : '';

  return `MVD active (${typeName}): ${description}. Exit condition: ${state.exit_condition}`;
}
