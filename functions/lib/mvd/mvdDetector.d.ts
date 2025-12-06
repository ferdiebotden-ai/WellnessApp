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
import type { MVDDetectionContext, MVDDetectionResult, MVDTrigger, MVDType } from './types';
/**
 * Detect if MVD should be activated based on current context
 *
 * @param context - MVD detection context with all relevant data
 * @returns Detection result with trigger, type, and reason
 */
export declare function detectMVD(context: MVDDetectionContext): MVDDetectionResult;
/**
 * Check if MVD should be exited based on recovery improvement
 *
 * @param recoveryScore - Current recovery score (0-100, null if unavailable)
 * @returns true if MVD should be deactivated
 */
export declare function shouldExitMVD(recoveryScore: number | null): boolean;
/**
 * Select the appropriate MVD type based on trigger
 *
 * @param trigger - The trigger that activated MVD
 * @returns The MVD type to use
 */
export declare function selectMVDType(trigger: MVDTrigger): MVDType;
/**
 * High-level function: Detect and maybe activate MVD for a user
 * Combines detection, state management, and logging
 *
 * @param context - MVD detection context
 * @returns Detection result with updated state
 */
export declare function detectAndMaybeActivateMVD(context: MVDDetectionContext): Promise<MVDDetectionResult & {
    wasActivated: boolean;
}>;
/**
 * High-level function: Check exit condition and maybe deactivate MVD
 *
 * @param userId - The user ID
 * @param recoveryScore - Current recovery score
 * @returns true if MVD was deactivated
 */
export declare function checkAndMaybeExitMVD(userId: string, recoveryScore: number | null): Promise<boolean>;
/**
 * Get a human-readable summary of current MVD status
 *
 * @param userId - The user ID
 * @returns Status summary string
 */
export declare function getMVDStatusSummary(userId: string): Promise<string>;
