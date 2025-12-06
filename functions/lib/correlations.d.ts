/**
 * Correlations API Endpoint
 *
 * Returns user's protocol-outcome correlations from the most recent weekly synthesis.
 * Per PRD Section 5.8 - Correlation Dashboard.
 */
import { Request, Response } from 'express';
/**
 * GET /api/users/me/correlations
 *
 * Returns the user's protocol-outcome correlations from their most recent weekly synthesis.
 * If no synthesis exists, returns empty correlations with days_tracked = 0.
 */
export declare function getUserCorrelations(req: Request, res: Response): Promise<void>;
