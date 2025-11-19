import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { getServiceClient } from './supabaseClient';

const JOB_NAME = 'continuous_learning_engine';
const JOB_STATE_TABLE = 'job_run_state';

interface JobRunStateRow {
  last_run_at: string | null;
}

interface FeedbackAggregateRow {
  protocol_id: string | null;
  module_id: string | null;
  user_feedback: string | null;
  count: number | null;
}

export interface FeedbackSummaryEntry {
  protocolId: string | null;
  moduleId: string | null;
  total: number;
  counts: Record<string, number>;
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return Boolean(error && typeof error === 'object' && 'code' in (error as Record<string, unknown>));
}

async function fetchLastRun(client: SupabaseClient): Promise<Date | null> {
  const { data, error } = await client
    .from(JOB_STATE_TABLE)
    .select('last_run_at')
    .eq('job_name', JOB_NAME)
    .maybeSingle();

  if (error) {
    if (isPostgrestError(error) && error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to read last run timestamp: ${error.message}`);
  }

  if (!data?.last_run_at) {
    return null;
  }

  return new Date(data.last_run_at);
}

async function recordLastRun(client: SupabaseClient, timestamp: Date): Promise<void> {
  const payload = {
    job_name: JOB_NAME,
    last_run_at: timestamp.toISOString(),
    updated_at: timestamp.toISOString(),
  };

  const { error } = await client.from(JOB_STATE_TABLE).upsert(payload, { onConflict: 'job_name' });

  if (error) {
    throw new Error(`Failed to update last run timestamp: ${error.message}`);
  }
}

async function fetchFeedbackAggregates(
  client: SupabaseClient,
  lastRun: Date | null,
): Promise<FeedbackAggregateRow[]> {
  let query = client
    .from('ai_audit_log')
    .select('protocol_id,module_id,user_feedback')
    .not('user_feedback', 'is', null);

  if (lastRun) {
    query = query.gte('created_at', lastRun.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to aggregate feedback: ${error.message}`);
  }

  // Group in JavaScript since Supabase doesn't support .group()
  const grouped = new Map<string, number>();
  for (const row of (data as Array<{ protocol_id: string | null; module_id: string | null; user_feedback: string | null }> | null) ?? []) {
    if (!row.user_feedback) continue;
    const key = `${row.protocol_id ?? 'unassigned'}|${row.module_id ?? 'unassigned'}|${row.user_feedback}`;
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }

  return Array.from(grouped.entries()).map(([key, count]) => {
    const [protocol_id, module_id, user_feedback] = key.split('|');
    return {
      protocol_id: protocol_id === 'unassigned' ? null : protocol_id,
      module_id: module_id === 'unassigned' ? null : module_id,
      user_feedback,
      count,
    };
  });
}

export function groupFeedbackSummaries(rows: FeedbackAggregateRow[]): FeedbackSummaryEntry[] {
  const summaries = new Map<string, FeedbackSummaryEntry>();

  for (const row of rows) {
    if (!row.user_feedback) {
      continue;
    }

    const key = `${row.protocol_id ?? 'unassigned'}|${row.module_id ?? 'unassigned'}`;
    const entry = summaries.get(key) ?? {
      protocolId: row.protocol_id,
      moduleId: row.module_id,
      total: 0,
      counts: {},
    };

    const increment = typeof row.count === 'number' ? row.count : Number(row.count ?? 0);
    entry.total += increment;
    entry.counts[row.user_feedback] = (entry.counts[row.user_feedback] ?? 0) + increment;

    summaries.set(key, entry);
  }

  return Array.from(summaries.values()).sort((a, b) => {
    const protocolCompare = (a.protocolId ?? '').localeCompare(b.protocolId ?? '');
    if (protocolCompare !== 0) {
      return protocolCompare;
    }
    return (a.moduleId ?? '').localeCompare(b.moduleId ?? '');
  });
}

export function formatFeedbackSummary(
  summaries: FeedbackSummaryEntry[],
  windowStart: Date | null,
  windowEnd: Date,
): string {
  const headerStart = windowStart ? windowStart.toISOString() : 'beginning';
  const headerEnd = windowEnd.toISOString();
  const lines = [
    `[ContinuousLearningEngine] Feedback summary for ${headerStart} → ${headerEnd}`,
  ];

  if (summaries.length === 0) {
    lines.push('No new feedback recorded for this window.');
    return lines.join('\n');
  }

  for (const summary of summaries) {
    const feedbackBreakdown = Object.entries(summary.counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([feedback, count]) => `${feedback}: ${count}`)
      .join(' | ');

    const protocol = summary.protocolId ?? 'unassigned';
    const module = summary.moduleId ?? 'unassigned';
    lines.push(`• protocol=${protocol} | module=${module} | total=${summary.total} | ${feedbackBreakdown}`);
  }

  return lines.join('\n');
}

/**
 * Scheduled Google Cloud Function entry point that aggregates recent user feedback from the
 * `ai_audit_log` table and logs a summary report for the product team.
 */
export async function analyzeNudgeFeedback(): Promise<void> {
  const supabase = getServiceClient();
  const runStartedAt = new Date();

  try {
    const lastRun = await fetchLastRun(supabase);
    const aggregates = await fetchFeedbackAggregates(supabase, lastRun);
    const grouped = groupFeedbackSummaries(aggregates);
    const report = formatFeedbackSummary(grouped, lastRun, runStartedAt);

    console.log(report);

    await recordLastRun(supabase, runStartedAt);
  } catch (error) {
    console.error('[ContinuousLearningEngine] Failed to generate feedback summary', error);
    throw error;
  }
}
