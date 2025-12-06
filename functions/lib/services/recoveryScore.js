"use strict";
/**
 * Recovery Score Service
 *
 * Calculates recovery scores from daily wearable metrics using a weighted
 * algorithm based on HRV, RHR, sleep quality, and other biometric data.
 *
 * Formula (peer-reviewed basis):
 * Recovery = (HRV × 0.40) + (RHR × 0.25) + (SleepQuality × 0.20) +
 *            (SleepDuration × 0.10) + (RespiratoryRate × 0.05) - TempPenalty
 *
 * @file functions/src/services/recoveryScore.ts
 * @author Claude Opus 4.5 (Session 40)
 * @created December 4, 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPONENT_WEIGHTS = void 0;
exports.calculateHrvScore = calculateHrvScore;
exports.calculateRhrScore = calculateRhrScore;
exports.calculateSleepQualityScore = calculateSleepQualityScore;
exports.calculateSleepDurationScore = calculateSleepDurationScore;
exports.calculateRespiratoryRateScore = calculateRespiratoryRateScore;
exports.calculateTemperaturePenalty = calculateTemperaturePenalty;
exports.detectEdgeCases = detectEdgeCases;
exports.generateRecommendations = generateRecommendations;
exports.calculateRecoveryScore = calculateRecoveryScore;
exports.shouldCalculateRecovery = shouldCalculateRecovery;
exports.getBaselineStatus = getBaselineStatus;
const recovery_types_1 = require("../types/recovery.types");
// =============================================================================
// CONSTANTS
// =============================================================================
/** Default component weights (sum to 1.0) */
exports.COMPONENT_WEIGHTS = {
    hrv: 0.40,
    rhr: 0.25,
    sleepQuality: 0.20,
    sleepDuration: 0.10,
    respiratoryRate: 0.05,
};
/** Z-score mapping to 0-100 scale */
const ZSCORE_MAPPING = {
    baseline: 70, // Z-score 0 = 70 points
    plusTwoSD: 100, // Z-score +2 = 100 points
    minusTwoSD: 40, // Z-score -2 = 40 points
    minusThreeSD: 0, // Z-score -3 = 0 points
};
/** Sleep efficiency targets (percentage) */
const SLEEP_EFFICIENCY_TARGET = 85;
/** Sleep stage targets (percentage of total sleep) */
const SLEEP_STAGE_TARGETS = {
    deep: { min: 15, optimal: 20, weight: 0.30 },
    rem: { min: 20, optimal: 22.5, weight: 0.30 },
    efficiency: { min: 80, optimal: 90, weight: 0.40 },
};
/** Temperature penalty thresholds (Celsius) */
const TEMP_PENALTY_THRESHOLDS = {
    noEffect: 0.3, // Within ±0.3°C: no penalty
    mild: 0.5, // ±0.5°C: -5 points
    moderate: 0.75, // ±0.75°C: -10 points
    severe: 1.0, // ±1.0°C: -15 points
};
/** Alcohol detection pattern thresholds */
const ALCOHOL_DETECTION = {
    rhrElevation: 5, // +5 bpm above baseline
    hrvReduction: 0.25, // -25% below baseline
    remReduction: 0.30, // -30% below normal
};
/** Illness detection pattern thresholds */
const ILLNESS_DETECTION = {
    tempElevation: 0.5, // +0.5°C
    rrElevation: 2, // +2 breaths/min
    rhrElevation: 5, // +5 bpm
    hrvReduction: 0.30, // -30% below baseline
};
// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
/**
 * Map a Z-score to a 0-100 scale.
 * - Z-score 0 (at baseline) = 70 points
 * - Z-score +2 = 100 points
 * - Z-score -2 = 40 points
 * - Z-score -3 = 0 points
 */
function zScoreToScore(zScore) {
    if (zScore >= 0) {
        // Positive Z-scores: 70 → 100 (linear from 0 to +2)
        const score = ZSCORE_MAPPING.baseline + (zScore / 2) * (ZSCORE_MAPPING.plusTwoSD - ZSCORE_MAPPING.baseline);
        return Math.min(100, Math.round(score));
    }
    else if (zScore >= -2) {
        // Negative Z-scores (-2 to 0): 40 → 70 (linear)
        const score = ZSCORE_MAPPING.minusTwoSD + ((zScore + 2) / 2) * (ZSCORE_MAPPING.baseline - ZSCORE_MAPPING.minusTwoSD);
        return Math.max(0, Math.round(score));
    }
    else {
        // Very negative Z-scores (-3 to -2): 0 → 40 (linear)
        const score = ZSCORE_MAPPING.minusThreeSD + ((zScore + 3) / 1) * (ZSCORE_MAPPING.minusTwoSD - ZSCORE_MAPPING.minusThreeSD);
        return Math.max(0, Math.round(score));
    }
}
/**
 * Map an inverse Z-score to a 0-100 scale (for RHR where lower is better).
 */
