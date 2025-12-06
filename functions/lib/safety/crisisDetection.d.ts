/**
 * Crisis Detection Engine
 *
 * Detects crisis indicators in user input with contextual awareness
 * and surfaces appropriate mental health resources.
 */
import type { CrisisDetectionResult, CrisisKeyword, CrisisSeverity } from './types';
/**
 * Normalize text for consistent matching.
 * Converts to lowercase, normalizes whitespace, and handles apostrophes.
 *
 * @param text - Raw input text
 * @returns Normalized text for matching
 */
export declare function normalizeText(text: string): string;
/**
 * Check if any exclusion pattern matches the text.
 * An exclusion match means the keyword is being used in a benign context.
 *
 * @param text - Normalized text to check
 * @param exclusions - Array of exclusion patterns
 * @returns True if any exclusion matches
 */
export declare function hasExclusionMatch(text: string, exclusions: string[]): boolean;
/**
 * Find all matching crisis keywords in the text.
 *
 * @param text - Normalized text to scan
 * @returns Array of matched CrisisKeyword objects
 */
export declare function findMatchingKeywords(text: string): CrisisKeyword[];
/**
 * Detect crisis indicators in user input.
 *
 * This function:
 * 1. Normalizes the input text
 * 2. Scans for crisis keywords while respecting exclusions
 * 3. Determines the highest severity level
 * 4. Returns appropriate crisis resources
 *
 * @param text - User input to analyze
 * @returns CrisisDetectionResult with detection status and resources
 */
export declare function detectCrisis(text: string): CrisisDetectionResult;
/**
 * Generate a compassionate crisis response message with resources.
 *
 * @param result - CrisisDetectionResult from detectCrisis
 * @returns Formatted response string with resources
 */
export declare function generateCrisisResponse(result: CrisisDetectionResult): string;
/**
 * Determine if crisis requires immediate intervention.
 * When true, normal AI response should be deferred entirely.
 *
 * @param result - CrisisDetectionResult from detectCrisis
 * @returns True if AI should not provide normal response
 */
export declare function requiresImmediateIntervention(result: CrisisDetectionResult): boolean;
/**
 * Get severity description for audit logging.
 *
 * @param severity - CrisisSeverity or null
 * @returns Human-readable severity description
 */
export declare function getSeverityDescription(severity: CrisisSeverity | null): string;
