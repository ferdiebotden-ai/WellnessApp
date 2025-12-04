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
import {
  evaluateSuppression,
  buildSuppressionContext,
  getUserLocalHour,
  parseQuietHour,
  SuppressionResult,
  SUPPRESSION_CONFIG,
} from './suppression';
import {
  scanAIOutput,
  getSafeFallbackResponse,
} from './safety';
import {
  generateWhyExpansion,
  WhyExpansion,
} from './reasoning/whyEngine';
import {
  getMVDState,
  detectAndMaybeActivateMVD,
  checkAndMaybeExitMVD,
  buildMVDDetectionContext,
  isProtocolApprovedForMVD,
  MVDState,
} from './mvd';

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
  preferences?: {
    quiet_hours_enabled?: boolean;
    quiet_start_time?: string; // HH:MM format
    quiet_end_time?: string; // HH:MM format
    timezone?: string; // IANA timezone
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
  why_expansion?: WhyExpansion;
}

type ScheduledEvent = { data?: string } | undefined;
type ScheduledContext = { timestamp?: string } | undefined;

const SYSTEM_PROMPT = `You are a credible wellness coach for performance professionals. Use evidence-based language. Reference peer-reviewed studies when relevant. Celebrate progress based on health outcomes (HRV improvement, sleep quality gains), not arbitrary milestones. Tone is professional, motivational but not cheesy. Address user by name occasionally. Use 🔥 emoji only for streaks (professional standard). No other emojis. **You must not provide medical advice.** You are an educational tool. If a user asks for medical advice, you must decline and append the medical disclaimer.`;

/**
 * Protocol IDs that qualify as morning anchors
 * Morning anchors are exempt from low_recovery suppression
 */
const MORNING_ANCHOR_PROTOCOL_IDS = [
  'proto_morning_light',
  'morning_light_exposure',
  'proto_hydration_electrolytes',
  'hydration_electrolytes',
] as const;

/**
 * Check if a protocol qualifies as a morning anchor
 */
function isMorningAnchorProtocol(protocolId: string): boolean {
  return MORNING_ANCHOR_PROTOCOL_IDS.some(
    (id) => protocolId.toLowerCase().includes(id.toLowerCase())
  );
}

// Note: MVD protocol approval now handled by mvd/mvdProtocols.ts
// with type-aware filtering (full, semi_active, travel)

/**
 * Get today's nudge statistics for a user (for suppression engine)
 *
 * @param firestore - Firestore instance
 * @param userId - User ID to check
 * @returns Stats: nudgesDeliveredToday, lastNudgeDeliveredAt, dismissalsToday
 */
