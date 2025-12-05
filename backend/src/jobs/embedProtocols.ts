import { getOpenAIClient } from '../lib/openai';
import { getPineconeIndex } from '../lib/pinecone';
import { getSupabaseClient } from '../lib/supabase';

const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 1536;
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
  const openai = getOpenAIClient();
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

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: inputs,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    const vectors = response.data.map((item, index) => {
      const protocol = batch[index];
      return {
        id: protocol.id,
        values: item.embedding,
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
