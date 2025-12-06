/**
 * Recovery Score API Endpoint
 *
 * GET /api/recovery?date=YYYY-MM-DD
 *
 * Returns recovery score for authenticated user. Works for both:
 * - Wearable users: Full recovery score with 5+ biometric components
 * - Lite Mode users: Check-in score with 3 self-reported components
 *
 * The endpoint detects the user's data source and returns the appropriate
 * score format. Client uses `isLiteMode` flag to render the correct UI.
 *
 * @file functions/src/recovery.ts
 * @author Claude Opus 4.5 (Session 49)
 * @created December 5, 2025
 */
import { Request, Response } from 'express';
/**
 * GET /api/recovery?date=YYYY-MM-DD
 *
 * Returns recovery score for the authenticated user.
 */
export declare function getRecoveryScore(req: Request, res: Response): Promise<void>;
