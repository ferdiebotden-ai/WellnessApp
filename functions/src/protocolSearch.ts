import { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getConfig } from './config';
import { getServiceClient } from './supabaseClient';
import { generateEmbedding as generateVertexEmbedding, getEmbeddingModelName } from './vertexAI';

const DEFAULT_TOP_K = 5;
const MAX_TOP_K = 20;

interface EmbeddingResponse {
  data?: Array<{ embedding?: number[] }>;
}

interface PineconeDescribeResponse {
  host?: string;
}

interface PineconeMatch {
  id?: string | null;
  metadata?: { protocol_id?: unknown } | null;
  score?: number | null;
}

interface PineconeQueryResponse {
  matches?: PineconeMatch[];
}

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

const pineconeHostCache = new Map<string, string>();

function resetPineconeHostCache(): void {
  pineconeHostCache.clear();
}

function normalizeCitations(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }

  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }

  return [];
}

function normalizeHost(host: string): string {
  const trimmed = host.trim().replace(/\/+$/, '');
  if (!trimmed) {
    throw new Error('Pinecone host is empty');
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function parseTopK(value: unknown): number {
  if (Array.isArray(value)) {
    return parseTopK(value[0]);
  }

  if (typeof value !== 'string') {
    return DEFAULT_TOP_K;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_TOP_K;
  }

  return Math.min(parsed, MAX_TOP_K);
}

function extractQuery(value: unknown): string {
  if (Array.isArray(value)) {
    return extractQuery(value[0]);
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return '';
}

async function generateEmbedding(query: string): Promise<number[]> {
  // Use Vertex AI embedding generation
  return await generateVertexEmbedding(query);
}

async function resolvePineconeHost(apiKey: string, indexName: string): Promise<string> {
  const cached = pineconeHostCache.get(indexName);
  if (cached) {
    return cached;
  }

  const response = await fetch(`https://api.pinecone.io/indexes/${encodeURIComponent(indexName)}`, {
    method: 'GET',
    headers: {
      'Api-Key': apiKey,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to describe Pinecone index: ${response.status} ${body}`);
  }

  const payload = (await response.json()) as PineconeDescribeResponse;
  if (!payload.host) {
    throw new Error('Pinecone describe response did not include host');
  }

  const normalized = normalizeHost(payload.host);
  pineconeHostCache.set(indexName, normalized);
  return normalized;
}

async function queryPinecone(
  apiKey: string,
  host: string,
  vector: number[],
  topK: number,
): Promise<RankedMatch[]> {
  const response = await fetch(`${host}/query`, {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vector,
      topK,
      includeMetadata: true,
      includeValues: false,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Pinecone query failed: ${response.status} ${body}`);
  }

  const payload = (await response.json()) as PineconeQueryResponse;
  const matches = payload.matches ?? [];
  const seen = new Set<string>();
  const ranked: RankedMatch[] = [];

  for (const match of matches) {
    const candidateId = typeof match.id === 'string' && match.id.trim().length > 0
      ? match.id
      : typeof match.metadata?.protocol_id === 'string'
        ? match.metadata.protocol_id
        : null;

    if (!candidateId || seen.has(candidateId)) {
      continue;
    }

    seen.add(candidateId);
    ranked.push({
      id: candidateId,
      score: typeof match.score === 'number' ? match.score : 0,
    });
  }

  return ranked;
}

async function fetchProtocols(
  client: SupabaseClient,
  ids: string[],
): Promise<ProtocolRow[]> {
  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from('protocols')
    .select('id,name,description,category,tier_required,benefits,constraints,citations,is_active')
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to fetch protocols: ${error.message}`);
  }

  return (data as ProtocolRow[] | null) ?? [];
}

function mapProtocols(matches: RankedMatch[], rows: ProtocolRow[]): ProtocolSearchResult[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const results: ProtocolSearchResult[] = [];

  for (const match of matches) {
    const record = byId.get(match.id);
    if (!record || record.is_active === false) {
      continue;
    }

    results.push({
      id: record.id,
      name: record.name,
      description: record.description,
      category: record.category,
      tier_required: record.tier_required,
      benefits: record.benefits,
      constraints: record.constraints,
      citations: normalizeCitations(record.citations),
      score: match.score,
    });
  }

  return results;
}

/**
 * HTTP Cloud Function that performs semantic search across wellness protocols using
 * OpenAI embeddings, Pinecone vector similarity, and Supabase metadata hydration.
 */
export async function searchProtocols(req: Request, res: Response): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const queryParam = extractQuery(req.query.q);
  if (!queryParam) {
    res.status(400).json({ error: 'Query parameter "q" is required' });
    return;
  }

  const topK = parseTopK(req.query.limit ?? req.query.topK ?? req.query.k);

  try {
    const config = getConfig();
    const supabase = getServiceClient();
    const embedding = await generateEmbedding(queryParam);
    const pineconeHost = await resolvePineconeHost(config.pineconeApiKey, config.pineconeIndexName);
    const matches = await queryPinecone(config.pineconeApiKey, pineconeHost, embedding, topK);
    const protocols = await fetchProtocols(supabase, matches.map((match) => match.id));
    const results = mapProtocols(matches, protocols);

    res.status(200).json(results);
  } catch (error) {
    console.error('[ProtocolSearch] Failed to execute search', error);
    res.status(500).json({ error: 'Failed to search protocols' });
  }
}

export {
  generateEmbedding,
  resolvePineconeHost,
  queryPinecone,
  fetchProtocols,
  mapProtocols,
  resetPineconeHostCache,
};
