# Backend Brain Activation Plan (Vertex AI Edition)

## Context
The codebase has been successfully migrated to **Vertex AI (Gemini 2.0 Flash)** for cost savings and performance. The code is ready, but the infrastructure and data are not. This plan focuses on "hydrating" the system: setting up the environment, seeding data, and turning on the switches.

## Phase 1: Credentials & Infrastructure Setup
**Goal:** Ensure the environment is ready to run the code.

### 1. Gather & Configure Secrets
We need to collect 10 specific secrets and configure them in GitHub Actions.
- **Supabase:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- **Pinecone:** `PINECONE_API_KEY`, `PINECONE_INDEX_NAME` (Value: `wellness-protocols`)
- **Firebase:** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- **RevenueCat:** `REVENUECAT_WEBHOOK_SECRET`

### 2. Google Cloud Configuration (Manual Steps)
- **Enable API:** Vertex AI API (`aiplatform.googleapis.com`)
- **Permissions:** Ensure `github-deployer` SA has `roles/aiplatform.user` (already likely done, but verify).
- **Pub/Sub Topics:** Create `daily-tick` and `hourly-tick`.
- **Cloud Scheduler:** Create jobs to trigger the topics.

### 3. Pinecone Re-Indexing (Manual Step)
- **Action:** Delete any existing 3072-dimension index.
- **Action:** Create a **new index**:
  - Name: `wellness-protocols`
  - Dimensions: **768** (Critical for Vertex AI compatibility)
  - Metric: `cosine`

## Phase 2: Data Seeding
**Goal:** Populate the "Brain" with knowledge.

### 1. Supabase Data (Modules & Protocols)
- Verify `modules`, `protocols`, and `module_protocol_map` tables are populated.
- If not, run `supabase/seed/mission_009_modules_protocols.sql`.

### 2. Pinecone Vectors (Embeddings)
- **Script:** `scripts/seed-pinecone.ts`
- **Action:** Configure local `.env` with the gathered secrets.
- **Action:** Run the script to:
  1. Fetch protocols from Supabase.
  2. Generate **768-dim embeddings** using Vertex AI.
  3. Upsert vectors to Pinecone.

## Phase 3: Validation & Testing
**Goal:** Prove it works.

### 1. Backend Function Tests
- **Daily Scheduler:** Trigger `daily-tick` -> Check Firestore for schedule.
- **Nudge Engine:** Trigger `hourly-tick` -> Check Firestore for nudge.
- **Chat API:** Send HTTP POST -> Verify generic wellness response (Vertex AI).

### 2. Frontend Integration
- Verify the React Native app (`ChatModal`) connects to the deployed function URL.
- Test a full conversation loop.

## Execution Checklist

- [ ] User provides API Keys/Secrets
- [ ] User enables Vertex AI API
- [ ] User recreates Pinecone Index (768-dim)
- [ ] Agent creates Pub/Sub topics & Scheduler jobs
- [ ] Agent runs Pinecone seeding script
- [ ] Agent validates all 3 functions

