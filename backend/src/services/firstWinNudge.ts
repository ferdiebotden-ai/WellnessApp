import { getFirestore } from '../lib/firebase';
import { getSupabaseClient } from '../lib/supabase';

const SOURCE_LABEL = 'mission_010_first_win';
const DEFAULT_TIMEZONE = 'UTC';
const DEFAULT_CONFIDENCE = 0.9;
const DEFAULT_DURATION_MINUTES = 15;

interface ModuleRow {
  id: string;
  name: string | null;
  starter_protocols: unknown;
}

interface ModuleProtocolMapRow {
  protocol_id: string;
  module_id: string;
  is_starter_protocol: boolean | null;
  priority: number | null;
  default_offset_minutes: number | null;
}

interface ProtocolRow {
  id: string;
  name: string | null;
  summary: string | null;
  default_time_of_day: string | null;
  timing_constraints: string | null;
  priority: number | null;
  duration_minutes: number | null;
  primary_citation: string | null;
}

interface UserRow {
  preferences: {
    timezone?: string | null;
  } | null;
}

interface StarterCandidate {
  protocol: ProtocolRow;
  mapping?: ModuleProtocolMapRow;
}

type DayPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

interface SelectionContext {
  now: Date;
  localMinutes: number;
  period: DayPeriod;
  moduleId: string;
  moduleName: string;
}

const PERIOD_RANGES: Array<{ label: DayPeriod; start: number; end: number }> = [
  { label: 'night', start: 0, end: 299 },
  { label: 'morning', start: 300, end: 719 },
  { label: 'afternoon', start: 720, end: 1019 },
  { label: 'evening', start: 1020, end: 1259 },
  { label: 'night', start: 1260, end: 1439 },
];

const PERIOD_KEYWORDS: Record<DayPeriod, string[]> = {
  morning: ['morning', 'sunrise', 'wake', 'am'],
  afternoon: ['afternoon', 'midday', 'mid-day', 'early afternoon'],
  evening: ['evening', 'wind', 'pm', 'sunset'],
  night: ['night', 'bed', 'sleep', 'late'],
};

const MODULE_KEYWORD_HINTS: Array<{
  matcher: RegExp;
  boosts: Array<{ phrase: RegExp; weight: number; period?: DayPeriod }>;
}> = [
  {
    matcher: /focus|productivity|clarity/i,
    boosts: [
      { phrase: /deep work|focus block|single[- ]task/i, weight: 90 },
      { phrase: /plan|planning|brain dump/i, weight: 40 },
    ],
  },
  {
    matcher: /sleep|circadian|recovery/i,
    boosts: [
      { phrase: /morning light|sunlight/i, weight: 90, period: 'morning' },
      { phrase: /wind.*down|sleep|nsdr|bedtime/i, weight: 70, period: 'evening' },
    ],
  },
  {
    matcher: /energy|vitality|movement/i,
    boosts: [
      { phrase: /movement|walk|mobility/i, weight: 70 },
      { phrase: /hydration|water/i, weight: 40 },
    ],
  },
  {
    matcher: /stress|resilience|calm/i,
    boosts: [{ phrase: /breath|breathing|reset|nsdr/i, weight: 70 }],
  },
];

const toTitleCase = (value: string): string =>
  value
    .split(/[_-]/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const parseStarterProtocols = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item): item is string => item.length > 0);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const trimmed = value.trim();
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item): item is string => item.length > 0);
      }
    } catch (error) {
      return trimmed
        .split(',')
        .map((piece) => piece.trim())
        .filter((piece): piece is string => piece.length > 0);
    }
  }

  return [];
};

const parseTimeOfDay = (value: string | null | undefined): number | null => {
  if (!value) {
    return null;
  }

  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number.parseInt(match[1] ?? '', 10);
  const minutes = Number.parseInt(match[2] ?? '', 10);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  const total = hours * 60 + minutes;
  if (total < 0 || total >= 24 * 60) {
    return null;
  }

  return total;
};

const minutesDifference = (target: number, current: number): number => {
  const raw = Math.abs(target - current);
  return Math.min(raw, 1440 - raw);
};

