import type { Request, Response } from 'express';
import { getSupabaseClient } from '../lib/supabase';
import { verifyFirebaseIdToken } from '../lib/firebase';

/**
 * POST /api/users/sync
 *
 * Creates or retrieves a Supabase user record for the authenticated Firebase user.
 * This endpoint bridges Firebase Auth (authentication) with Supabase (data storage).
 *
 * Flow:
 * 1. Verify Firebase ID token from Authorization header
 * 2. Check if user already exists in Supabase by firebase_uid
 * 3. If not, create new user record with auto-generated UUID
 * 4. Return the Supabase user ID (UUID)
 *
 * This endpoint is idempotent - safe to call multiple times.
 */
export const userSyncHandler = async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();

  let decoded: { uid: string; email?: string };
  try {
    decoded = await verifyFirebaseIdToken(token);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const firebaseUid = decoded.uid;
  const email = decoded.email ?? null;
  const supabase = getSupabaseClient();

  // Check if user already exists
  const { data: existing, error: lookupError } = await supabase
    .from('users')
    .select('id, email')
    .eq('firebase_uid', firebaseUid)
    .maybeSingle();

  if (lookupError) {
    console.error('[userSync] Lookup error:', lookupError);
    res.status(500).json({ error: 'Failed to lookup user' });
    return;
  }

  if (existing) {
    // User already exists - return existing ID
    res.status(200).json({
      user_id: existing.id,
      created: false,
    });
    return;
  }

  // Create new user record
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      firebase_uid: firebaseUid,
      email: email,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[userSync] Insert error:', insertError);
    res.status(500).json({ error: 'Failed to create user' });
    return;
  }

  res.status(201).json({
    user_id: newUser.id,
    created: true,
  });
};
