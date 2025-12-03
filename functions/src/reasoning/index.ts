/**
 * Reasoning Module
 *
 * Provides AI reasoning capabilities including confidence scoring
 * for nudge recommendations.
 *
 * Reference: APEX_OS_PRD_FINAL_v6.md - Reasoning Layer
 */

// Types
export {
  ConfidenceScore,
  ConfidenceFactors,
  NudgeContext,
  EvidenceLevel,
  PrimaryGoal,
  TimeOfDay,
  CONFIDENCE_WEIGHTS,
  EVIDENCE_SCORES,
  CONFIDENCE_SUPPRESSION_THRESHOLD,
  GOAL_MODULE_MAPPING,
  GOAL_KEYWORDS,
  CATEGORY_TIME_MAPPING,
} from './types';

// Core functionality
export { calculateConfidence, getTimeOfDay } from './confidenceScorer';
