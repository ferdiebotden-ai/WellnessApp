import { Request, Response } from 'express';
import type { PostgrestError } from '@supabase/supabase-js';
import { getServiceClient } from './supabaseClient';

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
      .select('id, name, tier, headline, description, icon_svg, outcomeMetric, starterProtocols')
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
    const modules: ModuleSummary[] = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      tier: row.tier,
      headline: row.headline || '',
      description: row.description || '',
      icon_svg: row.icon_svg,
      outcomeMetric: row.outcomeMetric,
      starterProtocols: row.starterProtocols
    }));

    res.status(200).json(modules);

  } catch (error) {
    const { status, message } = resolveError(error);
    res.status(status).json({ error: message });
  }
}
