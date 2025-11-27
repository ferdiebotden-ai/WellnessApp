"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postChat = void 0;
const users_1 = require("./users");
const firestore_1 = require("firebase-admin/firestore");
const firebaseAdmin_1 = require("./firebaseAdmin");
const supabaseClient_1 = require("./supabaseClient");
const config_1 = require("./config");
const protocolSearch_1 = require("./protocolSearch");
const vertexAI_1 = require("./vertexAI");
const SYSTEM_PROMPT = `You are a credible wellness coach for performance professionals. Use evidence-based language. Reference peer-reviewed studies when relevant. Celebrate progress based on health outcomes (HRV improvement, sleep quality gains), not arbitrary milestones. Tone is professional, motivational but not cheesy. Address user by name occasionally. Use 🔥 emoji only for streaks (professional standard). No other emojis. **You must not provide medical advice.** You are an educational tool. If a user asks for medical advice, you must decline and append the medical disclaimer.`;
const MEDICAL_DISCLAIMER = "\n\n⚠️ **Important**: This is educational information, not medical advice. Consult your healthcare provider.";
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
        // 1. Safety Check (Simple Keyword)
        const lowerMsg = message.toLowerCase();
        const crisisKeywords = ['suicide', 'kill myself', 'end my life', 'hurt myself'];
        if (crisisKeywords.some(k => lowerMsg.includes(k))) {
            res.status(200).json({
                response: "I'm concerned about what you're sharing. Please reach out to the 988 Suicide & Crisis Lifeline immediately by calling or texting 988. They are available 24/7.",
                safety_flag: 'crisis_detected'
            });
            return;
        }
        // 2. Fetch User Context
        const { data: profile } = await supabase
            .from('users')
            .select('id, display_name, healthMetrics')
            .eq('firebase_uid', uid)
            .single();
        // Get the Supabase UUID for foreign key relationships
        const supabaseUserId = profile?.id;
        const context = `
      User: ${profile?.display_name || 'Performance Professional'}
      Health Metrics: Sleep Quality Trend: ${profile?.healthMetrics?.sleepQualityTrend || 'N/A'}, HRV Improvement: ${profile?.healthMetrics?.hrvImprovementPct || 'N/A'}%
    `;
        // 3. RAG Search
        const embedding = await (0, protocolSearch_1.generateEmbedding)(message);
        const pineconeHost = await (0, protocolSearch_1.resolvePineconeHost)(config.pineconeApiKey, config.pineconeIndexName);
        const matches = await (0, protocolSearch_1.queryPinecone)(config.pineconeApiKey, pineconeHost, embedding, 3);
        const protocols = await (0, protocolSearch_1.fetchProtocols)(supabase, matches.map(m => m.id));
        const ragResults = (0, protocolSearch_1.mapProtocols)(matches, protocols);
        const ragContext = ragResults.map(p => `Protocol: ${p.name}\nBenefits: ${p.benefits}\nEvidence: ${p.citations.join(', ')}`).join('\n\n');
        // 4. Generate Response
        const userPrompt = `
      Context: ${context}

      Relevant Protocols:
      ${ragContext}

      User Query: ${message}
    `;
        let responseText = await (0, vertexAI_1.generateCompletion)(SYSTEM_PROMPT, userPrompt);
        // Append disclaimer if medical keywords detected (simplified)
        const medicalKeywords = ['pain', 'doctor', 'prescription', 'diagnose', 'symptom', 'medication'];
        if (medicalKeywords.some(k => lowerMsg.includes(k))) {
            responseText += MEDICAL_DISCLAIMER;
        }
        // 5. Persistence
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
