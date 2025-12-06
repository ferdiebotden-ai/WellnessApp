/**
 * Crisis Detection Rules
 *
 * Defines crisis keywords with severity levels and contextual exclusions,
 * plus mental health resources to surface when crisis is detected.
 */
import type { CrisisKeyword, CrisisResource, CrisisSeverity } from './types';
/**
 * Crisis keywords organized by severity level.
 * Each keyword has optional exclusion patterns to prevent false positives.
 */
export declare const CRISIS_KEYWORDS: CrisisKeyword[];
/**
 * Mental health crisis resources, ordered by priority.
 * Resources are filtered by severity level when displayed.
 */
export declare const CRISIS_RESOURCES: CrisisResource[];
/**
 * Get crisis resources appropriate for the given severity level.
 * Resources are sorted by priority (lower = shown first).
 *
 * @param severity - The severity level to filter resources by
 * @param limit - Maximum number of resources to return (optional)
 * @returns Array of CrisisResource objects
 */
export declare function getResourcesForSeverity(severity: CrisisSeverity, limit?: number): CrisisResource[];
/**
 * Determine the highest severity from an array of severity levels.
 *
 * @param severities - Array of CrisisSeverity values
 * @returns The highest severity, or null if array is empty
 */
export declare function getHighestSeverity(severities: CrisisSeverity[]): CrisisSeverity | null;
/**
 * Get all unique severities from an array of keywords.
 *
 * @param keywords - Array of CrisisKeyword objects
 * @returns Array of unique CrisisSeverity values
 */
export declare function getUniqueSeverities(keywords: CrisisKeyword[]): CrisisSeverity[];
