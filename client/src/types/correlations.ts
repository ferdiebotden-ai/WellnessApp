/**
 * Correlation Types (Client-side)
 *
 * Types for displaying protocol-outcome correlations in the Insights Dashboard.
 * Matches API response from GET /api/users/me/correlations
 */

/**
 * Outcome metrics that can be correlated with protocol adherence
 */
export type OutcomeMetric = 'sleep_hours' | 'hrv_score' | 'recovery_score' | 'resting_hr';

/**
 * Single protocol-outcome correlation
 */
export interface Correlation {
  /** Protocol identifier */
  protocol: string;
  /** Human-readable protocol name */
  protocol_name: string;
  /** Outcome metric being correlated */
  outcome: OutcomeMetric;
  /** Human-readable outcome name */
  outcome_name: string;
  /** Pearson correlation coefficient (-1 to 1), rounded to 2 decimals */
  r: number;
  /** Two-tailed p-value for statistical significance, rounded to 3 decimals */
  p_value: number;
  /** Whether correlation is statistically significant (p < 0.05) */
  is_significant: boolean;
  /** Number of data points used in calculation */
  sample_size: number;
  /** Correlation direction */
  direction: 'positive' | 'negative' | 'neutral';
  /** Human-readable interpretation */
  interpretation: string;
}

/**
 * API response from GET /api/users/me/correlations
 */
export interface CorrelationsResponse {
  /** Top correlations (max 5), sorted by significance */
  correlations: Correlation[];
  /** Number of days with tracked data */
  days_tracked: number;
  /** Minimum days required for correlation analysis (14) */
  min_days_required: number;
}
