import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';

/**
 * Vertex AI client wrapper for Gemini 3 Flash
 * Provides completion and embedding generation for wellness coaching
 *
 * Model: gemini-3-flash-preview (Released Dec 17, 2025)
 * - +3x better reasoning on complex benchmarks
 * - 78% on SWE-Bench (vs 54% for 2.5 Flash)
 * - 90.4% on GPQA Diamond (PhD-level reasoning)
 */

const PROJECT_ID = process.env.GCP_PROJECT_ID ?? 'wellness-os-app';
const LOCATION = process.env.GCP_LOCATION ?? 'us-central1';
const COMPLETION_MODEL = 'gemini-3-flash-preview';
const EMBEDDING_MODEL = 'text-embedding-005';
const EMBEDDING_DIMENSIONS = 768;

let vertexAI: VertexAI | null = null;

function getVertexAI(): VertexAI {
  if (!vertexAI) {
    vertexAI = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
    });
  }
  return vertexAI;
}

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

/**
 * Generate a text completion using Gemini 3 Flash
 */
export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.7,
): Promise<string> {
  const generativeModel = getVertexAI().getGenerativeModel({
    model: COMPLETION_MODEL,
    safetySettings,
    generationConfig: {
      temperature,
      maxOutputTokens: 512,
      topP: 0.95,
    },
  });

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

  const textPart = content.parts.find((part: { text?: string }) => part.text);
  if (!textPart || !textPart.text) {
    throw new Error('Vertex AI response did not include text content');
  }

  return textPart.text;
}

/**
 * Generate a structured completion using Gemini 3 Flash with JSON mode
 * Returns parsed JSON response for structured output like nudges
 */
export async function generateStructuredCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.7,
): Promise<T> {
  const generativeModel = getVertexAI().getGenerativeModel({
    model: COMPLETION_MODEL,
    safetySettings,
    generationConfig: {
      temperature,
      maxOutputTokens: 1024,
      topP: 0.95,
      responseMimeType: 'application/json',
    },
  });

  const combinedPrompt = `${systemPrompt}\n\n${userPrompt}\n\nRespond with valid JSON only.`;

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

  const textPart = content.parts.find((part: { text?: string }) => part.text);
  if (!textPart || !textPart.text) {
    throw new Error('Vertex AI response did not include text content');
  }

  return JSON.parse(textPart.text) as T;
}

/**
 * Generate embedding vectors for semantic search
 * Uses text-embedding-005 model (768 dimensions)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth();
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  if (!accessToken.token) {
    throw new Error('Failed to obtain access token for Vertex AI');
  }

  const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${EMBEDDING_MODEL}:predict`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: texts.map((text) => ({ content: text })),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vertex AI embedding request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const predictions = payload.predictions;

  if (!predictions || !Array.isArray(predictions)) {
    throw new Error('Vertex AI embedding response did not include predictions');
  }

  return predictions.map((prediction: { embeddings?: { values?: number[] } }) => {
    const embedding = prediction.embeddings?.values;
    if (!embedding || !Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Expected ${EMBEDDING_DIMENSIONS}-dimensional embedding`);
    }
    return embedding;
  });
}

/**
 * Generate a single embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddings = await generateEmbeddings([text]);
  return embeddings[0];
}

export function getCompletionModelName(): string {
  return COMPLETION_MODEL;
}

export function getEmbeddingModelName(): string {
  return EMBEDDING_MODEL;
}

export function getEmbeddingDimensions(): number {
  return EMBEDDING_DIMENSIONS;
}
