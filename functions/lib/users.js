"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.getCurrentUser = getCurrentUser;
exports.updateCurrentUser = updateCurrentUser;
exports.filterMutableFields = filterMutableFields;
exports.buildUserInsert = buildUserInsert;
exports.authenticateRequest = authenticateRequest;
const supabaseClient_1 = require("./supabaseClient");
const firebaseAdmin_1 = require("./firebaseAdmin");
const config_1 = require("./config");
const http_1 = require("./utils/http");
const MUTABLE_FIELDS = new Set([
    'display_name',
    'onboarding_complete',
    'preferences',
    'healthMetrics',
    'earnedBadges'
]);
async function authenticateRequest(req) {
    const token = (0, http_1.extractBearerToken)(req);
    if (!token) {
        throw Object.assign(new Error('Missing bearer token'), { status: 401 });
    }
    const decoded = await (0, firebaseAdmin_1.verifyFirebaseToken)(token);
    return { uid: decoded.uid, email: decoded.email };
}
function resolveError(error) {
    if (typeof error === 'object' && error !== null) {
        const maybeStatus = error.status;
        if (typeof maybeStatus === 'number') {
            return { status: maybeStatus, message: error.message };
        }
        const maybePostgrest = error;
        if (typeof maybePostgrest.code === 'string') {
            if (maybePostgrest.code === 'PGRST116') {
                return { status: 404, message: 'User profile not found' };
            }
            return { status: 400, message: maybePostgrest.message };
        }
    }
    return { status: 500, message: error.message };
}
function buildUserInsert(uid, email, displayName) {
    const now = new Date();
    const { defaultTrialDays } = (0, config_1.getConfig)();
    const trialEnd = new Date(now.getTime() + defaultTrialDays * 24 * 60 * 60 * 1000);
    return {
        id: uid,
        email: email ?? null,
        display_name: displayName ?? null,
        tier: 'trial',
        onboarding_complete: false,
        trial_start_date: now.toISOString(),
        trial_end_date: trialEnd.toISOString(),
        preferences: {},
        healthMetrics: {},
        earnedBadges: [],
        subscription_id: null
    };
}
function filterMutableFields(payload) {
    const updates = {};
    for (const [key, value] of Object.entries(payload)) {
        if (!MUTABLE_FIELDS.has(key)) {
            continue;
        }
        switch (key) {
            case 'display_name':
                if (typeof value === 'string' || value === null) {
                    updates.display_name = value;
                }
                break;
            case 'onboarding_complete':
                if (typeof value === 'boolean') {
                    updates.onboarding_complete = value;
                }
                break;
            case 'preferences':
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    updates.preferences = value;
                }
                break;
            case 'healthMetrics':
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    updates.healthMetrics = value;
                }
                break;
            case 'earnedBadges':
                if (Array.isArray(value)) {
                    updates.earnedBadges = value.map(String);
                }
                break;
            default:
                break;
        }
    }
    return updates;
}
async function createUser(req, res) {
    if (req.method !== 'POST') {
        res.status(405).send({ error: 'Method Not Allowed' });
        return;
    }
    try {
        const { uid, email } = await authenticateRequest(req);
        const body = (req.body ?? {});
        const serviceClient = (0, supabaseClient_1.getServiceClient)();
        const existing = await serviceClient.from('users').select('*').eq('id', uid).maybeSingle();
        if (existing.error) {
            throw existing.error;
        }
        if (existing.data) {
            res.status(200).json({ user: existing.data });
            return;
        }
        const profile = buildUserInsert(uid, email, body.display_name ?? null);
        const { data, error } = await serviceClient.from('users').insert(profile).select().single();
        if (error) {
            throw error;
        }
        res.status(201).json({ user: data });
    }
    catch (error) {
        const { status, message } = resolveError(error);
        res.status(status).json({ error: message });
    }
}
async function getCurrentUser(req, res) {
    if (req.method !== 'GET') {
        res.status(405).send({ error: 'Method Not Allowed' });
        return;
    }
    try {
        const { uid } = await authenticateRequest(req);
        const supabase = (0, supabaseClient_1.getUserClient)(uid);
        const { data, error } = await supabase.from('users').select('*').eq('id', uid).single();
        if (error) {
            throw error;
        }
        res.status(200).json({ user: data });
    }
    catch (error) {
        const { status, message } = resolveError(error);
        res.status(status).json({ error: message });
    }
}
async function updateCurrentUser(req, res) {
    if (req.method !== 'PATCH') {
        res.status(405).send({ error: 'Method Not Allowed' });
        return;
    }
    if (!(0, http_1.isPatchPayloadAllowed)(req.body)) {
        res.status(400).json({ error: 'Invalid request payload' });
        return;
    }
    try {
        const { uid } = await authenticateRequest(req);
        const updates = filterMutableFields(req.body);
        if (Object.keys(updates).length === 0) {
            res.status(400).json({ error: 'No mutable fields provided' });
            return;
        }
        const supabase = (0, supabaseClient_1.getUserClient)(uid);
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', uid)
            .select()
            .single();
        if (error) {
            throw error;
        }
        res.status(200).json({ user: data });
    }
    catch (error) {
        const { status, message } = resolveError(error);
        res.status(status).json({ error: message });
    }
}
