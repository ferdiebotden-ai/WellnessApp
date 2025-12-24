"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultTimeForProtocol = getDefaultTimeForProtocol;
exports.enrollProtocol = enrollProtocol;
exports.unenrollProtocol = unenrollProtocol;
exports.getEnrolledProtocols = getEnrolledProtocols;
const supabaseClient_1 = require("./supabaseClient");
const firebaseAdmin_1 = require("./firebaseAdmin");
const http_1 = require("./utils/http");
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
 * Determines the default schedule time based on protocol ID/name patterns.
 * Returns time in HH:MM format (UTC).
 *
 * Logic:
 * - Morning light, foundation protocols → 07:00
 * - Exercise, cold exposure → 10:00
 * - Breathwork, meditation → 13:00
 * - Wind down, sleep prep → 21:00
 * - Others → 12:00
 */
function getDefaultTimeForProtocol(protocolId, category) {
    const id = protocolId.toLowerCase();
    // Morning protocols
    if (id.includes('morning_light') ||
        id.includes('foundation') ||
        id.includes('sunlight') ||
        id.includes('wake')) {
        return '07:00';
    }
    // Mid-morning exercise/cold
    if (id.includes('exercise') ||
        id.includes('cold_exposure') ||
        id.includes('cold_shower') ||
        id.includes('workout')) {
        return '10:00';
    }
    // Midday/afternoon focus
    if (id.includes('breathwork') ||
        id.includes('meditation') ||
        id.includes('nsdr') ||
        id.includes('yoga_nidra') ||
        id.includes('cyclic_sigh')) {
        return '13:00';
    }
    // Evening wind-down
    if (id.includes('wind_down') ||
        id.includes('sleep') ||
        id.includes('evening') ||
        id.includes('magnesium') ||
        id.includes('blue_light')) {
        return '21:00';
    }
    // Category-based fallback
    if (category === 'Foundation') {
        return '07:00';
    }
    if (category === 'Recovery') {
        return '21:00';
    }
    // Default midday
    return '12:00';
}
/**
 * POST /api/protocols/:id/enroll
 *
 * Adds a protocol to the user's daily schedule with intelligent default timing.
 * Body (optional): { module_id?: string, time?: string }
 * - time: Custom schedule time in "HH:MM" format (overrides intelligent default)
 *
 * Returns: { enrolled: true, protocol_id, default_time, protocol_name }
 */
async function enrollProtocol(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    try {
        // 1. Authenticate user
        const token = (0, http_1.extractBearerToken)(req);
        if (!token) {
            res.status(401).json({ error: 'Missing bearer token' });
            return;
        }
        const decoded = await (0, firebaseAdmin_1.verifyFirebaseToken)(token);
        const firebaseUid = decoded.uid;
        // 2. Get Supabase user by Firebase UID
        const serviceClient = (0, supabaseClient_1.getServiceClient)();
        const { data: userData, error: userError } = await serviceClient
            .from('users')
            .select('id')
            .eq('firebase_uid', firebaseUid)
            .single();
        if (userError || !userData) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const supabaseUserId = userData.id;
        // 3. Get protocol ID from URL params
        const protocolId = req.params.id;
        if (!protocolId) {
            res.status(400).json({ error: 'Protocol ID is required' });
            return;
        }
        // 4. Verify protocol exists and get metadata
        const { data: protocolData, error: protocolError } = await serviceClient
            .from('protocols')
            .select('id, name, short_name, category')
            .eq('id', protocolId)
            .single();
        if (protocolError || !protocolData) {
            res.status(404).json({ error: 'Protocol not found' });
            return;
        }
        // 5. Get optional module_id and custom time from body
        const { module_id, time } = (req.body || {});
        // 6. Use custom time if provided, otherwise calculate intelligent default
        const scheduleTime = time || getDefaultTimeForProtocol(protocolId, protocolData.category);
        // 7. Upsert enrollment (reactivate if previously soft-deleted)
        const { error: upsertError } = await serviceClient
            .from('user_protocol_enrollment')
            .upsert({
            user_id: supabaseUserId,
            protocol_id: protocolId,
            module_id: module_id || null,
            default_time_utc: scheduleTime,
            is_active: true,
            enrolled_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id,protocol_id',
        });
        if (upsertError) {
            throw upsertError;
        }
        res.status(200).json({
            enrolled: true,
            protocol_id: protocolId,
            protocol_name: protocolData.name,
            default_time: scheduleTime,
        });
    }
    catch (error) {
        console.error('[enrollProtocol] Error:', error);
        const { status, message } = resolveError(error);
        res.status(status).json({ error: message });
    }
}
/**
 * DELETE /api/protocols/:id/enroll
 *
 * Removes a protocol from the user's schedule (soft delete).
 * Sets is_active = false to preserve history.
 *
 * Returns: { enrolled: false, protocol_id }
 */
