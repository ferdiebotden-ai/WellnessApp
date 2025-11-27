import { Request, Response } from 'express';
/**
 * GET /api/users/me/monetization
 *
 * Returns monetization status for current user:
 * - Trial dates
 * - Subscription tier (trial, core, pro, elite, lapsed)
 * - Chat usage (queries used this week vs weekly limit)
 *
 * Blueprint Reference: V3.2 - Tier 1 ($29/mo) includes limited chat (10 queries/week)
 *                       Tier 2 ($59/mo) unlocks unlimited chat
 */
export declare function getMonetizationStatus(req: Request, res: Response): Promise<void>;
