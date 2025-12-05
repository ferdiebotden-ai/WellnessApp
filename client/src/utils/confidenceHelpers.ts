/**
 * Confidence Factor Helper Functions
 *
 * Utilities for calculating confidence scores, determining colors,
 * and formatting factor values for display.
 *
 * @file client/src/utils/confidenceHelpers.ts
 * @author Claude Opus 4.5 (Session 46)
 * @created December 5, 2025
 */

import { palette } from '../theme/palette';
import type {
  ConfidenceFactors,
  ConfidenceFactorKey,
  ConfidenceLevel,
} from '../types/confidence';
import {
  CONFIDENCE_FACTOR_WEIGHTS,
  CONFIDENCE_FACTOR_LABELS,
  CONFIDENCE_FACTOR_ORDER,
} from '../types/confidence';

/**
 * Get color for a factor score based on thresholds.
 * - >= 0.7: success (green)
 * - >= 0.4: accent (amber)
 * - < 0.4: error (red)
 *
 * @param score - Factor score (0-1)
 * @returns Palette color string
 */
export function getFactorColor(score: number): string {
  if (score >= 0.7) return palette.success;
  if (score >= 0.4) return palette.accent;
  return palette.error;
}

/**
 * Format a factor score as percentage string.
 *
 * @param score - Factor score (0-1)
 * @returns Formatted string like "75%"
 */
export function formatFactorScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * Format a factor weight as percentage string.
 *
 * @param weight - Factor weight (0-1)
 * @returns Formatted string like "25%"
 */
export function formatFactorWeight(weight: number): string {
  return `${Math.round(weight * 100)}%`;
}

/**
 * Calculate overall confidence from individual factors.
 * Uses weighted sum matching backend calculation.
 *
 * @param factors - Individual factor scores
 * @returns Overall confidence (0-1)
 */
export function calculateOverallConfidence(factors: ConfidenceFactors): number {
  let overall = 0;

  for (const key of CONFIDENCE_FACTOR_ORDER) {
    overall += factors[key] * CONFIDENCE_FACTOR_WEIGHTS[key];
  }

  return Math.min(1, Math.max(0, overall));
}

/**
 * Map overall confidence score to display level.
 * - >= 0.7: High
 * - >= 0.4: Medium
 * - < 0.4: Low
 *
 * @param score - Overall confidence (0-1)
 * @returns Confidence level for UI display
 */
export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.7) return 'High';
  if (score >= 0.4) return 'Medium';
  return 'Low';
}

/**
 * Get color for overall confidence level.
 *
 * @param level - Confidence level
 * @returns Palette color string
 */
export function getConfidenceLevelColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'High':
      return palette.success;
    case 'Medium':
      return palette.accent;
    case 'Low':
      return palette.textMuted;
  }
}

/**
 * Get the dominant (highest-weighted contribution) factor.
 *
 * @param factors - Individual factor scores
 * @returns Key of the dominant factor
 */
export function getDominantFactor(factors: ConfidenceFactors): ConfidenceFactorKey {
  let maxKey: ConfidenceFactorKey = 'protocol_fit';
  let maxContribution = 0;

  for (const key of CONFIDENCE_FACTOR_ORDER) {
    const contribution = factors[key] * CONFIDENCE_FACTOR_WEIGHTS[key];
    if (contribution > maxContribution) {
      maxContribution = contribution;
      maxKey = key;
    }
  }

  return maxKey;
}

/**
 * Get the weakest (lowest score) factor.
 *
 * @param factors - Individual factor scores
 * @returns Key of the weakest factor
 */
export function getWeakestFactor(factors: ConfidenceFactors): ConfidenceFactorKey {
  let minKey: ConfidenceFactorKey = 'protocol_fit';
  let minScore = 1;

  for (const key of CONFIDENCE_FACTOR_ORDER) {
    if (factors[key] < minScore) {
      minScore = factors[key];
      minKey = key;
    }
  }

  return minKey;
}

/**
 * Get label for a confidence factor.
 *
 * @param key - Factor key
 * @returns Human-readable label
 */
export function getFactorLabel(key: ConfidenceFactorKey): string {
  return CONFIDENCE_FACTOR_LABELS[key];
}

/**
 * Get ordered array of factor entries for rendering.
 *
 * @param factors - Individual factor scores
 * @returns Array of [key, score, weight, label] tuples
 */
export function getOrderedFactorEntries(
  factors: ConfidenceFactors
): Array<{
  key: ConfidenceFactorKey;
  score: number;
  weight: number;
  label: string;
}> {
  return CONFIDENCE_FACTOR_ORDER.map((key) => ({
    key,
    score: factors[key],
    weight: CONFIDENCE_FACTOR_WEIGHTS[key],
    label: CONFIDENCE_FACTOR_LABELS[key],
  }));
}
