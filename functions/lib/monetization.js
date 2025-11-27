"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonetizationStatus = getMonetizationStatus;
const supabaseClient_1 = require("./supabaseClient");
const users_1 = require("./users");
function resolveError(error) {
    if (typeof error === 'object' && error !== null) {
        const maybeStatus = error.status;
        if (typeof maybeStatus === 'number') {
            return { status: maybeStatus, message: error.message };
        }
        const maybePostgrest = error;
        if (typeof maybePostgrest.code === 'string') {
            return { status: 400, message: maybePostgrest.message };
        }
    }
    return { status: 500, message: error.message };
}
/**
 * Calculates chat queries used this week from ai_audit_log
 */
async function getChatQueriesThisWeek(userId) {
    const serviceClient = (0, supabaseClient_1.getServiceClient)();
    // Calculate start of current week (Sunday 00:00:00)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const { count, error } = await serviceClient
        .from('ai_audit_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('decision_type', 'chat_response')
        .gte('created_at', startOfWeek.toISOString());
    if (error) {
        console.warn('Failed to fetch chat query count:', error);
        return 0;
    }
    return count || 0;
}
/**
 * GET /api/users/me/monetization
 *
 * Returns monetization status for current user:
 * - Trial dates
 * - Subscription tier (trial, core, pro, elite, lapsed)
 * - Chat usage (queries used this week vs weekly limit)
 *
 * Blueprint Reference: V3.2 - Tier 1 ($29/mo) includes limited chat (10 queries/week)
 *                       Tier 2 ($59/mo) unlocks unlimited chat
 */
async function getMonetizationStatus(req, res) {
    if (req.method !== 'GET') {
        res.status(405).send({ error: 'Method Not Allowed' });
        return;
    }
    try {
        const { uid } = await (0, users_1.authenticateRequest)(req);
        const serviceClient = (0, supabaseClient_1.getServiceClient)();
        // 1. Fetch user profile (query by firebase_uid)
        const { data: user, error: userError } = await serviceClient
            .from('users')
            .select('id, tier, trial_start_date, trial_end_date, subscription_id')
            .eq('firebase_uid', uid)
            .single();
        if (userError || !user) {
            throw userError || new Error('User not found');
        }
        // 2. Calculate chat queries used this week (use Supabase UUID for foreign key)
        const queriesUsed = await getChatQueriesThisWeek(user.id);
        // 3. Determine chat weekly limit based on tier
        let chatWeeklyLimit;
        switch (user.tier) {
            case 'trial':
            case 'core':
                chatWeeklyLimit = 10; // Limited chat
                break;
            case 'pro':
            case 'elite':
                chatWeeklyLimit = 999999; // Unlimited
                break;
            case 'lapsed':
            default:
                chatWeeklyLimit = 0; // No access
                break;
        }
        // 4. Build response
        const status = {
            trial_start_date: user.trial_start_date,
            trial_end_date: user.trial_end_date,
            subscription_tier: user.tier || 'trial',
            subscription_id: user.subscription_id,
            chat_queries_used_this_week: queriesUsed,
            chat_weekly_limit: chatWeeklyLimit
        };
        res.status(200).json(status);
    }
    catch (error) {
        const { status, message } = resolveError(error);
        res.status(status).json({ error: message });
    }
}
