"use strict";
/**
 * Suppression Engine Types
 *
 * Defines interfaces and constants for nudge suppression rules.
 * Rules are evaluated in priority order; first suppression wins.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 3
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RULE_IDS = exports.SUPPRESSION_CONFIG = void 0;
/**
 * Constants for suppression engine configuration
 */
exports.SUPPRESSION_CONFIG = {
    /** Maximum nudges allowed per day (can be exceeded by 1 for CRITICAL) */
    DAILY_CAP: 5,
    /** Minimum milliseconds between nudges (2 hours) */
    COOLDOWN_MS: 2 * 60 * 60 * 1000,
    /** Number of dismissals before fatigue suppression kicks in */
    FATIGUE_THRESHOLD: 3,
    /** Meeting hours threshold for meeting awareness suppression */
    MEETING_HOURS_THRESHOLD: 2,
    /** Default quiet hours if not configured */
    DEFAULT_QUIET_START: 22, // 10pm
    DEFAULT_QUIET_END: 6, // 6am
    /** Recovery score below which morning-only mode activates */
    LOW_RECOVERY_THRESHOLD: 30,
    /** Streak days after which frequency is reduced by 50% */
    STREAK_THRESHOLD: 7,
    /** Minimum confidence score required to deliver a nudge */
    LOW_CONFIDENCE_THRESHOLD: 0.4,
    /** Morning hours range for morning anchor protocols (5-10am) */
    MORNING_HOURS_START: 5,
    MORNING_HOURS_END: 10,
};
/**
 * Rule IDs for reference and audit logging
 */
exports.RULE_IDS = {
    DAILY_CAP: 'daily_cap',
    QUIET_HOURS: 'quiet_hours',
    COOLDOWN: 'cooldown',
    FATIGUE_DETECTION: 'fatigue_detection',
    MEETING_AWARENESS: 'meeting_awareness',
    LOW_RECOVERY: 'low_recovery',
    STREAK_RESPECT: 'streak_respect',
    LOW_CONFIDENCE: 'low_confidence',
    MVD_ACTIVE: 'mvd_active',
};
