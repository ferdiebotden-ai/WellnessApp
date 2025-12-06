"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratingToScore = ratingToScore;
exports.calculateSleepDurationScore = calculateSleepDurationScore;
exports.buildComponents = buildComponents;
exports.generateRecommendations = generateRecommendations;
exports.generateReasoning = generateReasoning;
exports.calculateCheckInScore = calculateCheckInScore;
exports.validateCheckInInput = validateCheckInInput;
const checkIn_types_1 = require("../types/checkIn.types");
const recovery_types_1 = require("../types/recovery.types");
// =============================================================================
// COMPONENT CALCULATORS
// =============================================================================
/**
 * Convert quality rating (1-5) to score (0-100).
 * Linear mapping: 1→20, 2→40, 3→60, 4→80, 5→100
 */
function ratingToScore(rating) {
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
function calculateSleepDurationScore(hours, target = checkIn_types_1.TARGET_SLEEP_HOURS) {
    const diff = hours - target;
    let score;
    let vsTarget;
    if (Math.abs(diff) < 0.25) {
        // Within 15 minutes of target
        score = 100;
        vsTarget = 'On target';
    }
    else if (diff < 0) {
        // Under-slept
        score = Math.max(20, 100 + diff * 15); // -15 points per hour under
        const diffHours = Math.abs(diff).toFixed(1);
        vsTarget = `-${diffHours}h from target`;
    }
    else {
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
function buildComponents(input) {
    const sleepHours = checkIn_types_1.SLEEP_HOURS_MAP[input.sleepHours];
    const { score: durationScore, vsTarget } = calculateSleepDurationScore(sleepHours);
    return {
        sleepQuality: {
            rating: input.sleepQuality,
            label: checkIn_types_1.SLEEP_QUALITY_LABELS[input.sleepQuality],
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
            label: checkIn_types_1.ENERGY_LEVEL_LABELS[input.energyLevel],
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
function generateRecommendations(zone, components) {
    const recommendations = [];
    if (zone === 'green') {
        recommendations.push({
            type: 'training',
            headline: 'Green light for activity',
            body: 'Your check-in suggests good readiness. This is a great day for challenging workouts or demanding tasks.',
            protocols: ['high_intensity_training', 'cold_exposure'],
        });
    }
    else if (zone === 'yellow') {
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
    }
    else {
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
function generateReasoning(score, zone, components, skipped) {
    if (skipped) {
        return 'Check-in was skipped. Using default values for a baseline score. Complete tomorrow\'s check-in for personalized guidance.';
    }
    const parts = [];
    // Lead with the headline
    if (zone === 'green') {
        parts.push('Good readiness based on your morning check-in.');
    }
    else if (zone === 'yellow') {
        parts.push('Moderate readiness today.');
    }
    else {
        parts.push('Low readiness detected — prioritize recovery.');
    }
    // Add specific component insights
    if (components.sleepQuality.score >= 80) {
        parts.push(`Sleep quality was ${components.sleepQuality.label.toLowerCase()}.`);
    }
    else if (components.sleepQuality.score <= 40) {
        parts.push(`Sleep quality was ${components.sleepQuality.label.toLowerCase()} — this impacts recovery.`);
    }
    if (components.sleepDuration.score < 70) {
        parts.push(`Sleep duration: ${components.sleepDuration.vsTarget}.`);
    }
    if (components.energyLevel.score >= 80) {
        parts.push(`Starting the day with ${components.energyLevel.label.toLowerCase()} energy.`);
    }
    else if (components.energyLevel.score <= 40) {
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
function calculateCheckInScore(input = checkIn_types_1.DEFAULT_CHECK_IN, skipped = false) {
    // Use defaults if skipped
    const effectiveInput = skipped ? checkIn_types_1.DEFAULT_CHECK_IN : input;
    // Build component breakdown
    const components = buildComponents(effectiveInput);
    // Calculate weighted score
    const rawScore = components.sleepQuality.score * checkIn_types_1.CHECK_IN_WEIGHTS.sleepQuality +
        components.sleepDuration.score * checkIn_types_1.CHECK_IN_WEIGHTS.sleepDuration +
        components.energyLevel.score * checkIn_types_1.CHECK_IN_WEIGHTS.energyLevel;
    // Round to whole number
    const score = Math.round(rawScore);
    // Determine zone
    const zone = (0, recovery_types_1.determineZone)(score);
    // Calculate confidence (capped for manual inputs)
    const confidence = skipped ? checkIn_types_1.SKIPPED_CHECK_IN_CONFIDENCE : checkIn_types_1.MAX_CHECK_IN_CONFIDENCE;
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
function validateCheckInInput(input) {
    if (!input || typeof input !== 'object') {
        return 'Invalid input: must be an object';
    }
    const { sleepQuality, sleepHours, energyLevel } = input;
    // Validate sleepQuality
    if (typeof sleepQuality !== 'number' || sleepQuality < 1 || sleepQuality > 5) {
        return 'sleepQuality must be a number between 1 and 5';
    }
    // Validate energyLevel
    if (typeof energyLevel !== 'number' || energyLevel < 1 || energyLevel > 5) {
        return 'energyLevel must be a number between 1 and 5';
    }
    // Validate sleepHours
    const validSleepHours = ['<5', '5-6', '6-7', '7-8', '8+'];
    if (!validSleepHours.includes(sleepHours)) {
        return 'sleepHours must be one of: <5, 5-6, 6-7, 7-8, 8+';
    }
    return null;
}
