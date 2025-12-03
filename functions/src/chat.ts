import { Request, Response } from 'express';
import { authenticateRequest } from './users';
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
import {
  detectCrisis,
  generateCrisisResponse,
  requiresImmediateIntervention,
  scanAIOutput,
  getSafeFallbackResponse,
} from './safety';

const SYSTEM_PROMPT = `You are a credible wellness coach for performance professionals. Use evidence-based language. Reference peer-reviewed studies when relevant. Celebrate progress based on health outcomes (HRV improvement, sleep quality gains), not arbitrary milestones. Tone is professional, motivational but not cheesy. Address user by name occasionally. Use 🔥 emoji only for streaks (professional standard). No other emojis. **You must not provide medical advice.** You are an educational tool. If a user asks for medical advice, you must decline and append the medical disclaimer.`;

const MEDICAL_DISCLAIMER = "\n\n⚠️ **Important**: This is educational information, not medical advice. Consult your healthcare provider.";

export const postChat = async (req: Request, res: Response): Promise<void> => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { uid } = await authenticateRequest(req);
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const config = getConfig();
    const firestore = getFirestore(getFirebaseApp());
    const supabase = getServiceClient();

    // 1. Safety Check (Enhanced Crisis Detection)
    const crisisResult = detectCrisis(message);
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
          response: generateCrisisResponse(crisisResult),
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
        response: generateCrisisResponse(crisisResult),
        safety_flag: 'crisis_detected',
        severity: crisisResult.severity,
        resources: crisisResult.resources,
      });
      return;
    }

    const lowerMsg = message.toLowerCase();

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
    const embedding = await generateEmbedding(message);
    const pineconeHost = await resolvePineconeHost(config.pineconeApiKey, config.pineconeIndexName);
    const matches = await queryPinecone(config.pineconeApiKey, pineconeHost, embedding, 3);
    const protocols = await fetchProtocols(supabase, matches.map(m => m.id));
    const ragResults = mapProtocols(matches, protocols);

    const ragContext = ragResults.map(p => `Protocol: ${p.name}\nBenefits: ${p.benefits}\nEvidence: ${p.citations.join(', ')}`).join('\n\n');

    // 4. Generate Response
    const userPrompt = `
      Context: ${context}

      Relevant Protocols:
      ${ragContext}

      User Query: ${message}
    `;

    let responseText = await generateCompletion(SYSTEM_PROMPT, userPrompt);

    // 4b. AI Output Safety Check
    const outputScan = scanAIOutput(responseText, 'ai_response');
    if (!outputScan.safe) {
      // Log the flagged content for review
      console.warn('[Chat] AI output flagged:', outputScan.reason);
      if (supabaseUserId) {
        await supabase.from('ai_audit_log').insert({
          user_id: supabaseUserId,
          decision_type: 'ai_output_flagged',
          model_used: getCompletionModelName(),
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
      responseText = getSafeFallbackResponse('ai_response');
    }

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
        model_used: getCompletionModelName(),
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

  } catch (error) {
    console.error('[Chat] Error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
};

