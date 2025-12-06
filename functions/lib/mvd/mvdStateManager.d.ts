/**
 * MVD State Manager
 *
 * Handles Firestore read/write operations for MVD state.
 * State is stored at: user_state/{userId}
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 6
 */
import type { MVDState, MVDType, MVDTrigger } from './types';
/**
 * Get the current MVD state for a user
 *
 * @param userId - The user ID
 * @returns MVDState if found, null if no state exists
 */
export declare function getMVDState(userId: string): Promise<MVDState | null>;
/**
 * Activate MVD mode for a user
 *
 * @param userId - The user ID
 * @param mvdType - Type of MVD to activate
 * @param trigger - What triggered the activation
 * @param exitCondition - Human-readable exit condition
 */
export declare function activateMVD(userId: string, mvdType: MVDType, trigger: MVDTrigger, exitCondition: string): Promise<void>;
/**
 * Deactivate MVD mode for a user
 *
 * @param userId - The user ID
 * @param reason - Why MVD was deactivated (for logging)
 */
export declare function deactivateMVD(userId: string, reason: string): Promise<void>;
/**
 * Update the last_checked_at timestamp without changing MVD state
 *
 * @param userId - The user ID
 */
export declare function updateMVDCheckTimestamp(userId: string): Promise<void>;
/**
 * Initialize MVD state for a new user (or reset existing)
 *
 * @param userId - The user ID
 */
export declare function initializeMVDState(userId: string): Promise<void>;
/**
 * Check if MVD is currently active for a user
 * Convenience wrapper around getMVDState
 *
 * @param userId - The user ID
 * @returns true if MVD is active, false otherwise
 */
export declare function isMVDActive(userId: string): Promise<boolean>;
/**
 * Get MVD activation history for a user (for analytics)
 * Returns the last N activations from a subcollection
 *
 * @param userId - The user ID
 * @param limit - Number of records to return (default 10)
 */
export declare function getMVDHistory(userId: string, limit?: number): Promise<Array<{
    type: MVDType;
    trigger: MVDTrigger;
    activated_at: string;
    deactivated_at: string | null;
    duration_hours: number | null;
}>>;
/**
 * Log MVD activation to history subcollection (for analytics)
 *
 * @param userId - The user ID
 * @param mvdType - Type of MVD activated
 * @param trigger - What triggered activation
 */
export declare function logMVDActivation(userId: string, mvdType: MVDType, trigger: MVDTrigger): Promise<string>;
/**
 * Close an MVD history record when deactivation occurs
 *
 * @param userId - The user ID
 * @param historyId - ID of the history record to close
 */
export declare function closeMVDHistoryRecord(userId: string, historyId: string): Promise<void>;
