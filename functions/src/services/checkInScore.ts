/**
 * Check-in Score Calculator for Lite Mode
 *
 * Calculates a simplified wellness score from manual user inputs.
 * Used for users without wearables who complete a morning check-in.
 *
 * Formula:
 * Score = (SleepQuality × 0.40) + (SleepDuration × 0.35) + (Energy × 0.25)
 *
 * Key differences from wearable Recovery Score:
 * - Only 3 components (vs 5 biometric + temperature penalty)
 * - Max confidence = 0.60 (vs 0.90 for wearables)
 * - No edge case detection (alcohol, illness, travel)
 * - Simpler recommendations (zone-based only)
 *
 * @file functions/src/services/checkInScore.ts
 * @author Claude Opus 4.5 (Session 49)
 * @created December 5, 2025
 */

import {
  ManualCheckInInput,
  CheckInResult,
  CheckInComponents,
  CheckInRecommendation,
  QualityRating,
  SleepHoursOption,
  SLEEP_HOURS_MAP,
  SLEEP_QUALITY_LABELS,
  ENERGY_LEVEL_LABELS,
  CHECK_IN_WEIGHTS,
  MAX_CHECK_IN_CONFIDENCE,
  SKIPPED_CHECK_IN_CONFIDENCE,
  TARGET_SLEEP_HOURS,
  DEFAULT_CHECK_IN,
} from '../types/checkIn.types';
import { RecoveryZone, determineZone } from '../types/recovery.types';

// =============================================================================
// COMPONENT CALCULATORS
// =============================================================================

/**
 * Convert quality rating (1-5) to score (0-100).
 * Linear mapping: 1→20, 2→40, 3→60, 4→80, 5→100
 */
export function ratingToScore(rating: QualityRating): number {
  return rating * 20;
}

/**
 * Calculate sleep duration score based on hours vs target.
 *
 * Scoring:
 * - At target (7.5h): 100 points
 * - Each hour below: -15 points
 * - Each hour above: -5 points (oversleep is less penalized)
 * - Minimum score: 20
 *
 * @param hours - Actual sleep hours
 * @param target - Target sleep hours (default 7.5)
 */
export function calculateSleepDurationScore(
  hours: number,
  target: number = TARGET_SLEEP_HOURS
): { score: number; vsTarget: string } {
  const diff = hours - target;

  let score: number;
  let vsTarget: string;

  if (Math.abs(diff) < 0.25) {
    // Within 15 minutes of target
    score = 100;
    vsTarget = 'On target';
  } else if (diff < 0) {
    // Under-slept
    score = Math.max(20, 100 + diff * 15); // -15 points per hour under
    const diffHours = Math.abs(diff).toFixed(1);
    vsTarget = `-${diffHours}h from target`;
  } else {
    // Over-slept (less penalized)
    score = Math.max(70, 100 - diff * 5); // -5 points per hour over
    const diffHours = diff.toFixed(1);
    vsTarget = `+${diffHours}h over target`;
  }

  return { score: Math.round(score), vsTarget };
}

/**
 * Build component breakdown for transparency.
 */
export function buildComponents(input: ManualCheckInInput): CheckInComponents {
  const sleepHours = SLEEP_HOURS_MAP[input.sleepHours];
  const { score: durationScore, vsTarget } = calculateSleepDurationScore(sleepHours);

  return {
    sleepQuality: {
      rating: input.sleepQuality,
      label: SLEEP_QUALITY_LABELS[input.sleepQuality],
      score: ratingToScore(input.sleepQuality),
      weight: 0.40,
    },
    sleepDuration: {
      hours: sleepHours,
      option: input.sleepHours,
      score: durationScore,
      vsTarget,
      weight: 0.35,
    },
    energyLevel: {
      rating: input.energyLevel,
      label: ENERGY_LEVEL_LABELS[input.energyLevel],
      score: ratingToScore(input.energyLevel),
      weight: 0.25,
    },
  };
}

// =============================================================================
// RECOMMENDATIONS
// =============================================================================

/**
 * Generate recommendations based on zone.
 */
export function generateRecommendations(
  zone: RecoveryZone,
  components: CheckInComponents
): CheckInRecommendation[] {
  const recommendations: CheckInRecommendation[] = [];

  if (zone === 'green') {
    recommendations.push({
      type: 'training',
      headline: 'Green light for activity',
      body: 'Your check-in suggests good readiness. This is a great day for challenging workouts or demanding tasks.',
      protocols: ['high_intensity_training', 'cold_exposure'],
    });
  } else if (zone === 'yellow') {
    recommendations.push({
      type: 'recovery',
      headline: 'Moderate readiness',
      body: 'Your check-in suggests moderate readiness. Consider lighter activity and prioritize recovery protocols.',
      protocols: ['light_movement', 'breathwork', 'hydration'],
    });

    // Add specific advice based on low components
    if (components.sleepQuality.score < 60) {
      recommendations.push({
        type: 'rest',
        headline: 'Sleep quality was low',
        body: 'Consider a 20-minute nap today if possible, and prioritize sleep hygiene tonight.',
        protocols: ['nap_protocol', 'sleep_hygiene'],
      });
    }

    if (components.energyLevel.score < 60) {
      recommendations.push({
        type: 'health',
        headline: 'Energy needs support',
        body: 'Start with natural light exposure and consider a walk outside to boost alertness.',
        protocols: ['morning_sunlight', 'light_walk'],
      });
    }
  } else {
    // Red zone
    recommendations.push({
      type: 'rest',
      headline: 'Prioritize recovery today',
      body: 'Your check-in suggests you need rest. Skip intense workouts and focus on recovery.',
      protocols: ['rest_day', 'gentle_stretching', 'hydration'],
    });

    if (components.sleepDuration.score < 60) {
      recommendations.push({
        type: 'rest',
        headline: 'Sleep deficit detected',
        body: 'You may be under-slept. Try to go to bed 30-60 minutes earlier tonight.',
        protocols: ['early_bedtime', 'wind_down_routine'],
      });
    }
  }

  return recommendations;
}

