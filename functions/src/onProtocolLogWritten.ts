import type { CloudEvent } from '@google-cloud/functions-framework';
import { getServiceClient } from './supabaseClient';

const STREAK_BADGES: Record<number, string> = {
  7: 'streak-7',
  30: 'streak-30',
  100: 'streak-100',
};

const DEFAULT_PROGRESS_TARGET = 30;

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  mapValue?: { fields?: Record<string, FirestoreValue> };
  arrayValue?: { values?: FirestoreValue[] };
  referenceValue?: string;
};

interface FirestoreDocument {
  name?: string;
  fields?: Record<string, FirestoreValue>;
}

interface FirestoreEventData {
  value?: FirestoreDocument;
}

type FirestoreCloudEvent = CloudEvent<FirestoreEventData>;

const decodeFirestoreValue = (value?: FirestoreValue): unknown => {
  if (!value) {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(value, 'nullValue')) {
    return null;
  }

  if (value.stringValue !== undefined) {
    return value.stringValue;
  }

  if (value.integerValue !== undefined) {
    const parsed = Number.parseInt(value.integerValue, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (value.doubleValue !== undefined) {
    return value.doubleValue;
  }

  if (value.booleanValue !== undefined) {
    return value.booleanValue;
  }

  if (value.timestampValue !== undefined) {
    return value.timestampValue;
  }

  if (value.referenceValue !== undefined) {
    return value.referenceValue;
  }

  if (value.arrayValue) {
    const items = value.arrayValue.values ?? [];
    return items.map((item) => decodeFirestoreValue(item));
  }

  if (value.mapValue) {
    const mapFields = value.mapValue.fields ?? {};
    return Object.fromEntries(
      Object.entries(mapFields).map(([key, innerValue]) => [key, decodeFirestoreValue(innerValue)]),
    );
  }

  return undefined;
};

const decodeFirestoreDocument = (document?: FirestoreDocument): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  const fields = document?.fields ?? {};

  for (const [key, rawValue] of Object.entries(fields)) {
    result[key] = decodeFirestoreValue(rawValue);
  }

  return result;
};

const parseDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
};

const formatDateKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const computeNextStreak = (previousDateIso: string | null | undefined, previousStreak: number, currentDate: Date): number => {
  if (!previousDateIso) {
    return Math.max(previousStreak, 0) + 1;
  }

  const previousDate = new Date(previousDateIso);
  if (Number.isNaN(previousDate.getTime())) {
    return Math.max(previousStreak, 0) + 1;
  }

  const previousKey = formatDateKey(previousDate);
  const currentKey = formatDateKey(currentDate);

  if (previousKey === currentKey) {
    return Math.max(previousStreak, 1);
  }

  const yesterday = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate() - 1));
  const yesterdayKey = formatDateKey(yesterday);

  if (previousKey === yesterdayKey) {
    return Math.max(previousStreak, 0) + 1;
  }

  return 1;
};

