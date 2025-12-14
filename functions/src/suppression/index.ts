/**
 * Suppression Engine Module
 *
 * Provides nudge suppression capabilities based on configurable rules.
 * Prevents notification fatigue while allowing critical nudges through.
 *
 * Usage:
 *   import { evaluateSuppression, buildSuppressionContext } from './suppression';
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 3
 */

// Types
export type {
  NudgePriority,
  SuppressionCheckResult,
  SuppressionContext,
  SuppressionRule,
  SuppressionResult,
} from './types';

// Constants
export { SUPPRESSION_CONFIG, RULE_IDS } from './types';

// Rules
export { SUPPRESSION_RULES, getRuleById } from './rules';

// Core functionality
export {
  evaluateSuppression,
  buildSuppressionContext,
  getUserLocalHour,
  parseQuietHour,
  logSuppressionResult,
} from './suppressionEngine';
