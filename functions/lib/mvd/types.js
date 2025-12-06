"use strict";
/**
 * MVD (Minimum Viable Day) Type Definitions
 *
 * Defines interfaces and constants for MVD detection and state management.
 * MVD automatically activates "easy mode" when users are struggling.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 6
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MVD_STATE = exports.MVD_CONFIG = void 0;
/**
 * Configuration constants for MVD detection
 */
exports.MVD_CONFIG = {
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
    /** Meeting hours threshold for heavy_calendar trigger (Phase 3 Session 5) */
    HEAVY_CALENDAR_THRESHOLD: 4,
};
/**
 * Default MVD state for new users or when MVD is inactive
 */
exports.DEFAULT_MVD_STATE = {
    mvd_active: false,
    mvd_type: null,
    trigger: null,
    activated_at: null,
    exit_condition: null,
    last_checked_at: new Date().toISOString(),
};