async function unenrollProtocol(req, res) {
    if (req.method !== 'DELETE') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    try {
        // 1. Authenticate user
        const token = (0, http_1.extractBearerToken)(req);
        if (!token) {
            res.status(401).json({ error: 'Missing bearer token' });
            return;
        }
        const decoded = await (0, firebaseAdmin_1.verifyFirebaseToken)(token);
        const firebaseUid = decoded.uid;
        // 2. Get Supabase user by Firebase UID
        const serviceClient = (0, supabaseClient_1.getServiceClient)();
        const { data: userData, error: userError } = await serviceClient
            .from('users')
            .select('id')
            .eq('firebase_uid', firebaseUid)
            .single();
        if (userError || !userData) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const supabaseUserId = userData.id;
        // 3. Get protocol ID from URL params
        const protocolId = req.params.id;
        if (!protocolId) {
            res.status(400).json({ error: 'Protocol ID is required' });
            return;
        }
        // 4. Soft delete by setting is_active = false
        const { error: updateError } = await serviceClient
            .from('user_protocol_enrollment')
            .update({ is_active: false })
            .eq('user_id', supabaseUserId)
            .eq('protocol_id', protocolId);
        if (updateError) {
            throw updateError;
        }
        res.status(200).json({
            enrolled: false,
            protocol_id: protocolId,
        });
    }
    catch (error) {
        console.error('[unenrollProtocol] Error:', error);
        const { status, message } = resolveError(error);
        res.status(status).json({ error: message });
    }
}
/**
 * GET /api/user/enrolled-protocols
 *
 * Returns all active protocol enrollments for the authenticated user.
 * Includes full protocol details for display in the browser screen.
 *
 * Returns: EnrolledProtocol[]
 */
async function getEnrolledProtocols(req, res) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    try {
        // 1. Authenticate user
        const token = (0, http_1.extractBearerToken)(req);
        if (!token) {
            res.status(401).json({ error: 'Missing bearer token' });
            return;
        }
        const decoded = await (0, firebaseAdmin_1.verifyFirebaseToken)(token);
        const firebaseUid = decoded.uid;
        // 2. Get Supabase user by Firebase UID
        const serviceClient = (0, supabaseClient_1.getServiceClient)();
        const { data: userData, error: userError } = await serviceClient
            .from('users')
            .select('id')
            .eq('firebase_uid', firebaseUid)
            .single();
        if (userError || !userData) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const supabaseUserId = userData.id;
        // 3. Fetch active enrollments
        const { data: enrollments, error: enrollmentError } = await serviceClient
            .from('user_protocol_enrollment')
            .select('id, protocol_id, module_id, default_time_utc, enrolled_at')
            .eq('user_id', supabaseUserId)
            .eq('is_active', true)
            .order('enrolled_at', { ascending: false });
        if (enrollmentError) {
            throw enrollmentError;
        }
        if (!enrollments || enrollments.length === 0) {
            res.status(200).json([]);
            return;
        }
        // 4. Fetch protocol details for all enrolled protocols
        const protocolIds = enrollments.map((e) => e.protocol_id);
        const { data: protocols, error: protocolError } = await serviceClient
            .from('protocols')
            .select('id, name, short_name, category, summary, duration_minutes, frequency_per_week')
            .in('id', protocolIds);
        if (protocolError) {
            throw protocolError;
        }
        // 5. Map protocols by ID for easy lookup
        const protocolMap = new Map();
        for (const p of protocols || []) {
            protocolMap.set(p.id, p);
        }
        // 6. Build response with full protocol details
        const result = enrollments.map((enrollment) => {
            const protocol = protocolMap.get(enrollment.protocol_id);
            return {
                id: enrollment.id,
                protocol_id: enrollment.protocol_id,
                module_id: enrollment.module_id,
                default_time_utc: enrollment.default_time_utc,
                enrolled_at: enrollment.enrolled_at,
                protocol: protocol || {
                    id: enrollment.protocol_id,
                    name: 'Unknown Protocol',
                    short_name: 'Unknown',
                    category: 'Unknown',
                    summary: '',
                    duration_minutes: null,
                    frequency_per_week: null,
                },
            };
        });
        res.status(200).json(result);
    }
    catch (error) {
        console.error('[getEnrolledProtocols] Error:', error);
        const { status, message } = resolveError(error);
        res.status(status).json({ error: message });
    }
}
