# WellnessApp Backend Architecture

> **Last Updated:** November 2024
> **Author:** Claude Code Agent
> **Purpose:** Comprehensive reference for AI agents and developers working on the WellnessApp backend

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Cloud Functions](#cloud-functions)
5. [Database Layer](#database-layer)
6. [AI/ML Components](#aiml-components)
7. [Authentication Flow](#authentication-flow)
8. [Scheduled Jobs](#scheduled-jobs)
9. [API Reference](#api-reference)
10. [Environment Variables](#environment-variables)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Overview

WellnessApp is a wellness coaching mobile application with an AI-powered backend (the "Brain"). The backend provides:

- **AI Coaching:** Personalized wellness nudges using Vertex AI Gemini 2.0 Flash
- **Protocol Search:** RAG-based semantic search using Pinecone vector database
- **User Management:** Firebase Auth + Supabase PostgreSQL hybrid
- **Scheduled Jobs:** Daily schedule generation and hourly adaptive nudges

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Firebase Auth + Supabase DB | Firebase for mobile auth convenience, Supabase for relational data and RLS |
| Vertex AI over OpenAI | 96% cost reduction ($4-8/month vs $120-180/month) |
| Cloud Functions Gen2 | Better cold start times, Cloud Run under the hood |
| Pinecone for RAG | Managed vector DB, easy to scale |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MOBILE CLIENT                                   │
│                         (Expo / React Native)                               │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FIREBASE AUTH                                      │
│                    (Authentication & JWT Tokens)                            │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      GOOGLE CLOUD FUNCTIONS (Gen2)                          │
│  ┌─────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │       api       │  │ generateDailySchedules│ │ generateAdaptiveNudges │  │
│  │  (HTTP Trigger) │  │   (Pub/Sub Trigger)   │ │   (Pub/Sub Trigger)    │  │
│  │                 │  │                       │ │                         │  │
│  │ - /api/users    │  │ Runs daily at 5 AM    │ │ Runs every hour         │  │
│  │ - /api/chat     │  │ Creates user schedules│ │ Generates AI nudges     │  │
│  │ - /api/modules  │  │                       │ │                         │  │
│  │ - /api/protocols│  │                       │ │                         │  │
│  └────────┬────────┘  └───────────┬───────────┘  └────────────┬───────────┘  │
│           │                       │                           │              │
└───────────┼───────────────────────┼───────────────────────────┼──────────────┘
            │                       │                           │
            ▼                       ▼                           ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                        │
│                                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │    SUPABASE     │  │    PINECONE     │  │   FIRESTORE     │                │
│  │   (PostgreSQL)  │  │  (Vector DB)    │  │  (Real-time)    │                │
│  │                 │  │                 │  │                 │                │
│  │ - users         │  │ 768-dim vectors │  │ - daily_schedules│               │
│  │ - modules       │  │ 23 protocols    │  │ - nudges         │               │
│  │ - protocols     │  │ Cosine metric   │  │ - user sessions  │               │
│  │ - job_run_state │  │                 │  │                 │                │
│  │ - waitlist_entry│  │                 │  │                 │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                                                                │
└───────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                              AI LAYER                                          │
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                      VERTEX AI (Google Cloud)                            │  │
│  │                                                                          │  │
│  │  ┌─────────────────────────┐  ┌─────────────────────────────────────┐   │  │
│  │  │   Gemini 2.0 Flash      │  │     text-embedding-005              │   │  │
│  │  │   (Chat Completions)    │  │     (768-dim Embeddings)            │   │  │
│  │  │                         │  │                                     │   │  │
│  │  │   - Nudge generation    │  │   - Protocol semantic search        │   │  │
│  │  │   - Chat responses      │  │   - Query vectorization             │   │  │
│  │  │   - Coaching advice     │  │                                     │   │  │
│  │  └─────────────────────────┘  └─────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Runtime** | Node.js 20 | Cloud Functions runtime |
| **Framework** | Express.js 5 | HTTP API routing |
| **Auth** | Firebase Auth | Mobile authentication |
| **Database** | Supabase (PostgreSQL) | User data, protocols, modules |
| **Real-time DB** | Firebase Firestore | Schedules, nudges, sessions |
| **Vector DB** | Pinecone | RAG semantic search |
| **AI Model** | Vertex AI Gemini 2.0 Flash | Chat completions |
| **Embeddings** | Vertex AI text-embedding-005 | 768-dim vectors |
| **Scheduling** | Cloud Scheduler + Pub/Sub | Cron jobs |
| **CI/CD** | GitHub Actions | Auto-deploy on push to main |

---

## Cloud Functions

### 1. `api` (HTTP Trigger)

**URL:** `https://api-26324650924.us-central1.run.app`

The main REST API serving all client requests.

**Source:** `functions/src/api.ts`

```typescript
// Key routes
app.get('/', healthCheck);
app.post('/api/users', createUser);
app.get('/api/users/me', getCurrentUser);
app.patch('/api/users/me', updateCurrentUser);
app.post('/api/chat', postChat);
app.get('/api/modules', getModules);
app.get('/api/protocols/search', searchProtocols);
app.post('/api/waitlist', joinWaitlist);
app.post('/api/webhooks/revenuecat', handleRevenueCatWebhook);
```

### 2. `generateDailySchedules` (Pub/Sub Trigger)

**Topic:** `daily-tick`
**Schedule:** Daily at 5:00 AM UTC

Generates personalized daily protocol schedules for each enrolled user.

**Source:** `functions/src/dailyScheduler.ts`

**Flow:**
1. Query all users with module enrollments from Supabase
2. For each user, get their enrolled protocols
3. Create a daily schedule with time slots
4. Store in Firestore under `users/{uid}/daily_schedules/{date}`

### 3. `generateAdaptiveNudges` (Pub/Sub Trigger)

**Topic:** `hourly-tick`
**Schedule:** Every hour

Generates AI-powered coaching nudges based on user context and health metrics.

**Source:** `functions/src/nudgeEngine.ts`

**Flow:**
1. Query users with recent activity from Supabase
2. Get user's health metrics and preferences
3. Use RAG to find relevant protocols from Pinecone
4. Generate personalized nudge using Vertex AI Gemini
5. Store nudge in Firestore under `users/{uid}/nudges/{timestamp}`

---

## Database Layer

### Supabase (PostgreSQL)

**URL:** `https://vcrdogdyjljtwgoxpkew.supabase.co`

#### Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `users` | User profiles linked to Firebase UID | Yes |
| `modules` | Wellness modules (Sleep, Focus, etc.) | No |
| `protocols` | Health protocols (Cold Exposure, etc.) | No |
| `module_protocol_map` | Links protocols to modules | No |
| `job_run_state` | Tracks cron job execution | No |
| `waitlist_entry` | Premium tier waitlist | No |

#### Key Schema: `users`

```sql
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid text NOT NULL UNIQUE,
    email text,
    display_name text,
    avatar_url text,
    tier text NOT NULL DEFAULT 'trial',        -- 'trial', 'core', 'pro', 'elite'
    trial_start_date timestamptz,
    trial_end_date timestamptz,
    onboarding_complete boolean DEFAULT false,
    preferences jsonb DEFAULT '{}',            -- nudge_tone, quiet_hours, etc.
    "healthMetrics" jsonb DEFAULT '{}',        -- HRV, sleep quality, etc.
    "earnedBadges" text[] DEFAULT '{}',
    subscription_id text,                      -- RevenueCat subscription
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

#### Key Schema: `protocols`

```sql
CREATE TABLE public.protocols (
    id text PRIMARY KEY,                       -- e.g., 'prot_cold_exposure'
    name text NOT NULL,
    short_name text NOT NULL,
    category text NOT NULL,                    -- Foundation, Performance, Recovery, etc.
    summary text NOT NULL,
    evidence_level text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### Pinecone (Vector Database)

**Index:** `wellness-protocols`
**Dimension:** 768
**Metric:** Cosine
**Vectors:** 23 protocols

Used for semantic search in the RAG pipeline. Each protocol is embedded using Vertex AI `text-embedding-005`.

### Firestore (Real-time)

Used for real-time data that needs to sync with mobile clients:

```
users/
  {firebase_uid}/
    daily_schedules/
      {YYYY-MM-DD}/
        protocols: [{protocol_id, scheduled_time, status}]
    nudges/
      {timestamp}/
        nudge_text, protocol_id, reasoning, status
```

---

## AI/ML Components

### Vertex AI Integration

**Source:** `functions/src/vertexAI.ts`

```typescript
// Chat completions using Gemini 2.0 Flash
export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string
): Promise<string>

// Embeddings using text-embedding-005
export async function generateEmbedding(text: string): Promise<number[]>
```

### RAG Pipeline

**Source:** `functions/src/protocolSearch.ts`

1. **Query:** User asks a health question
2. **Embed:** Convert query to 768-dim vector using `text-embedding-005`
3. **Search:** Query Pinecone for top-k similar protocols
4. **Augment:** Include protocol summaries in LLM context
5. **Generate:** Gemini generates response with citations

```typescript
export async function searchProtocols(req: Request, res: Response) {
  const { query, limit = 5 } = req.query;

  // Generate embedding
  const embedding = await generateEmbedding(query);

  // Query Pinecone
  const results = await queryPinecone(embedding, limit);

  // Fetch full protocol data from Supabase
  const protocols = await fetchProtocols(results.map(r => r.id));

  return res.json({ protocols });
}
```

---

## Authentication Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Mobile App   │────▶│ Firebase Auth│────▶│ Cloud Function│────▶│  Supabase    │
│              │     │              │     │              │     │              │
│ 1. Sign in   │     │ 2. Issue JWT │     │ 3. Verify JWT│     │ 4. Query DB  │
│    with      │     │    with      │     │    with      │     │    with      │
│    Google/   │     │    firebase  │     │    firebase- │     │    service   │
│    Apple     │     │    uid claim │     │    admin     │     │    role key  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### JWT Bridge

Firebase JWTs are verified in Cloud Functions, then Supabase is accessed using the service role key (bypasses RLS for backend operations).

**Source:** `functions/src/authMiddleware.ts`

```typescript
export async function verifyFirebaseToken(req: Request): Promise<DecodedIdToken> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split('Bearer ')[1];
  return await getAuth().verifyIdToken(token);
}
```

---

## Scheduled Jobs

### Cloud Scheduler Configuration

| Job Name | Schedule | Pub/Sub Topic | Target Function |
|----------|----------|---------------|-----------------|
| `daily-scheduler` | `0 5 * * *` (5 AM UTC) | `daily-tick` | `generateDailySchedules` |
| `hourly-nudge-engine` | `0 * * * *` (every hour) | `hourly-tick` | `generateAdaptiveNudges` |

### Job Tracking

The `job_run_state` table tracks execution:

```sql
SELECT * FROM job_run_state;
-- job_name                | last_run_at          | updated_at
-- generateDailySchedules  | 2024-11-26 05:00:00  | 2024-11-26 05:00:15
-- generateAdaptiveNudges  | 2024-11-26 10:00:00  | 2024-11-26 10:00:08
```

---

## API Reference

### Health Check

```
GET /
Response: { "status": "ok", "service": "wellness-api" }
```

### User Management

```
POST /api/users
Body: { firebase_uid, email, display_name }
Response: { id, firebase_uid, email, ... }

GET /api/users/me
Headers: Authorization: Bearer <firebase_jwt>
Response: { id, email, tier, preferences, ... }

PATCH /api/users/me
Headers: Authorization: Bearer <firebase_jwt>
Body: { display_name?, preferences?, healthMetrics? }
Response: { id, ... }
```

### AI Chat

```
POST /api/chat
Headers: Authorization: Bearer <firebase_jwt>
Body: { message: "How can I improve my sleep?" }
Response: {
  response: "Based on your profile...",
  citations: ["prot_sleep_hygiene", "prot_morning_light"]
}
```

### Protocol Search

```
GET /api/protocols/search?query=cold+exposure&limit=5
Response: {
  protocols: [
    { id, name, summary, evidence_level, similarity_score }
  ]
}
```

### Modules

```
GET /api/modules
Response: {
  modules: [
    { id, name, description, headline, tier, protocols: [...] }
  ]
}
```

---

## Environment Variables

### Required for Cloud Functions

| Variable | Description |
|----------|-------------|
| `FIREBASE_PROJECT_ID` | `wellness-os-app` |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_PRIVATE_KEY` | Service account private key |
| `SUPABASE_URL` | `https://vcrdogdyjljtwgoxpkew.supabase.co` |
| `SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (backend only) |
| `SUPABASE_JWT_SECRET` | JWT signing secret |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_INDEX_NAME` | `wellness-protocols` |
| `REVENUECAT_WEBHOOK_SECRET` | RevenueCat webhook verification |

### Client Environment (`.env`)

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyA6E9i-d1jfLwgJIjgVJk9Bfl9MeDMO_6o
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=wellness-os-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=wellness-os-app
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=wellness-os-app.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=26324650924
EXPO_PUBLIC_FIREBASE_APP_ID=1:26324650924:android:44e1c78ddab77c26be8809
EXPO_PUBLIC_API_BASE_URL=https://api-26324650924.us-central1.run.app
```

---

## Deployment

### GitHub Actions Workflow

**File:** `.github/workflows/deploy-backend.yml`

**Trigger:** Push to `main` branch (paths: `functions/**`)

**Steps:**
1. Checkout code
2. Install dependencies (`npm ci`)
3. Build TypeScript (`npm run build`)
4. Authenticate with GCP (using `GCP_SA_KEY` secret)
5. Deploy each function with environment variables

### Manual Deployment

```bash
cd functions
npm ci
npm run build

# Deploy API
gcloud functions deploy api \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=api \
  --trigger-http \
  --allow-unauthenticated

# Deploy scheduled functions
gcloud functions deploy generateDailySchedules \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --trigger-topic=daily-tick

gcloud functions deploy generateAdaptiveNudges \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --trigger-topic=hourly-tick
```

---

## Troubleshooting

### Common Issues

#### 1. Container Crash on Deployment

**Symptom:** "Creating Revision...failed"

**Cause:** Missing production dependencies

**Fix:** Ensure all required packages are in `dependencies` (not `devDependencies`) in `functions/package.json`:
```json
{
  "dependencies": {
    "@google-cloud/vertexai": "^1.10.0",
    "google-auth-library": "^10.5.0"
  }
}
```

#### 2. IAM Permission Denied

**Symptom:** `PERMISSION_DENIED: Build failed because the default service account is missing required IAM permissions`

**Fix:** Add `Service Usage Consumer` role to the deploying service account in GCP IAM.

#### 3. 404 on API Endpoint

**Symptom:** `https://us-central1-wellness-os-app.cloudfunctions.net/api` returns 404

**Cause:** Gen2 functions use Cloud Run URLs, not the legacy format

**Fix:** Use the Cloud Run URL: `https://api-26324650924.us-central1.run.app`

#### 4. Supabase RLS Blocking Queries

**Symptom:** Empty results from Supabase queries

**Cause:** Row-Level Security blocking access

**Fix:** Use service role key for backend operations:
```typescript
const supabase = createClient(url, SERVICE_ROLE_KEY);
```

### Logs

```bash
# View function logs
gcloud functions logs read api --gen2 --region=us-central1

# View specific function
gcloud functions logs read generateAdaptiveNudges --gen2 --region=us-central1 --limit=50
```

---

## Quick Reference

| Resource | URL/Command |
|----------|-------------|
| **API Health** | `https://api-26324650924.us-central1.run.app` |
| **GCP Console** | `https://console.cloud.google.com/functions?project=wellness-os-app` |
| **Supabase Dashboard** | `https://supabase.com/dashboard/project/vcrdogdyjljtwgoxpkew` |
| **Pinecone Console** | `https://app.pinecone.io` |
| **Firebase Console** | `https://console.firebase.google.com/project/wellness-os-app` |
| **GitHub Repo** | `https://github.com/ferdiebotden-ai/WellnessApp` |

---

## Version History

| Date | Change |
|------|--------|
| Nov 2024 | Initial documentation created |
| Nov 2024 | Migrated from OpenAI to Vertex AI (96% cost reduction) |
| Nov 2024 | Fixed deployment issues (devDependencies → dependencies) |
| Nov 2024 | Created missing Supabase tables (users, job_run_state, waitlist_entry) |
| Nov 2024 | Configured Cloud Scheduler jobs |
