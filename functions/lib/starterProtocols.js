"use strict";
/**
 * Starter Protocols Endpoint
 *
 * Returns protocols marked as "starter" for a given module.
 * Used during onboarding to show users which protocols they can add.
 *
 * GET /api/modules/:moduleId/starter-protocols
 *
 * Response: StarterProtocol[]
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStarterProtocols = getStarterProtocols;
exports.getModuleProtocols = getModuleProtocols;
const supabaseClient_1 = require("./supabaseClient");
/**
 * Get default scheduled time based on protocol category.
 * Foundation protocols (light, sleep) → morning
 * Performance protocols (caffeine, movement) → mid-morning
 * Recovery protocols (NSDR, breathwork) → afternoon
 * Optimization protocols (supplements, focus) → varies
 * Meta protocols (reflection) → evening
 */
function getDefaultTimeForCategory(category) {
    switch (category) {
        case 'Foundation':
            return '07:00'; // Morning light, sleep-related
        case 'Performance':
            return '10:00'; // Mid-morning for energy/focus protocols
        case 'Recovery':
            return '14:00'; // Afternoon for NSDR, breathwork
        case 'Optimization':
            return '09:00'; // Morning for supplements, focus
        case 'Meta':
            return '20:00'; // Evening for reflection, accountability
        default:
            return '12:00'; // Noon as fallback
    }
}
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
 * GET /api/modules/:moduleId/starter-protocols
 *
 * Returns starter protocols for a given module.
 * No authentication required - public endpoint.
 */
async function getStarterProtocols(req, res) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    try {
        const { moduleId } = req.params;
        if (!moduleId || typeof moduleId !== 'string') {
            res.status(400).json({ error: 'moduleId is required' });
            return;
        }
        const serviceClient = (0, supabaseClient_1.getServiceClient)();
        // Query module_protocol_map joined with protocols
        // Filter by is_starter_protocol = true
        const { data, error } = await serviceClient
            .from('module_protocol_map')
            .select(`
        protocol_id,
        protocols (
          id,
          name,
          short_name,
          summary,
          category
        )
      `)
            .eq('module_id', moduleId)
            .eq('is_starter_protocol', true);
        if (error) {
            throw error;
        }
        // Transform to StarterProtocol format
        const starterProtocols = (data || [])
            .filter((row) => row.protocols) // Ensure protocol exists
            .map((row) => ({
            id: row.protocols.id,
            name: row.protocols.name,
            short_name: row.protocols.short_name,
            summary: row.protocols.summary,
            category: row.protocols.category,
            default_time: getDefaultTimeForCategory(row.protocols.category),
        }));
        res.status(200).json(starterProtocols);
    }
    catch (error) {
        console.error('getStarterProtocols error:', error);
        const { status, message } = resolveError(error);
        res.status(status).json({ error: message });
    }
}
/**
 * GET /api/modules/:moduleId/protocols
 *
 * Returns ALL protocols for a given module (not just starters).
 * Used in ModuleProtocolsScreen to show all available protocols.
 * Includes user enrollment status if authenticated.
 */
async function getModuleProtocols(req, res) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    try {
        const { moduleId } = req.params;
        if (!moduleId || typeof moduleId !== 'string') {
            res.status(400).json({ error: 'moduleId is required' });
            return;
        }
        const serviceClient = (0, supabaseClient_1.getServiceClient)();
        // Query all protocols for this module
        const { data, error } = await serviceClient
            .from('module_protocol_map')
            .select(`
        protocol_id,
        is_starter_protocol,
        tier_required,
        protocols (
          id,
          name,
          short_name,
          summary,
          category,
          evidence_level,
          duration_minutes,
          implementation_methods
        )
      `)
            .eq('module_id', moduleId);
        if (error) {
            throw error;
        }
        // Transform to response format
        const protocols = (data || [])
            .filter((row) => row.protocols)
            .map((row) => ({
            id: row.protocols.id,
            name: row.protocols.name,
            short_name: row.protocols.short_name,
            summary: row.protocols.summary,
            category: row.protocols.category,
            evidence_level: row.protocols.evidence_level,
            duration_minutes: row.protocols.duration_minutes,
            implementation_methods: row.protocols.implementation_methods,
            is_starter_protocol: row.is_starter_protocol,
            tier_required: row.tier_required,
            default_time: getDefaultTimeForCategory(row.protocols.category),
        }));
        res.status(200).json(protocols);
    }
    catch (error) {
        console.error('getModuleProtocols error:', error);
        const { status, message } = resolveError(error);
        res.status(status).json({ error: message });
    }
}
