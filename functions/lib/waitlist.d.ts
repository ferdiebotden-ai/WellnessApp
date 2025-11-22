import { Request, Response } from 'express';
/**
 * Handles POST /api/waitlist requests to enroll interested users in the premium tier waitlist.
 */
export declare function joinWaitlist(req: Request, res: Response): Promise<void>;
