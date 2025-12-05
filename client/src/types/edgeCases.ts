/**
 * Edge Case Types for Recovery Score Badges
 *
 * Defines the edge case detection system from the recovery score engine.
 * These conditions surface important health signals to users via badges.
 *
 * @file client/src/types/edgeCases.ts
 * @author Claude Opus 4.5 (Session 46)
 * @created December 5, 2025
 */

import { palette } from '../theme/palette';

// =============================================================================
// CORE TYPES (Mirror backend: functions/src/types/recovery.types.ts)
// =============================================================================

/**
 * Illness risk level based on biometric signals.
 * - none: No elevated markers
 * - low: 1 signal detected
 * - medium: 2 signals detected
 * - high: 3+ signals detected (prioritize rest)
 */
export type IllnessRisk = 'none' | 'low' | 'medium' | 'high';

/**
 * Edge case detection results from recovery score calculation.
 * Mirrors backend EdgeCases interface for type safety.
 */
export interface EdgeCases {
  /** High RHR + Low HRV + Low REM pattern */
  alcoholDetected: boolean;
  /** Elevated temp + respiratory rate + RHR + HRV drop */
  illnessRisk: IllnessRisk;
  /** Timezone/location change (not yet implemented) */
  travelDetected: boolean;
  /** Luteal phase temperature adjustment active */
  menstrualPhaseAdjustment: boolean;
}

// =============================================================================
// BADGE CONFIGURATION
// =============================================================================

/**
 * Edge case badge type identifiers.
 * Used for styling and prioritization.
 */
export type EdgeCaseType =
  | 'alcohol'
  | 'illness_low'
  | 'illness_medium'
  | 'illness_high'
  | 'menstrual';

/**
 * Badge configuration for rendering.
 */
export interface EdgeCaseBadgeConfig {
  type: EdgeCaseType;
  /** Short label for badge (uppercase) */
  label: string;
  /** Badge color from palette */
  color: string;
  /** Longer description for accessibility/tooltips */
  description: string;
  /** Priority for sorting (higher = more urgent) */
  priority: number;
}

/**
 * Badge configurations for all edge case types.
 * Ordered by severity/urgency for proper visual hierarchy.
 */
export const EDGE_CASE_CONFIGS: Record<EdgeCaseType, EdgeCaseBadgeConfig> = {
  illness_high: {
    type: 'illness_high',
    label: 'REST',
    color: palette.error,
    description: 'Strong illness indicators — prioritize rest today',
    priority: 5,
  },
  alcohol: {
    type: 'alcohol',
    label: 'ALCOHOL',
    color: palette.error,
    description: 'Elevated RHR + Low HRV + Low REM pattern detected',
    priority: 4,
  },
  illness_medium: {
    type: 'illness_medium',
    label: 'ILLNESS?',
    color: palette.accent,
    description: 'Multiple markers suggest possible illness onset',
    priority: 3,
  },
  illness_low: {
    type: 'illness_low',
    label: 'MONITOR',
    color: palette.accent,
    description: 'Minor biometric variations — monitor how you feel',
    priority: 2,
  },
  menstrual: {
    type: 'menstrual',
    label: 'LUTEAL',
    color: palette.primary,
    description: 'Temperature adjusted for luteal phase',
    priority: 1,
  },
};

// =============================================================================
// DEFAULTS
// =============================================================================

/**
 * Default edge cases (all clear).
 */
export const DEFAULT_EDGE_CASES: EdgeCases = {
  alcoholDetected: false,
  illnessRisk: 'none',
  travelDetected: false,
  menstrualPhaseAdjustment: false,
};
