#!/usr/bin/env ts-node
/**
 * Pinecone Seeding Script
 *
 * Seeds the Pinecone vector index with embeddings of all protocols from Supabase.
 * Uses Vertex AI text-embedding-005 model (768 dimensions).
 *
 * Usage:
 *   1. Copy .env.example to .env and fill in credentials
 *   2. Run: npm install
 *   3. Run: npm run seed
 */

import { createClient } from '@supabase/supabase-js';
import { VertexAI } from '@google-cloud/vertexai';
import { GoogleAuth } from 'google-auth-library';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log("DEBUG: Script started");

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'wellness-protocols';
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || 'wellness-os-app';
const GCP_LOCATION = process.env.GCP_LOCATION || 'us-central1';
const EMBEDDING_MODEL = 'text-embedding-005';

interface Protocol {
  id: string;
  name: string;
  summary: string;
  category: string;
}

/**
 * Generate embedding for a text string using Vertex AI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const endpoint = `https://${GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${GCP_LOCATION}/publishers/google/models/${EMBEDDING_MODEL}:predict`;

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
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

  const payload = await response.json() as any;
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
 * Get Pinecone index host
 */
async function getPineconeHost(apiKey: string, indexName: string): Promise<string> {
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

  const payload = await response.json() as any;
  if (!payload.host) {
    throw new Error('Pinecone describe response did not include host');
  }

  return payload.host.startsWith('https://') ? payload.host : `https://${payload.host}`;
}

/**
 * Upsert vectors to Pinecone
 */
async function upsertToPinecone(
  apiKey: string,
  host: string,
  vectors: Array<{ id: string; values: number[]; metadata: any }>
): Promise<void> {
  const response = await fetch(`${host}/vectors/upsert`, {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ vectors }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Pinecone upsert failed: ${response.status} ${body}`);
  }
}

/**
 * Main seeding function
 */
async function seedPinecone() {
  console.log('🌱 Starting Pinecone seeding process...\n');
  
  try {
    // Validate environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PINECONE_API_KEY) {
    throw new Error('Missing required environment variables. Check your .env file.');
  }

  console.log(`📊 Configuration:`);
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Pinecone Index: ${PINECONE_INDEX_NAME}`);
  console.log(`   GCP Project: ${GCP_PROJECT_ID}`);
  console.log(`   Embedding Model: ${EMBEDDING_MODEL} (768-dim)\n`);

  // 1. Connect to Supabase
  console.log('🔌 Connecting to Supabase...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 2. Fetch all active protocols
  console.log('📚 Fetching protocols from Supabase...');
  const { data: protocols, error } = await supabase
    .from('protocols')
    .select('id, name, summary, category');

  if (error) {
    throw new Error(`Failed to fetch protocols: ${error.message}`);
  }

  if (!protocols || protocols.length === 0) {
    console.log('⚠️  No active protocols found in database.');
    return;
  }

  console.log(`✅ Found ${protocols.length} active protocols\n`);

  // 3. Get Pinecone host
  console.log('🔍 Resolving Pinecone index host...');
  const pineconeHost = await getPineconeHost(PINECONE_API_KEY, PINECONE_INDEX_NAME);
  console.log(`✅ Pinecone host: ${pineconeHost}\n`);

  // 4. Generate embeddings and prepare vectors
  console.log('🤖 Generating embeddings with Vertex AI...');
  const vectors = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < protocols.length; i++) {
    const protocol = protocols[i] as Protocol;
    const progressPercent = ((i + 1) / protocols.length * 100).toFixed(1);

    try {
      // Combine name and summary for embedding
      const textToEmbed = `${protocol.name}\n\n${protocol.summary}`;

      // Generate embedding
      console.log(`   [${i + 1}/${protocols.length}] (${progressPercent}%) Embedding: ${protocol.name}...`);
      const embedding = await generateEmbedding(textToEmbed);

      // Prepare vector for Pinecone
      vectors.push({
        id: protocol.id,
        values: embedding,
        metadata: {
          protocol_id: protocol.id,
          name: protocol.name,
          category: protocol.category,
        },
      });

      successCount++;
    } catch (error) {
      console.error(`   ❌ Failed to embed "${protocol.name}": ${error}`);
      failCount++;
    }
  }

  console.log(`\n✅ Successfully generated ${successCount} embeddings`);
  if (failCount > 0) {
    console.log(`⚠️  Failed to generate ${failCount} embeddings\n`);
  } else {
    console.log('');
  }

  // 5. Upsert to Pinecone in batches
  if (vectors.length === 0) {
    console.log('⚠️  No vectors to upsert.');
    return;
  }

  console.log('📤 Upserting vectors to Pinecone...');
  const BATCH_SIZE = 100; // Pinecone recommends batching for large datasets
  const batches = [];

  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    batches.push(vectors.slice(i, i + BATCH_SIZE));
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`   [${i + 1}/${batches.length}] Upserting ${batch.length} vectors...`);
    await upsertToPinecone(PINECONE_API_KEY, pineconeHost, batch);
  }

  console.log(`\n🎉 Seeding complete!`);
  console.log(`   Total protocols seeded: ${vectors.length}`);
  console.log(`   Pinecone index: ${PINECONE_INDEX_NAME}`);
  console.log(`   Embedding dimensions: 768\n`);
  console.log('✨ Your Pinecone index is ready for RAG queries!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

// Run the seeding script
seedPinecone()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });
