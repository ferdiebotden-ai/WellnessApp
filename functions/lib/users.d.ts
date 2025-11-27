import { Request, Response } from 'express';
interface UserProfileInsert {
    firebase_uid: string;
    email?: string | null;
    display_name?: string | null;
    tier?: string;
    trial_start_date?: string | null;
    trial_end_date?: string | null;
    onboarding_complete?: boolean;
    preferences?: Record<string, unknown>;
    healthMetrics?: Record<string, unknown>;
    earnedBadges?: string[];
    subscription_id?: string | null;
}
declare function authenticateRequest(req: Request): Promise<{
    uid: string;
    email?: string | null;
}>;
declare function buildUserInsert(uid: string, email?: string | null, displayName?: string | null): UserProfileInsert;
declare function filterMutableFields(payload: Record<string, unknown>): Partial<UserProfileInsert>;
export declare function createUser(req: Request, res: Response): Promise<void>;
export declare function getCurrentUser(req: Request, res: Response): Promise<void>;
export declare function updateCurrentUser(req: Request, res: Response): Promise<void>;
export { filterMutableFields, buildUserInsert, authenticateRequest };
