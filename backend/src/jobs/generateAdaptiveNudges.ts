import { subDays } from 'date-fns';
import { getFirestore } from '../lib/firebase';
import { getOpenAIClient } from '../lib/openai';
import { getPineconeIndex } from '../lib/pinecone';
import { getSupabaseClient } from '../lib/supabase';

const LOOKBACK_DAYS = 7;
const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 1536;
const COMPLETION_MODEL = 'gpt-5-turbo';
const PINECONE_TOP_K = 5;

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface UserPreferences {
  nudge_tone?: string | null;
  timezone?: string | null;
}

interface UserRecord {
  id: string;
  tier?: string | null;
  preferences?: UserPreferences | null;
  primary_module_id?: string | null;
  onboarding_complete?: boolean | null;
}

interface ProtocolLogRecord {
  protocol_id: string;
  status?: string | null;
  performed_at?: string | null;
}

interface WearableRecord {
  hrv_score?: number | null;
  sleep_hours?: number | null;
  readiness_score?: number | null;
  recorded_at?: string | null;
}

interface RagMatch {
  id: string;
  score?: number;
  metadata?: Record<string, JsonValue> | null;
}

interface GeneratedNudge {
  protocol_id: string;
  nudge_text: string;
  reasoning: string;
  evidence_citation: string;
  timing: string;
  confidence_score: number;
  module_id?: string | null;
}

interface AuditLogPayload {
  user_id: string;
  model_used: string;
  prompt: string;
  context_snapshot: Record<string, JsonValue>;
  rag_sources: JsonValue;
  response_payload: JsonValue;
  fallback_reason: string | null;
  status: 'success' | 'fallback';
  error_message: string | null;
  metadata: Record<string, JsonValue>;
}

const DEFAULT_GENERIC_NUDGES: Record<string, GeneratedNudge> = {
  core: {
    protocol_id: 'core_hydration_microbreak',
    module_id: 'core_foundations',
    nudge_text:
      'Take a quick hydration break and stretch for two minutes. Small movement breaks support steady energy across the day.',
    reasoning: 'User belongs to the Core tier; hydration and micro-mobility are universally supportive habits.',
    evidence_citation: '10.1002/ejn.14777',
    timing: 'within the next hour',
    confidence_score: 0.4,
  },
  plus: {
    protocol_id: 'plus_evening_reflection',
    module_id: 'plus_recovery',
    nudge_text:
      'Plan a five-minute wind-down ritual tonight—light stretching or box breathing—to ease your transition to sleep.',
    reasoning: 'Plus-tier members benefit from structured evening routines to consolidate recovery.',
    evidence_citation: '10.5664/jcsm.9476',
    timing: 'this evening',
    confidence_score: 0.4,
  },
  pro: {
    protocol_id: 'pro_morning_light',
    module_id: 'pro_circadian',
    nudge_text:
      'Schedule tomorrow morning light exposure within 30 minutes of waking to reinforce circadian alignment.',
    reasoning: 'Circadian-focused reminder suitable for Pro members with advanced coaching.',
    evidence_citation: '10.1177/07487304211001521',
    timing: 'tomorrow morning',
    confidence_score: 0.4,
  },
};

const buildRagQuery = (
  user: UserRecord,
  adherence: ProtocolLogRecord[],
  wearable: WearableRecord | null,
): string => {
  const recentProtocols = adherence
    .slice(0, 5)
    .map((log) => `${log.protocol_id} (${log.status ?? 'unknown'})`)
    .join('; ');

  const wearableSummary = wearable
    ? `HRV ${wearable.hrv_score ?? 'n/a'}, sleep ${wearable.sleep_hours ?? 'n/a'}h, readiness ${
        wearable.readiness_score ?? 'n/a'
      }`
    : 'Wearable data unavailable';

  return [
    `Tier: ${user.tier ?? 'core'}`,
    `Primary Module: ${user.primary_module_id ?? 'unknown'}`,
    `Recent protocols: ${recentProtocols || 'none logged'}`,
    `Latest biometrics: ${wearableSummary}`,
  ].join('\n');
};

const summariseAdherence = (logs: ProtocolLogRecord[]): string => {
  if (logs.length === 0) {
    return 'No protocol engagement recorded in the past week.';
  }

  const completed = logs.filter((log) => (log.status ?? '').toLowerCase() === 'completed').length;
  return `Completed ${completed} of ${logs.length} tracked protocols in the last seven days.`;
};

