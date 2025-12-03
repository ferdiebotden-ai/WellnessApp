/**
 * Push Token API Handlers
 *
 * Handles registration and deactivation of Expo Push Tokens.
 * Tokens are stored in user_push_tokens table for server-side push delivery.
 */

import type { Request, Response } from 'express';
import { getServiceClient } from './supabaseClient';
import { verifyFirebaseToken } from './firebaseAdmin';
import { extractBearerToken } from './utils/http';

/**
 * Authenticate request and return user's Supabase UUID.
 */
async function authenticateRequest(req: Request): Promise<string> {
  const token = extractBearerToken(req);
  if (!token) {
    throw Object.assign(new Error('Missing bearer token'), { status: 401 });
  }
  const decoded = await verifyFirebaseToken(token);

  // Get Supabase user ID from Firebase UID
  const supabase = getServiceClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('firebase_uid', decoded.uid)
    .single();

  if (error || !user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  return user.id;
}

/**
 * POST /api/push-tokens
 * Register or update a push token for the authenticated user.
 */
export async function registerPushToken(req: Request, res: Response): Promise<void> {
  let userId: string;
  try {
    userId = await authenticateRequest(req);
  } catch (err) {
    const status = (err as { status?: number }).status || 401;
    res.status(status).json({ error: (err as Error).message });
    return;
  }

  const { expo_push_token, device_type } = req.body;

  if (!expo_push_token || typeof expo_push_token !== 'string') {
    res.status(400).json({ error: 'expo_push_token is required' });
    return;
  }

  if (!expo_push_token.startsWith('ExponentPushToken[')) {
    res.status(400).json({ error: 'Invalid token format' });
    return;
  }

  const validDeviceTypes = ['ios', 'android', 'web'];
  if (device_type && !validDeviceTypes.includes(device_type)) {
    res.status(400).json({ error: 'Invalid device_type' });
    return;
  }

  const supabase = getServiceClient();

  // Upsert the token
  const { error } = await supabase
    .from('user_push_tokens')
    .upsert(
      {
        user_id: userId,
        expo_push_token,
        device_type: device_type || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,expo_push_token',
      }
    );

  if (error) {
    console.error('[PushTokens] Failed to save token:', error);
    res.status(500).json({ error: 'Failed to save token' });
    return;
  }

  res.status(200).json({ success: true });
}

/**
 * DELETE /api/push-tokens
 * Deactivate all push tokens for the authenticated user.
 */
export async function deactivatePushTokens(req: Request, res: Response): Promise<void> {
  let userId: string;
  try {
    userId = await authenticateRequest(req);
  } catch (err) {
    const status = (err as { status?: number }).status || 401;
    res.status(status).json({ error: (err as Error).message });
    return;
  }

  const supabase = getServiceClient();

  const { error } = await supabase
    .from('user_push_tokens')
    .update({ is_active: false })
    .eq('user_id', userId);

  if (error) {
    console.error('[PushTokens] Failed to deactivate tokens:', error);
    res.status(500).json({ error: 'Failed to deactivate tokens' });
    return;
  }

  res.status(200).json({ success: true });
}
