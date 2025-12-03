/**
 * Statistical Correlation Utilities
 *
 * Provides Pearson correlation calculation with p-value computation
 * using pure TypeScript (no external statistics libraries).
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 5 & 9
 */

import {
  OutcomeMetric,
  OUTCOME_EXPECTED_DIRECTION,
  OUTCOME_METRIC_NAMES,
} from './types';

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
export function pearsonCorrelation(x: number[], y: number[]): PearsonResult {
  if (x.length !== y.length) {
    throw new Error('Arrays must have the same length');
  }

  const n = x.length;

  if (n < 3) {
    throw new Error('At least 3 data points required for correlation');
  }

  // Calculate means
  const xMean = x.reduce((sum, val) => sum + val, 0) / n;
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;

  // Calculate covariance and standard deviations
  let covariance = 0;
  let xVariance = 0;
  let yVariance = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    covariance += xDiff * yDiff;
    xVariance += xDiff * xDiff;
    yVariance += yDiff * yDiff;
  }

  // Handle case where one variable has no variance
  if (xVariance === 0 || yVariance === 0) {
    return { r: 0, p_value: 1, n };
  }

  // Calculate Pearson r
  const r = covariance / Math.sqrt(xVariance * yVariance);

  // Calculate p-value using t-distribution
  const p_value = calculatePValue(r, n);

  return {
    r: roundTo(r, 4),
    p_value: roundTo(p_value, 6),
    n,
  };
}

/**
 * Calculates the two-tailed p-value for a Pearson correlation coefficient.
 * Uses t-distribution: t = r * sqrt((n-2) / (1-r^2))
 */
function calculatePValue(r: number, n: number): number {
  // Handle edge cases
  if (Math.abs(r) >= 1) {
    return r === 0 ? 1 : 0;
  }

  const df = n - 2; // degrees of freedom
  const t = r * Math.sqrt(df / (1 - r * r));

  // Calculate two-tailed p-value from t-distribution
  const p = 2 * (1 - tDistributionCDF(Math.abs(t), df));

  return Math.max(0, Math.min(1, p));
}

/**
 * Cumulative distribution function for t-distribution.
 * Uses the regularized incomplete beta function.
 */
function tDistributionCDF(t: number, df: number): number {
  // For large df, use normal approximation
  if (df > 100) {
    return normalCDF(t);
  }

  const x = df / (df + t * t);

  // CDF = 1 - 0.5 * I_x(df/2, 0.5) when t >= 0
  // where I_x is the regularized incomplete beta function
  const beta = regularizedIncompleteBeta(x, df / 2, 0.5);

  if (t >= 0) {
    return 1 - 0.5 * beta;
  } else {
    return 0.5 * beta;
  }
}

/**
 * Standard normal CDF approximation for large df.
 * Uses Abramowitz and Stegun approximation.
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Regularized incomplete beta function I_x(a, b).
 * Uses continued fraction expansion for accuracy.
 */
function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x === 0) return 0;
  if (x === 1) return 1;

  // Use symmetry relation for better convergence
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedIncompleteBeta(1 - x, b, a);
  }

  // Calculate using continued fraction (Lentz's algorithm)
  const lnBeta = logBeta(a, b);
  const front = Math.exp(
    Math.log(x) * a + Math.log(1 - x) * b - lnBeta
  ) / a;

  // Continued fraction convergent
  const maxIterations = 200;
  const epsilon = 1e-10;

  let f = 1;
  let c = 1;
  let d = 0;

  for (let m = 0; m <= maxIterations; m++) {
    const m2 = 2 * m;

    // Even term
    let numerator: number;
    if (m === 0) {
      numerator = 1;
    } else {
      numerator = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    }

    d = 1 + numerator * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;

    c = 1 + numerator / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;

    f *= d * c;

    // Odd term
    numerator = -((a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));

    d = 1 + numerator * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;

    c = 1 + numerator / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;

    const delta = d * c;
    f *= delta;

    if (Math.abs(delta - 1) < epsilon) {
      break;
    }
  }

  return front * (f - 1);
}

/**
 * Log of the beta function B(a, b) using Lanczos approximation for gamma.
 */
function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

/**
 * Log of the gamma function using Lanczos approximation.
 */
function logGamma(z: number): number {
  // Lanczos coefficients
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    // Reflection formula
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }

  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * Round a number to specified decimal places.
 */
function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Interprets a correlation coefficient with context about the outcome metric.
 *
 * @param r - Pearson correlation coefficient
 * @param outcome - The outcome metric being measured
 * @returns Object with direction and human-readable interpretation
 */
export function interpretCorrelation(
  r: number,
  outcome: OutcomeMetric
): { direction: 'positive' | 'negative' | 'neutral'; interpretation: string } {
  const absR = Math.abs(r);
  const expectedDirection = OUTCOME_EXPECTED_DIRECTION[outcome];
  const metricName = OUTCOME_METRIC_NAMES[outcome];

  // Determine direction
  let direction: 'positive' | 'negative' | 'neutral';
  if (absR < 0.1) {
    direction = 'neutral';
  } else if (r > 0) {
    direction = 'positive';
  } else {
    direction = 'negative';
  }

  // Determine strength label
  let strength: string;
  if (absR < 0.1) {
    strength = 'No meaningful';
  } else if (absR < 0.3) {
    strength = 'Weak';
  } else if (absR < 0.5) {
    strength = 'Moderate';
  } else if (absR < 0.7) {
    strength = 'Strong';
  } else {
    strength = 'Very strong';
  }

  // Build interpretation
  let interpretation: string;

  if (direction === 'neutral') {
    interpretation = `${strength} correlation with ${metricName}`;
  } else {
    // Determine if the correlation is beneficial based on expected direction
    const isBeneficial =
      (direction === 'positive' && expectedDirection === 'positive') ||
      (direction === 'negative' && expectedDirection === 'negative');

    const trend = isBeneficial ? 'improved' : 'decreased';
    const directionWord = direction === 'positive' ? 'positive' : 'negative';

    interpretation = `${strength} ${directionWord} correlation — ${metricName} ${trend} on protocol days`;
  }

  return { direction, interpretation };
}

/**
 * Calculates correlation strength category for display.
 */
export function getCorrelationStrength(r: number): 'none' | 'weak' | 'moderate' | 'strong' | 'very_strong' {
  const absR = Math.abs(r);
  if (absR < 0.1) return 'none';
  if (absR < 0.3) return 'weak';
  if (absR < 0.5) return 'moderate';
  if (absR < 0.7) return 'strong';
  return 'very_strong';
}
