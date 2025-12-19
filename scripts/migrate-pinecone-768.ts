#!/usr/bin/env ts-node
/**
 * Pinecone Migration Script - 1536 to 768 Dimensions
 *
 * This script handles the migration from OpenAI embeddings (1536-dim)
 * to Vertex AI embeddings (768-dim) for the Gemini 3 Flash upgrade.
 *
 * Steps:
 * 1. Check current index dimensions
 * 2. If 1536-dim, delete and recreate with 768-dim
 * 3. Re-seed all protocols with new embeddings
 *
 * Usage:
 *   1. Ensure .env has PINECONE_API_KEY, PINECONE_INDEX_NAME
 *   2. Run: npm run migrate:pinecone
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleAuth } from 'google-auth-library';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'wellness-protocols';
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || 'wellness-os-app';
const GCP_LOCATION = process.env.GCP_LOCATION || 'us-central1';
const EMBEDDING_MODEL = 'text-embedding-005';
const TARGET_DIMENSIONS = 768;

interface Protocol {
  id: string;
  name: string;
  summary: string;
  category: string;
}

interface PineconeIndexInfo {
  name: string;
  dimension: number;
  metric: string;
  host: string;
  status: { ready: boolean; state: string };
}

async function getPineconeIndexInfo(): Promise<PineconeIndexInfo | null> {
  const response = await fetch(
    `https://api.pinecone.io/indexes/${encodeURIComponent(PINECONE_INDEX_NAME)}`,
    {
      method: 'GET',
      headers: {
        'Api-Key': PINECONE_API_KEY,
        Accept: 'application/json',
      },
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to get index info: ${response.status} ${body}`);
  }

  return (await response.json()) as PineconeIndexInfo;
}

async function deletePineconeIndex(): Promise<void> {
  console.log(`🗑️  Deleting index "${PINECONE_INDEX_NAME}"...`);

  const response = await fetch(
    `https://api.pinecone.io/indexes/${encodeURIComponent(PINECONE_INDEX_NAME)}`,
    {
      method: 'DELETE',
      headers: {
        'Api-Key': PINECONE_API_KEY,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    const body = await response.text();
    throw new Error(`Failed to delete index: ${response.status} ${body}`);
  }

  console.log('✅ Index deleted successfully');
}

async function createPineconeIndex(): Promise<void> {
  console.log(`📦 Creating new index "${PINECONE_INDEX_NAME}" with ${TARGET_DIMENSIONS} dimensions...`);

  const response = await fetch('https://api.pinecone.io/indexes', {
    method: 'POST',
    headers: {
      'Api-Key': PINECONE_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name: PINECONE_INDEX_NAME,
      dimension: TARGET_DIMENSIONS,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to create index: ${response.status} ${body}`);
  }

  console.log('✅ Index creation initiated');
}

async function waitForIndexReady(): Promise<string> {
  console.log('⏳ Waiting for index to be ready...');

  const maxWaitTime = 5 * 60 * 1000; // 5 minutes
  const pollInterval = 10 * 1000; // 10 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const info = await getPineconeIndexInfo();

    if (info && info.status.ready) {
      console.log('✅ Index is ready!');
      return info.host.startsWith('https://') ? info.host : `https://${info.host}`;
    }

    console.log(`   Status: ${info?.status.state || 'unknown'}...`);
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Timeout waiting for index to be ready');
}

async function generateEmbedding(text: string): Promise<number[]> {
  const endpoint = `https://${GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${GCP_LOCATION}/publishers/google/models/${EMBEDDING_MODEL}:predict`;

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
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

  const payload = (await response.json()) as any;
  const embedding = payload.predictions?.[0]?.embeddings?.values;

  if (!embedding || !Array.isArray(embedding) || embedding.length !== TARGET_DIMENSIONS) {
    throw new Error(`Expected ${TARGET_DIMENSIONS}-dimensional embedding`);
  }

  return embedding;
}

async function upsertToPinecone(
  host: string,
  vectors: Array<{ id: string; values: number[]; metadata: any }>
): Promise<void> {
  const response = await fetch(`${host}/vectors/upsert`, {
    method: 'POST',
    headers: {
      'Api-Key': PINECONE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ vectors }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Pinecone upsert failed: ${response.status} ${body}`);
  }
}

async function seedProtocols(pineconeHost: string): Promise<void> {
  console.log('\n🌱 Seeding protocols with Vertex AI embeddings...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: protocols, error } = await supabase
    .from('protocols')
    .select('id, name, summary, category');

  if (error) {
    throw new Error(`Failed to fetch protocols: ${error.message}`);
  }

  if (!protocols || protocols.length === 0) {
    console.log('⚠️  No protocols found in database.');
    return;
  }

  console.log(`📚 Found ${protocols.length} protocols to embed\n`);

  const vectors: Array<{ id: string; values: number[]; metadata: any }> = [];

  for (let i = 0; i < protocols.length; i++) {
    const protocol = protocols[i] as Protocol;
    const progressPercent = (((i + 1) / protocols.length) * 100).toFixed(1);

    try {
      const textToEmbed = `${protocol.name}\n\n${protocol.summary}`;
      console.log(`   [${i + 1}/${protocols.length}] (${progressPercent}%) ${protocol.name}...`);

      const embedding = await generateEmbedding(textToEmbed);

      vectors.push({
        id: protocol.id,
        values: embedding,
        metadata: {
          protocol_id: protocol.id,
          name: protocol.name,
          category: protocol.category,
        },
      });
    } catch (err) {
      console.error(`   ❌ Failed: ${protocol.name} - ${err}`);
    }
  }

  if (vectors.length === 0) {
    console.log('⚠️  No vectors to upsert.');
    return;
  }

  console.log(`\n📤 Upserting ${vectors.length} vectors to Pinecone...`);

  const BATCH_SIZE = 100;
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} vectors`);
    await upsertToPinecone(pineconeHost, batch);
  }

  console.log(`\n✅ Seeded ${vectors.length} protocols successfully!`);
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Pinecone Migration: 1536-dim (OpenAI) → 768-dim (Vertex AI)  ║');
  console.log('║  For Gemini 3 Flash Upgrade                                    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (!PINECONE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required environment variables');
  }

  console.log(`📊 Configuration:`);
  console.log(`   Index Name: ${PINECONE_INDEX_NAME}`);
  console.log(`   Target Dimensions: ${TARGET_DIMENSIONS}`);
  console.log(`   Embedding Model: ${EMBEDDING_MODEL}\n`);

  // Step 1: Check current index
  console.log('🔍 Checking current Pinecone index...');
  const currentIndex = await getPineconeIndexInfo();

  if (currentIndex) {
    console.log(`   Found index: ${currentIndex.name}`);
    console.log(`   Current dimensions: ${currentIndex.dimension}`);
    console.log(`   Status: ${currentIndex.status.state}`);

    if (currentIndex.dimension === TARGET_DIMENSIONS) {
      console.log(`\n✅ Index already has ${TARGET_DIMENSIONS} dimensions!`);
      console.log('   Proceeding to re-seed protocols...\n');

      const host = currentIndex.host.startsWith('https://')
        ? currentIndex.host
        : `https://${currentIndex.host}`;
      await seedProtocols(host);
      return;
    }

    console.log(`\n⚠️  Index has ${currentIndex.dimension} dimensions, need ${TARGET_DIMENSIONS}`);
    console.log('   Will delete and recreate...\n');

    // Step 2: Delete old index
    await deletePineconeIndex();

    // Wait a bit for deletion to propagate
    console.log('⏳ Waiting for deletion to complete...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } else {
    console.log('   No existing index found. Will create new one.\n');
  }

  // Step 3: Create new index
  await createPineconeIndex();

  // Step 4: Wait for index to be ready
  const pineconeHost = await waitForIndexReady();

  // Step 5: Seed protocols
  await seedProtocols(pineconeHost);

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Migration Complete! Gemini 3 Flash is ready to use.          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
}

main()
  .then(() => {
    console.log('✅ Migration finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
