"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinWaitlist = joinWaitlist;
const firebaseAdmin_1 = require("./firebaseAdmin");
const supabaseClient_1 = require("./supabaseClient");
const http_1 = require("./utils/http");
const ALLOWED_TIERS = new Set(['pro', 'elite']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function normalizeEmail(value) {
    return value.trim().toLowerCase();
}
function resolveDatabaseError(error) {
    if (error) {
        throw error;
    }
    throw new Error('Failed to save waitlist entry');
}
/**
 * Handles POST /api/waitlist requests to enroll interested users in the premium tier waitlist.
 */
async function joinWaitlist(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    const token = (0, http_1.extractBearerToken)(req);
    if (!token) {
        res.status(401).json({ error: 'Missing bearer token' });
        return;
    }
    try {
        await (0, firebaseAdmin_1.verifyFirebaseToken)(token);
    }
    catch {
        res.status(401).json({ error: 'Invalid bearer token' });
        return;
    }
    const payload = (req.body ?? {});
    const email = typeof payload.email === 'string' ? normalizeEmail(payload.email) : null;
    const tier = typeof payload.tier_interested_in === 'string' ? payload.tier_interested_in : null;
    if (!email || !EMAIL_PATTERN.test(email)) {
        res.status(400).json({ error: 'Valid email is required' });
        return;
    }
    if (!tier || !ALLOWED_TIERS.has(tier)) {
        res.status(400).json({ error: 'Tier must be "pro" or "elite"' });
        return;
    }
    try {
        const supabase = (0, supabaseClient_1.getServiceClient)();
        const { error } = await supabase
            .from('waitlist_entry')
            .upsert({ email, tier_interested_in: tier }, { onConflict: 'email' });
        if (error) {
            resolveDatabaseError(error);
        }
        res.status(201).json({ success: true });
    }
    catch (error) {
        console.error('Failed to store waitlist entry', error);
        res.status(500).json({ error: 'Failed to save waitlist entry' });
    }
}
