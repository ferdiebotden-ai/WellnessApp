import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseApp } from './firebaseAdmin';
import { getServiceClient } from './supabaseClient';
import { getConfig } from './config';
import {
  generateEmbedding,
  resolvePineconeHost,
  queryPinecone,
  fetchProtocols,
  mapProtocols,
} from './protocolSearch';
import { generateCompletion, getCompletionModelName } from './vertexAI';
import { getRelevantMemories, ScoredMemory } from './memory';
import {
  calculateConfidence,
  getTimeOfDay,
  NudgeContext,
  ConfidenceScore,
  PrimaryGoal,
} from './reasoning';

// Interfaces
interface ModuleEnrollmentRow {
  id: string;
  user_id: string;
  module_id: string;
  last_active_date?: string | null;
}

interface UserProfileRow {
  id: string;
  display_name?: string | null;
  primary_goal?: PrimaryGoal | null;
  healthMetrics?: {
    sleepQualityTrend?: number;
    hrvImprovementPct?: number;
    protocolAdherencePct?: number;
    readinessScore?: number;
  } | null;
}

interface NudgePayload {
  nudge_text: string;
  protocol_id?: string;
  module_id: string;
  reasoning: string;
  citations?: string[];
  type: 'proactive_coach';
  generated_at: string;
  status: 'pending';
  confidence?: ConfidenceScore;
}

type ScheduledEvent = { data?: string } | undefined;
type ScheduledContext = { timestamp?: string } | undefined;

const SYSTEM_PROMPT = `You are a credible wellness coach for performance professionals. Use evidence-based language. Reference peer-reviewed studies when relevant. Celebrate progress based on health outcomes (HRV improvement, sleep quality gains), not arbitrary milestones. Tone is professional, motivational but not cheesy. Address user by name occasionally. Use 🔥 emoji only for streaks (professional standard). No other emojis. **You must not provide medical advice.** You are an educational tool. If a user asks for medical advice, you must decline and append the medical disclaimer.`;

