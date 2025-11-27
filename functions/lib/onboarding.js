"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeOnboarding = completeOnboarding;
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
 * POST /api/onboarding/complete
 *
 * Completes user onboarding by:
 * 1. Setting onboarding_complete = true on user profile
 * 2. Creating module_enrollment record for selected primary module
 * 3. Initializing trial dates if not already set
 *
 * Blueprint Reference: MISSION_003 - Module-Aware Onboarding Flow
 */
async function completeOnboarding(req, res) {
    if (req.method !== 'POST') {
        res.status(405).send({ error: 'Method Not Allowed' });
        return;
    }
    try {
        const { uid } = await (0, users_1.authenticateRequest)(req);
        const body = req.body;
        if (!body.primary_module_id || typeof body.primary_module_id !== 'string') {
            res.status(400).json({ error: 'primary_module_id is required' });
            return;
        }
        const serviceClient = (0, supabaseClient_1.getServiceClient)();
        // 1. Fetch current user profile (query by firebase_uid)
        const { data: user, error: userError } = await serviceClient
            .from('users')
            .select('*')
            .eq('firebase_uid', uid)
            .single();
        if (userError || !user) {
            throw userError || new Error('User not found');
        }
        // 2. Verify module exists
        const { data: module, error: moduleError } = await serviceClient
            .from('modules')
            .select('id, name, tier')
            .eq('id', body.primary_module_id)
            .single();
        if (moduleError || !module) {
            res.status(404).json({ error: 'Module not found' });
            return;
        }
        // 3. Update user profile to mark onboarding complete (use Supabase UUID)
        const { error: updateError } = await serviceClient
            .from('users')
            .update({
            onboarding_complete: true,
            preferences: {
                ...(user.preferences || {}),
                primary_module_id: body.primary_module_id
            }
        })
            .eq('id', user.id);
        if (updateError) {
            throw updateError;
        }
        // 4. Check if enrollment already exists (use Supabase UUID for foreign key)
        const { data: existingEnrollment } = await serviceClient
            .from('module_enrollment')
            .select('*')
            .eq('user_id', user.id)
            .eq('module_id', body.primary_module_id)
            .maybeSingle();
        if (!existingEnrollment) {
            // 5. Create module enrollment (use Supabase UUID for user_id foreign key)
            const now = new Date();
            const enrollment = {
                user_id: user.id,
                module_id: body.primary_module_id,
                is_primary: true,
                enrolled_at: now.toISOString(),
                currentStreak: 0,
                longestStreak: 0,
                lastActiveDate: now.toISOString(),
                progressPct: 0,
                streakFreezeAvailable: true,
                streakFreezeUsedDate: null
            };
            const { error: enrollmentError } = await serviceClient
                .from('module_enrollment')
                .insert(enrollment);
            if (enrollmentError) {
                throw enrollmentError;
            }
        }
        // 6. Return success with trial dates
        res.status(200).json({
            success: true,
            trial_start_date: user.trial_start_date,
            trial_end_date: user.trial_end_date,
            primary_module_id: body.primary_module_id
        });
    }
    catch (error) {
        const { status, message } = resolveError(error);
        res.status(status).json({ error: message });
    }
}
