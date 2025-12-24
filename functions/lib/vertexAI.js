"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCompletion = generateCompletion;
exports.generateEmbedding = generateEmbedding;
exports.getCompletionModelName = getCompletionModelName;
exports.getEmbeddingModelName = getEmbeddingModelName;
const genai_1 = require("@google/genai");
/**
 * Vertex AI client wrapper for Gemini 3 Flash
 * Uses the @google/genai SDK (recommended for Gemini 2.0+)
 *
 * Completion Model: gemini-3-flash-preview (Global endpoint)
 * - Released Dec 17, 2025
 * - +3x better reasoning on complex benchmarks
 * - Supports thinking_level parameter for reasoning control
 *
 * Embedding Model: text-embedding-005 (us-central1)
 * - 768-dimensional vectors for semantic search
 */
const PROJECT_ID = 'wellness-os-app';
// Initialize Google Gen AI client for Vertex AI with global location
// The @google/genai SDK correctly handles global endpoint URLs
const ai = new genai_1.GoogleGenAI({
    vertexai: true,
    project: PROJECT_ID,
    location: 'global',
});
const COMPLETION_MODEL = 'gemini-3-flash-preview';
const EMBEDDING_MODEL = 'text-embedding-005';
const EMBEDDING_LOCATION = 'us-central1';
// Safety settings for wellness coaching context
const safetySettings = [
    {
        category: genai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: genai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: genai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: genai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: genai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: genai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: genai_1.HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: genai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];
/**
 * Generate a text completion using Gemini 3 Flash
 * @param systemPrompt System-level instructions for the model
 * @param userPrompt User's query or context
 * @param temperature Controls randomness (0-1, default 0.7)
 * @returns Generated text response
 */
async function generateCompletion(systemPrompt, userPrompt, temperature = 0.7) {
    const response = await ai.models.generateContent({
        model: COMPLETION_MODEL,
        contents: userPrompt,
        config: {
            systemInstruction: systemPrompt,
            temperature,
            maxOutputTokens: 2048,
            topP: 0.95,
            safetySettings,
            thinkingConfig: {
                thinkingBudget: 1024, // Low thinking budget for faster responses
            },
        },
    });
    if (!response.text) {
        throw new Error('Gemini 3 Flash did not return text content');
    }
    return response.text;
}
/**
 * Generate an embedding vector for semantic search
 * Uses text-embedding-005 model (768 dimensions)
 * @param text Text to embed
 * @returns Embedding vector (768-dimensional array)
 */
async function generateEmbedding(text) {
    // Vertex AI REST API endpoint for embeddings (uses regional endpoint)
    const endpoint = `https://${EMBEDDING_LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${EMBEDDING_LOCATION}/publishers/google/models/${EMBEDDING_MODEL}:predict`;
    // Get access token using Application Default Credentials
    // This works automatically in Cloud Functions with the service account
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth();
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    if (!accessToken.token) {
        throw new Error('Failed to obtain access token for Vertex AI');
    }
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            instances: [{ content: text }],
        }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex AI embedding request failed: ${response.status} ${errorText}`);
    }
    const payload = await response.json();
    const embedding = payload.predictions?.[0]?.embeddings?.values;
    if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Vertex AI embedding response did not include valid embedding vector');
    }
    if (embedding.length !== 768) {
        throw new Error(`Expected 768-dimensional embedding, got ${embedding.length}`);
    }
    return embedding;
}
/**
 * Get the model name for audit logging
 */
function getCompletionModelName() {
    return COMPLETION_MODEL;
}
/**
 * Get the embedding model name for audit logging
 */
function getEmbeddingModelName() {
    return EMBEDDING_MODEL;
}