const summariseWearable = (wearable: WearableRecord | null): string => {
  if (!wearable) {
    return 'No recent wearable trends available.';
  }

  const segments: string[] = [];
  if (typeof wearable.hrv_score === 'number') {
    segments.push(`HRV score ${wearable.hrv_score}`);
  }
  if (typeof wearable.sleep_hours === 'number') {
    segments.push(`Average sleep ${wearable.sleep_hours}h`);
  }
  if (typeof wearable.readiness_score === 'number') {
    segments.push(`Readiness ${wearable.readiness_score}`);
  }
  return segments.join('; ') || 'Wearable metrics captured but not interpretable.';
};

const buildPrompt = (
  user: UserRecord,
  adherence: ProtocolLogRecord[],
  wearable: WearableRecord | null,
  ragMatches: RagMatch[],
): { system: string; user: string } => {
  const tone = user.preferences?.nudge_tone ?? 'professional-encouraging';
  const ragSummary =
    ragMatches.length === 0
      ? 'No protocol knowledge snippets retrieved. Default to general coaching best practice.'
      : ragMatches
          .map((match, index) => {
            const name = typeof match.metadata?.name === 'string' ? match.metadata?.name : match.id;
            const citation = Array.isArray(match.metadata?.citations)
              ? (match.metadata?.citations[0] as string | undefined)
              : undefined;
            return `${index + 1}. ${name} (Protocol ID: ${match.id})${
              citation ? ` – cite ${citation}` : ''
            }`;
          })
          .join('\n');

  const systemPrompt =
    'You are the Wellness OS Adaptive Coach. Deliver concise, evidence-grounded nudges aligned with behavioral science and the user\'s selected module. Always respect HIPAA, avoid storing PHI, and tailor tone per preferences. Respond using the provided function schema only.';

  const userPrompt = [
    `User Tier: ${user.tier ?? 'core'}`,
    `Preferred Tone: ${tone}`,
    `Primary Module: ${user.primary_module_id ?? 'unspecified'}`,
    `Adherence Summary: ${summariseAdherence(adherence)}`,
    `Wearable Summary: ${summariseWearable(wearable)}`,
    'Relevant Protocol Intelligence:',
    ragSummary,
    'Return a single actionable nudge appropriate for the next 24 hours. Include DOI citations present in the protocol metadata when possible.',
  ].join('\n');

  return { system: systemPrompt, user: userPrompt };
};

const parseFunctionResult = (payload: unknown): GeneratedNudge | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const { protocol_id, nudge_text, reasoning, evidence_citation, timing, confidence_score, module_id } =
    payload as Record<string, unknown>;

  if (
    typeof protocol_id !== 'string' ||
    typeof nudge_text !== 'string' ||
    typeof reasoning !== 'string' ||
    typeof evidence_citation !== 'string' ||
    typeof timing !== 'string'
  ) {
    return null;
  }

  const confidence = typeof confidence_score === 'number' ? confidence_score : 0.7;

  return {
    protocol_id,
    nudge_text,
    reasoning,
    evidence_citation,
    timing,
    confidence_score: confidence,
    module_id: typeof module_id === 'string' ? module_id : null,
  };
};

