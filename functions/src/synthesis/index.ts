/**
 * Weekly Synthesis Module
 *
 * Provides weekly metrics aggregation and correlation analysis for user progress tracking.
 * Used to generate Sunday Briefs - the "magic moment" that drives user retention.
 *
 * Usage:
 *   import { aggregateWeeklyMetrics, pearsonCorrelation } from './synthesis';
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 5
 */

// Types
export type {
  WeeklyMetrics,
  ProtocolBreakdown,
  ProtocolCorrelation,
  WeekOverWeekComparison,
  OutcomeMetric,
  ProtocolLogRow,
  WearableDataRow,
  ProtocolNameRow,
  EnrolledProtocolRow,
  // New types for narrative generation
  WeeklySynthesisResult,
  UserSynthesisContext,
  NarrativeSection,
  SynthesisNotification,
} from './types';

// Constants
export {
  SYNTHESIS_CONFIG,
  OUTCOME_EXPECTED_DIRECTION,
  OUTCOME_METRIC_NAMES,
  NARRATIVE_SECTIONS,
} from './types';

// Correlation utilities (reusable for Component 9: Outcome Correlation)
export {
  pearsonCorrelation,
  interpretCorrelation,
  getCorrelationStrength,
  type PearsonResult,
} from './correlations';

// Core aggregation
export {
  aggregateWeeklyMetrics,
  getWeekMonday,
  getWeekSunday,
} from './weeklySynthesis';

// Narrative generation
export {
  generateWeeklyNarrative,
  validateNarrative,
} from './narrativeGenerator';
