import { addMinutes, startOfDay } from 'date-fns';
import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz';
import { getFirestore } from '../lib/firebase';
import { getSupabaseClient } from '../lib/supabase';

const DEFAULT_DURATION_MINUTES = 15;
const DEFAULT_WAKE_TIME = '07:00';
const DEFAULT_BEDTIME = '22:00';
const DEFAULT_TIMEZONE = 'UTC';
const CONFLICT_BUFFER_MINUTES = 5;

interface UserRecord {
  id: string;
  tier?: string | null;
  preferences?: {
    wake_time?: string | null;
    bedtime?: string | null;
    timezone?: string | null;
  } | null;
}

interface ModuleEnrollmentRecord {
  module_id: string;
}

interface ModuleProtocolMapRecord {
  module_id: string;
  protocol_id: string;
  tier?: string | null;
  priority?: number | null;
  default_offset_minutes?: number | null;
}

interface ProtocolRecord {
  id: string;
  duration_minutes?: number | null;
  category?: string | null;
  default_time_of_day?: string | null;
  timing_constraints?: string | null;
  priority?: number | null;
}

interface RawScheduleItem {
  protocolId: string;
  moduleId: string;
  durationMinutes: number;
  scheduledAt: Date;
  priority: number;
}

interface FinalScheduleItem {
  protocol_id: string;
  module_id: string;
  scheduled_time_utc: string;
  duration_minutes: number;
  status: 'pending';
}

const sanitizeTime = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && /^\d{1,2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  return fallback;
};

const resolveUserTimezone = (prefs: UserRecord['preferences']): string => {
  const tz = prefs?.timezone;
  if (typeof tz === 'string' && tz.trim().length > 0) {
    return tz;
  }
  return DEFAULT_TIMEZONE;
};

const parseTimeInZone = (dateKey: string, time: string, timezone: string): Date => {
  const normalized = sanitizeTime(time, DEFAULT_WAKE_TIME);
  const dateTime = `${dateKey}T${normalized}:00`;
  return zonedTimeToUtc(dateTime, timezone);
};

const deriveScheduledAt = (
  protocol: ProtocolRecord,
  mapping: ModuleProtocolMapRecord,
  prefs: UserRecord['preferences'],
  dateKey: string,
  timezone: string,
): Date => {
  const wakeTime = sanitizeTime(prefs?.wake_time, DEFAULT_WAKE_TIME);
  const bedtime = sanitizeTime(prefs?.bedtime, DEFAULT_BEDTIME);
  const constraint = protocol.timing_constraints?.toLowerCase() ?? '';

  const baseWake = parseTimeInZone(dateKey, wakeTime, timezone);
  const baseBed = parseTimeInZone(dateKey, bedtime, timezone);

  const defaultOffset = mapping.default_offset_minutes ?? 0;

  if (constraint.includes('wake')) {
    const maxWindow = constraint.includes('60') ? 60 : constraint.includes('90') ? 90 : 45;
    const offset = Math.min(Math.max(defaultOffset, 0), maxWindow);
    return addMinutes(baseWake, offset || Math.min(maxWindow, 30));
  }

  if (constraint.includes('bed')) {
    const backOff = Math.abs(defaultOffset) || 45;
    return addMinutes(baseBed, backOff * -1);
  }

  if (protocol.default_time_of_day) {
    return parseTimeInZone(dateKey, protocol.default_time_of_day, timezone);
  }

  return addMinutes(baseWake, defaultOffset || 120);
};

const resolveConflicts = (items: RawScheduleItem[]): RawScheduleItem[] => {
  const sorted = [...items].sort((a, b) => {
    const timeDiff = a.scheduledAt.getTime() - b.scheduledAt.getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return (b.priority ?? 0) - (a.priority ?? 0);
  });

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const previous = sorted[i - 1];
    const previousEnd = addMinutes(previous.scheduledAt, previous.durationMinutes);

    if (current.scheduledAt < previousEnd) {
      const shiftStart = addMinutes(previousEnd, CONFLICT_BUFFER_MINUTES);
      current.scheduledAt = shiftStart;
    }
  }

  return sorted;
};

