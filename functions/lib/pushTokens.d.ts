/**
 * Push Token API Handlers
 *
 * Handles registration and deactivation of Expo Push Tokens.
 * Tokens are stored in user_push_tokens table for server-side push delivery.
 */
import type { Request, Response } from 'express';
/**
 * POST /api/push-tokens
 * Register or update a push token for the authenticated user.
 */
export declare function registerPushToken(req: Request, res: Response): Promise<void>;
/**
 * DELETE /api/push-tokens
 * Deactivate all push tokens for the authenticated user.
 */
export declare function deactivatePushTokens(req: Request, res: Response): Promise<void>;