const generateRuleBasedNudge = (
  user: UserRecord,
  adherence: ProtocolLogRecord[],
  wearable: WearableRecord | null,
  ragMatches: RagMatch[],
): GeneratedNudge => {
  const primaryProtocolId = ragMatches[0]?.id ?? user.primary_module_id ?? 'core_hydration_microbreak';
  const moduleId =
    (typeof ragMatches[0]?.metadata?.module_id === 'string' ? ragMatches[0]?.metadata?.module_id : null) ??
    user.primary_module_id ??
    null;

  if (wearable?.sleep_hours !== null && wearable?.sleep_hours !== undefined && wearable.sleep_hours < 7) {
    return {
      protocol_id: primaryProtocolId,
      module_id: moduleId,
      nudge_text: 'Aim for a 20-minute earlier wind-down tonight to reclaim consistent sleep duration.',
      reasoning: 'Recent sleep duration trended below the 7-hour minimum target.',
      evidence_citation: '10.1093/sleep/zsaa097',
      timing: 'tonight',
      confidence_score: 0.35,
    };
  }

  if (wearable?.hrv_score !== null && wearable?.hrv_score !== undefined && wearable.hrv_score < 70) {
    return {
      protocol_id: primaryProtocolId,
      module_id: moduleId,
      nudge_text: 'Schedule a restorative breathing break to support parasympathetic recovery.',
      reasoning: 'HRV dipped below the optimal range, suggesting added recovery support.',
      evidence_citation: '10.3389/fphys.2017.00679',
      timing: 'within the next 2 hours',
      confidence_score: 0.32,
    };
  }

  if (adherence.length === 0) {
    return {
      protocol_id: primaryProtocolId,
      module_id: moduleId,
      nudge_text: 'Pick one small protocol action today to build momentum—start with the easiest option available.',
      reasoning: 'No recent protocol completions were logged in the lookback window.',
      evidence_citation: '10.1016/j.brat.2011.02.004',
      timing: 'today',
      confidence_score: 0.3,
    };
  }

  const base = DEFAULT_GENERIC_NUDGES[user.tier ?? 'core'] ?? DEFAULT_GENERIC_NUDGES.core;
  return { ...base };
};

const getGenericFallback = (tier?: string | null): GeneratedNudge => {
  const base = DEFAULT_GENERIC_NUDGES[tier ?? 'core'] ?? DEFAULT_GENERIC_NUDGES.core;
  return { ...base };
};

const writeAuditLog = async (payload: AuditLogPayload) => {
  const supabase = getSupabaseClient();
  await supabase.from('ai_audit_log').insert(payload);
};

const queryWearableData = async (userId: string) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from<WearableRecord>('wearable_data_archive')
    .select('hrv_score, sleep_hours, readiness_score, recorded_at')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0];
};

const queryProtocolLogs = async (userId: string, since: string) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from<ProtocolLogRecord>('protocol_logs')
    .select('protocol_id, status, performed_at')
    .eq('user_id', userId)
    .gte('performed_at', since)
    .order('performed_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data;
};

const queryUsers = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from<UserRecord>('users')
    .select('id, tier, preferences, primary_module_id, onboarding_complete')
    .eq('onboarding_complete', true);

  if (error || !data) {
    return [];
  }

  return data;
};

const queryRag = async (user: UserRecord, adherence: ProtocolLogRecord[], wearable: WearableRecord | null) => {
  const openai = getOpenAIClient();
  const pineconeIndex = getPineconeIndex();

  const queryText = buildRagQuery(user, adherence, wearable);
  const embeddingResponse = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: [queryText],
    dimensions: EMBEDDING_DIMENSIONS,
  });

  const vector = embeddingResponse.data[0]?.embedding;

  if (!vector) {
    return [] as RagMatch[];
  }

  const pineconeResponse = await pineconeIndex.query({
    vector,
    topK: PINECONE_TOP_K,
    includeMetadata: true,
  });

  if (!pineconeResponse.matches) {
    return [];
  }

  return pineconeResponse.matches as RagMatch[];
};

const callOpenAi = async (
  user: UserRecord,
  adherence: ProtocolLogRecord[],
  wearable: WearableRecord | null,
  ragMatches: RagMatch[],
): Promise<{ nudge: GeneratedNudge; prompt: { system: string; user: string } }> => {
  const openai = getOpenAIClient();
  const prompt = buildPrompt(user, adherence, wearable, ragMatches);

  const response = await openai.chat.completions.create({
    model: COMPLETION_MODEL,
    temperature: 0.7,
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    functions: [
      {
        name: 'submit_nudge',
        description: 'Return the structured adaptive nudge payload',
        parameters: {
          type: 'object',
          properties: {
            protocol_id: { type: 'string' },
            module_id: { type: 'string', nullable: true },
            nudge_text: { type: 'string' },
            reasoning: { type: 'string' },
            evidence_citation: { type: 'string' },
            timing: { type: 'string' },
            confidence_score: { type: 'number' },
          },
          required: ['protocol_id', 'nudge_text', 'reasoning', 'evidence_citation', 'timing'],
        },
      },
    ],
    function_call: { name: 'submit_nudge' },
  });

  const choice = response.choices[0];
  const functionCall = choice?.message?.function_call;

  if (!functionCall || !functionCall.arguments) {
    throw new Error('OpenAI response missing function call payload');
  }

  const parsed = parseFunctionResult(JSON.parse(functionCall.arguments));

  if (!parsed) {
    throw new Error('OpenAI response could not be parsed');
  }

  if (!parsed.module_id) {
    const metadataModule = ragMatches.find((match) => typeof match.metadata?.module_id === 'string');
    parsed.module_id = (metadataModule?.metadata?.module_id as string | undefined) ?? user.primary_module_id ?? null;
  }

  return { nudge: parsed, prompt };
};