export const onProtocolLogWritten = async (event: FirestoreCloudEvent): Promise<void> => {
  const payload = decodeFirestoreDocument(event.data?.value);
  const userId = typeof payload.userId === 'string' ? payload.userId : typeof payload.uid === 'string' ? payload.uid : '';
  const moduleId = typeof payload.moduleId === 'string' ? payload.moduleId : '';
  const protocolId = typeof payload.protocolId === 'string' ? payload.protocolId : '';

  if (!userId || !moduleId || !protocolId) {
    console.warn('onProtocolLogWritten: missing identifiers, skipping', {
      userId,
      moduleId,
      protocolId,
      documentName: event.data?.value?.name,
    });
    return;
  }

  const supabase = getServiceClient();
  const loggedAt = parseDate(payload.loggedAt) ?? new Date();
  const source = typeof payload.source === 'string' ? payload.source : 'manual';
  const status = typeof payload.status === 'string' ? payload.status : 'completed';
  const enrollmentId = typeof payload.enrollmentId === 'string' ? payload.enrollmentId : null;
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};
  const progressTargetRaw = typeof payload.progressTarget === 'number' ? payload.progressTarget : undefined;
  const progressTarget = progressTargetRaw && Number.isFinite(progressTargetRaw) && progressTargetRaw > 0
    ? progressTargetRaw
    : DEFAULT_PROGRESS_TARGET;

  // Look up the user's Supabase UUID from their Firebase UID
  const { data: user, error: userLookupError } = await supabase
    .from('users')
    .select('id')
    .eq('firebase_uid', userId)
    .maybeSingle();

  if (userLookupError || !user) {
    console.warn('onProtocolLogWritten: user not found in Supabase', { userId });
    return;
  }

  const supabaseUserId = user.id;

  const insertResult = await supabase.from('protocol_logs').insert([
    {
      user_id: supabaseUserId,
      module_id: moduleId,
      protocol_id: protocolId,
      module_enrollment_id: enrollmentId,
      source,
      status,
      logged_at: loggedAt.toISOString(),
      metadata,
    },
  ]);

  if (insertResult.error) {
    throw new Error(`Failed to persist protocol log: ${insertResult.error.message}`);
  }

  const enrollmentResponse = await supabase
    .from('module_enrollment')
    .select('id,current_streak,longest_streak,last_active_date,progress_pct')
    .match({ user_id: supabaseUserId, module_id: moduleId })
    .maybeSingle();

  if (enrollmentResponse.error) {
    throw new Error(`Failed to read module enrollment: ${enrollmentResponse.error.message}`);
  }

  let nextStreak: number | null = null;

  if (enrollmentResponse.data) {
    const enrollment = enrollmentResponse.data as {
      id: string;
      current_streak?: number | null;
      longest_streak?: number | null;
      last_active_date?: string | null;
    };

    const currentStreak = enrollment.current_streak ?? 0;
    nextStreak = computeNextStreak(enrollment.last_active_date ?? null, currentStreak, loggedAt);
    const longest = Math.max(enrollment.longest_streak ?? 0, nextStreak);

    const logsResponse = await supabase
      .from('protocol_logs')
      .select('id')
      .match({ user_id: supabaseUserId, module_id: moduleId });

    if (logsResponse.error) {
      throw new Error(`Failed to count protocol logs: ${logsResponse.error.message}`);
    }

    const completedCount = Array.isArray(logsResponse.data) ? logsResponse.data.length : 0;
    const progressPct = Math.min(1, completedCount / progressTarget);

    const updateResult = await supabase
      .from('module_enrollment')
      .update({
        current_streak: nextStreak,
        longest_streak: longest,
        last_active_date: formatDateKey(loggedAt),
        progress_pct: progressPct,
      })
      .match({ id: enrollment.id });

    if (updateResult.error) {
      throw new Error(`Failed to update module enrollment: ${updateResult.error.message}`);
    }
  }

  if (nextStreak && STREAK_BADGES[nextStreak]) {
    const badgeId = STREAK_BADGES[nextStreak];
    const userResponse = await supabase
      .from('users')
      .select('id,"earnedBadges"')
      .eq('id', supabaseUserId)
      .maybeSingle();

    if (userResponse.error) {
      throw new Error(`Failed to load user badges: ${userResponse.error.message}`);
    }

    const badgesRaw = (userResponse.data as { earnedBadges?: unknown })?.earnedBadges;
    const earned = Array.isArray(badgesRaw) ? badgesRaw.map(String) : [];

    if (!earned.includes(badgeId)) {
      const updateBadges = await supabase
        .from('users')
        .update({ earnedBadges: [...earned, badgeId] })
        .eq('id', supabaseUserId);

      if (updateBadges.error) {
        throw new Error(`Failed to update earned badges: ${updateBadges.error.message}`);
      }
    }
  }
};
