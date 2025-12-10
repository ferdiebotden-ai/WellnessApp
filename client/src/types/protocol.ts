/**
 * Protocol Types
 *
 * Types for protocol data, enrichment, and personalization.
 *
 * Session 59: Protocol Data Enrichment & Personalization
 */

import type { ConfidenceFactors, ConfidenceLevel } from './confidence';

// =============================================================================
// CORE PROTOCOL TYPES
// =============================================================================

export interface ProtocolSummary {
  id: string;
  name: string;
  description?: string | string[];
}

export type ProtocolCategory =
  | 'Foundation'
  | 'Performance'
  | 'Recovery'
  | 'Optimization'
  | 'Meta';

// =============================================================================
// ENRICHED PROTOCOL DATA (from Master Library seeding)
// =============================================================================

/**
 * Parameter range with min/optimal/max values
 */
export interface ParameterRange {
  min: number;
  optimal: number;
  max: number;
  unit: string;
}

/**
 * Study source citation with metadata
 */
export interface StudySource {
  author: string;
  year: number;
  title?: string;
  doi?: string;
  journal?: string;
}

/**
 * Expected outcome metric with baseline and target
 */
export interface SuccessMetric {
  metric: string;
  baseline: string;
  target: string;
  timeline: string;
}

/**
 * Implementation method option for protocols with multiple ways to achieve the same goal.
 * Example: Morning Light can be outdoor sunlight, 10k lux lamp, or light bar.
 * Session 63: Protocol Implementation Flexibility
 */
export interface ImplementationMethod {
  /** Unique identifier for this method */
  id: string;
  /** Display name (e.g., "Outdoor Sunlight") */
  name: string;
  /** Description with instructions */
  description: string;
  /** Optional Ionicons icon name */
  icon?: string;
}

/**
 * Full protocol detail with enrichment data
 */
export interface ProtocolDetail extends ProtocolSummary {
  /** Array of citation strings (e.g., "Huberman Lab, 2023") */
  citations: string[];

  /** Protocol category for color coding */
  category?: ProtocolCategory;

  /** Tier required to access this protocol */
  tier_required?: string;

  /** Benefits description */
  benefits?: string;

  /** Contraindications/constraints */
  constraints?: string;

  // --- Enriched fields from Session 59 ---

  /** Scientific explanation for "Why This Works" panel */
  mechanism_description?: string;

  /** Typical duration in minutes for one session */
  duration_minutes?: number;

  /** Recommended frequency in days per week (1-7) */
  frequency_per_week?: number;

  /** Min/optimal/max ranges for protocol parameters */
  parameter_ranges?: Record<string, ParameterRange>;

  /** Decision tree for context-aware nudge generation */
  implementation_rules?: Record<string, string>;

  /** Expected outcomes with baselines, targets, and timelines */
  success_metrics?: SuccessMetric[];

  /** Detailed study citations with author, year, DOI */
  study_sources?: StudySource[];

  /** Alternative implementation methods (Session 63) */
  implementation_methods?: ImplementationMethod[];
}

// =============================================================================
// USER-SPECIFIC PROTOCOL DATA
// =============================================================================

/**
 * User's relationship with a specific protocol
 */
export interface UserProtocolData {
  /** When the user last completed this protocol */
  last_completed_at: string | null;

  /** Days completed in the last 7 days (0-7) */
  adherence_7d: number;

  /** Average difficulty rating (1-5), null if never rated */
  difficulty_avg: number | null;

  /** Total number of times completed */
  total_completions: number;

  /** AI-generated insight from memory layer */
  memory_insight: string | null;
}

// =============================================================================
// PERSONALIZED PROTOCOL RESPONSE
// =============================================================================

/**
 * Confidence result from 5-factor scoring
 */
export interface ConfidenceResult {
  /** Overall confidence level for display */
  level: Lowercase<ConfidenceLevel>;

  /** Overall confidence score (0-1) */
  overall: number;

  /** Individual factor scores */
  factors: ConfidenceFactors;

  /** Human-readable explanation */
  reasoning: string;
}

/**
 * Full personalized protocol response from API
 */
export interface PersonalizedProtocolResponse {
  /** Enriched protocol data */
  protocol: ProtocolDetail;

  /** User-specific data for this protocol */
  user_data: UserProtocolData;

  /** Calculated confidence from 5-factor system */
  confidence: ConfidenceResult;
}

// =============================================================================
// DEFAULTS
// =============================================================================

export const DEFAULT_USER_PROTOCOL_DATA: UserProtocolData = {
  last_completed_at: null,
  adherence_7d: 0,
  difficulty_avg: null,
  total_completions: 0,
  memory_insight: null,
};

export const DEFAULT_CONFIDENCE_RESULT: ConfidenceResult = {
  level: 'medium',
  overall: 0.65,
  factors: {
    protocol_fit: 0.7,
    memory_support: 0.5,
    timing_fit: 0.7,
    conflict_risk: 0.8,
    evidence_strength: 0.85,
  },
  reasoning: 'Default confidence. Sign in to see personalized recommendations.',
};
