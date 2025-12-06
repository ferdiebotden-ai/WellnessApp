"use strict";
/**
 * Recovery Score API Endpoint
 *
 * GET /api/recovery?date=YYYY-MM-DD
 *
 * Returns recovery score for authenticated user. Works for both:
 * - Wearable users: Full recovery score with 5+ biometric components
 * - Lite Mode users: Check-in score with 3 self-reported components
 *
 * The endpoint detects the user's data source and returns the appropriate
 * score format. Client uses `isLiteMode` flag to render the correct UI.
 *
 * @file functions/src/recovery.ts
 * @author Claude Opus 4.5 (Session 49)
 * @created December 5, 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecoveryScore = getRecoveryScore;
const supabaseClient_1 = require("./supabaseClient");
const users_1 = require("./users");
const recoveryScore_1 = require("./services/recoveryScore");
const recovery_types_1 = require("./types/recovery.types");
// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function resolveError(error) {
    if (typeof error === 'object' && error !== null) {
        const maybeStatus = error.status;
        if (typeof maybeStatus === 'number') {
            return { status: maybeStatus, message: error.message };
        }
    }
    return { status: 500, message: error.message };
}
/**
 * Get baseline status for the user.
 */
function getBaselineStatus(baseline) {
    if (!baseline) {
        return {
            ready: false,
            daysCollected: 0,
            daysRequired: 7,
            confidenceLevel: 'low',
            message: 'Start syncing your wearable to build your personal baseline.',
        };
    }
    const sampleCount = baseline.hrvSampleCount;
    const ready = sampleCount >= 7;
    const confidenceLevel = (0, recovery_types_1.determineBaselineConfidence)(sampleCount);
    let message;
    if (sampleCount >= 14) {
        message = 'Baseline established. Your recovery scores are highly personalized.';
    }
    else if (sampleCount >= 7) {
        message = `Baseline ready. ${14 - sampleCount} more days for optimal accuracy.`;
    }
    else {
        message = `Building baseline: ${sampleCount}/7 days collected. Keep syncing!`;
    }
    return {
        ready,
        daysCollected: sampleCount,
        daysRequired: 7,
        confidenceLevel,
        message,
    };
}
/**
 * Get baseline status for Lite Mode users (no wearable).
 */
function getLiteModeBaselineStatus() {
    return {
        ready: true,
        daysCollected: 0,
        daysRequired: 0,
        confidenceLevel: 'low',
        message: 'Using check-in data. Connect a wearable for more accurate scores.',
    };
}
/**
 * Transform RecoveryResult to API response format.
 */
function transformRecoveryResult(result) {
    return {
        score: result.score,
        confidence: result.confidence,
        zone: result.zone,
        components: {
            hrv: {
                raw: result.components.hrv.raw,
                score: result.components.hrv.score,
                vsBaseline: result.components.hrv.vsBaseline,
                weight: result.components.hrv.weight,
            },
            rhr: {
                raw: result.components.rhr.raw,
                score: result.components.rhr.score,
                vsBaseline: result.components.rhr.vsBaseline,
                weight: result.components.rhr.weight,
            },
            sleepQuality: {
                efficiency: result.components.sleepQuality.efficiency,
                deepPct: result.components.sleepQuality.deepPct,
                remPct: result.components.sleepQuality.remPct,
                score: result.components.sleepQuality.score,
                weight: result.components.sleepQuality.weight,
            },
            sleepDuration: {
                hours: result.components.sleepDuration.hours,
                vsTarget: result.components.sleepDuration.vsTarget,
                score: result.components.sleepDuration.score,
                weight: result.components.sleepDuration.weight,
            },
            respiratoryRate: {
                raw: result.components.respiratoryRate.raw,
                score: result.components.respiratoryRate.score,
                vsBaseline: result.components.respiratoryRate.vsBaseline,
                weight: result.components.respiratoryRate.weight,
            },
            temperaturePenalty: {
                deviation: result.components.temperaturePenalty.deviation,
                penalty: result.components.temperaturePenalty.penalty,
            },
        },
        reasoning: result.reasoning,
        dataCompleteness: result.dataCompleteness,
        missingInputs: result.missingInputs,
        isLiteMode: false,
    };
}
/**
 * Transform CheckInResult to API response format.
 */
