import { Request, Response } from 'express';
import type { PostgrestError } from '@supabase/supabase-js';
import { getServiceClient } from './supabaseClient';
import { authenticateRequest } from './users';

interface MonetizationStatus {
  trial_start_date: string | null;
  trial_end_date: string | null;
  subscription_tier: string;
  subscription_id: string | null;
  chat_queries_used_this_week: number;
  chat_weekly_limit: number;
}

function resolveError(error: unknown): { status: number; message: string } {
  if (typeof error === 'object' && error !== null) {
    const maybeStatus = (error as { status?: number }).status;
    if (typeof maybeStatus === 'number') {
      return { status: maybeStatus, message: (error as Error).message };
    }

    const maybePostgrest = error as PostgrestError;
    if (typeof maybePostgrest.code === 'string') {
      return { status: 400, message: maybePostgrest.message };
    }
  }

  return { status: 500, message: (error as Error).message };
}

/**
 * Calculates chat queries used this week from ai_audit_log
 */
async function getChatQueriesThisWeek(userId: string): Promise<number> {
  const serviceClient = getServiceClient();

  // Calculate start of current week (Sunday 00:00:00)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const { count, error } = await serviceClient
    .from('ai_audit_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('decision_type', 'chat_response')
    .gte('created_at', startOfWeek.toISOString());

  if (error) {
    console.warn('Failed to fetch chat query count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * GET /api/users/me/monetization
 *
 * Returns monetization status for current user:
 * - Trial dates
 * - Subscription tier (trial, core, pro, elite, lapsed)
 * - Chat usage (queries used this week vs weekly limit)
 *
 * Blueprint Reference: V3.2 - Tier 1 ($29/mo) includes limited chat (10 queries/week)
 *                       Tier 2 ($59/mo) unlocks unlimited chat
 */
export async function getMonetizationStatus(req: Request, res: Response): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).send({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { uid } = await authenticateRequest(req);
    const serviceClient = getServiceClient();

    // 1. Fetch user profile (query by firebase_uid)
    const { data: user, error: userError } = await serviceClient
      .from('users')
      .select('id, tier, trial_start_date, trial_end_date, subscription_id')
      .eq('firebase_uid', uid)
      .single();

    if (userError || !user) {
      throw userError || new Error('User not found');
    }

    // 2. Calculate chat queries used this week (use Supabase UUID for foreign key)
    const queriesUsed = await getChatQueriesThisWeek(user.id);

    // 3. Determine chat weekly limit based on tier
    let chatWeeklyLimit: number;
    switch (user.tier) {
      case 'trial':
      case 'core':
        chatWeeklyLimit = 10; // Limited chat
        break;
      case 'pro':
      case 'elite':
        chatWeeklyLimit = 999999; // Unlimited
        break;
      case 'lapsed':
      default:
        chatWeeklyLimit = 0; // No access
        break;
    }

    // 4. Build response
    const status: MonetizationStatus = {
      trial_start_date: user.trial_start_date,
      trial_end_date: user.trial_end_date,
      subscription_tier: user.tier || 'trial',
      subscription_id: user.subscription_id,
      chat_queries_used_this_week: queriesUsed,
      chat_weekly_limit: chatWeeklyLimit
    };

    res.status(200).json(status);

  } catch (error) {
    const { status, message } = resolveError(error);
    res.status(status).json({ error: message });
  }
}
