"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeOnboarding = completeOnboarding;
const supabaseClient_1 = require("./supabaseClient");
const users_1 = require("./users");
/** Maps primary goals to their corresponding module IDs */
const GOAL_TO_MODULE_MAP = {
    better_sleep: 'sleep_foundations',
    more_energy: 'metabolic_reset',
    sharper_focus: 'metabolic_reset',
    faster_recovery: 'stress_resilience',
};
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
 * Completes user onboarding with conversational AI flow data:
 * 1. Storing primary_goal, wearable_source, and biometrics on user profile
 * 2. Setting onboarding_complete = true
 * 3. Creating module_enrollment record for goal-mapped module
 *
 * Accepts:
 * - primary_goal: User's wellness focus (better_sleep, more_energy, sharper_focus, faster_recovery)
 * - wearable_source: Optional wearable device (oura, whoop, apple_health, google_fit, garmin)
 * - primary_module_id: Optional explicit module (defaults to goal→module mapping)
 * - biometrics: Optional biometric profile (birthDate, biologicalSex, heightCm, weightKg, timezone)
 */
async function completeOnboarding(req, res) {
    if (req.method !== 'POST') {
        res.status(405).send({ error: 'Method Not Allowed' });
        return;
    }
    try {
        const { uid } = await (0, users_1.authenticateRequest)(req);
        const body = req.body;
        // Validate primary_goal (required)
        const validGoals = ['better_sleep', 'more_energy', 'sharper_focus', 'faster_recovery'];
        if (!body.primary_goal || !validGoals.includes(body.primary_goal)) {
            res.status(400).json({ error: 'primary_goal is required and must be one of: better_sleep, more_energy, sharper_focus, faster_recovery' });
            return;
        }
        // Validate wearable_source (optional)
        const validWearables = ['oura', 'whoop', 'apple_health', 'google_fit', 'garmin'];
        if (body.wearable_source && !validWearables.includes(body.wearable_source)) {
            res.status(400).json({ error: 'wearable_source must be one of: oura, whoop, apple_health, google_fit, garmin' });
            return;
        }
        // Derive module from goal if not explicitly provided
        const primaryModuleId = body.primary_module_id || GOAL_TO_MODULE_MAP[body.primary_goal];
        const wearableSource = body.wearable_source ?? null;
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
            .eq('id', primaryModuleId)
            .single();
        if (moduleError || !module) {
            res.status(404).json({ error: `Module '${primaryModuleId}' not found` });
            return;
        }
        // 3. Build user profile update with goal, wearable, biometrics, and mark onboarding complete
        const biometrics = body.biometrics;
        // Build update object
        const updateData = {
            onboarding_complete: true,
            primary_goal: body.primary_goal,
            wearable_source: wearableSource,
            preferences: {
                ...(user.preferences || {}),
                primary_module_id: primaryModuleId
            }
        };
        // Add biometric fields if provided
        if (biometrics) {
            if (biometrics.birthDate) {
                updateData.birth_date = biometrics.birthDate;
            }
            if (biometrics.biologicalSex) {
                updateData.biological_sex = biometrics.biologicalSex;
            }
            if (biometrics.heightCm !== null && biometrics.heightCm > 0) {
                updateData.height_cm = Math.round(biometrics.heightCm);
            }
            if (biometrics.weightKg !== null && biometrics.weightKg > 0) {
                updateData.weight_kg = Math.round(biometrics.weightKg * 100) / 100; // 2 decimal places
                updateData.weight_updated_at = new Date().toISOString();
            }
            if (biometrics.timezone) {
                updateData.timezone = biometrics.timezone;
            }
        }
        const { error: updateError } = await serviceClient
            .from('users')
            .update(updateData)
            .eq('id', user.id);
        if (updateError) {
            throw updateError;
        }
        // 4. Check if enrollment already exists
        const { data: existingEnrollment } = await serviceClient
            .from('module_enrollment')
            .select('*')
            .eq('user_id', user.id)
            .eq('module_id', primaryModuleId)
            .maybeSingle();
        if (!existingEnrollment) {
            // 5. Create module enrollment
            const now = new Date();
            const enrollment = {
                user_id: user.id,
                module_id: primaryModuleId,
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
        // 6. Return success with all relevant data
        res.status(200).json({
            success: true,
            trial_start_date: user.trial_start_date,
            trial_end_date: user.trial_end_date,
            primary_module_id: primaryModuleId,
            primary_goal: body.primary_goal,
            wearable_source: wearableSource,
            has_biometrics: !!(biometrics?.birthDate || biometrics?.biologicalSex || biometrics?.heightCm || biometrics?.weightKg),
            timezone: biometrics?.timezone ?? 'UTC'
        });
    }
    catch (error) {
        const { status, message } = resolveError(error);
        res.status(status).json({ error: message });
    }
}
