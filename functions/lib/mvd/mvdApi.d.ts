/**
 * MVD API Handlers
 *
 * HTTP endpoints for manual MVD control.
 * Allows users to activate "Tough Day" mode and check status.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 6
 */
import { Request, Response } from 'express';
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
export declare function activateMVDManually(req: Request, res: Response): Promise<void>;
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
export declare function getMVDStatus(req: Request, res: Response): Promise<void>;
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
export declare function deactivateMVDManually(req: Request, res: Response): Promise<void>;
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
export declare function triggerMVDDetection(req: Request, res: Response): Promise<void>;
