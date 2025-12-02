import { Request, Response } from 'express';
import type { PostgrestError } from '@supabase/supabase-js';
import { getServiceClient } from './supabaseClient';
import { authenticateRequest } from './users';

type PrimaryGoal = 'better_sleep' | 'more_energy' | 'sharper_focus' | 'faster_recovery';
type WearableSource = 'oura' | 'whoop' | 'apple_health' | 'google_fit' | 'garmin';

interface OnboardingCompleteRequest {
  primary_goal: PrimaryGoal;
  wearable_source?: WearableSource | null;
  primary_module_id?: string;
}

/** Maps primary goals to their corresponding module IDs */
const GOAL_TO_MODULE_MAP: Record<PrimaryGoal, string> = {
  better_sleep: 'sleep_foundations',
  more_energy: 'metabolic_reset',
  sharper_focus: 'metabolic_reset',
  faster_recovery: 'stress_resilience',
};

interface ModuleEnrollmentInsert {
  user_id: string;
  module_id: string;
  is_primary: boolean;
  enrolled_at: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  progressPct: number;
  streakFreezeAvailable: boolean;
  streakFreezeUsedDate?: string | null;
}

function resolveError(error: unknown): { status: number; message: string } {
  if (typeof error === 'object' && error !== null) {
    const maybeStatus = (error as { status?: number }).status;
    if (typeof maybeStatus === 'number') {
      return { status: maybeStatus, message: (error as Error).message };
    }

    const maybePostgrest = error as PostgrestError;
    if (typeof maybePostgrest.code === 'string') {
      return { status: 400, message: maybePostgrest.message };
    }
  }

  return { status: 500, message: (error as Error).message };
}

/**
 * POST /api/onboarding/complete
 *
 * Completes user onboarding with conversational AI flow data:
 * 1. Storing primary_goal and wearable_source on user profile
 * 2. Setting onboarding_complete = true
 * 3. Creating module_enrollment record for goal-mapped module
 *
 * Accepts:
 * - primary_goal: User's wellness focus (better_sleep, more_energy, sharper_focus, faster_recovery)
 * - wearable_source: Optional wearable device (oura, whoop, apple_health, google_fit, garmin)
 * - primary_module_id: Optional explicit module (defaults to goal→module mapping)
 */
export async function completeOnboarding(req: Request, res: Response): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { uid } = await authenticateRequest(req);
    const body = req.body as OnboardingCompleteRequest;

    // Validate primary_goal (required)
    const validGoals: PrimaryGoal[] = ['better_sleep', 'more_energy', 'sharper_focus', 'faster_recovery'];
    if (!body.primary_goal || !validGoals.includes(body.primary_goal)) {
      res.status(400).json({ error: 'primary_goal is required and must be one of: better_sleep, more_energy, sharper_focus, faster_recovery' });
      return;
    }

    // Validate wearable_source (optional)
    const validWearables: WearableSource[] = ['oura', 'whoop', 'apple_health', 'google_fit', 'garmin'];
    if (body.wearable_source && !validWearables.includes(body.wearable_source)) {
      res.status(400).json({ error: 'wearable_source must be one of: oura, whoop, apple_health, google_fit, garmin' });
      return;
    }

    // Derive module from goal if not explicitly provided
    const primaryModuleId = body.primary_module_id || GOAL_TO_MODULE_MAP[body.primary_goal];
    const wearableSource = body.wearable_source ?? null;

    const serviceClient = getServiceClient();

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

    // 3. Update user profile with goal, wearable, and mark onboarding complete
    const { error: updateError } = await serviceClient
      .from('users')
      .update({
        onboarding_complete: true,
        primary_goal: body.primary_goal,
        wearable_source: wearableSource,
        preferences: {
          ...((user.preferences as Record<string, unknown>) || {}),
          primary_module_id: primaryModuleId
        }
      })
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
      const enrollment: ModuleEnrollmentInsert = {
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
      wearable_source: wearableSource
    });

  } catch (error) {
    const { status, message } = resolveError(error);
    res.status(status).json({ error: message });
  }
}
