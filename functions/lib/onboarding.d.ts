import { Request, Response } from 'express';
/**
 * POST /api/onboarding/complete
 *
 * Completes user onboarding with conversational AI flow data:
 * 1. Storing primary_goal, wearable_source, and biometrics on user profile
 * 2. Setting onboarding_complete = true
 * 3. Creating module_enrollment record for goal-mapped module
 *
 * Accepts:
 * - primary_goal: User's wellness focus (better_sleep, more_energy, sharper_focus, faster_recovery)
 * - wearable_source: Optional wearable device (oura, whoop, apple_health, google_fit, garmin)
 * - primary_module_id: Optional explicit module (defaults to goal→module mapping)
 * - biometrics: Optional biometric profile (birthDate, biologicalSex, heightCm, weightKg, timezone)
 */
export declare function completeOnboarding(req: Request, res: Response): Promise<void>;
