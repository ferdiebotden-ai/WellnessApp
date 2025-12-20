"use strict";
/**
 * Weekly Synthesis API Endpoint
 *
 * Returns user's latest weekly synthesis narrative and insights.
 * Per PRD Section 4.5 - Weekly Synthesis (5-section narrative).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestWeeklySynthesis = getLatestWeeklySynthesis;
const supabaseClient_1 = require("./supabaseClient");
const users_1 = require("./users");
const types_1 = require("./synthesis/types");
function resolveError(error) {
    if (typeof error === 'object' && error !== null) {
        const maybeStatus = error.status;
        if (typeof maybeStatus === 'number') {
            return { status: maybeStatus, message: error.message };
        }
        const maybePostgrest = error;
        if (typeof maybePostgrest.code === 'string') {
            if (maybePostgrest.code === 'PGRST116') {
                return { status: 404, message: 'No synthesis found' };
            }
            return { status: 400, message: maybePostgrest.message };
        }
    }
    return { status: 500, message: error.message };
}
/**
 * GET /api/users/me/weekly-synthesis
 *
 * Returns the user's latest weekly synthesis narrative and insights.
 * If no synthesis exists, returns has_synthesis: false with days_tracked.
 */
async function getLatestWeeklySynthesis(req, res) {
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
            .select(`
        id,
        user_id,
        week_start,
        week_end,
        narrative,
        win_of_week,
        area_to_watch,
        pattern_insight,
        trajectory_prediction,
        experiment,
        metrics_summary,
        generated_at,
        read_at
      `)
            .eq('user_id', user.id)
            .order('week_end', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (synthesisError) {
            throw synthesisError;
        }
        // Count days with protocol completions for progress indication
        const { count: logCount } = await supabase
            .from('protocol_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'completed');
        const daysTracked = logCount ?? 0;
        // If no synthesis exists, return empty state
        if (!synthesis) {
            const response = {
                has_synthesis: false,
                synthesis: null,
                days_tracked: daysTracked,
                min_days_required: types_1.SYNTHESIS_CONFIG.MIN_DATA_DAYS,
            };
            res.status(200).json(response);
            return;
        }
        // Mark as read if this is the first read
        const typedSynthesis = synthesis;
        if (!typedSynthesis.read_at) {
            await supabase
                .from('weekly_syntheses')
                .update({ read_at: new Date().toISOString() })
                .eq('id', typedSynthesis.id);
        }
        // Return the full synthesis
        const response = {
            has_synthesis: true,
            synthesis: {
                id: typedSynthesis.id,
                week_start: typedSynthesis.week_start,
                week_end: typedSynthesis.week_end,
                narrative: typedSynthesis.narrative,
                win_of_week: typedSynthesis.win_of_week,
                area_to_watch: typedSynthesis.area_to_watch,
                pattern_insight: typedSynthesis.pattern_insight,
                trajectory_prediction: typedSynthesis.trajectory_prediction,
                experiment: typedSynthesis.experiment,
                metrics: typedSynthesis.metrics_summary ?? {},
                generated_at: typedSynthesis.generated_at,
            },
            days_tracked: daysTracked,
            min_days_required: types_1.SYNTHESIS_CONFIG.MIN_DATA_DAYS,
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('[WeeklySynthesis API] Error:', error);
        const { status, message } = resolveError(error);
        res.status(status).json({ error: message });
    }
}
