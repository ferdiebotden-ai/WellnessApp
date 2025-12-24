import { Request, Response } from 'express';
/**
 * Determines the default schedule time based on protocol ID/name patterns.
 * Returns time in HH:MM format (UTC).
 *
 * Logic:
 * - Morning light, foundation protocols → 07:00
 * - Exercise, cold exposure → 10:00
 * - Breathwork, meditation → 13:00
 * - Wind down, sleep prep → 21:00
 * - Others → 12:00
 */
export declare function getDefaultTimeForProtocol(protocolId: string, category: string): string;
/**
 * POST /api/protocols/:id/enroll
 *
 * Adds a protocol to the user's daily schedule with intelligent default timing.
 * Body (optional): { module_id?: string, time?: string }
 * - time: Custom schedule time in "HH:MM" format (overrides intelligent default)
 *
 * Returns: { enrolled: true, protocol_id, default_time, protocol_name }
 */
export declare function enrollProtocol(req: Request, res: Response): Promise<void>;
/**
 * DELETE /api/protocols/:id/enroll
 *
 * Removes a protocol from the user's schedule (soft delete).
 * Sets is_active = false to preserve history.
 *
 * Returns: { enrolled: false, protocol_id }
 */
export declare function unenrollProtocol(req: Request, res: Response): Promise<void>;
/**
 * GET /api/user/enrolled-protocols
 *
 * Returns all active protocol enrollments for the authenticated user.
 * Includes full protocol details for display in the browser screen.
 *
 * Returns: EnrolledProtocol[]
 */
export declare function getEnrolledProtocols(req: Request, res: Response): Promise<void>;