function transformCheckInResult(result) {
    return {
        score: result.score,
        confidence: result.confidence,
        zone: result.zone,
        components: {
            sleepQuality: {
                rating: result.components.sleepQuality.rating,
                label: result.components.sleepQuality.label,
                score: result.components.sleepQuality.score,
                weight: result.components.sleepQuality.weight,
            },
            sleepDuration: {
                hours: result.components.sleepDuration.hours,
                option: result.components.sleepDuration.option,
                score: result.components.sleepDuration.score,
                vsTarget: result.components.sleepDuration.vsTarget,
                weight: result.components.sleepDuration.weight,
            },
            energyLevel: {
                rating: result.components.energyLevel.rating,
                label: result.components.energyLevel.label,
                score: result.components.energyLevel.score,
                weight: result.components.energyLevel.weight,
            },
        },
        reasoning: result.reasoning,
        recommendations: result.recommendations.map((r) => ({
            type: r.type,
            headline: r.headline,
            body: r.body,
            protocols: r.protocols,
        })),
        isLiteMode: true,
        skipped: result.skipped,
    };
}
// =============================================================================
// MAIN HANDLER
// =============================================================================
/**
 * GET /api/recovery?date=YYYY-MM-DD
 *
 * Returns recovery score for the authenticated user.
 */
async function getRecoveryScore(req, res) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    try {
        const { uid } = await (0, users_1.authenticateRequest)(req);
        const dateParam = req.query.date;
        // Default to today if no date provided
        const date = dateParam || new Date().toISOString().split('T')[0];
        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
            return;
        }
        const serviceClient = (0, supabaseClient_1.getServiceClient)();
        // 1. Get Supabase user by Firebase UID
        const { data: user, error: userError } = await serviceClient
            .from('users')
            .select('id, wearable_source')
            .eq('firebase_uid', uid)
            .single();
        if (userError || !user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const userId = user.id;
        const wearableSource = user.wearable_source;
        const isLiteMode = !wearableSource || wearableSource === 'manual' || wearableSource === 'none';
        // 2. Check for today's daily_metrics
        const { data: metrics } = await serviceClient
            .from('daily_metrics')
            .select('*')
            .eq('user_id', userId)
            .eq('date', date)
            .single();
        // 3. Check for yesterday's score (for trend calculation)
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const { data: yesterdayMetrics } = await serviceClient
            .from('daily_metrics')
            .select('recovery_score')
            .eq('user_id', userId)
            .eq('date', yesterdayStr)
            .single();
        const yesterdayScore = yesterdayMetrics?.recovery_score ?? null;
        // 4. Handle Lite Mode users (manual check-in data)
        if (isLiteMode) {
            // Check if user has a manual check-in for today
            if (metrics && metrics.wearable_source === 'manual' && metrics.raw_payload) {
                const payload = metrics.raw_payload;
                if (payload.type === 'manual_check_in' && payload.result) {
                    const response = {
                        recovery: transformCheckInResult(payload.result),
                        baseline: getLiteModeBaselineStatus(),
                        yesterdayScore,
                        isLiteMode: true,
                    };
                    res.status(200).json(response);
                    return;
                }
            }
            // No check-in yet today
            const response = {
                recovery: null,
                baseline: getLiteModeBaselineStatus(),
                yesterdayScore,
                isLiteMode: true,
            };
            res.status(200).json(response);
            return;
        }
        // 5. Handle wearable users
        // Get user baseline
        const { data: baselineRow } = await serviceClient
            .from('user_baselines')
            .select('*')
            .eq('user_id', userId)
            .single();
        const baseline = baselineRow ? (0, recovery_types_1.fromUserBaselineRow)(baselineRow) : null;
        const baselineStatus = getBaselineStatus(baseline);
        // If no baseline ready or no metrics, return null recovery
        if (!baseline || !baselineStatus.ready || !metrics) {
            const response = {
                recovery: null,
                baseline: baselineStatus,
                yesterdayScore,
                isLiteMode: false,
            };
            res.status(200).json(response);
            return;
        }
        // Calculate recovery score
        const recoveryResult = (0, recoveryScore_1.calculateRecoveryScore)({
            dailyMetrics: metrics,
            userBaseline: baseline,
            yesterdayRecovery: yesterdayScore,
        });
        // Return recovery score
        const response = {
            recovery: transformRecoveryResult(recoveryResult),
            baseline: baselineStatus,
            yesterdayScore,
            isLiteMode: false,
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('[getRecoveryScore] Error:', error);
        const { status, message } = resolveError(error);
        res.status(status).json({ error: message });
    }
}
