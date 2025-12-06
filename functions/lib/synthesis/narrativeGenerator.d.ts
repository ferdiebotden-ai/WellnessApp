/**
 * Weekly Synthesis Narrative Generator
 *
 * Generates AI-powered weekly narratives summarizing user progress.
 * Uses Gemini 2.5 Flash for reasoning-enhanced text generation.
 *
 * Output: ~200 word narrative with 5 sections:
 *   1. WIN OF THE WEEK - What improved, with specific numbers
 *   2. AREA TO WATCH - What declined or needs attention
 *   3. PATTERN INSIGHT - A correlation from their data
 *   4. TRAJECTORY PREDICTION - If trends continue, what happens
 *   5. EXPERIMENT - One achievable action for next week
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 5
 */
import { type ScoredMemory } from '../memory';
import { WeeklyMetrics, WeeklySynthesisResult, UserSynthesisContext } from './types';
/**
 * Generate a weekly narrative synthesis for a user
 *
 * @param user - User context (name, goal, timezone)
 * @param metrics - Aggregated weekly metrics
 * @param memories - Optional array of user memories (will fetch if not provided)
 * @returns WeeklySynthesisResult with narrative and metadata
 */
export declare function generateWeeklyNarrative(user: UserSynthesisContext, metrics: WeeklyMetrics, memories?: ScoredMemory[]): Promise<WeeklySynthesisResult>;
/**
 * Validate a narrative meets quality requirements
 */
export declare function validateNarrative(result: WeeklySynthesisResult): {
    valid: boolean;
    issues: string[];
};
