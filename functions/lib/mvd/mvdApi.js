"use strict";
/**
 * MVD API Handlers
 *
 * HTTP endpoints for manual MVD control.
 * Allows users to activate "Tough Day" mode and check status.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 6
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateMVDManually = activateMVDManually;
exports.getMVDStatus = getMVDStatus;
exports.deactivateMVDManually = deactivateMVDManually;
exports.triggerMVDDetection = triggerMVDDetection;
const firebaseAdmin_1 = require("../firebaseAdmin");
const index_1 = require("./index");
const mvdProtocols_1 = require("./mvdProtocols");
/**
 * Helper: Extract and verify user ID from Authorization header
 */
async function extractUserId(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    const idToken = authHeader.substring(7);
    try {
        const decoded = await (0, firebaseAdmin_1.verifyFirebaseToken)(idToken);
        return decoded.uid;
    }
    catch (error) {
        console.error('[MVD API] Token verification failed:', error);
        return null;
    }
}
/**
 * POST /api/mvd/activate
 *
 * Manually activate MVD mode ("Tough Day" button).
 * Defaults to 'full' MVD type unless specified.
 *
 * Request body (optional):
 * {
 *   "mvdType": "full" | "semi_active" | "travel"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "mvdState": { ... },
 *   "description": "..."
 * }
 */
async function activateMVDManually(req, res) {
    const userId = await extractUserId(req);
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        // Check if already active
        const currentState = await (0, index_1.getMVDState)(userId);
        if (currentState?.mvd_active) {
            res.status(400).json({
                error: 'MVD already active',
                mvdState: currentState,
                description: currentState.mvd_type
                    ? (0, mvdProtocols_1.getMVDTypeDescription)(currentState.mvd_type)
                    : undefined,
            });
            return;
        }
        // Get MVD type from request body, default to 'full'
        const requestedType = req.body?.mvdType;
        const mvdType = requestedType || 'full';
        // Validate MVD type
        if (!['full', 'semi_active', 'travel'].includes(mvdType)) {
            res.status(400).json({
                error: 'Invalid mvdType. Must be: full, semi_active, or travel',
            });
            return;
        }
        // Activate MVD
        const trigger = 'manual_activation';
        const exitCondition = 'Recovery >50% or manual deactivation';
        await (0, index_1.activateMVD)(userId, mvdType, trigger, exitCondition);
        // Fetch updated state
        const newState = await (0, index_1.getMVDState)(userId);
        res.status(200).json({
            success: true,
            mvdState: newState,
            description: (0, mvdProtocols_1.getMVDTypeDescription)(mvdType),
            protocolCount: (0, mvdProtocols_1.getMVDProtocolCount)(mvdType),
        });
    }
    catch (error) {
        console.error('[MVD API] Activation failed:', error);
        res.status(500).json({
            error: 'Failed to activate MVD',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * GET /api/mvd/status
 *
 * Get current MVD status for the authenticated user.
 *
 * Response:
 * {
 *   "active": boolean,
 *   "mvdState": { ... } | null,
 *   "description": "...",
 *   "protocolCount": number
 * }
 */
async function getMVDStatus(req, res) {
    const userId = await extractUserId(req);
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const mvdState = await (0, index_1.getMVDState)(userId);
        const summary = await (0, index_1.getMVDStatusSummary)(userId);
        if (mvdState?.mvd_active && mvdState.mvd_type) {
            res.status(200).json({
                active: true,
                mvdState,
                summary,
                description: (0, mvdProtocols_1.getMVDTypeDescription)(mvdState.mvd_type),
                protocolCount: (0, mvdProtocols_1.getMVDProtocolCount)(mvdState.mvd_type),
            });
        }
        else {
            res.status(200).json({
                active: false,
                mvdState: null,
                summary,
                description: 'Full protocol access available',
                protocolCount: null,
            });
        }
    }
    catch (error) {
        console.error('[MVD API] Status check failed:', error);
        res.status(500).json({
            error: 'Failed to get MVD status',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * POST /api/mvd/deactivate
 *
 * Manually deactivate MVD mode.
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "MVD deactivated"
 * }
 */
async function deactivateMVDManually(req, res) {
    const userId = await extractUserId(req);
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const currentState = await (0, index_1.getMVDState)(userId);
        if (!currentState?.mvd_active) {
            res.status(400).json({
                error: 'MVD is not active',
                success: false,
            });
            return;
        }
        await (0, index_1.deactivateMVD)(userId, 'Manual deactivation by user');
        res.status(200).json({
            success: true,
            message: 'MVD deactivated - full protocol access restored',
        });
    }
    catch (error) {
        console.error('[MVD API] Deactivation failed:', error);
        res.status(500).json({
            error: 'Failed to deactivate MVD',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * POST /api/mvd/detect
 *
 * Trigger MVD detection manually (for testing/debugging).
 * Returns detection result without necessarily activating.
 *
 * Request body (optional):
 * {
 *   "deviceTimezone": "America/Los_Angeles"
 * }
 *
 * Response:
 * {
 *   "shouldActivate": boolean,
 *   "trigger": string | null,
 *   "mvdType": string | null,
 *   "reason": string
 * }
 */
async function triggerMVDDetection(req, res) {
    const userId = await extractUserId(req);
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const deviceTimezone = req.body?.deviceTimezone;
        const context = await (0, index_1.buildMVDDetectionContext)(userId, deviceTimezone ?? null, false // Not manual activation - just detection
        );
        const result = await (0, index_1.detectAndMaybeActivateMVD)(context);
        res.status(200).json({
            shouldActivate: result.shouldActivate,
            wasActivated: result.wasActivated,
            trigger: result.trigger,
            mvdType: result.mvdType,
            exitCondition: result.exitCondition,
            reason: result.reason,
        });
    }
    catch (error) {
        console.error('[MVD API] Detection failed:', error);
        res.status(500).json({
            error: 'Failed to run MVD detection',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
