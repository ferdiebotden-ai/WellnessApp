import { Request, Response } from 'express';
/**
 * POST /api/onboarding/complete
 *
 * Completes user onboarding by:
 * 1. Setting onboarding_complete = true on user profile
 * 2. Creating module_enrollment record for selected primary module
 * 3. Initializing trial dates if not already set
 *
 * Blueprint Reference: MISSION_003 - Module-Aware Onboarding Flow
 */
export declare function completeOnboarding(req: Request, res: Response): Promise<void>;
