import { Request, Response } from 'express';
import type { PostgrestError } from '@supabase/supabase-js';
import { getServiceClient } from './supabaseClient';
import { verifyFirebaseToken } from './firebaseAdmin';
import { extractBearerToken } from './utils/http';

interface ModuleSummary {
  id: string;
  name: string;
  tier: string;
  headline: string;
  description: string;
  icon_svg?: string | null;
  outcomeMetric?: string | null;
  starterProtocols?: string[] | null;
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
 * GET /api/modules?tier=core
 *
 * Returns list of modules, optionally filtered by tier.
 * Supports query parameters:
 * - tier: Filter by tier (core, pro, elite)
 *
 * Blueprint Reference: MISSION_009 - Module & Protocol Definition
 *                      Section 3.1 - MVP Life Domains (Modules)
 */
export async function getModules(req: Request, res: Response): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).send({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const serviceClient = getServiceClient();
    const tierFilter = req.query.tier as string | undefined;

    // Build query
    let query = serviceClient
      .from('modules')
      .select('id, name, tier, headline, description, icon_svg, outcome_metric, starter_protocols')
      .order('tier', { ascending: true })
      .order('name', { ascending: true });

    // Apply tier filter if provided
    if (tierFilter && ['core', 'pro', 'elite'].includes(tierFilter)) {
      query = query.eq('tier', tierFilter);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Map to ModuleSummary format (matching client expectations)
    // Database uses snake_case, client expects camelCase
    const modules: ModuleSummary[] = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      tier: row.tier,
      headline: row.headline || '',
      description: row.description || '',
      icon_svg: row.icon_svg,
      outcomeMetric: row.outcome_metric,
      starterProtocols: row.starter_protocols
    }));

    res.status(200).json(modules);

  } catch (error) {
    const { status, message } = resolveError(error);
    res.status(status).json({ error: message });
  }
}

/**
 * PATCH /api/modules/enrollment
 *
 * Updates the user's primary module.
 * Body: { module_id: string }
 *
 * Logic:
 * 1. Authenticate user via Firebase token
 * 2. Look up Supabase user by Firebase UID
 * 3. Verify module exists
 * 4. Check tier access (trial users can only select core modules)
 * 5. Clear existing is_primary flags
 * 6. Upsert enrollment with is_primary: true
 */
export async function updatePrimaryModule(req: Request, res: Response): Promise<void> {
  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // 1. Authenticate user
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Missing bearer token' });
      return;
    }

    const decoded = await verifyFirebaseToken(token);
    const firebaseUid = decoded.uid;

    // 2. Get Supabase user by Firebase UID
    const serviceClient = getServiceClient();
    const { data: userData, error: userError } = await serviceClient
      .from('users')
      .select('id, tier')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (userError || !userData) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const supabaseUserId = userData.id;
    const userTier = userData.tier || 'trial';

    // 3. Parse and validate request body
    const { module_id } = req.body as { module_id?: string };
    if (!module_id || typeof module_id !== 'string') {
      res.status(400).json({ error: 'module_id is required' });
      return;
    }

    // 4. Verify module exists and get its tier
    const { data: moduleData, error: moduleError } = await serviceClient
      .from('modules')
      .select('id, tier, name')
      .eq('id', module_id)
      .single();

    if (moduleError || !moduleData) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }

    // 5. Check tier access - trial users can only select core modules
    if (userTier === 'trial' && moduleData.tier !== 'core') {
      res.status(403).json({
        error: 'Upgrade required to access this module',
        required_tier: moduleData.tier,
      });
      return;
    }

    // 6. Clear existing is_primary flags for this user
    const { error: clearError } = await serviceClient
      .from('module_enrollment')
      .update({ is_primary: false })
      .eq('user_id', supabaseUserId);

    if (clearError) {
      console.error('Failed to clear primary flags:', clearError);
      // Continue - this might fail if no enrollments exist yet
    }

    // 7. Upsert enrollment with is_primary: true
    const { error: upsertError } = await serviceClient
      .from('module_enrollment')
      .upsert(
        {
          user_id: supabaseUserId,
          module_id: module_id,
          is_primary: true,
          enrolled_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,module_id',
        }
      );

    if (upsertError) {
      throw upsertError;
    }

    // 8. Update user preferences with primary module
    // First get current preferences
    const { data: currentUser } = await serviceClient
      .from('users')
      .select('preferences')
      .eq('id', supabaseUserId)
      .single();

    const currentPrefs = (currentUser?.preferences as Record<string, unknown>) || {};
    await serviceClient
      .from('users')
      .update({
        preferences: {
          ...currentPrefs,
          primary_module_id: module_id,
        },
      })
      .eq('id', supabaseUserId);

    res.status(200).json({
      success: true,
      module_id: module_id,
      module_name: moduleData.name,
    });

  } catch (error) {
    const { status, message } = resolveError(error);
    res.status(status).json({ error: message });
  }
}
