import type { Request, Response } from 'express';
import { getSupabaseClient } from '../lib/supabase';
import { publishOnboardingCompleted } from '../lib/pubsub';
import { verifyFirebaseIdToken } from '../lib/firebase';
import { deliverFirstWinNudge } from '../services/firstWinNudge';
import type { OnboardingCompleteRequestBody } from '../types/onboarding';

const DEFAULT_TRIAL_DAYS = 14;

export const onboardingCompleteHandler = async (req: Request, res: Response) => {
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

  let decoded: { uid: string };
  try {
    decoded = await verifyFirebaseIdToken(token);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const body = req.body as OnboardingCompleteRequestBody | undefined;
  if (!body || typeof body.primary_module_id !== 'string' || body.primary_module_id.trim().length === 0) {
    res.status(400).json({ error: 'primary_module_id is required' });
    return;
  }

  const firebaseUid = decoded.uid;
  const primaryModuleId = body.primary_module_id.trim();
  const supabase = getSupabaseClient();

  // Look up user by firebase_uid to get their Supabase UUID
  const { data: userRecord, error: lookupError } = await supabase
    .from('users')
    .select('id')
    .eq('firebase_uid', firebaseUid)
    .maybeSingle();

  if (lookupError) {
    console.error('[onboardingComplete] User lookup error:', lookupError);
    res.status(500).json({ error: 'Failed to lookup user' });
    return;
  }

  if (!userRecord) {
    // User doesn't exist in Supabase - they need to sync first
    res.status(404).json({
      error: 'User not found in database. Please call /api/users/sync first.',
    });
    return;
  }

  const supabaseUserId = userRecord.id; // This is the UUID

  const now = new Date();
  const trialDays = Number(process.env.DEFAULT_TRIAL_DAYS || DEFAULT_TRIAL_DAYS);
  const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  const { error: userError } = await supabase
    .from('users')
    .update({
      onboarding_complete: true,
      trial_start_date: now.toISOString(),
      trial_end_date: trialEnd.toISOString(),
    })
    .eq('id', supabaseUserId); // Use UUID, not Firebase UID

  if (userError) {
    console.error('[onboardingComplete] User update error:', userError);
    res.status(500).json({ error: 'Failed to update user onboarding status' });
    return;
  }

  const enrollmentPayload = {
    user_id: supabaseUserId, // Use UUID for foreign key relationship
    module_id: primaryModuleId,
    is_primary: true,
    enrolled_at: now.toISOString(),
  };

  const { error: enrollmentError } = await supabase
    .from('module_enrollment')
    .insert([enrollmentPayload]);

  if (enrollmentError) {
    res.status(500).json({ error: 'Failed to enroll user in module' });
    return;
  }

  try {
    // Pass both Firebase UID (for Firestore paths) and Supabase UUID (for DB queries)
    await deliverFirstWinNudge(firebaseUid, supabaseUserId, primaryModuleId);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('First win nudge delivery failed', {
      firebase_uid: firebaseUid,
      supabase_user_id: supabaseUserId,
      module_id: primaryModuleId,
      error,
    });
  }

  try {
    await publishOnboardingCompleted({
      user_id: supabaseUserId, // Use Supabase UUID for Pub/Sub events
      primary_module_id: primaryModuleId,
    });
  } catch (error) {
    // Logging is omitted; onboarding should still succeed.
  }

  res.status(200).json({
    success: true,
    trial_start_date: now.toISOString(),
    trial_end_date: trialEnd.toISOString(),
    primary_module_id: primaryModuleId,
  });
};