export const generateAdaptiveNudges = async (
  _event: ScheduledEvent,
  _context: ScheduledContext,
): Promise<void> => {
  const config = getConfig();
  const firestore = getFirestore(getFirebaseApp());
  const supabase = getServiceClient();

  // 1. Fetch active enrollments
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('module_enrollment')
    .select('id, user_id, module_id, last_active_date');

  if (enrollmentsError) throw new Error(enrollmentsError.message);
  if (enrollments.length === 0) return;

  // Group by user
  const userEnrollments = new Map<string, ModuleEnrollmentRow[]>();
  for (const e of (enrollments as ModuleEnrollmentRow[] | null) || []) {
    const list = userEnrollments.get(e.user_id) || [];
    list.push(e);
    userEnrollments.set(e.user_id, list);
  }

  // Process each user (limit to 50 for MVP batch)
  const userIds = Array.from(userEnrollments.keys()).slice(0, 50);
  
  // Fetch profiles
  const { data: profilesData, error: profilesError } = await supabase
    .from('users')
    .select('id, display_name, healthMetrics, primary_goal')
    .in('id', userIds);
    
  if (profilesError) throw new Error(profilesError.message);
  const profiles = new Map((profilesData as UserProfileRow[] | null)?.map(p => [p.id, p]) || []);

  for (const userId of userIds) {
    const profile = profiles.get(userId);
    const modules = userEnrollments.get(userId) || [];
    if (!profile || modules.length === 0) continue;

    const primaryModule = modules[0]; // Just pick first for MVP context

    // Construct Context
    const context = `
      User: ${profile.display_name || 'Performance Professional'}
      Focus Module: ${primaryModule.module_id}
      Health Metrics: Sleep Quality Trend: ${profile.healthMetrics?.sleepQualityTrend || 'N/A'}, HRV Improvement: ${profile.healthMetrics?.hrvImprovementPct || 'N/A'}%
      Last Active: ${primaryModule.last_active_date || 'Never'}
    `;

    // Memory Layer: Retrieve relevant user memories
    const memories: ScoredMemory[] = await getRelevantMemories(userId, {
      module_id: primaryModule.module_id,
      min_confidence: 0.2
    }, 5);

    // Format memories for AI context
    const memoryContext = memories.length > 0
      ? `\n      User Memories (learned patterns):\n${memories.map(m =>
          `      - [${m.type}] ${m.content} (confidence: ${m.confidence.toFixed(2)})`
        ).join('\n')}`
      : '';

    // RAG: Find relevant protocol
    // Query based on module + "optimization"
    const query = `${primaryModule.module_id} optimization strategies`;
    const embedding = await generateEmbedding(query);
    const pineconeHost = await resolvePineconeHost(config.pineconeApiKey, config.pineconeIndexName);
    const matches = await queryPinecone(config.pineconeApiKey, pineconeHost, embedding, 3);
    const protocols = await fetchProtocols(supabase, matches.map(m => m.id));
    const ragResults = mapProtocols(matches, protocols);

    // Confidence Scoring: Evaluate each protocol before selection
    const currentHour = new Date().getUTCHours();
    const timeOfDay = getTimeOfDay(currentHour);

    const scoredProtocols = ragResults.map((protocol) => {
      const nudgeContext: NudgeContext = {
        user_id: userId,
        primary_goal: profile.primary_goal || 'better_sleep',
        module_id: primaryModule.module_id,
        current_hour_utc: currentHour,
        time_of_day: timeOfDay,
        recovery_score: profile.healthMetrics?.readinessScore,
        hrv_baseline_deviation: profile.healthMetrics?.hrvImprovementPct,
        protocol,
        memories,
        other_protocols: ragResults.filter((p) => p.id !== protocol.id),
      };
      return { protocol, confidence: calculateConfidence(nudgeContext) };
    });

    // Filter out suppressed protocols and sort by confidence
    const validProtocols = scoredProtocols.filter((sp) => !sp.confidence.should_suppress);

    if (validProtocols.length === 0) {
      // All protocols were suppressed - skip this user
      console.log(`[NudgeEngine] All protocols suppressed for user ${userId} - skipping`);
      continue;
    }

    // Select the highest-confidence protocol
    const bestMatch = validProtocols.sort((a, b) => b.confidence.overall - a.confidence.overall)[0];

    const ragContext = ragResults.map(p => `Protocol: ${p.name}\nBenefits: ${p.benefits}\nEvidence: ${p.citations.join(', ')}`).join('\n\n');

    const userPrompt = `
      Context: ${context}${memoryContext}

      Relevant Protocols:
      ${ragContext}

      Task: Generate a short, punchy, evidence-based nudge (max 2 sentences) to motivate the user to engage with their ${primaryModule.module_id} module today. Suggest one of the relevant protocols if appropriate. Consider the user's memories and past preferences if available.
    `;

    // Generate Nudge
    const nudgeText = await generateCompletion(SYSTEM_PROMPT, userPrompt);

    // Write to Firestore (match client's expected task structure)
    const now = new Date().toISOString();
    const suggestedProtocolId = bestMatch.protocol.id;
    const nudgePayload: NudgePayload = {
      nudge_text: nudgeText,
      module_id: primaryModule.module_id,
      reasoning: bestMatch.confidence.reasoning,
      citations: bestMatch.protocol.citations,
      type: 'proactive_coach',
      generated_at: now,
      status: 'pending',
      confidence: bestMatch.confidence,
    };

    // Write as a task document with client-expected fields
    const taskDoc = {
      title: nudgeText, // Client expects 'title' field
      status: 'pending' as const,
      scheduled_for: now, // Client expects 'scheduled_for' field
      emphasis: 'high', // Nudges are high priority
      type: 'proactive_coach',
      module_id: primaryModule.module_id,
      protocol_id: suggestedProtocolId, // For memory feedback tracking
      citations: nudgePayload.citations,
      created_at: now,
      // Confidence scoring fields
      confidence_score: bestMatch.confidence.overall,
      confidence_reasoning: bestMatch.confidence.reasoning,
    };

    await firestore.collection('live_nudges').doc(userId).collection('entries').add(taskDoc);

    // Log to Audit Log (includes memory IDs and confidence for traceability)
    const memoryIdsUsed = memories.map((m) => m.id);
    const suppressedCount = scoredProtocols.length - validProtocols.length;
    await supabase.from('ai_audit_log').insert({
      user_id: userId,
      decision_type: 'nudge_generated',
      model_used: getCompletionModelName(),
      prompt: userPrompt,
      response: nudgeText,
      reasoning: bestMatch.confidence.reasoning,
      citations: nudgePayload.citations,
      module_id: primaryModule.module_id,
      protocol_id: suggestedProtocolId,
      memory_ids_used: memoryIdsUsed.length > 0 ? memoryIdsUsed : null,
      // Confidence scoring data
      confidence_score: bestMatch.confidence.overall,
      confidence_factors: bestMatch.confidence.factors,
      suppressed_count: suppressedCount,
    });
  }
};

