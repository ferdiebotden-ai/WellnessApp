import type { PostgrestResponse } from '@supabase/supabase-js';
import type { Firestore } from 'firebase-admin/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseApp } from './firebaseAdmin';
import { getServiceClient } from './supabaseClient';

interface ModuleEnrollmentRow {
  id: string;
  user_id: string;
  module_id: string;
  current_streak?: number | null;
  last_active_date?: string | null;
  streak_freeze_available?: boolean | null;
}

interface StreakNudgePayload {
  module_id: string;
  type: 'streak_preserved' | 'lapse_recovery';
  category: 'streak_maintenance';
  nudge_text: string;
  reasoning: string;
  evidence_citation: string;
  timing: string;
  confidence_score: number;
  priority: 'medium';
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const STREAK_SOURCE = 'streak_maintenance';

type ScheduledEvent = { data?: string } | undefined;
type ScheduledContext = { timestamp?: string } | undefined;

const parseDateKey = (value: string | null | undefined): Date | null => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const dateKeyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateKeyMatch) {
    const [, year, month, day] = dateKeyMatch;
    const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const computeDaysSinceActive = (lastActive: string | null | undefined, runDate: Date): number => {
  const parsed = parseDateKey(lastActive);
  if (!parsed) {
    return Number.POSITIVE_INFINITY;
  }

  const runMidnight = Date.UTC(runDate.getUTCFullYear(), runDate.getUTCMonth(), runDate.getUTCDate());
  const activeMidnight = Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  const diff = runMidnight - activeMidnight;

  if (diff <= 0) {
    return 0;
  }

  return Math.floor(diff / MS_PER_DAY);
};

const toTitleCase = (value: string): string => {
  if (!value) {
    return 'your module';
  }

  return value
    .split(/[-_\s]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const buildDocId = (enrollmentId: string, timestampIso: string): string => {
  const sanitizedTimestamp = timestampIso.replace(/[:.]/g, '-');
  return `${enrollmentId}-${sanitizedTimestamp}`;
};

const buildPreservedNudge = (moduleId: string, streak: number): StreakNudgePayload => {
  const moduleLabel = toTitleCase(moduleId);
  return {
    module_id: moduleId,
    type: 'streak_preserved',
    category: 'streak_maintenance',
    nudge_text: `Freeze used—your ${moduleLabel} streak stays at ${streak} days. Log one action today to keep momentum.`,
    reasoning: 'A missed day was detected, so the automatic weekly streak freeze preserved motivation and progress.',
    evidence_citation: 'internal',
    timing: 'today',
    confidence_score: 0.6,
    priority: 'medium',
  };
};

const buildLapseNudge = (moduleId: string): StreakNudgePayload => {
  const moduleLabel = toTitleCase(moduleId);
  return {
    module_id: moduleId,
    type: 'lapse_recovery',
    category: 'streak_maintenance',
    nudge_text: `Your ${moduleLabel} streak reset. Start fresh with a quick protocol today to rebuild momentum.`,
    reasoning: 'No activity was logged for over a day, so the streak reset. Prompting an immediate restart supports adherence.',
    evidence_citation: 'internal',
    timing: 'today',
    confidence_score: 0.6,
    priority: 'medium',
  };
};

const sendStreakNudge = async (
  firestore: Firestore,
  userId: string,
  docId: string,
  timestampIso: string,
  payload: StreakNudgePayload,
): Promise<void> => {
  await firestore
    .collection('live_nudges')
    .doc(userId)
    .collection('entries')
    .doc(docId)
    .set(
      {
        ...payload,
        status: 'pending',
        generated_at: timestampIso,
        source: STREAK_SOURCE,
      },
      { merge: true },
    );
};

const fetchEnrollments = async (
  supabase: ReturnType<typeof getServiceClient>,
): Promise<ModuleEnrollmentRow[]> => {
  const response: PostgrestResponse<ModuleEnrollmentRow> = await supabase
    .from<ModuleEnrollmentRow>('module_enrollment')
    .select('id,user_id,module_id,current_streak,last_active_date,streak_freeze_available');

  if (response.error) {
    throw new Error(`Failed to load module enrollments: ${response.error.message}`);
  }

  return Array.isArray(response.data) ? response.data : [];
};

const resolveRunDate = (context: ScheduledContext): Date => {
  if (context?.timestamp) {
    const parsed = new Date(context.timestamp);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
};

export const calculateStreaks = async (
  _event: ScheduledEvent,
  context: ScheduledContext,
): Promise<void> => {
  const runDate = resolveRunDate(context);
  const timestampIso = runDate.toISOString();
  const firestore = getFirestore(getFirebaseApp());
  const supabase = getServiceClient();
  const enrollments = await fetchEnrollments(supabase);

  if (enrollments.length === 0) {
    return;
  }

  for (const enrollment of enrollments) {
    const currentStreak = typeof enrollment.current_streak === 'number' ? enrollment.current_streak : 0;

    if (currentStreak <= 0) {
      continue;
    }

    const daysSinceActive = computeDaysSinceActive(enrollment.last_active_date ?? null, runDate);
    if (daysSinceActive <= 1) {
      continue;
    }

    const docId = buildDocId(enrollment.id, timestampIso);

    if (enrollment.streak_freeze_available !== false) {
      const { error } = await supabase
        .from('module_enrollment')
        .update({
          streak_freeze_available: false,
          streak_freeze_used_date: timestampIso,
        })
        .match({ id: enrollment.id });

      if (error) {
        throw new Error(`Failed to consume streak freeze for enrollment ${enrollment.id}: ${error.message}`);
      }

      await sendStreakNudge(firestore, enrollment.user_id, docId, timestampIso, buildPreservedNudge(enrollment.module_id, currentStreak));
      continue;
    }

    const { error } = await supabase
      .from('module_enrollment')
      .update({ current_streak: 0 })
      .match({ id: enrollment.id });

    if (error) {
      throw new Error(`Failed to reset streak for enrollment ${enrollment.id}: ${error.message}`);
    }

    await sendStreakNudge(firestore, enrollment.user_id, docId, timestampIso, buildLapseNudge(enrollment.module_id));
  }
};

export const resetFreezes = async (_event: ScheduledEvent, _context: ScheduledContext): Promise<void> => {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('module_enrollment')
    .update({
      streak_freeze_available: true,
      streak_freeze_used_date: null,
    });

  if (error) {
    throw new Error(`Failed to reset streak freezes: ${error.message}`);
  }
};

export type { ModuleEnrollmentRow };