const resolvePeriod = (localMinutes: number): DayPeriod => {
  const range = PERIOD_RANGES.find((candidate) => localMinutes >= candidate.start && localMinutes <= candidate.end);
  return range ? range.label : 'afternoon';
};

const resolveLocalMinutes = (now: Date, timezone: string): number => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    });

    const [hoursText, minutesText] = formatter.format(now).split(':');
    const hours = Number.parseInt(hoursText, 10);
    const minutes = Number.parseInt(minutesText, 10);

    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      return hours * 60 + minutes;
    }
  } catch (error) {
    // Fallback to UTC below.
  }

  return now.getUTCHours() * 60 + now.getUTCMinutes();
};

const computeTimingScore = (candidate: StarterCandidate, context: SelectionContext): number => {
  const defaultMinutes = parseTimeOfDay(candidate.protocol.default_time_of_day);
  let score = 0;

  if (defaultMinutes !== null) {
    const diff = minutesDifference(defaultMinutes, context.localMinutes);
    score += Math.max(0, 120 - diff);
  }

  const constraints = (candidate.protocol.timing_constraints ?? '').toLowerCase();
  if (constraints.length > 0) {
    (Object.entries(PERIOD_KEYWORDS) as Array<[DayPeriod, string[]]>).forEach(([period, keywords]) => {
      const hit = keywords.some((keyword) => constraints.includes(keyword));
      if (hit) {
        score += period === context.period ? 60 : 20;
      }
    });
  }

  return score;
};

const computeModuleAffinity = (candidate: StarterCandidate, context: SelectionContext): number => {
  const normalizedModule = `${context.moduleId} ${context.moduleName}`.toLowerCase();
  const protocolName = (candidate.protocol.name ?? '').toLowerCase();
  let score = 0;

  MODULE_KEYWORD_HINTS.forEach(({ matcher, boosts }) => {
    if (matcher.test(normalizedModule)) {
      boosts.forEach(({ phrase, weight, period }) => {
        if (phrase.test(protocolName) && (!period || period === context.period)) {
          score += weight;
        }
      });
    }
  });

  return score;
};

const scoreCandidate = (candidate: StarterCandidate, context: SelectionContext): number => {
  let score = 0;

  if (typeof candidate.protocol.priority === 'number') {
    score += candidate.protocol.priority * 10;
  }

  if (typeof candidate.mapping?.priority === 'number') {
    score += candidate.mapping.priority * 20;
  }

  score += computeTimingScore(candidate, context);
  score += computeModuleAffinity(candidate, context);

  return score;
};

const describeTiming = (candidate: StarterCandidate, context: SelectionContext): {
  label: string;
  narrative: string;
} => {
  const defaultMinutes = parseTimeOfDay(candidate.protocol.default_time_of_day);
  const duration = candidate.protocol.duration_minutes ?? DEFAULT_DURATION_MINUTES;

  if (defaultMinutes !== null) {
    const diff = minutesDifference(defaultMinutes, context.localMinutes);
    if (diff <= 10) {
      return {
        label: 'right now',
        narrative: `Start immediately and invest ${duration} focused minutes for a fast win.`,
      };
    }

    if (diff <= 45) {
      return {
        label: 'within the next hour',
        narrative: `Schedule ${duration} minutes within the next hour while motivation is high.`,
      };
    }
  }

  const periodLabel = context.period === 'night' ? 'this evening' : `this ${context.period}`;
  return {
    label: periodLabel,
    narrative: `Block ${duration} minutes ${periodLabel} to secure your first win.`,
  };
};

