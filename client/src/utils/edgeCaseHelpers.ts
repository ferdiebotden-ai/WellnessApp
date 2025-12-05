/**
 * Edge Case Helper Functions
 *
 * Utilities for converting EdgeCases data to badge configurations,
 * sorting by priority, and filtering active conditions.
 *
 * @file client/src/utils/edgeCaseHelpers.ts
 * @author Claude Opus 4.5 (Session 46)
 * @created December 5, 2025
 */

import type { EdgeCases, EdgeCaseType, EdgeCaseBadgeConfig } from '../types/edgeCases';
import { EDGE_CASE_CONFIGS } from '../types/edgeCases';

/**
 * Extract active edge case types from EdgeCases object.
 * Filters out inactive conditions and maps illness risk levels.
 *
 * @param edgeCases - Edge case detection results
 * @returns Array of active edge case type identifiers
 */
export function getActiveEdgeCases(edgeCases: EdgeCases): EdgeCaseType[] {
  const active: EdgeCaseType[] = [];

  // Check alcohol detection
  if (edgeCases.alcoholDetected) {
    active.push('alcohol');
  }

  // Check illness risk levels (mutually exclusive)
  switch (edgeCases.illnessRisk) {
    case 'high':
      active.push('illness_high');
      break;
    case 'medium':
      active.push('illness_medium');
      break;
    case 'low':
      active.push('illness_low');
      break;
    // 'none' adds nothing
  }

  // Check menstrual phase adjustment
  if (edgeCases.menstrualPhaseAdjustment) {
    active.push('menstrual');
  }

  // Note: travelDetected skipped (not implemented in backend)

  return active;
}

/**
 * Get priority value for an edge case type.
 * Higher priority = more urgent/important to display first.
 *
 * @param type - Edge case type identifier
 * @returns Priority value (1-5)
 */
export function getEdgeCasePriority(type: EdgeCaseType): number {
  return EDGE_CASE_CONFIGS[type].priority;
}

/**
 * Sort edge case types by priority (highest first).
 *
 * @param types - Array of edge case types
 * @returns Sorted array (highest priority first)
 */
export function sortEdgeCasesByPriority(types: EdgeCaseType[]): EdgeCaseType[] {
  return [...types].sort((a, b) => getEdgeCasePriority(b) - getEdgeCasePriority(a));
}

/**
 * Get badge configurations for active edge cases, sorted by priority.
 *
 * @param edgeCases - Edge case detection results
 * @param maxBadges - Maximum badges to return (default: 3)
 * @returns Array of badge configurations
 */
export function getEdgeCaseBadgeConfigs(
  edgeCases: EdgeCases,
  maxBadges = 3
): EdgeCaseBadgeConfig[] {
  const activeTypes = getActiveEdgeCases(edgeCases);
  const sortedTypes = sortEdgeCasesByPriority(activeTypes);
  const limitedTypes = sortedTypes.slice(0, maxBadges);

  return limitedTypes.map((type) => EDGE_CASE_CONFIGS[type]);
}

/**
 * Check if any edge cases are active.
 *
 * @param edgeCases - Edge case detection results
 * @returns True if at least one edge case is active
 */
export function hasActiveEdgeCases(edgeCases: EdgeCases): boolean {
  return (
    edgeCases.alcoholDetected ||
    edgeCases.illnessRisk !== 'none' ||
    edgeCases.menstrualPhaseAdjustment
    // Note: travelDetected excluded (not implemented)
  );
}

/**
 * Get the highest priority active edge case.
 *
 * @param edgeCases - Edge case detection results
 * @returns Highest priority badge config, or null if none active
 */
export function getHighestPriorityEdgeCase(
  edgeCases: EdgeCases
): EdgeCaseBadgeConfig | null {
  const configs = getEdgeCaseBadgeConfigs(edgeCases, 1);
  return configs[0] || null;
}