function inverseZScoreToScore(zScore) {
    // For RHR, negative Z-score (below baseline) is GOOD
    return zScoreToScore(-zScore);
}
/**
 * Format a percentage change string.
 */
function formatPercentChange(current, baseline) {
    if (baseline === 0)
        return 'No baseline';
    const change = ((current - baseline) / baseline) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(0)}% vs baseline`;
}
/**
 * Format a bpm difference string.
 */
function formatBpmDiff(current, baseline) {
    const diff = current - baseline;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff.toFixed(0)} bpm vs baseline`;
}
/**
 * Redistribute weights when some components are missing.
 * Scales up remaining weights proportionally to maintain 100% total.
 */
function redistributeWeights(availableComponents) {
    const totalAvailableWeight = availableComponents.reduce((sum, key) => sum + exports.COMPONENT_WEIGHTS[key], 0);
    // Start with zeros
    const redistributed = {
        hrv: 0,
        rhr: 0,
        sleepQuality: 0,
        sleepDuration: 0,
        respiratoryRate: 0,
    };
    // If all components missing, return original weights (as numbers)
    if (totalAvailableWeight === 0) {
        return {
            hrv: exports.COMPONENT_WEIGHTS.hrv,
            rhr: exports.COMPONENT_WEIGHTS.rhr,
            sleepQuality: exports.COMPONENT_WEIGHTS.sleepQuality,
            sleepDuration: exports.COMPONENT_WEIGHTS.sleepDuration,
            respiratoryRate: exports.COMPONENT_WEIGHTS.respiratoryRate,
        };
    }
    // Scale up available component weights
    for (const key of availableComponents) {
        redistributed[key] = exports.COMPONENT_WEIGHTS[key] / totalAvailableWeight;
    }
    return redistributed;
}
// =============================================================================
// COMPONENT CALCULATORS
// =============================================================================
/**
 * Calculate HRV score (40% weight).
 * Uses log-transformed Z-score against 14-day baseline.
 */
function calculateHrvScore(hrvAvg, hrvMethod, baseline) {
    if (hrvAvg === null || hrvAvg <= 0) {
        return {
            raw: null,
            score: 0,
            vsBaseline: 'No data',
            available: false,
        };
    }
    // Check if HRV method matches baseline
    if (hrvMethod !== baseline.hrvMethod && baseline.hrvMethod !== null) {
        // Different HRV methods - cannot compare directly
        // Use a conservative approach: assume neutral score
        return {
            raw: hrvAvg,
            score: 65, // Slightly below baseline assumption
            vsBaseline: `Method mismatch (${hrvMethod} vs baseline ${baseline.hrvMethod})`,
            available: true,
        };
    }
    // Calculate Z-score using log-transformed values
    const lnHrv = Math.log(hrvAvg);
    const lnMean = baseline.hrvLnMean;
    const lnStdDev = baseline.hrvLnStdDev;
    if (lnStdDev <= 0) {
        // Not enough variance in baseline
        return {
            raw: hrvAvg,
            score: 70, // Assume baseline
            vsBaseline: 'Insufficient baseline variance',
            available: true,
        };
    }
    const zScore = (lnHrv - lnMean) / lnStdDev;
    const score = zScoreToScore(zScore);
    return {
        raw: hrvAvg,
        score,
        vsBaseline: formatPercentChange(hrvAvg, Math.exp(lnMean)),
        available: true,
    };
}
/**
 * Calculate RHR score (25% weight).
 * Uses inverse Z-score (lower RHR = better).
 */