const buildNudgeDocument = (candidate: StarterCandidate, context: SelectionContext) => {
  const { label, narrative } = describeTiming(candidate, context);
  const timestamp = context.now.toISOString();
  const protocolName = candidate.protocol.name ?? 'your starter protocol';

  const reasoningPeriod = label === 'right now' ? 'this moment' : label;
  const moduleName = context.moduleName;

  return {
    timestamp,
    document: {
      protocol_id: candidate.protocol.id,
      module_id: context.moduleId,
      nudge_text: `Kick off ${moduleName} with ${protocolName}. ${narrative}`,
      reasoning: `${protocolName} is a starter protocol for ${moduleName} and fits ${reasoningPeriod}, helping you build momentum immediately.`,
      evidence_citation: candidate.protocol.primary_citation ?? SOURCE_LABEL,
      timing: label,
      confidence_score: DEFAULT_CONFIDENCE,
      priority: 'high',
      starter_protocol: true,
      status: 'pending',
      generated_at: timestamp,
      source: SOURCE_LABEL,
    },
  };
};

const fetchStarterCandidates = async (moduleId: string): Promise<{
  moduleName: string;
  candidates: StarterCandidate[];
}> => {
  const supabase = getSupabaseClient();

  const modulePromise = supabase
    .from<ModuleRow>('modules')
    .select('id, name, starter_protocols')
    .eq('id', moduleId)
    .maybeSingle();

  const mappingPromise = supabase
    .from<ModuleProtocolMapRow>('module_protocol_map')
    .select('protocol_id, module_id, is_starter_protocol, priority, default_offset_minutes')
    .eq('module_id', moduleId)
    .eq('is_starter_protocol', true);

  const [moduleResult, mappingResult] = await Promise.all([modulePromise, mappingPromise]);

  const moduleRow = moduleResult.data ?? null;
  const normalizedModuleName = moduleRow?.name?.trim();
  const moduleName = normalizedModuleName?.length ? normalizedModuleName : toTitleCase(moduleId);

  const mappingRecords = (mappingResult.data ?? []).filter((record) => record.is_starter_protocol);
  const starterProtocolIds = parseStarterProtocols(moduleRow?.starter_protocols);
  const candidateIds = starterProtocolIds.length > 0 ? starterProtocolIds : mappingRecords.map((record) => record.protocol_id);

  if (candidateIds.length === 0) {
    return { moduleName, candidates: [] };
  }

  const { data: protocols } = await supabase
    .from<ProtocolRow>('protocols')
    .select('id, name, summary, default_time_of_day, timing_constraints, priority, duration_minutes, primary_citation')
    .in('id', candidateIds);

  if (!protocols || protocols.length === 0) {
    return { moduleName, candidates: [] };
  }

  const mappingById = new Map<string, ModuleProtocolMapRow>();
  mappingRecords.forEach((record) => {
    mappingById.set(record.protocol_id, record);
  });

  const candidates = protocols.map((protocol) => ({
    protocol,
    mapping: mappingById.get(protocol.id) ?? undefined,
  }));

  return { moduleName, candidates };
};

const fetchUserTimezone = async (userId: string): Promise<string> => {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from<UserRow>('users')
    .select('preferences')
    .eq('id', userId)
    .maybeSingle();

  const timezone = data?.preferences?.timezone;
  return timezone && timezone.trim().length > 0 ? timezone : DEFAULT_TIMEZONE;
};

export const deliverFirstWinNudge = async (
  userId: string,
  moduleId: string,
  options: { now?: Date } = {},
): Promise<boolean> => {
  const now = options.now ?? new Date();

  try {
    const [{ moduleName, candidates }, timezone] = await Promise.all([
      fetchStarterCandidates(moduleId),
      fetchUserTimezone(userId),
    ]);

    if (candidates.length === 0) {
      return false;
    }

    const localMinutes = resolveLocalMinutes(now, timezone);
    const context: SelectionContext = {
      now,
      localMinutes,
      period: resolvePeriod(localMinutes),
      moduleId,
      moduleName,
    };

    const best = candidates
      .map((candidate) => ({ candidate, score: scoreCandidate(candidate, context) }))
      .sort((left, right) => right.score - left.score)[0]?.candidate;

    if (!best) {
      return false;
    }

    const { timestamp, document } = buildNudgeDocument(best, context);
    const firestore = getFirestore();
    const docRef = firestore.collection('live_nudges').doc(userId).collection('entries').doc(timestamp);

    await docRef.set(document, { merge: true });
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to deliver first win nudge', { user_id: userId, module_id: moduleId, error });
    return false;
  }
};
