"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatHistory = exports.postChat = void 0;
const users_1 = require("./users");
const firestore_1 = require("firebase-admin/firestore");
const firebaseAdmin_1 = require("./firebaseAdmin");
const supabaseClient_1 = require("./supabaseClient");
const config_1 = require("./config");
const protocolSearch_1 = require("./protocolSearch");
const vertexAI_1 = require("./vertexAI");
const safety_1 = require("./safety");
// ============================================================================
// TONE INSTRUCTIONS
// ============================================================================
const TONE_INSTRUCTIONS = {
    motivational: `**Communication Style: MOTIVATIONAL**
- Lead with encouragement and progress acknowledgment
- Be enthusiastic but professional (not cheesy)
- Celebrate small wins and consistent effort
- Use positive framing for challenges`,
    neutral: `**Communication Style: NEUTRAL**
- Be factual and informative
- Present data and recommendations objectively
- Balance encouragement with practicality
- Focus on evidence and actionable steps`,
    minimal: `**Communication Style: MINIMAL**
- Be extremely concise and direct
- Prioritize data and metrics over prose
- Skip pleasantries, get straight to the point
- Use bullet points when possible`,
};
// ============================================================================
// GOAL FORMATTING
// ============================================================================
const GOAL_DISPLAY_NAMES = {
    better_sleep: 'Better Sleep',
    more_energy: 'More Energy',
    sharper_focus: 'Sharper Focus',
    faster_recovery: 'Faster Recovery',
};
// ============================================================================
// DYNAMIC SYSTEM PROMPT BUILDER
// ============================================================================
function buildSystemPrompt(ctx, memories) {
    const toneInstruction = TONE_INSTRUCTIONS[ctx.tonePreference] || TONE_INSTRUCTIONS.neutral;
    const goalDisplay = ctx.primaryGoal ? GOAL_DISPLAY_NAMES[ctx.primaryGoal] || ctx.primaryGoal : 'General Wellness';
    // Build user profile section
    const profileSection = `**User Profile:**
- Name: ${ctx.displayName}
- Primary Goal: ${goalDisplay}
- Wearable: ${ctx.wearableSource || 'None connected'}
- Member Since: ${ctx.memberSince ? new Date(ctx.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'New user'}`;
    // Build current state section
    let stateSection = `**Current State:**`;
    if (ctx.recoveryScore !== null) {
        const confidenceLabel = ctx.recoveryConfidence && ctx.recoveryConfidence >= 0.7 ? '' : ' (estimated)';
        stateSection += `\n- Recovery Score: ${ctx.recoveryScore}% (${ctx.recoveryZone || 'unknown'} zone)${confidenceLabel}`;
    }
    else {
        stateSection += `\n- Recovery Score: Not available`;
    }
    stateSection += `\n- Active Protocols: ${ctx.activeProtocols.length > 0 ? ctx.activeProtocols.join(', ') : 'None enrolled'}`;
    stateSection += `\n- Protocol Completions (7d): ${ctx.recentCompletions}`;
    // Build memories section if any
    let memoriesSection = '';
    if (memories.length > 0) {
        memoriesSection = `\n\n**Known About User:**\n${memories.map(m => `- [${m.type}] ${m.content}`).join('\n')}`;
    }
    return `You are a credible wellness coach for performance professionals. Use evidence-based language. Reference peer-reviewed studies when relevant. Celebrate progress based on health outcomes (HRV improvement, sleep quality gains), not arbitrary milestones. Address user by name occasionally. Use 🔥 emoji only for streaks (professional standard). No other emojis.

${toneInstruction}

${profileSection}

${stateSection}${memoriesSection}

**RESPONSE STYLE:**
- Be concise but ALWAYS complete your thoughts - never end mid-sentence
- Structure: Direct answer + Supporting insight + Actionable next step
- Aim for 2-4 short paragraphs that fully address the question
- For simple questions, keep it brief; for complex topics, provide adequate detail
- Reference the user's current recovery state and goals when relevant
- Use warm, conversational tone appropriate for a wellness coach
- End with 1-2 concrete next steps

**You must not provide medical advice.** You are an educational tool. If a user asks for medical advice, you must decline and append the medical disclaimer.`;
}
const MEDICAL_DISCLAIMER = "\n\n⚠️ **Important**: This is educational information, not medical advice. Consult your healthcare provider.";
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Fetches the last N messages from a conversation for context continuity.
 */