function calculateRhrScore(rhrAvg, baseline) {
    if (rhrAvg === null || rhrAvg <= 0) {
        return {
            raw: null,
            score: 0,
            vsBaseline: 'No data',
            available: false,
        };
    }
    const mean = baseline.rhrMean;
    const stdDev = baseline.rhrStdDev;
    if (stdDev <= 0 || mean <= 0) {
        return {
            raw: rhrAvg,
            score: 70, // Assume baseline
            vsBaseline: 'Insufficient baseline',
            available: true,
        };
    }
    // For RHR, lower is better (inverse scoring)
    const zScore = (rhrAvg - mean) / stdDev;
    const score = inverseZScoreToScore(zScore);
    return {
        raw: rhrAvg,
        score,
        vsBaseline: formatBpmDiff(rhrAvg, mean),
        available: true,
    };
}
/**
 * Calculate sleep quality score (20% weight).
 * Composite of efficiency, deep sleep %, and REM %.
 */
function calculateSleepQualityScore(efficiency, deepPct, remPct) {
    // Track what we have
    let totalWeight = 0;
    let weightedScore = 0;
    const details = [];
    // Efficiency score (40% of sleep quality)
    if (efficiency !== null && efficiency > 0) {
        const effScore = Math.min(100, (efficiency / SLEEP_STAGE_TARGETS.efficiency.optimal) * 100);
        weightedScore += effScore * SLEEP_STAGE_TARGETS.efficiency.weight;
        totalWeight += SLEEP_STAGE_TARGETS.efficiency.weight;
        details.push(`Eff: ${efficiency}%`);
    }
    // Deep sleep score (30% of sleep quality)
    if (deepPct !== null && deepPct > 0) {
        // Score based on reaching optimal range
        let deepScore;
        if (deepPct >= SLEEP_STAGE_TARGETS.deep.optimal) {
            deepScore = 100;
        }
        else if (deepPct >= SLEEP_STAGE_TARGETS.deep.min) {
            deepScore = 70 + ((deepPct - SLEEP_STAGE_TARGETS.deep.min) /
                (SLEEP_STAGE_TARGETS.deep.optimal - SLEEP_STAGE_TARGETS.deep.min)) * 30;
        }
        else {
            deepScore = (deepPct / SLEEP_STAGE_TARGETS.deep.min) * 70;
        }
        weightedScore += deepScore * SLEEP_STAGE_TARGETS.deep.weight;
        totalWeight += SLEEP_STAGE_TARGETS.deep.weight;
        details.push(`Deep: ${deepPct}%`);
    }
    // REM sleep score (30% of sleep quality)
    if (remPct !== null && remPct > 0) {
        let remScore;
        if (remPct >= SLEEP_STAGE_TARGETS.rem.optimal) {
            remScore = 100;
        }
        else if (remPct >= SLEEP_STAGE_TARGETS.rem.min) {
            remScore = 70 + ((remPct - SLEEP_STAGE_TARGETS.rem.min) /
                (SLEEP_STAGE_TARGETS.rem.optimal - SLEEP_STAGE_TARGETS.rem.min)) * 30;
        }
        else {
            remScore = (remPct / SLEEP_STAGE_TARGETS.rem.min) * 70;
        }
        weightedScore += remScore * SLEEP_STAGE_TARGETS.rem.weight;
        totalWeight += SLEEP_STAGE_TARGETS.rem.weight;
        details.push(`REM: ${remPct}%`);
    }
    // If no data at all
    if (totalWeight === 0) {
        return {
            raw: null,
            score: 0,
            vsBaseline: 'No sleep data',
            available: false,
            efficiency: null,
            deepPct: null,
            remPct: null,
        };
    }
    // Normalize to account for missing components
    const finalScore = Math.round(weightedScore / totalWeight);
    return {
        raw: efficiency,
        score: finalScore,
        vsBaseline: details.join(', '),
        available: true,
        efficiency,
        deepPct,
        remPct,
    };
}
/**
 * Calculate sleep duration score (10% weight).
 * Based on ratio to personalized target (75th percentile).
 */
