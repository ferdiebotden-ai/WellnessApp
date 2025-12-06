/**
 * Manual Check-in API Endpoints
 *
 * POST /api/manual-check-in — Submit a morning check-in
 * GET /api/manual-check-in/today — Get today's check-in
 *
 * These endpoints handle manual wellness check-ins for Lite Mode users
 * (users without wearables). Check-ins collect sleep quality, sleep hours,
 * and energy level to produce a "Check-in Score".
 *
 * @file functions/src/manualCheckIn.ts
 * @author Claude Opus 4.5 (Session 49)
 * @created December 5, 2025
 */
import { Request, Response } from 'express';
/**
 * Submit a manual check-in.
 *
 * Request body:
 * - sleepQuality: 1-5 (required)
 * - sleepHours: '<5' | '5-6' | '6-7' | '7-8' | '8+' (required)
 * - energyLevel: 1-5 (required)
 * - wakeTime: ISO timestamp (optional)
 * - timezone: IANA timezone (optional)
 * - skipped: boolean (optional, use defaults if true)
 */
export declare function submitManualCheckIn(req: Request, res: Response): Promise<void>;
/**
 * Get today's check-in for the authenticated user.
 */
export declare function getTodayCheckIn(req: Request, res: Response): Promise<void>;