async function getRecentMessages(firestore, firebaseUid, conversationId, limit = 5) {
    try {
        const messagesRef = firestore
            .collection('users')
            .doc(firebaseUid)
            .collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(limit);
        const snapshot = await messagesRef.get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs
            .map(doc => {
            const data = doc.data();
            return {
                role: data.role,
                content: data.content,
            };
        })
            .reverse(); // Return in chronological order
    }
    catch (error) {
        console.warn('[Chat] Failed to fetch recent messages:', error);
        return [];
    }
}
/**
 * Builds comprehensive user context from multiple data sources.
 */
async function buildUserContext(supabase, supabaseUserId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();
    // Parallel queries for efficiency
    const [profileResult, recoveryResult, protocolsResult, completionsResult] = await Promise.all([
        // Get user profile
        supabase
            .from('users')
            .select('display_name, primary_goal, wearable_source, preferences, created_at')
            .eq('id', supabaseUserId)
            .single(),
        // Get latest recovery score
        supabase
            .from('recovery_scores')
            .select('score, zone, confidence, date')
            .eq('user_id', supabaseUserId)
            .order('date', { ascending: false })
            .limit(1)
            .single(),
        // Get active protocol enrollments (using module_enrollment as it uses users.id FK)
        supabase
            .from('module_enrollment')
            .select('modules!inner(id, name)')
            .eq('user_id', supabaseUserId)
            .eq('is_active', true),
        // Get protocol completions in last 7 days
        supabase
            .from('protocol_logs')
            .select('id')
            .eq('user_id', supabaseUserId)
            .eq('status', 'completed')
            .gte('logged_at', sevenDaysAgoISO),
    ]);
    // Extract tone preference from JSONB preferences
    const preferences = profileResult.data?.preferences;
    const tonePreference = preferences?.nudge_tone || 'neutral';
    // Extract active protocols from modules
    const activeProtocols = [];
    if (protocolsResult.data && Array.isArray(protocolsResult.data)) {
        for (const enrollment of protocolsResult.data) {
            const modules = enrollment.modules;
            if (modules?.name) {
                activeProtocols.push(modules.name);
            }
        }
    }
    return {
        displayName: profileResult.data?.display_name || 'there',
        primaryGoal: profileResult.data?.primary_goal || null,
        tonePreference,
        recoveryScore: recoveryResult.data?.score ?? null,
        recoveryZone: recoveryResult.data?.zone,
        recoveryConfidence: recoveryResult.data?.confidence ?? null,
        activeProtocols,
        recentCompletions: completionsResult.data?.length || 0,
        wearableSource: profileResult.data?.wearable_source || null,
        memberSince: profileResult.data?.created_at || null,
    };
}
/**
 * Fetches relevant user memories for personalization.
 */
async function getUserMemories(supabase, supabaseUserId, limit = 5) {
    try {
        const { data, error } = await supabase
            .from('user_memories')
            .select('type, content, confidence')
            .eq('user_id', supabaseUserId)
            .gte('confidence', 0.3) // Only include reasonably confident memories
            .order('confidence', { ascending: false })
            .order('last_used_at', { ascending: false })
            .limit(limit);
        if (error) {
            console.warn('[Chat] Failed to fetch user memories:', error);
            return [];
        }
        // Update last_used_at for retrieved memories (fire and forget)
        if (data && data.length > 0) {
            // Note: This would require a separate update call if we want to track usage
            // For now, we'll skip this to avoid additional latency
        }
        return (data || []).map(m => ({
            type: m.type,
            content: m.content,
            confidence: m.confidence,
        }));
    }
    catch (error) {
        console.warn('[Chat] Error fetching user memories:', error);
        return [];
    }
}
/**
 * Formats conversation history for the prompt.
 */
