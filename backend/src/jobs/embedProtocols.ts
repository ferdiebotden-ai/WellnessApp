import { generateEmbeddings, getEmbeddingDimensions, getEmbeddingModelName } from '../lib/vertexai';
import { getPineconeIndex } from '../lib/pinecone';
import { getSupabaseClient } from '../lib/supabase';

// Using Vertex AI text-embedding-005 (768 dimensions)
// Migrated from OpenAI text-embedding-3-large (1536 dimensions) on Dec 2025
const EMBEDDING_DIMENSIONS = getEmbeddingDimensions(); // 768
const BATCH_SIZE = 20;

type Citation = string;

type ProtocolRecord = {
  id: string;
  name: string | null;
  description: string | null;
  category: string | null;
  tier_required: string | null;
  benefits?: string | null;
  constraints?: string | null;
  citations?: Citation[] | null;
  is_active?: boolean | null;
};

const buildEmbeddingInput = (protocol: ProtocolRecord): string => {
  const sections: string[] = [];
  sections.push(`Protocol: ${protocol.name ?? protocol.id}`);

  if (protocol.category) {
    sections.push(`Category: ${protocol.category}`);
  }

  if (protocol.tier_required) {
    sections.push(`Tier Required: ${protocol.tier_required}`);
  }

  if (protocol.description) {
    sections.push(`Description: ${protocol.description}`);
  }

  if (protocol.benefits) {
    sections.push(`Benefits: ${protocol.benefits}`);
  }

  if (protocol.constraints) {
    sections.push(`Constraints: ${protocol.constraints}`);
  }

  return sections.join('\n');
};

const normalizeCitations = (citations: ProtocolRecord['citations']): Citation[] => {
  if (!citations) {
    return [];
  }

  if (Array.isArray(citations)) {
    return citations.filter((citation): citation is string => typeof citation === 'string');
  }

  return [];
};

const chunkProtocols = <T>(items: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
};

export const embedProtocols = async (): Promise<void> => {
  const supabase = getSupabaseClient();
  const pineconeIndex = getPineconeIndex();

  const { data, error } = await supabase
    .from('protocols')
    .select(
      'id, name, description, category, tier_required, benefits, constraints, citations, is_active',
    );

  if (error) {
    throw new Error(`Failed to fetch protocols: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return;
  }

  const activeProtocols = data.filter((protocol) => protocol.is_active ?? true);

  if (activeProtocols.length === 0) {
    return;
  }

  const batches = chunkProtocols(activeProtocols, BATCH_SIZE);

  for (const batch of batches) {
    const inputs = batch.map(buildEmbeddingInput);

    // Generate embeddings using Vertex AI (Gemini 3 Flash era)
    const embeddings = await generateEmbeddings(inputs);

    const vectors = embeddings.map((embedding, index) => {
      const protocol = batch[index];
      return {
        id: protocol.id,
        values: embedding,
        metadata: {
          protocol_id: protocol.id,
          name: protocol.name ?? '',
          category: protocol.category ?? '',
          tier_required: protocol.tier_required ?? '',
          citations: normalizeCitations(protocol.citations),
        },
      };
    });

    await pineconeIndex.upsert(vectors);
  }
};
