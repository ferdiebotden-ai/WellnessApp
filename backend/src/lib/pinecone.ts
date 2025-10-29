import { Pinecone, type Index } from '@pinecone-database/pinecone';

let cachedClient: Pinecone | null = null;

const getIndexName = (): string => {
  return process.env.PINECONE_INDEX_NAME ?? 'wellness-protocols';
};

export const getPineconeClient = (): Pinecone => {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    throw new Error('Pinecone API key is not configured');
  }

  cachedClient = new Pinecone({ apiKey });
  return cachedClient;
};

export const getPineconeIndex = (): Index => {
  const client = getPineconeClient();
  const indexName = getIndexName();
  return client.index(indexName);
};

export const resetPineconeClient = () => {
  cachedClient = null;
};