const buildScheduleForUser = async (
  user: UserRecord,
  baseDate: Date,
): Promise<void> => {
  const supabase = getSupabaseClient();
  const firestore = getFirestore();

  const timezone = resolveUserTimezone(user.preferences);
  const localDateKey = formatInTimeZone(baseDate, timezone, 'yyyy-MM-dd');

  const writeSchedule = async (items: FinalScheduleItem[]) => {
    const docRef = firestore.collection('schedules').doc(user.id).collection('dates').doc(localDateKey);
    await docRef.set(
      {
        generated_at: new Date().toISOString(),
        items,
      },
      { merge: true },
    );
  };

  const enrollmentsResponse = await supabase
    .from<ModuleEnrollmentRecord>('module_enrollment')
    .select('module_id')
    .eq('user_id', user.id);

  if (enrollmentsResponse.error || !enrollmentsResponse.data || enrollmentsResponse.data.length === 0) {
    await writeSchedule([]);
    return;
  }

  const moduleIds = enrollmentsResponse.data.map((enrollment) => enrollment.module_id);

  const moduleProtocolResponse = await supabase
    .from<ModuleProtocolMapRecord>('module_protocol_map')
    .select('module_id, protocol_id, tier, priority, default_offset_minutes')
    .in('module_id', moduleIds);

  if (moduleProtocolResponse.error || !moduleProtocolResponse.data || moduleProtocolResponse.data.length === 0) {
    await writeSchedule([]);
    return;
  }

  const filteredMappings = moduleProtocolResponse.data.filter((mapping) => {
    if (!mapping.tier) {
      return true;
    }
    return mapping.tier === user.tier;
  });

  if (filteredMappings.length === 0) {
    await writeSchedule([]);
    return;
  }

  const protocolIds = Array.from(new Set(filteredMappings.map((mapping) => mapping.protocol_id)));

  const protocolsResponse = await supabase
    .from<ProtocolRecord>('protocols')
    .select('id, duration_minutes, category, default_time_of_day, timing_constraints, priority')
    .in('id', protocolIds);

  if (protocolsResponse.error || !protocolsResponse.data) {
    await writeSchedule([]);
    return;
  }

  const protocolsById = new Map(protocolsResponse.data.map((protocol) => [protocol.id, protocol]));

  const rawItems: RawScheduleItem[] = [];
  for (const mapping of filteredMappings) {
    const protocol = protocolsById.get(mapping.protocol_id);
    if (!protocol) {
      continue;
    }

    const scheduledAt = deriveScheduledAt(protocol, mapping, user.preferences ?? {}, localDateKey, timezone);
    const duration = protocol.duration_minutes ?? DEFAULT_DURATION_MINUTES;
    const priority = mapping.priority ?? protocol.priority ?? 0;

    rawItems.push({
      protocolId: protocol.id,
      moduleId: mapping.module_id,
      durationMinutes: duration,
      scheduledAt,
      priority,
    });
  }

  if (rawItems.length === 0) {
    await writeSchedule([]);
    return;
  }

  const resolved = resolveConflicts(rawItems);

  const scheduleItems: FinalScheduleItem[] = resolved.map((item) => ({
    protocol_id: item.protocolId,
    module_id: item.moduleId,
    scheduled_time_utc: item.scheduledAt.toISOString(),
    duration_minutes: item.durationMinutes,
    status: 'pending',
  }));

  await writeSchedule(scheduleItems);
};

export const generateDailySchedules = async (
  _event: { data?: string } | undefined,
  context: { timestamp?: string } = {},
): Promise<void> => {
  const supabase = getSupabaseClient();

  const baseTimestamp = context.timestamp ? new Date(context.timestamp) : new Date();
  const baseDate = startOfDay(baseTimestamp);

  const usersResponse = await supabase
    .from<UserRecord>('users')
    .select('id, tier, preferences')
    .eq('onboarding_complete', true);

  if (usersResponse.error || !usersResponse.data) {
    return;
  }

  for (const user of usersResponse.data) {
    try {
      await buildScheduleForUser(user, baseDate);
    } catch (error) {
      // If a single user fails, proceed with others.
      // eslint-disable-next-line no-console
      console.error(`Failed to build schedule for user ${user.id}`, error);
    }
  }
};
