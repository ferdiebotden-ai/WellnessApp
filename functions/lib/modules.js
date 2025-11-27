"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModules = getModules;
const supabaseClient_1 = require("./supabaseClient");
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
 * GET /api/modules?tier=core
 *
 * Returns list of modules, optionally filtered by tier.
 * Supports query parameters:
 * - tier: Filter by tier (core, pro, elite)
 *
 * Blueprint Reference: MISSION_009 - Module & Protocol Definition
 *                      Section 3.1 - MVP Life Domains (Modules)
 */
async function getModules(req, res) {
    if (req.method !== 'GET') {
        res.status(405).send({ error: 'Method Not Allowed' });
        return;
    }
    try {
        const serviceClient = (0, supabaseClient_1.getServiceClient)();
        const tierFilter = req.query.tier;
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
        const modules = (data || []).map((row) => ({
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
    }
    catch (error) {
        const { status, message } = resolveError(error);
        res.status(status).json({ error: message });
    }
}
