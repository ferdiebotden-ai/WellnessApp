"use strict";
/**
 * Correlations API Endpoint
 *
 * Returns user's protocol-outcome correlations from the most recent weekly synthesis.
 * Per PRD Section 5.8 - Correlation Dashboard.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserCorrelations = getUserCorrelations;
const supabaseClient_1 = require("./supabaseClient");
const users_1 = require("./users");
const types_1 = require("./synthesis/types");
/**
 * Human-readable names for outcome metrics
 */
const OUTCOME_NAMES = {
    sleep_hours: 'Sleep Duration',
    hrv_score: 'HRV Score',
    recovery_score: 'Recovery Score',
    resting_hr: 'Resting Heart Rate',
};
function resolveError(error) {
    if (typeof error === 'object' && error !== null) {
        const maybeStatus = error.status;
        if (typeof maybeStatus === 'number') {
            return { status: maybeStatus, message: error.message };
        }
        const maybePostgrest = error;
        if (typeof maybePostgrest.code === 'string') {
            if (maybePostgrest.code === 'PGRST116') {
                return { status: 404, message: 'No correlations found' };
            }
            return { status: 400, message: maybePostgrest.message };
        }
    }
    return { status: 500, message: error.message };
}
/**
 * Transform backend ProtocolCorrelation to client-friendly format
 */
function toClientCorrelation(c) {
    return {
        protocol: c.protocol,
        protocol_name: c.protocol_name,
        outcome: c.outcome,
        outcome_name: OUTCOME_NAMES[c.outcome],
        r: Math.round(c.correlation * 100) / 100, // Round to 2 decimals
        p_value: Math.round(c.p_value * 1000) / 1000, // Round to 3 decimals
        is_significant: c.is_significant,
        sample_size: c.sample_size,
        direction: c.direction,
        interpretation: c.interpretation,
    };
}
/**
 * GET /api/users/me/correlations
 *
 * Returns the user's protocol-outcome correlations from their most recent weekly synthesis.
 * If no synthesis exists, returns empty correlations with days_tracked = 0.
 */
async function getUserCorrelations(req, res) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    try {
        // Authenticate and get Firebase UID
        const { uid } = await (0, users_1.authenticateRequest)(req);
        const supabase = (0, supabaseClient_1.getServiceClient)();
        // Get user's Supabase ID
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('firebase_uid', uid)
            .single();
        if (userError || !user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Fetch most recent weekly synthesis
        const { data: synthesis, error: synthesisError } = await supabase
            .from('weekly_syntheses')
            .select('id, user_id, week_start, week_end, metrics_summary')
            .eq('user_id', user.id)
            .order('week_end', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (synthesisError) {
            throw synthesisError;
        }
        // If no synthesis exists, return empty state
        if (!synthesis) {
            // Count protocol_logs to get days_tracked
            const { count: logCount, error: countError } = await supabase
                .from('protocol_logs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'completed');
            if (countError) {
                console.error('[Correlations] Failed to count protocol logs:', countError);
            }
            const response = {
                correlations: [],
                days_tracked: logCount ?? 0,
                min_days_required: types_1.SYNTHESIS_CONFIG.MIN_CORRELATION_DAYS,
            };
            res.status(200).json(response);
            return;
        }
        // Extract correlations from metrics_summary
        const typedSynthesis = synthesis;
        const correlations = typedSynthesis.metrics_summary?.correlations ?? [];
        const daysTracked = typedSynthesis.metrics_summary?.data_days_available ?? 0;
        // Transform to client format and limit to top 5
        const clientCorrelations = correlations
            .slice(0, types_1.SYNTHESIS_CONFIG.MAX_CORRELATIONS)
            .map(toClientCorrelation);
        const response = {
            correlations: clientCorrelations,
            days_tracked: daysTracked,
            min_days_required: types_1.SYNTHESIS_CONFIG.MIN_CORRELATION_DAYS,
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('[Correlations] Error:', error);
        const { status, message } = resolveError(error);
        res.status(status).json({ error: message });
    }
}
