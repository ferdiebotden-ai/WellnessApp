# Deployment Architecture - Simplified

## Overview
The WellnessApp backend has been simplified from 14 individual Cloud Functions to just **3 consolidated functions**.

---

## Deployed Functions

### 1. **api** (HTTP Triggered)
- **Entry Point:** `api` (Express app from [functions/src/api.ts](functions/src/api.ts))
- **Trigger:** HTTPS
- **URL:** `https://us-central1-wellness-os-app.cloudfunctions.net/api`
- **Purpose:** Consolidated REST API with all HTTP endpoints

**Routes:**
- `POST /api/users` - Create user
- `GET /api/users/me` - Get current user
- `PATCH /api/users/me` - Update current user
- `DELETE /api/users/me` - Request user deletion
- `POST /api/users/me/export` - Request data export
- `GET /api/users/me/privacy` - Get privacy dashboard
- `GET /api/users/me/monetization` - Get monetization status
- `POST /api/chat` - Chat with AI coach
- `POST /api/onboarding/complete` - Complete onboarding
- `POST /api/waitlist` - Join waitlist
- `POST /api/wearables/sync` - Sync wearable data
- `GET /api/protocols/search` - Search protocols (RAG)
- `GET /api/modules` - Get available modules
- `POST /api/webhooks/revenuecat` - RevenueCat webhook

### 2. **generateDailySchedules** (Pub/Sub Triggered)
- **Entry Point:** `generateDailySchedules` from [functions/src/dailyScheduler.ts](functions/src/dailyScheduler.ts)
- **Trigger:** Pub/Sub topic `daily-tick` (6 AM Pacific)
- **Purpose:** Generate personalized daily protocols for all users

**What it does:**
1. Fetches all active module enrollments
2. Selects protocols based on user preferences
3. Creates daily schedule in Firestore
4. Respects user's preferred wake time

### 3. **generateAdaptiveNudges** (Pub/Sub Triggered)
- **Entry Point:** `generateAdaptiveNudges` from [functions/src/nudgeEngine.ts](functions/src/nudgeEngine.ts)
- **Trigger:** Pub/Sub topic `hourly-tick` (every hour)
- **Purpose:** Generate adaptive nudges based on user behavior

**What it does:**
1. Analyzes protocol completion patterns
2. Uses AI to craft personalized nudges
3. Respects notification preferences
4. Implements smart throttling

---

## Why the Change?

### Before (❌ Old Architecture)
- **14 separate Cloud Functions** for each route
- Complex deployment (14 individual deploys)
- Higher cold start overhead
- More difficult to manage environment variables
- Each function needed separate configuration

### After (✅ New Architecture)
- **1 API function** for all HTTP routes (Express app)
- **2 scheduled functions** for autonomous features
- Faster deployment (3 functions)
- Single warm Express server for API
- Centralized environment variable management
- Simpler monitoring and logging

---

## Environment Variables

All functions receive these environment variables from GitHub Secrets:

**API Function:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `PINECONE_API_KEY` - Pinecone vector DB API key
- `PINECONE_INDEX_NAME` - Pinecone index name
- `OPENAI_API_KEY` - OpenAI API key for embeddings/chat

**Scheduler Functions:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FIREBASE_PROJECT_ID`
- `OPENAI_API_KEY` (nudge engine only)

---

## Deployment Process

**Automated via GitHub Actions:**
1. Push to `main` branch triggers workflow
2. Lint code
3. Run tests (non-blocking)
4. Build TypeScript → JavaScript
5. Deploy 3 functions to GCP

**Manual deployment:**
```bash
cd functions
npm run build
gcloud functions deploy api --gen2 --runtime=nodejs20 --region=us-central1 --entry-point=api --trigger-http --allow-unauthenticated --source=. --project=wellness-os-app
```

---

## Monitoring

**Check function status:**
```bash
gcloud functions list --region=us-central1 --project=wellness-os-app
```

**View logs:**
```bash
gcloud functions logs read api --region=us-central1 --project=wellness-os-app --limit=50
```

**Test API endpoint:**
```bash
curl "https://us-central1-wellness-os-app.cloudfunctions.net/api/modules?tier=core"
```

---

## Next Steps

1. ✅ Deployment workflow simplified
2. ⏳ Deploy and verify functions work
3. ⏳ Run database migrations
4. ⏳ Seed database with modules/protocols
5. ⏳ Verify Cloud Scheduler jobs are connected

**Status:** Deployment in progress (commit: 35d1399)
