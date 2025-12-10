import { Request, Response } from 'express';
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
export declare function getModules(req: Request, res: Response): Promise<void>;
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
export declare function updatePrimaryModule(req: Request, res: Response): Promise<void>;
