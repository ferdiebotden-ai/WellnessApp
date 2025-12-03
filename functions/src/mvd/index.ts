/**
 * MVD (Minimum Viable Day) Module
 *
 * Exports all MVD-related functionality for use by other modules.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 6
 */

// Types
export type {
  MVDTrigger,
  MVDType,
  MVDState,
  MVDDetectionContext,
  MVDDetectionResult,
} from './types';
export { MVD_CONFIG, DEFAULT_MVD_STATE } from './types';

// Protocol Sets
export {
  MVD_PROTOCOL_SETS,
  getAllMVDApprovedProtocolIds,
  isProtocolApprovedForMVD,
  getApprovedProtocolIds,
  getMVDTypeDescription,
  getMVDProtocolCount,
} from './mvdProtocols';

// State Management
export {
  getMVDState,
  activateMVD,
  deactivateMVD,
  updateMVDCheckTimestamp,
  initializeMVDState,
  isMVDActive,
  getMVDHistory,
  logMVDActivation,
  closeMVDHistoryRecord,
} from './mvdStateManager';

// Data Fetching
export {
  getLatestRecoveryScore,
  getCompletionHistory,
  getUserTimezone,
  calculateTimezoneOffset,
  buildMVDDetectionContext,
  hasSufficientDataForMVD,
} from './mvdDataFetcher';

// Detection Logic
export {
  detectMVD,
  shouldExitMVD,
  selectMVDType,
  detectAndMaybeActivateMVD,
  checkAndMaybeExitMVD,
  getMVDStatusSummary,
} from './mvdDetector';