function calculateSleepDurationScore(sleepHours, targetMinutes) {
    if (sleepHours === null || sleepHours <= 0) {
        return {
            raw: null,
            score: 0,
            vsBaseline: 'No data',
            available: false,
            hours: null,
            vsTarget: 'No data',
        };
    }
    const actualMinutes = sleepHours * 60;
    const ratio = actualMinutes / targetMinutes;
    // Score calculation:
    // - 100% of target = 100 points
    // - 80% of target = 70 points
    // - 60% of target = 40 points
    // - Over target is also capped at 100
    let score;
    if (ratio >= 1.0) {
        score = 100;
    }
    else if (ratio >= 0.8) {
        score = 70 + ((ratio - 0.8) / 0.2) * 30;
    }
    else if (ratio >= 0.6) {
        score = 40 + ((ratio - 0.6) / 0.2) * 30;
    }
    else {
        score = (ratio / 0.6) * 40;
    }
    // Format comparison to target
    const diffMinutes = actualMinutes - targetMinutes;
    let vsTarget;
    if (Math.abs(diffMinutes) <= 15) {
        vsTarget = 'On target';
    }
    else if (diffMinutes > 0) {
        vsTarget = `+${Math.round(diffMinutes)} min`;
    }
    else {
        vsTarget = `${Math.round(diffMinutes)} min`;
    }
    return {
        raw: sleepHours,
        score: Math.round(score),
        vsBaseline: `${sleepHours.toFixed(1)}h of ${(targetMinutes / 60).toFixed(1)}h target`,
        available: true,
        hours: sleepHours,
        vsTarget,
    };
}
/**
 * Calculate respiratory rate score (5% weight).
 * Z-score against baseline.
 */
function calculateRespiratoryRateScore(rrAvg, baseline) {
    if (rrAvg === null || rrAvg <= 0) {
        return {
            raw: null,
            score: 0,
            vsBaseline: 'No data',
            available: false,
        };
    }
    const mean = baseline.respiratoryRateMean;
    const stdDev = baseline.respiratoryRateStdDev;
    // Normal range is typically 12-16 breaths/min
    // Elevated respiratory rate is a concern
    if (stdDev <= 0 || mean <= 0) {
        // Use population norms if no baseline
        if (rrAvg >= 12 && rrAvg <= 16) {
            return {
                raw: rrAvg,
                score: 100,
                vsBaseline: 'Normal range',
                available: true,
            };
        }
        else if (rrAvg < 12) {
            return {
                raw: rrAvg,
                score: 85,
                vsBaseline: 'Below normal',
                available: true,
            };
        }
        else {
            // Elevated
            const score = Math.max(40, 100 - (rrAvg - 16) * 10);
            return {
                raw: rrAvg,
                score: Math.round(score),
                vsBaseline: 'Elevated',
                available: true,
            };
        }
    }
    // Use inverse Z-score (higher RR is worse)
    const zScore = (rrAvg - mean) / stdDev;
    const score = inverseZScoreToScore(zScore);
    const diffBreaths = rrAvg - mean;
    const vsBaseline = Math.abs(diffBreaths) < 0.5
        ? 'Normal'
        : `${diffBreaths > 0 ? '+' : ''}${diffBreaths.toFixed(1)} breaths/min`;
    return {
        raw: rrAvg,
        score,
        vsBaseline,
        available: true,
    };
}
/**
 * Calculate temperature penalty (0 to -15 points).
 * Only applies as a penalty (never a boost).
 */
function calculateTemperaturePenalty(tempDeviation, menstrualTracking, cycleDay) {
    if (tempDeviation === null) {
        return { deviation: null, penalty: 0 };
    }
    // Adjust for menstrual cycle if tracking
    // Luteal phase (days 15-28) has naturally elevated temperature
    let adjustedDeviation = tempDeviation;
    if (menstrualTracking && cycleDay !== null) {
        if (cycleDay >= 15 && cycleDay <= 28) {
            // Luteal phase: allow +0.3°C more before penalizing
            adjustedDeviation = Math.max(0, tempDeviation - 0.3);
        }
    }
    const absDeviation = Math.abs(adjustedDeviation);
    // Calculate penalty based on deviation magnitude
    let penalty = 0;
    if (absDeviation <= TEMP_PENALTY_THRESHOLDS.noEffect) {
        penalty = 0;
    }
    else if (absDeviation <= TEMP_PENALTY_THRESHOLDS.mild) {
        penalty = -5;
    }
    else if (absDeviation <= TEMP_PENALTY_THRESHOLDS.moderate) {
        penalty = -10;
    }
    else {
        penalty = -15;
    }
    return {
        deviation: tempDeviation,
        penalty,
    };
}
// =============================================================================
// EDGE CASE DETECTION
// =============================================================================
/**
 * Detect edge cases from biometric patterns.
 */
