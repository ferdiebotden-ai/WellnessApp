/**
 * Statistical Correlation Utilities
 *
 * Provides Pearson correlation calculation with p-value computation
 * using pure TypeScript (no external statistics libraries).
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 5 & 9
 */
import { OutcomeMetric } from './types';
/**
 * Result of Pearson correlation calculation
 */
export interface PearsonResult {
    /** Pearson correlation coefficient (-1 to 1) */
    r: number;
    /** Two-tailed p-value */
    p_value: number;
    /** Sample size */
    n: number;
}
/**
 * Calculates the Pearson correlation coefficient and p-value for two arrays.
 *
 * @param x - First array of numeric values
 * @param y - Second array of numeric values
 * @returns PearsonResult with r, p_value, and sample size n
 * @throws Error if arrays have different lengths or fewer than 3 data points
 */
export declare function pearsonCorrelation(x: number[], y: number[]): PearsonResult;
/**
 * Interprets a correlation coefficient with context about the outcome metric.
 *
 * @param r - Pearson correlation coefficient
 * @param outcome - The outcome metric being measured
 * @returns Object with direction and human-readable interpretation
 */
export declare function interpretCorrelation(r: number, outcome: OutcomeMetric): {
    direction: 'positive' | 'negative' | 'neutral';
    interpretation: string;
};
/**
 * Calculates correlation strength category for display.
 */
export declare function getCorrelationStrength(r: number): 'none' | 'weak' | 'moderate' | 'strong' | 'very_strong';
