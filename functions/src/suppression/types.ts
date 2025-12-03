/**
 * Suppression Engine Types
 *
 * Defines interfaces and constants for nudge suppression rules.
 * Rules are evaluated in priority order; first suppression wins.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 3
 */

/**
 * Nudge priority levels that determine override behavior
 */
export type NudgePriority = 'CRITICAL' | 'ADAPTIVE' | 'STANDARD';

/**
 * Result of a single rule check
 */
export interface SuppressionCheckResult {
  /** Whether this rule wants to suppress the nudge */
  suppress: boolean;
  /** Human-readable reason for suppression */
  reason?: string;
}

/**
 * Context needed for suppression rule evaluation
 */
export interface SuppressionContext {
  /** Number of nudges already delivered today for this user */
  nudgesDeliveredToday: number;
  /** User's current local hour (0-23) */
  userLocalHour: number;
  /** User profile with quiet hours configuration */
  user: {
    quiet_hours_start: number; // Hour (0-23), e.g., 22 for 10pm
    quiet_hours_end: number; // Hour (0-23), e.g., 6 for 6am
    timezone?: string; // IANA timezone
  };
  /** Timestamp of last nudge delivered to user */
  lastNudgeDeliveredAt: Date | null;
  /** Number of nudges dismissed today */
  dismissalsToday: number;
  /** Total meeting hours scheduled today */
  meetingHoursToday: number;
  /** Priority of the current nudge being evaluated */
  nudgePriority: NudgePriority;
  /** Confidence score from the reasoning module (0-1) */
  confidenceScore: number;
  /** Recovery score from wearable data (0-100) */
  recoveryScore: number;
  /** Whether this nudge is a morning anchor protocol (exempt from low_recovery) */
  isMorningAnchor: boolean;
  /** User's current streak (consecutive days of protocol completion) */
  currentStreak: number;
  /** Whether MVD (Minimum Viable Day) mode is currently active */
  mvdActive: boolean;
  /** Whether this nudge is approved for MVD mode */
  isMvdApprovedNudge: boolean;
}

/**
 * Definition of a suppression rule
 */
export interface SuppressionRule {
  /** Unique identifier for the rule */
  id: string;
  /** Human-readable name */
  name: string;
  /** Evaluation priority (lower = checked first) */
  priority: number;
  /** Whether this rule can be overridden by higher-priority nudges */
  canBeOverridden: boolean;
  /** Which nudge priorities can override this rule */
  overrideBy: NudgePriority[];
  /** The check function that evaluates the rule */
  check: (context: SuppressionContext) => SuppressionCheckResult;
}

/**
 * Final result of suppression evaluation
 */
export interface SuppressionResult {
  /** Whether the nudge should be delivered */
  shouldDeliver: boolean;
  /** ID of the rule that suppressed (if suppressed) */
  suppressedBy?: string;
  /** Human-readable reason for suppression */
  reason?: string;
  /** List of all rules that were checked */
  rulesChecked: string[];
  /** Whether an override was applied */
  wasOverridden?: boolean;
  /** Which rule was overridden (if any) */
  overriddenRule?: string;
}

/**
 * Constants for suppression engine configuration
 */
export const SUPPRESSION_CONFIG = {
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
} as const;

/**
 * Rule IDs for reference and audit logging
 */
export const RULE_IDS = {
  DAILY_CAP: 'daily_cap',
  QUIET_HOURS: 'quiet_hours',
  COOLDOWN: 'cooldown',
  FATIGUE_DETECTION: 'fatigue_detection',
  MEETING_AWARENESS: 'meeting_awareness',
  LOW_RECOVERY: 'low_recovery',
  STREAK_RESPECT: 'streak_respect',
  LOW_CONFIDENCE: 'low_confidence',
  MVD_ACTIVE: 'mvd_active',
} as const;