const writeNudgeToFirestore = async (userId: string, timestamp: string, nudge: GeneratedNudge, source: string) => {
  const firestore = getFirestore();
  const docRef = firestore.collection('live_nudges').doc(userId).collection('entries').doc(timestamp);
  await docRef.set(
    {
      ...nudge,
      status: 'pending',
      generated_at: timestamp,
      source,
    },
    { merge: true },
  );
};

export const generateAdaptiveNudges = async (
  _event: { data?: string } | undefined,
  context: { timestamp?: string } | undefined,
): Promise<void> => {
  const runDate = context?.timestamp ? new Date(context.timestamp) : new Date();
  const lookbackIso = subDays(runDate, LOOKBACK_DAYS).toISOString();

  const users = await queryUsers();

  if (users.length === 0) {
    return;
  }

  for (const user of users) {
    const wearable = await queryWearableData(user.id);
    const adherence = await queryProtocolLogs(user.id, lookbackIso);

    let ragMatches: RagMatch[] = [];
    try {
      ragMatches = await queryRag(user, adherence, wearable);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('RAG query failed', { user_id: user.id, error });
      ragMatches = [];
    }

    let modelUsed = COMPLETION_MODEL;
    let fallbackReason: string | null = null;
    let errorMessage: string | null = null;
    let promptRecord: { system: string; user: string } | null = null;
    let finalNudge: GeneratedNudge | null = null;

    try {
      const { nudge, prompt } = await callOpenAi(user, adherence, wearable, ragMatches);
      finalNudge = nudge;
      promptRecord = prompt;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('OpenAI nudge generation failed', { user_id: user.id, error });
      errorMessage = error instanceof Error ? error.message : 'Unknown OpenAI error';
      fallbackReason = 'openai_error';

      try {
        finalNudge = generateRuleBasedNudge(user, adherence, wearable, ragMatches);
        modelUsed = 'rule-based';
      } catch (ruleError) {
        // eslint-disable-next-line no-console
        console.error('Rule-based nudge generation failed', { user_id: user.id, error: ruleError });
        fallbackReason = 'rule_based_failed';
        modelUsed = 'static-cache';
        finalNudge = getGenericFallback(user.tier);
      }
    }

    if (!finalNudge) {
      finalNudge = getGenericFallback(user.tier);
      fallbackReason = fallbackReason ?? 'no_nudge_generated';
      modelUsed = 'static-cache';
    }

    const timestamp = new Date().toISOString();

    await writeNudgeToFirestore(user.id, timestamp, finalNudge, fallbackReason ? 'fallback' : 'ai');

    const auditPayload: AuditLogPayload = {
      user_id: user.id,
      model_used: modelUsed,
      prompt: promptRecord ? `${promptRecord.system}\n\n${promptRecord.user}` : 'N/A',
      context_snapshot: {
        tier: user.tier ?? null,
        preferences: user.preferences ?? null,
        primary_module_id: user.primary_module_id ?? null,
        adherence_window: lookbackIso,
        wearable,
      },
      rag_sources: ragMatches.map((match) => ({
        protocol_id: match.id,
        score: match.score ?? null,
        metadata: match.metadata ?? null,
      })),
      response_payload: finalNudge,
      fallback_reason: fallbackReason,
      status: fallbackReason ? 'fallback' : 'success',
      error_message: errorMessage,
      metadata: {
        generated_at: timestamp,
        source: fallbackReason ? 'fallback' : 'ai',
      },
    };

    try {
      await writeAuditLog(auditPayload);
    } catch (auditError) {
      // eslint-disable-next-line no-console
      console.error('Failed to write AI audit log', { user_id: user.id, error: auditError });
    }
  }
};

