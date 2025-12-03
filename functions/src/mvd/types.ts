/**
 * MVD (Minimum Viable Day) Type Definitions
 *
 * Defines interfaces and constants for MVD detection and state management.
 * MVD automatically activates "easy mode" when users are struggling.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 6
 */

/**
 * Trigger conditions that can activate MVD mode
 */
export type MVDTrigger =
  | 'low_recovery' // Recovery score <35%
  | 'manual_activation' // User tapped "Tough Day" button
  | 'travel_detected' // Timezone change >2 hours
  | 'consistency_drop'; // <50% completion for 3+ consecutive days
// Note: 'heavy_calendar' (6+ meeting hours) deferred to Phase 3 - requires Calendar API integration

/**
 * MVD mode types that determine which protocols are allowed
 */
export type MVDType = 'full' | 'semi_active' | 'travel';

/**
 * MVD state stored in Firestore at user_state/{userId}
 */
export interface MVDState {
  /** Whether MVD mode is currently active */
  mvd_active: boolean;
  /** Type of MVD determining allowed protocols */
  mvd_type: MVDType | null;
  /** What triggered MVD activation */
  trigger: MVDTrigger | null;
  /** ISO timestamp when MVD was activated */
  activated_at: string | null;
  /** Human-readable exit condition (e.g., "Recovery >50%") */
  exit_condition: string | null;
  /** ISO timestamp of last MVD check */
  last_checked_at: string;
}

/**
 * Context needed for MVD detection
 */
export interface MVDDetectionContext {
  /** User ID */
  userId: string;
  /** Latest recovery score from wearable data (0-100, null if unavailable) */
  recoveryScore: number | null;
  /** User's stored timezone from preferences (IANA format) */
  userTimezone: string | null;
  /** Device timezone from request (IANA format) */
  deviceTimezone: string | null;
  /** Protocol completion rates for last N days (0-100 each) */
  completionHistory: number[];
  /** Whether this is a manual activation request */
  isManualActivation?: boolean;
}

/**
 * Result of MVD detection
 */
export interface MVDDetectionResult {
  /** Whether MVD should be activated */
  shouldActivate: boolean;
  /** Which trigger caused activation */
  trigger: MVDTrigger | null;
  /** Which MVD type to use */
  mvdType: MVDType | null;
  /** Human-readable exit condition */
  exitCondition: string | null;
  /** Reason for the detection result (for logging) */
  reason: string;
}

/**
 * Configuration constants for MVD detection
 */
export const MVD_CONFIG = {
  /** Recovery score below which low_recovery triggers */
  LOW_RECOVERY_THRESHOLD: 35,
  /** Recovery score above which MVD auto-deactivates */
  RECOVERY_EXIT_THRESHOLD: 50,
  /** Timezone offset (hours) that triggers travel detection */
  TRAVEL_TIMEZONE_THRESHOLD: 2,
  /** Completion rate below which consistency_drop triggers */
  CONSISTENCY_THRESHOLD: 50,
  /** Number of consecutive days needed for consistency_drop */
  CONSISTENCY_DAYS: 3,
  // Note: HEAVY_CALENDAR_THRESHOLD (6 hours) deferred to Phase 3
} as const;

/**
 * Default MVD state for new users or when MVD is inactive
 */
export const DEFAULT_MVD_STATE: MVDState = {
  mvd_active: false,
  mvd_type: null,
  trigger: null,
  activated_at: null,
  exit_condition: null,
  last_checked_at: new Date().toISOString(),
};
