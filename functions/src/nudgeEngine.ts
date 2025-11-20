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
  healthMetrics?: {
    sleepQualityTrend?: number;
    hrvImprovementPct?: number;
    protocolAdherencePct?: number;
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
    .select('id, display_name, healthMetrics')
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

    // RAG: Find relevant protocol
    // Query based on module + "optimization"
    const query = `${primaryModule.module_id} optimization strategies`;
    const embedding = await generateEmbedding(query);
    const pineconeHost = await resolvePineconeHost(config.pineconeApiKey, config.pineconeIndexName);
    const matches = await queryPinecone(config.pineconeApiKey, pineconeHost, embedding, 3);
    const protocols = await fetchProtocols(supabase, matches.map(m => m.id));
    const ragResults = mapProtocols(matches, protocols);

    const ragContext = ragResults.map(p => `Protocol: ${p.name}\nBenefits: ${p.benefits}\nEvidence: ${p.citations.join(', ')}`).join('\n\n');

    const userPrompt = `
      Context: ${context}

      Relevant Protocols:
      ${ragContext}

      Task: Generate a short, punchy, evidence-based nudge (max 2 sentences) to motivate the user to engage with their ${primaryModule.module_id} module today. Suggest one of the relevant protocols if appropriate.
    `;

    // Generate Nudge
    const nudgeText = await generateCompletion(SYSTEM_PROMPT, userPrompt);

    // Write to Firestore
    const nudgePayload: NudgePayload = {
      nudge_text: nudgeText,
      module_id: primaryModule.module_id,
      reasoning: 'AI generated based on module focus and RAG context',
      citations: ragResults.length > 0 ? ragResults[0].citations : [],
      type: 'proactive_coach',
      generated_at: new Date().toISOString(),
      status: 'pending',
    };

    await firestore.collection('live_nudges').doc(userId).collection('entries').add(nudgePayload);

    // Log to Audit Log
    await supabase.from('ai_audit_log').insert({
      user_id: userId,
      decision_type: 'nudge_generated',
      model_used: getCompletionModelName(),
      prompt: userPrompt,
      response: nudgeText,
      reasoning: 'Proactive engagement',
      citations: nudgePayload.citations,
      module_id: primaryModule.module_id,
    });
  }
};

