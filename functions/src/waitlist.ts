import { Request, Response } from 'express';
import type { PostgrestError } from '@supabase/supabase-js';
import { verifyFirebaseToken } from './firebaseAdmin';
import { getServiceClient } from './supabaseClient';
import { extractBearerToken } from './utils/http';

const ALLOWED_TIERS = new Set(['pro', 'elite']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function resolveDatabaseError(error: PostgrestError | null): never {
  if (error) {
    throw error;
  }
  throw new Error('Failed to save waitlist entry');
}

/**
 * Handles POST /api/waitlist requests to enroll interested users in the premium tier waitlist.
 */
export async function joinWaitlist(req: Request, res: Response): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }

  try {
    await verifyFirebaseToken(token);
  } catch {
    res.status(401).json({ error: 'Invalid bearer token' });
    return;
  }

  const payload = (req.body ?? {}) as { email?: unknown; tier_interested_in?: unknown };
  const email = typeof payload.email === 'string' ? normalizeEmail(payload.email) : null;
  const tier = typeof payload.tier_interested_in === 'string' ? payload.tier_interested_in : null;

  if (!email || !EMAIL_PATTERN.test(email)) {
    res.status(400).json({ error: 'Valid email is required' });
    return;
  }

  if (!tier || !ALLOWED_TIERS.has(tier)) {
    res.status(400).json({ error: 'Tier must be "pro" or "elite"' });
    return;
  }

  try {
    const supabase = getServiceClient();
    const { error } = await supabase
      .from('waitlist_entry')
      .upsert({ email, tier_interested_in: tier }, { onConflict: 'email' });

    if (error) {
      resolveDatabaseError(error);
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Failed to store waitlist entry', error);
    res.status(500).json({ error: 'Failed to save waitlist entry' });
  }
}