function detectEdgeCases(metrics, baseline) {
    const edgeCases = {
        alcoholDetected: false,
        illnessRisk: 'none',
        travelDetected: false,
        menstrualPhaseAdjustment: false,
    };
    const hrvAvg = metrics.hrv_avg ? Number(metrics.hrv_avg) : null;
    const rhrAvg = metrics.rhr_avg ? Number(metrics.rhr_avg) : null;
    const remPct = metrics.rem_percentage;
    const tempDev = metrics.temperature_deviation ? Number(metrics.temperature_deviation) : null;
    const rrAvg = metrics.respiratory_rate_avg ? Number(metrics.respiratory_rate_avg) : null;
    // Alcohol detection: High RHR + Low HRV + Low REM
    if (hrvAvg !== null && rhrAvg !== null && baseline.hrvLnMean > 0 && baseline.rhrMean > 0) {
        const hrvReduction = 1 - (hrvAvg / Math.exp(baseline.hrvLnMean));
        const rhrElevation = rhrAvg - baseline.rhrMean;
        const remLow = remPct !== null && remPct < (20 * (1 - ALCOHOL_DETECTION.remReduction));
        if (rhrElevation >= ALCOHOL_DETECTION.rhrElevation &&
            hrvReduction >= ALCOHOL_DETECTION.hrvReduction &&
            remLow) {
            edgeCases.alcoholDetected = true;
        }
    }
    // Illness risk detection
    let illnessSignals = 0;
    if (tempDev !== null && tempDev >= ILLNESS_DETECTION.tempElevation) {
        illnessSignals++;
    }
    if (rrAvg !== null && baseline.respiratoryRateMean > 0) {
        if (rrAvg - baseline.respiratoryRateMean >= ILLNESS_DETECTION.rrElevation) {
            illnessSignals++;
        }
    }
    if (rhrAvg !== null && baseline.rhrMean > 0) {
        if (rhrAvg - baseline.rhrMean >= ILLNESS_DETECTION.rhrElevation) {
            illnessSignals++;
        }
    }
    if (hrvAvg !== null && baseline.hrvLnMean > 0) {
        const hrvReduction = 1 - (hrvAvg / Math.exp(baseline.hrvLnMean));
        if (hrvReduction >= ILLNESS_DETECTION.hrvReduction) {
            illnessSignals++;
        }
    }
    // Determine illness risk level
    if (illnessSignals >= 3) {
        edgeCases.illnessRisk = 'high';
    }
    else if (illnessSignals >= 2) {
        edgeCases.illnessRisk = 'medium';
    }
    else if (illnessSignals >= 1) {
        edgeCases.illnessRisk = 'low';
    }
    // Menstrual phase adjustment
    if (baseline.menstrualCycleTracking && baseline.cycleDay !== null) {
        if (baseline.cycleDay >= 15 && baseline.cycleDay <= 28) {
            edgeCases.menstrualPhaseAdjustment = true;
        }
    }
    // Travel detection would require timezone data (not implemented yet)
    // edgeCases.travelDetected = false;
    return edgeCases;
}
// =============================================================================
// RECOMMENDATIONS
// =============================================================================
/**
 * Generate recommendations based on recovery score and zone.
 */
function generateRecommendations(score, zone, edgeCases) {
    const recommendations = [];
    // Zone-based primary recommendation
    switch (zone) {
        case 'green':
            recommendations.push({
                type: 'training',
                headline: 'Ready for high intensity',
                body: 'Your recovery metrics indicate you\'re well-rested. This is a good day for challenging workouts or skill practice.',
                protocols: ['fitness_template', 'hiit'],
                activateMVD: false,
            });
            break;
        case 'yellow':
            recommendations.push({
                type: 'training',
                headline: 'Moderate activity recommended',
                body: 'Your recovery is moderate. Consider lighter activity today or focus on technique work rather than intensity.',
                protocols: ['walking', 'stretching'],
                activateMVD: false,
            });
            break;
        case 'red':
            recommendations.push({
                type: 'rest',
                headline: 'Prioritize recovery today',
                body: 'Your metrics suggest you need rest. Focus on sleep, nutrition, and low-stress activities.',
                protocols: ['nsdr', 'evening_routine'],
                activateMVD: true,
            });
            break;
    }
    // Edge case specific recommendations
    if (edgeCases.alcoholDetected) {
        recommendations.push({
            type: 'recovery',
            headline: 'Elevated stress markers detected',
            body: 'Your biometrics show patterns consistent with recent alcohol consumption. Consider extra hydration and rest today.',
            protocols: ['hydration', 'nsdr'],
        });
    }
    if (edgeCases.illnessRisk !== 'none') {
        const riskLevel = edgeCases.illnessRisk;
        recommendations.push({
            type: 'health',
            headline: riskLevel === 'high' ? 'Early illness warning' : 'Monitor your health',
            body: riskLevel === 'high'
                ? 'Multiple biometric indicators suggest you may be fighting off an illness. Rest is strongly recommended.'
                : 'Some markers are slightly elevated. Pay attention to how you feel today.',
            protocols: ['rest_mode'],
            activateMVD: riskLevel === 'high',
        });
    }
    return recommendations;
}
/**
 * Generate human-readable reasoning string.
 */
