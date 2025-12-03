/**
 * MVD API Handlers
 *
 * HTTP endpoints for manual MVD control.
 * Allows users to activate "Tough Day" mode and check status.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 6
 */

import { Request, Response } from 'express';
import { verifyFirebaseToken } from '../firebaseAdmin';
import {
  getMVDState,
  activateMVD,
  deactivateMVD,
  buildMVDDetectionContext,
  detectAndMaybeActivateMVD,
  getMVDStatusSummary,
} from './index';
import type { MVDType, MVDTrigger, MVDState } from './types';
import { getMVDTypeDescription, getMVDProtocolCount } from './mvdProtocols';

/**
 * Helper: Extract and verify user ID from Authorization header
 */
async function extractUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const idToken = authHeader.substring(7);
  try {
    const decoded = await verifyFirebaseToken(idToken);
    return decoded.uid;
  } catch (error) {
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
export async function activateMVDManually(
  req: Request,
  res: Response
): Promise<void> {
  const userId = await extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // Check if already active
    const currentState = await getMVDState(userId);
    if (currentState?.mvd_active) {
      res.status(400).json({
        error: 'MVD already active',
        mvdState: currentState,
        description: currentState.mvd_type
          ? getMVDTypeDescription(currentState.mvd_type)
          : undefined,
      });
      return;
    }

    // Get MVD type from request body, default to 'full'
    const requestedType = req.body?.mvdType as MVDType | undefined;
    const mvdType: MVDType = requestedType || 'full';

    // Validate MVD type
    if (!['full', 'semi_active', 'travel'].includes(mvdType)) {
      res.status(400).json({
        error: 'Invalid mvdType. Must be: full, semi_active, or travel',
      });
      return;
    }

    // Activate MVD
    const trigger: MVDTrigger = 'manual_activation';
    const exitCondition = 'Recovery >50% or manual deactivation';

    await activateMVD(userId, mvdType, trigger, exitCondition);

    // Fetch updated state
    const newState = await getMVDState(userId);

    res.status(200).json({
      success: true,
      mvdState: newState,
      description: getMVDTypeDescription(mvdType),
      protocolCount: getMVDProtocolCount(mvdType),
    });
  } catch (error) {
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
export async function getMVDStatus(req: Request, res: Response): Promise<void> {
  const userId = await extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const mvdState = await getMVDState(userId);
    const summary = await getMVDStatusSummary(userId);

    if (mvdState?.mvd_active && mvdState.mvd_type) {
      res.status(200).json({
        active: true,
        mvdState,
        summary,
        description: getMVDTypeDescription(mvdState.mvd_type),
        protocolCount: getMVDProtocolCount(mvdState.mvd_type),
      });
    } else {
      res.status(200).json({
        active: false,
        mvdState: null,
        summary,
        description: 'Full protocol access available',
        protocolCount: null,
      });
    }
  } catch (error) {
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
export async function deactivateMVDManually(
  req: Request,
  res: Response
): Promise<void> {
  const userId = await extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const currentState = await getMVDState(userId);
    if (!currentState?.mvd_active) {
      res.status(400).json({
        error: 'MVD is not active',
        success: false,
      });
      return;
    }

    await deactivateMVD(userId, 'Manual deactivation by user');

    res.status(200).json({
      success: true,
      message: 'MVD deactivated - full protocol access restored',
    });
  } catch (error) {
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
export async function triggerMVDDetection(
  req: Request,
  res: Response
): Promise<void> {
  const userId = await extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const deviceTimezone = req.body?.deviceTimezone as string | undefined;

    const context = await buildMVDDetectionContext(
      userId,
      deviceTimezone ?? null,
      false // Not manual activation - just detection
    );

    const result = await detectAndMaybeActivateMVD(context);

    res.status(200).json({
      shouldActivate: result.shouldActivate,
      wasActivated: result.wasActivated,
      trigger: result.trigger,
      mvdType: result.mvdType,
      exitCondition: result.exitCondition,
      reason: result.reason,
    });
  } catch (error) {
    console.error('[MVD API] Detection failed:', error);
    res.status(500).json({
      error: 'Failed to run MVD detection',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