async function getTodayNudgeStats(
  firestore: FirebaseFirestore.Firestore,
  userId: string
): Promise<{
  nudgesDeliveredToday: number;
  lastNudgeDeliveredAt: Date | null;
  dismissalsToday: number;
}> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const entriesRef = firestore
    .collection('live_nudges')
    .doc(userId)
    .collection('entries');

  const todaySnapshot = await entriesRef
    .where('created_at', '>=', startOfDay.toISOString())
    .get();

  let nudgesDeliveredToday = 0;
  let lastNudgeDeliveredAt: Date | null = null;
  let dismissalsToday = 0;

  todaySnapshot.docs.forEach((doc) => {
    const data = doc.data();
    nudgesDeliveredToday++;

    const createdAt = new Date(data.created_at);
    if (!lastNudgeDeliveredAt || createdAt > lastNudgeDeliveredAt) {
      lastNudgeDeliveredAt = createdAt;
    }

    if (data.status === 'dismissed') {
      dismissalsToday++;
    }
  });

  return { nudgesDeliveredToday, lastNudgeDeliveredAt, dismissalsToday };
}

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
  
  // Fetch profiles (including preferences for suppression engine)
  const { data: profilesData, error: profilesError } = await supabase
    .from('users')
    .select('id, display_name, healthMetrics, primary_goal, preferences')
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

    // Suppression Engine: Check if we should deliver this nudge
    const nudgeStats = await getTodayNudgeStats(firestore, userId);
    const userTimezone = profile.preferences?.timezone;

    // Get user's current streak (TODO: fetch from user_stats table in Phase 3)
    const currentStreak = 0; // Default until streak tracking is implemented

    // Get recovery score from health metrics (default to healthy if not available)
    const recoveryScore = profile.healthMetrics?.readinessScore ?? 100;

    // MVD Detection: Check if we should activate or exit MVD mode
    let mvdState: MVDState | null = await getMVDState(userId);

    // Check exit condition first if MVD is active
    if (mvdState?.mvd_active) {
      const exited = await checkAndMaybeExitMVD(userId, recoveryScore);
      if (exited) {
        console.log(`[NudgeEngine] MVD exited for user ${userId} - recovery improved to ${recoveryScore}%`);
        mvdState = null; // Clear state after exit
      }
    }

    // Check activation if not currently active
    if (!mvdState?.mvd_active) {
      const mvdContext = await buildMVDDetectionContext(
        userId,
        userTimezone, // Use as device timezone (best available)
        false // Not manual activation
      );
      const detection = await detectAndMaybeActivateMVD(mvdContext);
      if (detection.wasActivated) {
        console.log(
          `[NudgeEngine] MVD activated for user ${userId}: ` +
          `trigger=${detection.trigger}, type=${detection.mvdType}`
        );
        mvdState = await getMVDState(userId);
      }
    }

    const mvdActive = mvdState?.mvd_active ?? false;
    const mvdType = mvdState?.mvd_type ?? null;

    const suppressionContext = buildSuppressionContext({
      nudgePriority: 'STANDARD', // All scheduled nudges are STANDARD priority
      confidenceScore: bestMatch.confidence.overall,
      userLocalHour: getUserLocalHour(new Date(), userTimezone),
      userPreferences: {
        quiet_hours_start: parseQuietHour(profile.preferences?.quiet_start_time),
        quiet_hours_end: parseQuietHour(profile.preferences?.quiet_end_time),
        timezone: userTimezone,
      },
      nudgesDeliveredToday: nudgeStats.nudgesDeliveredToday,
      lastNudgeDeliveredAt: nudgeStats.lastNudgeDeliveredAt,
      dismissalsToday: nudgeStats.dismissalsToday,
      meetingHoursToday: 0, // TODO: Calendar integration in Phase 3
      // Part 2 suppression fields
      recoveryScore,
      isMorningAnchor: isMorningAnchorProtocol(bestMatch.protocol.id),
      currentStreak,
      mvdActive,
      // Use type-aware protocol approval (checks against MVD_PROTOCOL_SETS)
      isMvdApprovedNudge: isProtocolApprovedForMVD(bestMatch.protocol.id, mvdType),
    });

    const suppressionResult: SuppressionResult = evaluateSuppression(suppressionContext);

    if (!suppressionResult.shouldDeliver) {
      // Nudge was suppressed - log to audit and skip this user
      await supabase.from('ai_audit_log').insert({
        user_id: userId,
        decision_type: 'nudge_suppressed',
        model_used: getCompletionModelName(),
        reasoning: suppressionResult.reason,
        module_id: primaryModule.module_id,
        protocol_id: bestMatch.protocol.id,
        confidence_score: bestMatch.confidence.overall,
        confidence_factors: bestMatch.confidence.factors,
        was_suppressed: true,
        suppression_rule: suppressionResult.suppressedBy,
        suppression_reason: suppressionResult.reason,
      });

      console.log(
        `[NudgeEngine] Nudge suppressed for user ${userId}: ` +
          `${suppressionResult.suppressedBy} - ${suppressionResult.reason}`
      );
      continue;
    }

    const ragContext = ragResults.map(p => `Protocol: ${p.name}\nBenefits: ${p.benefits}\nEvidence: ${p.citations.join(', ')}`).join('\n\n');

    const userPrompt = `
      Context: ${context}${memoryContext}

      Relevant Protocols:
      ${ragContext}

      Task: Generate a short, punchy, evidence-based nudge (max 2 sentences) to motivate the user to engage with their ${primaryModule.module_id} module today. Suggest one of the relevant protocols if appropriate. Consider the user's memories and past preferences if available.
    `;

    // Generate Nudge
    let nudgeText = await generateCompletion(SYSTEM_PROMPT, userPrompt);

    // Generate WhyExpansion for reasoning transparency (Session 12)
    const whyExpansion = await generateWhyExpansion({
      protocol: bestMatch.protocol,
      confidence: bestMatch.confidence,
      memories: memories,
      userId: userId,
    });

    // Safety Check: Scan AI-generated nudge before delivery
    const nudgeScan = scanAIOutput(nudgeText, 'nudge');
    if (!nudgeScan.safe) {
      // Log the flagged content and skip this nudge
      console.warn(`[NudgeEngine] Nudge flagged for user ${userId}:`, nudgeScan.reason);
      await supabase.from('ai_audit_log').insert({
        user_id: userId,
        decision_type: 'nudge_safety_flagged',
        model_used: getCompletionModelName(),
        prompt: userPrompt,
        response: 'FLAGGED - Nudge not delivered',
        reasoning: nudgeScan.reason || 'Nudge content flagged by safety scanner',
        module_id: primaryModule.module_id,
        protocol_id: bestMatch.protocol.id,
        metadata: {
          flagged_keywords: nudgeScan.flaggedKeywords,
          severity: nudgeScan.severity,
        },
      });
      // Replace with safe fallback nudge
      nudgeText = getSafeFallbackResponse('nudge');
    }

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
      why_expansion: whyExpansion,
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
      // Reasoning transparency (Session 12)
      why_expansion: whyExpansion,
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
      // Suppression tracking (passed all rules)
      was_suppressed: false,
      suppression_rule: null,
      suppression_reason: null,
    });
  }
};

