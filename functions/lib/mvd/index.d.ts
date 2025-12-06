/**
 * MVD (Minimum Viable Day) Module
 *
 * Exports all MVD-related functionality for use by other modules.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 6
 */
export type { MVDTrigger, MVDType, MVDState, MVDDetectionContext, MVDDetectionResult, } from './types';
export { MVD_CONFIG, DEFAULT_MVD_STATE } from './types';
export { MVD_PROTOCOL_SETS, getAllMVDApprovedProtocolIds, isProtocolApprovedForMVD, getApprovedProtocolIds, getMVDTypeDescription, getMVDProtocolCount, } from './mvdProtocols';
export { getMVDState, activateMVD, deactivateMVD, updateMVDCheckTimestamp, initializeMVDState, isMVDActive, getMVDHistory, logMVDActivation, closeMVDHistoryRecord, } from './mvdStateManager';
export { getLatestRecoveryScore, getCompletionHistory, getUserTimezone, calculateTimezoneOffset, buildMVDDetectionContext, hasSufficientDataForMVD, } from './mvdDataFetcher';
export { detectMVD, shouldExitMVD, selectMVDType, detectAndMaybeActivateMVD, checkAndMaybeExitMVD, getMVDStatusSummary, } from './mvdDetector';
