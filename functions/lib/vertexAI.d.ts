/**
 * Generate a text completion using Gemini 3 Flash
 * @param systemPrompt System-level instructions for the model
 * @param userPrompt User's query or context
 * @param temperature Controls randomness (0-1, default 0.7)
 * @returns Generated text response
 */
export declare function generateCompletion(systemPrompt: string, userPrompt: string, temperature?: number): Promise<string>;
/**
 * Generate an embedding vector for semantic search
 * Uses text-embedding-005 model (768 dimensions)
 * @param text Text to embed
 * @returns Embedding vector (768-dimensional array)
 */
export declare function generateEmbedding(text: string): Promise<number[]>;
/**
 * Get the model name for audit logging
 */
export declare function getCompletionModelName(): string;
/**
 * Get the embedding model name for audit logging
 */
export declare function getEmbeddingModelName(): string;