/**
 * Generate human-readable reasoning string.
 */
export function generateReasoning(
  score: number,
  zone: RecoveryZone,
  components: CheckInComponents,
  skipped: boolean
): string {
  if (skipped) {
    return 'Check-in was skipped. Using default values for a baseline score. Complete tomorrow\'s check-in for personalized guidance.';
  }

  const parts: string[] = [];

  // Lead with the headline
  if (zone === 'green') {
    parts.push('Good readiness based on your morning check-in.');
  } else if (zone === 'yellow') {
    parts.push('Moderate readiness today.');
  } else {
    parts.push('Low readiness detected — prioritize recovery.');
  }

  // Add specific component insights
  if (components.sleepQuality.score >= 80) {
    parts.push(`Sleep quality was ${components.sleepQuality.label.toLowerCase()}.`);
  } else if (components.sleepQuality.score <= 40) {
    parts.push(`Sleep quality was ${components.sleepQuality.label.toLowerCase()} — this impacts recovery.`);
  }

  if (components.sleepDuration.score < 70) {
    parts.push(`Sleep duration: ${components.sleepDuration.vsTarget}.`);
  }

  if (components.energyLevel.score >= 80) {
    parts.push(`Starting the day with ${components.energyLevel.label.toLowerCase()} energy.`);
  } else if (components.energyLevel.score <= 40) {
    parts.push(`Energy is ${components.energyLevel.label.toLowerCase()} — pace yourself today.`);
  }

  return parts.join(' ');
}

// =============================================================================
// MAIN CALCULATOR
// =============================================================================

/**
 * Calculate Check-in Score from manual inputs.
 *
 * @param input - User's check-in answers
 * @param skipped - Whether the user skipped (uses defaults)
 * @returns Full CheckInResult with score, breakdown, and recommendations
 */
export function calculateCheckInScore(
  input: ManualCheckInInput = DEFAULT_CHECK_IN,
  skipped: boolean = false
): CheckInResult {
  // Use defaults if skipped
  const effectiveInput = skipped ? DEFAULT_CHECK_IN : input;

  // Build component breakdown
  const components = buildComponents(effectiveInput);

  // Calculate weighted score
  const rawScore =
    components.sleepQuality.score * CHECK_IN_WEIGHTS.sleepQuality +
    components.sleepDuration.score * CHECK_IN_WEIGHTS.sleepDuration +
    components.energyLevel.score * CHECK_IN_WEIGHTS.energyLevel;

  // Round to whole number
  const score = Math.round(rawScore);

  // Determine zone
  const zone = determineZone(score);

  // Calculate confidence (capped for manual inputs)
  const confidence = skipped ? SKIPPED_CHECK_IN_CONFIDENCE : MAX_CHECK_IN_CONFIDENCE;

  // Generate recommendations
  const recommendations = generateRecommendations(zone, components);

  // Generate reasoning
  const reasoning = generateReasoning(score, zone, components, skipped);

  return {
    score,
    zone,
    confidence,
    components,
    reasoning,
    recommendations,
    isLiteMode: true,
    skipped,
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate check-in input.
 * @returns Error message if invalid, null if valid
 */
export function validateCheckInInput(input: unknown): string | null {
  if (!input || typeof input !== 'object') {
    return 'Invalid input: must be an object';
  }

  const { sleepQuality, sleepHours, energyLevel } = input as Record<string, unknown>;

  // Validate sleepQuality
  if (typeof sleepQuality !== 'number' || sleepQuality < 1 || sleepQuality > 5) {
    return 'sleepQuality must be a number between 1 and 5';
  }

  // Validate energyLevel
  if (typeof energyLevel !== 'number' || energyLevel < 1 || energyLevel > 5) {
    return 'energyLevel must be a number between 1 and 5';
  }

  // Validate sleepHours
  const validSleepHours: SleepHoursOption[] = ['<5', '5-6', '6-7', '7-8', '8+'];
  if (!validSleepHours.includes(sleepHours as SleepHoursOption)) {
    return 'sleepHours must be one of: <5, 5-6, 6-7, 7-8, 8+';
  }

  return null;
}
