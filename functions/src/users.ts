import { Request, Response } from 'express';
import type { PostgrestError } from '@supabase/supabase-js';
import { getServiceClient, getUserClient } from './supabaseClient';
import { verifyFirebaseToken } from './firebaseAdmin';
import { getConfig } from './config';
import { extractBearerToken, isPatchPayloadAllowed } from './utils/http';

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

const MUTABLE_FIELDS = new Set<keyof UserProfileInsert>([
  'display_name',
  'onboarding_complete',
  'preferences',
  'healthMetrics',
  'earnedBadges'
]);

async function authenticateRequest(req: Request): Promise<{ uid: string; email?: string | null }>
{
  const token = extractBearerToken(req);
  if (!token) {
    throw Object.assign(new Error('Missing bearer token'), { status: 401 });
  }
  const decoded = await verifyFirebaseToken(token);
  return { uid: decoded.uid, email: decoded.email };
}

function resolveError(error: unknown): { status: number; message: string } {
  if (typeof error === 'object' && error !== null) {
    const maybeStatus = (error as { status?: number }).status;
    if (typeof maybeStatus === 'number') {
      return { status: maybeStatus, message: (error as Error).message };
    }

    const maybePostgrest = error as PostgrestError;
    if (typeof maybePostgrest.code === 'string') {
      if (maybePostgrest.code === 'PGRST116') {
        return { status: 404, message: 'User profile not found' };
      }

      return { status: 400, message: maybePostgrest.message };
    }
  }

  return { status: 500, message: (error as Error).message };
}

function buildUserInsert(uid: string, email?: string | null, displayName?: string | null): UserProfileInsert {
  const now = new Date();
  const { defaultTrialDays } = getConfig();
  const trialEnd = new Date(now.getTime() + defaultTrialDays * 24 * 60 * 60 * 1000);
  return {
    firebase_uid: uid,
    email: email ?? null,
    display_name: displayName ?? null,
    tier: 'trial',
    onboarding_complete: false,
    trial_start_date: now.toISOString(),
    trial_end_date: trialEnd.toISOString(),
    preferences: {},
    healthMetrics: {},
    earnedBadges: [],
    subscription_id: null
  };
}

function filterMutableFields(payload: Record<string, unknown>): Partial<UserProfileInsert> {
  const updates: Partial<UserProfileInsert> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!MUTABLE_FIELDS.has(key as keyof UserProfileInsert)) {
      continue;
    }

    switch (key) {
      case 'display_name':
        if (typeof value === 'string' || value === null) {
          updates.display_name = value as string | null;
        }
        break;
      case 'onboarding_complete':
        if (typeof value === 'boolean') {
          updates.onboarding_complete = value;
        }
        break;
      case 'preferences':
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          updates.preferences = value as Record<string, unknown>;
        }
        break;
      case 'healthMetrics':
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          updates.healthMetrics = value as Record<string, unknown>;
        }
        break;
      case 'earnedBadges':
        if (Array.isArray(value)) {
          updates.earnedBadges = value.map(String);
        }
        break;
      default:
        break;
    }
  }
  return updates;
}

export async function createUser(req: Request, res: Response): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { uid, email } = await authenticateRequest(req);
    const body = (req.body ?? {}) as { display_name?: string | null };
    const serviceClient = getServiceClient();
    const existing = await serviceClient.from('users').select('*').eq('firebase_uid', uid).maybeSingle();

    if (existing.error) {
      throw existing.error;
    }

    if (existing.data) {
      res.status(200).json({ user: existing.data });
      return;
    }

    const profile = buildUserInsert(uid, email, body.display_name ?? null);
    const { data, error } = await serviceClient.from('users').insert(profile).select().single();

    if (error) {
      throw error;
    }

    res.status(201).json({ user: data });
  } catch (error) {
    const { status, message } = resolveError(error);
    res.status(status).json({ error: message });
  }
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).send({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { uid } = await authenticateRequest(req);
    const supabase = getUserClient(uid);

    // Fetch user profile first
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', uid)
      .single();

    if (userError) {
      throw userError;
    }

    // Attempt to fetch module_enrollment separately to avoid schema relationship issues
    // Use the Supabase UUID (userData.id), not the Firebase UID
    let moduleEnrollments: unknown[] = [];
    try {
      const { data: enrollments } = await supabase
        .from('module_enrollment')
        .select('*')
        .eq('user_id', userData.id);

      if (enrollments) {
        moduleEnrollments = enrollments;
      }
    } catch (enrollmentError) {
      // Log but don't fail - module_enrollment is optional
      console.warn('Failed to fetch module enrollments:', enrollmentError);
    }

    // Combine user data with enrollments
    const userWithEnrollments = {
      ...userData,
      module_enrollment: moduleEnrollments
    };

    res.status(200).json({ user: userWithEnrollments });
  } catch (error) {
    const { status, message } = resolveError(error);
    res.status(status).json({ error: message });
  }
}

export async function updateCurrentUser(req: Request, res: Response): Promise<void> {
  if (req.method !== 'PATCH') {
    res.status(405).send({ error: 'Method Not Allowed' });
    return;
  }

  if (!isPatchPayloadAllowed(req.body)) {
    res.status(400).json({ error: 'Invalid request payload' });
    return;
  }

  try {
    const { uid } = await authenticateRequest(req);
    const updates = filterMutableFields(req.body);

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No mutable fields provided' });
      return;
    }

    const supabase = getUserClient(uid);
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('firebase_uid', uid)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({ user: data });
  } catch (error) {
    const { status, message } = resolveError(error);
    res.status(status).json({ error: message });
  }
}

export { filterMutableFields, buildUserInsert, authenticateRequest };
