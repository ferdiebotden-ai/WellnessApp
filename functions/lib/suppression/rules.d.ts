/**
 * Suppression Rules
 *
 * All 9 rules for the suppression engine, evaluated in priority order:
 * 1. daily_cap - Max 5 nudges per day
 * 2. quiet_hours - No nudges during sleep hours
 * 3. cooldown - 2-hour minimum between nudges
 * 4. fatigue_detection - Pause after 3+ dismissals
 * 5. meeting_awareness - Suppress during heavy meeting days
 * 6. low_recovery - Morning-only mode when recovery <30%
 * 7. streak_respect - Reduce frequency after 7-day streak
 * 8. low_confidence - Filter nudges with confidence <0.4
 * 9. mvd_active - Only MVD nudges when MVD mode active
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 3
 */
import { SuppressionRule } from './types';
/**
 * Simple hash function for deterministic randomness
 * Used for streak_respect to ensure consistent behavior within a day
 */
declare function simpleHash(str: string): number;
/**
 * All suppression rules, sorted by priority (lower = checked first)
 */
export declare const SUPPRESSION_RULES: SuppressionRule[];
/**
 * Export simpleHash for testing deterministic streak behavior
 */
export { simpleHash };
/**
 * Get a rule by its ID
 * @param id - Rule ID to look up
 * @returns The rule if found, undefined otherwise
 */
export declare function getRuleById(id: string): SuppressionRule | undefined;
