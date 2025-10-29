import type { Request, Response } from 'express';
import { verifyFirebaseIdToken } from '../lib/firebase';
import { getSupabaseClient } from '../lib/supabase';
import type { NudgeFeedbackRequestBody } from '../types/feedback';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const nudgeFeedbackHandler = async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const nudgeLogId = req.params.nudge_log_id;
  if (!nudgeLogId || !UUID_REGEX.test(nudgeLogId)) {
    res.status(400).json({ error: 'Invalid nudge_log_id' });
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

  const body = req.body as NudgeFeedbackRequestBody | undefined;
  if (!body || (body.feedback !== 'thumb_up' && body.feedback !== 'thumb_down')) {
    res.status(400).json({ error: 'Invalid feedback value' });
    return;
  }

  if (body.text !== undefined && typeof body.text !== 'string') {
    res.status(400).json({ error: 'text must be a string' });
    return;
  }

  const trimmedText = body.text !== undefined ? body.text.trim() : undefined;
  const feedbackText = trimmedText && trimmedText.length > 0 ? trimmedText : null;
  const supabase = getSupabaseClient();

  const { data: logRecord, error: fetchError } = await supabase
    .from('ai_audit_log')
    .select('id, user_id')
    .eq('id', nudgeLogId)
    .maybeSingle();

  if (fetchError) {
    res.status(500).json({ error: 'Failed to fetch audit log record' });
    return;
  }

  if (!logRecord) {
    res.status(404).json({ error: 'Audit log record not found' });
    return;
  }

  if (logRecord.user_id !== decoded.uid) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const updatePayload = {
    user_feedback: body.feedback,
    user_feedback_text: feedbackText,
    user_action_timestamp: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from('ai_audit_log')
    .update(updatePayload)
    .eq('id', nudgeLogId);

  if (updateError) {
    res.status(500).json({ error: 'Failed to update feedback' });
    return;
  }

  res.status(200).json({ success: true });
};
