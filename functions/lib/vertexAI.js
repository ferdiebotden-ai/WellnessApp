"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCompletion = generateCompletion;
exports.generateEmbedding = generateEmbedding;
exports.getCompletionModelName = getCompletionModelName;
exports.getEmbeddingModelName = getEmbeddingModelName;
const vertexai_1 = require("@google-cloud/vertexai");
/**
 * Vertex AI client wrapper for Gemini 2.0 Flash
 * Provides completion and embedding generation for wellness coaching
 */
const PROJECT_ID = 'wellness-os-app';
const LOCATION = 'us-central1';
const COMPLETION_MODEL = 'gemini-2.0-flash-001';
const EMBEDDING_MODEL = 'text-embedding-005';
// Initialize Vertex AI client
const vertexAI = new vertexai_1.VertexAI({
    project: PROJECT_ID,
    location: LOCATION,
});
// Safety settings for wellness coaching context
const safetySettings = [
    {
        category: vertexai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: vertexai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: vertexai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: vertexai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: vertexai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: vertexai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: vertexai_1.HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: vertexai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];
/**
 * Generate a text completion using Gemini 2.0 Flash
 * @param systemPrompt System-level instructions for the model
 * @param userPrompt User's query or context
 * @param temperature Controls randomness (0-1, default 0.7)
 * @returns Generated text response
 */
async function generateCompletion(systemPrompt, userPrompt, temperature = 0.7) {
    const generativeModel = vertexAI.getGenerativeModel({
        model: COMPLETION_MODEL,
        safetySettings,
        generationConfig: {
            temperature,
            maxOutputTokens: 1024,
            topP: 0.95,
        },
    });
    // Combine system and user prompts for Gemini
    // Gemini doesn't have separate system role, so we prepend system instructions
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const request = {
        contents: [{ role: 'user', parts: [{ text: combinedPrompt }] }],
    };
    const response = await generativeModel.generateContent(request);
    const candidates = response.response?.candidates;
    if (!candidates || candidates.length === 0) {
        throw new Error('Vertex AI response did not include any candidates');
    }
    const content = candidates[0].content;
    if (!content?.parts || content.parts.length === 0) {
        throw new Error('Vertex AI response candidate did not include content parts');
    }
    const textPart = content.parts.find((part) => part.text);
    if (!textPart || !textPart.text) {
        throw new Error('Vertex AI response did not include text content');
    }
    return textPart.text;
}
/**
 * Generate an embedding vector for semantic search
 * Uses text-embedding-005 model (768 dimensions)
 * @param text Text to embed
 * @returns Embedding vector (768-dimensional array)
 */
async function generateEmbedding(text) {
    // Vertex AI REST API endpoint for embeddings
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${EMBEDDING_MODEL}:predict`;
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