function generateReasoning(score, zone, components, edgeCases) {
    const parts = [];
    // Overall assessment
    parts.push(`Recovery Score: ${score}/100 (${zone.toUpperCase()} zone).`);
    // Top contributors
    const componentScores = [
        { name: 'HRV', score: components.hrv.score, weight: 0.40 },
        { name: 'RHR', score: components.rhr.score, weight: 0.25 },
        { name: 'Sleep Quality', score: components.sleepQuality.score, weight: 0.20 },
        { name: 'Sleep Duration', score: components.sleepDuration.score, weight: 0.10 },
        { name: 'Respiratory Rate', score: components.respiratoryRate.score, weight: 0.05 },
    ].filter(c => c.score > 0);
    if (componentScores.length > 0) {
        // Sort by contribution (score * weight)
        componentScores.sort((a, b) => (b.score * b.weight) - (a.score * a.weight));
        const topContributors = componentScores.slice(0, 2).map(c => c.name);
        parts.push(`Top contributors: ${topContributors.join(', ')}.`);
    }
    // Edge case notes
    if (edgeCases.alcoholDetected) {
        parts.push('Alcohol consumption pattern detected.');
    }
    if (edgeCases.illnessRisk !== 'none') {
        parts.push(`Illness risk: ${edgeCases.illnessRisk}.`);
    }
    if (edgeCases.menstrualPhaseAdjustment) {
        parts.push('Luteal phase temperature adjustment applied.');
    }
    return parts.join(' ');
}
// =============================================================================
// MAIN CALCULATOR
// =============================================================================
/**
 * Calculate complete recovery score from daily metrics and baseline.
 */
