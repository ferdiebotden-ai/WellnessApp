#!/usr/bin/env tsx
/**
 * Full System Seeding Script
 *
 * 1. Reads protocols from scripts/protocols_data.json
 * 2. Upserts them to Supabase 'protocols' table
 * 3. Generates embeddings using Vertex AI
 * 4. Upserts vectors to Pinecone
 */

import { createClient } from '@supabase/supabase-js';
import { VertexAI } from '@google-cloud/vertexai';
import { GoogleAuth } from 'google-auth-library';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

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

interface ProtocolData {
  id: string;
  name: string;
  short_name: string;
  category: string;
  tier_required: string;
  description: string;
  benefits: string;
  constraints: string;
  citations: string[];
  summary: string;
  evidence_level: string;
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
 * Delete all vectors from Pinecone index (clean slate before seeding)
 */
async function deleteAllPineconeVectors(apiKey: string, host: string): Promise<void> {
  const response = await fetch(`${host}/vectors/delete`, {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deleteAll: true }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Pinecone deleteAll failed: ${response.status} ${body}`);
  }
}

/**
 * Main seeding function
 */
async function seedFullSystem() {
  console.log('🌱 Starting Full System Seeding process...\n');
  
  try {
    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PINECONE_API_KEY) {
      throw new Error('Missing required environment variables. Check your .env file.');
    }

    console.log(`📊 Configuration:`);
    console.log(`   Supabase URL: ${SUPABASE_URL}`);
    console.log(`   Pinecone Index: ${PINECONE_INDEX_NAME}`);
    console.log(`   GCP Project: ${GCP_PROJECT_ID}`);

    // 1. Load Protocol Data
    console.log('📂 Loading protocols from JSON...');
    const protocolsPath = path.join(__dirname, 'protocols_data.json');
    const protocolsData = JSON.parse(fs.readFileSync(protocolsPath, 'utf8')) as ProtocolData[];
    console.log(`✅ Loaded ${protocolsData.length} protocols from file.\n`);

    // 2. Connect to Supabase
    console.log('🔌 Connecting to Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2.5. Delete existing protocols (clean slate for consistent IDs)
    console.log('🗑️  Deleting existing protocols from Supabase...');
    const { error: deleteError } = await supabase.from('protocols').delete().neq('id', '');
    if (deleteError) {
      console.warn(`⚠️  Warning: Could not delete existing protocols: ${deleteError.message}`);
    } else {
      console.log('✅ Existing protocols deleted.\n');
    }

    // 3. Upsert to Supabase
    console.log('💾 Upserting protocols to Supabase...');

    // Map to all columns in the protocols table schema (after 20251129 migration)
    // Schema: id, name, short_name, category, summary, evidence_level,
    //         description, tier_required, benefits, constraints, citations, is_active
    const supabaseData = protocolsData.map(p => ({
      id: p.id,
      name: p.name,
      short_name: p.short_name,
      category: p.category,
      summary: p.summary,
      evidence_level: p.evidence_level,
      description: p.description,
      tier_required: p.tier_required,
      benefits: p.benefits,
      constraints: p.constraints,
      citations: p.citations,
      is_active: true
      // Note: created_at and updated_at are auto-managed by the database
    }));

    const { error: upsertError } = await supabase
      .from('protocols')
      .upsert(supabaseData, { onConflict: 'id' });

    if (upsertError) {
      throw new Error(`Failed to upsert protocols to Supabase: ${upsertError.message}`);
    }
    console.log('✅ Supabase upsert complete.\n');

    // 4. Pinecone Setup
    console.log('🔍 Resolving Pinecone index host...');
    const pineconeHost = await getPineconeHost(PINECONE_API_KEY, PINECONE_INDEX_NAME);
    console.log(`✅ Pinecone host: ${pineconeHost}\n`);

    // 4.5. Clear existing Pinecone vectors (clean slate)
    console.log('🗑️  Clearing existing Pinecone vectors...');
    await deleteAllPineconeVectors(PINECONE_API_KEY, pineconeHost);
    console.log('✅ Pinecone vectors cleared.\n');

    // 5. Generate Embeddings & Prepare Vectors
    console.log('🤖 Generating embeddings with Vertex AI...');
    const vectors = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < protocolsData.length; i++) {
      const protocol = protocolsData[i];
      const progressPercent = ((i + 1) / protocolsData.length * 100).toFixed(1);

      try {
        // Richer context for embedding
        const textToEmbed = `
Title: ${protocol.name}
Category: ${protocol.category}
Description: ${protocol.description}
Benefits: ${protocol.benefits}
Constraints: ${protocol.constraints}
Summary: ${protocol.summary}
        `.trim();

        console.log(`   [${i + 1}/${protocolsData.length}] (${progressPercent}%) Embedding: ${protocol.name}...`);
        const embedding = await generateEmbedding(textToEmbed);

        vectors.push({
          id: protocol.id,
          values: embedding,
          metadata: {
            protocol_id: protocol.id,
            name: protocol.name,
            category: protocol.category,
            tier: protocol.tier_required
          },
        });

        successCount++;
      } catch (error) {
        console.error(`   ❌ Failed to embed "${protocol.name}": ${error}`);
        failCount++;
      }
    }

    console.log(`\n✅ Successfully generated ${successCount} embeddings`);

    // 6. Upsert to Pinecone
    if (vectors.length > 0) {
      console.log('📤 Upserting vectors to Pinecone...');
      const BATCH_SIZE = 100;
      const batches = [];

      for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
        batches.push(vectors.slice(i, i + BATCH_SIZE));
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`   [${i + 1}/${batches.length}] Upserting ${batch.length} vectors...`);
        await upsertToPinecone(PINECONE_API_KEY, pineconeHost, batch);
      }
      console.log(`✅ Pinecone upsert complete.\n`);
    }

    console.log('🎉 Full System Seeding Complete!');
    console.log('   1. Local JSON -> Supabase (Data Sync)');
    console.log('   2. Local JSON -> Vertex AI -> Pinecone (RAG Sync)');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedFullSystem();