function formatConversationHistory(messages) {
    if (messages.length === 0) {
        return '';
    }
    const formatted = messages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');
    return `\n**Recent Conversation:**\n${formatted}\n`;
}
const postChat = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    try {
        const { uid } = await (0, users_1.authenticateRequest)(req);
        const { message, conversationId } = req.body;
        if (!message || typeof message !== 'string') {
            res.status(400).json({ error: 'Message is required' });
            return;
        }
        const config = (0, config_1.getConfig)();
        const firestore = (0, firestore_1.getFirestore)((0, firebaseAdmin_1.getFirebaseApp)());
        const supabase = (0, supabaseClient_1.getServiceClient)();
        // 1. Safety Check (Enhanced Crisis Detection)
        const crisisResult = (0, safety_1.detectCrisis)(message);
        if (crisisResult.detected) {
            // Get user ID for audit logging
            const { data: profile } = await supabase
                .from('users')
                .select('id')
                .eq('firebase_uid', uid)
                .single();
            // Log crisis detection to audit trail
            if (profile?.id) {
                await supabase.from('ai_audit_log').insert({
                    user_id: profile.id,
                    decision_type: 'crisis_assessment',
                    model_used: 'safety_module_v1',
                    prompt: '', // Don't store crisis messages for privacy
                    response: (0, safety_1.generateCrisisResponse)(crisisResult),
                    reasoning: `Severity: ${crisisResult.severity}, Keywords: ${crisisResult.matchedKeywords.join(', ')}`,
                    citations: [],
                    metadata: {
                        severity: crisisResult.severity,
                        keywords_detected: crisisResult.matchedKeywords,
                        resources_shown: crisisResult.resources.map((r) => r.name),
                    },
                });
            }
            res.status(200).json({
                response: (0, safety_1.generateCrisisResponse)(crisisResult),
                safety_flag: 'crisis_detected',
                severity: crisisResult.severity,
                resources: crisisResult.resources,
            });
            return;
        }
        const lowerMsg = message.toLowerCase();
        // 2. Get Supabase User ID first (needed for all context queries)
        const { data: userIdResult } = await supabase
            .from('users')
            .select('id')
            .eq('firebase_uid', uid)
            .single();
        const supabaseUserId = userIdResult?.id;
        // 3. Fetch all context in parallel for efficiency
        const [userContext, userMemories, recentMessages] = await Promise.all([
            // Rich user context (profile, recovery, protocols, completions)
            supabaseUserId ? buildUserContext(supabase, supabaseUserId) : Promise.resolve({
                displayName: 'there',
                primaryGoal: null,
                tonePreference: 'neutral',
                recoveryScore: null,
                recoveryZone: null,
                recoveryConfidence: null,
                activeProtocols: [],
                recentCompletions: 0,
                wearableSource: null,
                memberSince: null,
            }),
            // User memories for personalization
            supabaseUserId ? getUserMemories(supabase, supabaseUserId, 5) : Promise.resolve([]),
            // Conversation history (only if continuing a conversation)
            conversationId ? getRecentMessages(firestore, uid, conversationId, 5) : Promise.resolve([]),
        ]);
        // 4. RAG Search for relevant protocols
        const embedding = await (0, protocolSearch_1.generateEmbedding)(message);
        const pineconeHost = await (0, protocolSearch_1.resolvePineconeHost)(config.pineconeApiKey, config.pineconeIndexName);
        const matches = await (0, protocolSearch_1.queryPinecone)(config.pineconeApiKey, pineconeHost, embedding, 3);
        const protocols = await (0, protocolSearch_1.fetchProtocols)(supabase, matches.map(m => m.id));
        const ragResults = (0, protocolSearch_1.mapProtocols)(matches, protocols);
        const ragContext = ragResults.map(p => `Protocol: ${p.name}\nBenefits: ${p.benefits}\nEvidence: ${p.citations.join(', ')}`).join('\n\n');
        // 5. Build dynamic system prompt with user context and memories
        const systemPrompt = buildSystemPrompt(userContext, userMemories);
        // 6. Build user prompt with conversation history and RAG context
        const conversationHistory = formatConversationHistory(recentMessages);
        const userPrompt = `${conversationHistory}
Relevant Protocols:
${ragContext}

User Query: ${message}`;
        // 7. Generate Response
        let responseText = await (0, vertexAI_1.generateCompletion)(systemPrompt, userPrompt);
        // 8. AI Output Safety Check
        const outputScan = (0, safety_1.scanAIOutput)(responseText, 'ai_response');
        if (!outputScan.safe) {
            // Log the flagged content for review
            console.warn('[Chat] AI output flagged:', outputScan.reason);
            if (supabaseUserId) {
                await supabase.from('ai_audit_log').insert({
                    user_id: supabaseUserId,
                    decision_type: 'ai_output_flagged',
                    model_used: (0, vertexAI_1.getCompletionModelName)(),
                    prompt: userPrompt,
                    response: 'FLAGGED - Content replaced with safe fallback',
                    reasoning: outputScan.reason || 'AI output contained unsafe content',
                    citations: [],
                    metadata: {
                        flagged_keywords: outputScan.flaggedKeywords,
                        severity: outputScan.severity,
                    },
                });
            }
            // Replace with safe fallback
            responseText = (0, safety_1.getSafeFallbackResponse)('ai_response');
        }
        // 9. Word count monitoring (no truncation - trust model to self-regulate)
        const wordCount = responseText.split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount > 500) {
            console.info(`[Chat] Long response: ${wordCount} words (monitoring only)`);
        }
        // No truncation - Gemini 3 Flash with improved prompt handles response length naturally
        // Append disclaimer if medical keywords detected (simplified)
        const medicalKeywords = ['pain', 'doctor', 'prescription', 'diagnose', 'symptom', 'medication'];
        if (medicalKeywords.some(k => lowerMsg.includes(k))) {
            responseText += MEDICAL_DISCLAIMER;
        }
        // 10. Persistence
        const convId = conversationId || firestore.collection('users').doc(uid).collection('conversations').doc().id;
        const convRef = firestore.collection('users').doc(uid).collection('conversations').doc(convId);
        await convRef.set({
            updated_at: new Date().toISOString(),
            last_message: message.substring(0, 50) + '...',
        }, { merge: true });
        await convRef.collection('messages').add({
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
        });
        await convRef.collection('messages').add({
            role: 'assistant',
            content: responseText,
            timestamp: new Date().toISOString(),
            citations: ragResults.map(r => r.citations).flat(),
        });
        // Log to Audit Log (use Supabase UUID for foreign key)
        if (supabaseUserId) {
            await supabase.from('ai_audit_log').insert({
                user_id: supabaseUserId,
                decision_type: 'chat_response',
                model_used: (0, vertexAI_1.getCompletionModelName)(),
                prompt: userPrompt,
                response: responseText,
                reasoning: 'Chat response with RAG',
                citations: ragResults.map(r => r.citations).flat(),
                conversation_id: convId,
            });
        }
        res.status(200).json({
            response: responseText,
            conversationId: convId,
            citations: ragResults.map(r => r.citations).flat()
        });
    }
    catch (error) {
        console.error('[Chat] Error:', error);
        res.status(500).json({ error: 'Failed to process chat request' });
    }
};
exports.postChat = postChat;
/**
 * GET /api/chat/history
 *
 * Fetches the user's most recent conversation history.
 * Returns the most recent conversation with up to 20 messages.
 *
 * Query params:
 * - conversationId (optional): Specific conversation to fetch
 * - limit (optional): Max messages to return (default: 20, max: 50)
 *
 * @returns {
 *   conversationId: string | null,
 *   messages: Array<{role: 'user' | 'assistant', content: string}>
 * }
 */
const getChatHistory = async (req, res) => {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    try {
        const { uid } = await (0, users_1.authenticateRequest)(req);
        const { conversationId, limit: limitParam } = req.query;
        const limit = Math.min(parseInt(limitParam) || 20, 50);
        const firestore = (0, firestore_1.getFirestore)((0, firebaseAdmin_1.getFirebaseApp)());
        // If conversationId provided, use it; otherwise find most recent
        let convId = conversationId;
        if (!convId) {
            // Get most recent conversation by updated_at
            const conversationsRef = firestore
                .collection('users')
                .doc(uid)
                .collection('conversations')
                .orderBy('updated_at', 'desc')
                .limit(1);
            const snapshot = await conversationsRef.get();
            if (snapshot.empty) {
                // No conversations yet - return empty
                res.status(200).json({ conversationId: null, messages: [] });
                return;
            }
            convId = snapshot.docs[0].id;
        }
        // Fetch messages from the conversation
        const messages = await getRecentMessages(firestore, uid, convId, limit);
        res.status(200).json({
            conversationId: convId,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
            })),
        });
    }
    catch (error) {
        console.error('[Chat History] Error:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
};
exports.getChatHistory = getChatHistory;