function calculateRecoveryScore(input) {
    const { dailyMetrics, userBaseline } = input;
    // Extract metrics with safe number conversion
    const hrvAvg = dailyMetrics.hrv_avg !== null ? Number(dailyMetrics.hrv_avg) : null;
    const hrvMethod = dailyMetrics.hrv_method;
    const rhrAvg = dailyMetrics.rhr_avg !== null ? Number(dailyMetrics.rhr_avg) : null;
    const sleepHours = dailyMetrics.sleep_duration_hours !== null
        ? Number(dailyMetrics.sleep_duration_hours)
        : null;
    const sleepEfficiency = dailyMetrics.sleep_efficiency;
    const deepPct = dailyMetrics.deep_percentage;
    const remPct = dailyMetrics.rem_percentage;
    const rrAvg = dailyMetrics.respiratory_rate_avg !== null
        ? Number(dailyMetrics.respiratory_rate_avg)
        : null;
    const tempDev = dailyMetrics.temperature_deviation !== null
        ? Number(dailyMetrics.temperature_deviation)
        : null;
    // Calculate each component
    const hrvResult = calculateHrvScore(hrvAvg, hrvMethod, userBaseline);
    const rhrResult = calculateRhrScore(rhrAvg, userBaseline);
    const sleepQualityResult = calculateSleepQualityScore(sleepEfficiency, deepPct, remPct);
    const sleepDurationResult = calculateSleepDurationScore(sleepHours, userBaseline.sleepDurationTarget);
    const respiratoryResult = calculateRespiratoryRateScore(rrAvg, userBaseline);
    const tempPenalty = calculateTemperaturePenalty(tempDev, userBaseline.menstrualCycleTracking, userBaseline.cycleDay);
    // Track available components for weight redistribution
    const availableComponents = [];
    const missingInputs = [];
    if (hrvResult.available) {
        availableComponents.push('hrv');
    }
    else {
        missingInputs.push('hrv');
    }
    if (rhrResult.available) {
        availableComponents.push('rhr');
    }
    else {
        missingInputs.push('rhr');
    }
    if (sleepQualityResult.available) {
        availableComponents.push('sleepQuality');
    }
    else {
        missingInputs.push('sleepQuality');
    }
    if (sleepDurationResult.available) {
        availableComponents.push('sleepDuration');
    }
    else {
        missingInputs.push('sleepDuration');
    }
    if (respiratoryResult.available) {
        availableComponents.push('respiratoryRate');
    }
    else {
        missingInputs.push('respiratoryRate');
    }
    // Redistribute weights for missing components
    const weights = redistributeWeights(availableComponents);
    // Calculate weighted score
    let rawScore = 0;
    rawScore += hrvResult.score * weights.hrv;
    rawScore += rhrResult.score * weights.rhr;
    rawScore += sleepQualityResult.score * weights.sleepQuality;
    rawScore += sleepDurationResult.score * weights.sleepDuration;
    rawScore += respiratoryResult.score * weights.respiratoryRate;
    // Apply temperature penalty
    rawScore += tempPenalty.penalty;
    // Clamp to 0-100
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));
    // Determine zone
    const zone = (0, recovery_types_1.determineZone)(score);
    // Build components object
    const components = {
        hrv: {
            raw: hrvResult.raw,
            score: hrvResult.score,
            vsBaseline: hrvResult.vsBaseline,
            weight: 0.40,
        },
        rhr: {
            raw: rhrResult.raw,
            score: rhrResult.score,
            vsBaseline: rhrResult.vsBaseline,
            weight: 0.25,
        },
        sleepQuality: {
            efficiency: sleepQualityResult.efficiency,
            deepPct: sleepQualityResult.deepPct,
            remPct: sleepQualityResult.remPct,
            score: sleepQualityResult.score,
            weight: 0.20,
        },
        sleepDuration: {
            hours: sleepDurationResult.hours,
            vsTarget: sleepDurationResult.vsTarget,
            score: sleepDurationResult.score,
            weight: 0.10,
        },
        respiratoryRate: {
            raw: respiratoryResult.raw,
            score: respiratoryResult.score,
            vsBaseline: respiratoryResult.vsBaseline,
            weight: 0.05,
        },
        temperaturePenalty: tempPenalty,
    };
    // Detect edge cases
    const edgeCases = detectEdgeCases(dailyMetrics, userBaseline);
    // Generate recommendations
    const recommendations = generateRecommendations(score, zone, edgeCases);
    // Calculate data completeness
    const totalComponents = 5; // hrv, rhr, sleepQuality, sleepDuration, respiratoryRate
    const dataCompleteness = Math.round((availableComponents.length / totalComponents) * 100);
    // Calculate confidence
    const confidenceFactors = {
        dataRecency: 1.0, // Assume current data (would need sync timestamp)
        sampleSize: userBaseline.confidenceLevel === 'high' ? 1.0
            : userBaseline.confidenceLevel === 'medium' ? 0.7 : 0.4,
        correlationStrength: 0.7, // Default (would need historical correlation)
        userEngagement: 0.8, // Default (would need protocol adherence data)
        contextMatch: 0.8, // Default (would need calendar data)
    };
    const confidence = (0, recovery_types_1.calculateConfidence)(confidenceFactors);
    // Generate reasoning
    const reasoning = generateReasoning(score, zone, components, edgeCases);
    return {
        score,
        confidence,
        zone,
        components,
        edgeCases,
        reasoning,
        recommendations,
        dataCompleteness,
        missingInputs,
    };
}
/**
 * Check if we should calculate recovery (baseline requirements met).
 */
function shouldCalculateRecovery(baseline) {
    if (!baseline) {
        return false;
    }
    // Require at least 'medium' confidence (7+ days of data)
    // For MVP, we can calculate with 'low' but show a warning
    return baseline.confidenceLevel !== 'low' || baseline.hrvSampleCount >= 3;
}
/**
 * Get baseline status message for UI display during onboarding.
 */
function getBaselineStatus(baseline) {
    const daysRequired = 7;
    if (!baseline) {
        return {
            ready: false,
            daysCollected: 0,
            daysRequired,
            message: 'Sync your wearable to start building your baseline',
        };
    }
    const daysCollected = baseline.hrvSampleCount;
    const ready = daysCollected >= daysRequired;
    if (ready) {
        return {
            ready: true,
            daysCollected,
            daysRequired,
            message: 'Baseline ready',
        };
    }
    return {
        ready: false,
        daysCollected,
        daysRequired,
        message: `Building baseline... Day ${daysCollected}/${daysRequired}`,
    };
}
