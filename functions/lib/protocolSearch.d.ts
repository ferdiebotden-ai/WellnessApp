import { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
type ProtocolRow = {
    id: string;
    name: string | null;
    description: string | null;
    category: string | null;
    tier_required: string | null;
    benefits: string | null;
    constraints: string | null;
    citations: unknown;
    is_active: boolean | null;
};
export interface ProtocolSearchResult {
    id: string;
    name: string | null;
    description: string | null;
    category: string | null;
    tier_required: string | null;
    benefits: string | null;
    constraints: string | null;
    citations: string[];
    score: number;
}
type RankedMatch = {
    id: string;
    score: number;
};
declare function resetPineconeHostCache(): void;
declare function generateEmbedding(query: string): Promise<number[]>;
declare function resolvePineconeHost(apiKey: string, indexName: string): Promise<string>;
declare function queryPinecone(apiKey: string, host: string, vector: number[], topK: number): Promise<RankedMatch[]>;
declare function fetchProtocols(client: SupabaseClient, ids: string[]): Promise<ProtocolRow[]>;
declare function mapProtocols(matches: RankedMatch[], rows: ProtocolRow[]): ProtocolSearchResult[];
/**
 * HTTP Cloud Function that performs semantic search across wellness protocols using
 * OpenAI embeddings, Pinecone vector similarity, and Supabase metadata hydration.
 */
export declare function searchProtocols(req: Request, res: Response): Promise<void>;
export { generateEmbedding, resolvePineconeHost, queryPinecone, fetchProtocols, mapProtocols, resetPineconeHostCache, };
