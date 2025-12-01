# Backend Brain Setup Guide

> **Environment Note:** All commands in this guide should be run from WSL2 (Ubuntu) terminal.
> Open the project with: `cd ~/projects/WellnessApp && code .`

This guide walks you through activating your Backend Brain functions (daily scheduler, nudge engine, and chat API) using Vertex AI Gemini 2.0 Flash.

## ✅ What's Already Done (Code Changes)

All code has been migrated from OpenAI to Vertex AI:

- ✅ **[vertexAI.ts](functions/src/vertexAI.ts)** - Vertex AI client wrapper created
- ✅ **[chat.ts](functions/src/chat.ts)** - Updated to use Vertex AI Gemini 2.0 Flash
- ✅ **[nudgeEngine.ts](functions/src/nudgeEngine.ts)** - Updated to use Vertex AI
- ✅ **[protocolSearch.ts](functions/src/protocolSearch.ts)** - Updated for 768-dim embeddings
- ✅ **[config.ts](functions/src/config.ts)** - Removed OpenAI API key requirement
- ✅ **[package.json](functions/package.json)** - Added Vertex AI SDK dependencies
- ✅ **[deploy-backend.yml](.github/workflows/deploy-backend.yml)** - Environment variables configured
- ✅ **[seed-pinecone.ts](scripts/seed-pinecone.ts)** - Pinecone seeding script created
- ✅ **[client/.env](client/.env)** - API URL updated

## 📋 Prerequisites Checklist

Before proceeding, ensure you have:

- [x] Google Cloud Console access (`wellness-os-app` project)
- [x] Firebase project configured
- [ ] Supabase account and project
- [ ] Pinecone account and API key
- [ ] GitHub repository access (for Secrets)

---

## Phase 1: External Services Setup

### 1.1 Supabase Setup (15 minutes)

**Sign up:** [supabase.com](https://supabase.com)

1. Create new project (or use existing)
2. Navigate to **Settings** → **API**
3. Copy these credentials:
   - `Project URL` → Save as `SUPABASE_URL`
   - `anon/public key` → Save as `SUPABASE_ANON_KEY`
   - `service_role key` → Save as `SUPABASE_SERVICE_ROLE_KEY`
4. Navigate to **Settings** → **API** → **JWT Settings**
   - Copy `JWT Secret` → Save as `SUPABASE_JWT_SECRET`

**Apply database migrations:**
```bash
cd supabase
supabase db push
```

**Seed protocols data:**
```bash
psql [YOUR_SUPABASE_URL] -f seed/mission_009_modules_protocols.sql
```

### 1.2 Pinecone Setup (10 minutes)

**Sign up:** [pinecone.io](https://www.pinecone.io)

1. Create new index:
   - **Name:** `wellness-protocols`
   - **Dimensions:** `768` (Vertex AI text-embedding-005)
   - **Metric:** `cosine`
   - **Cloud:** AWS or GCP (your choice)
2. Navigate to **API Keys** tab
3. Copy API key → Save as `PINECONE_API_KEY`

### 1.3 Firebase Service Account (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select `wellness-os-app` project
3. **Project Settings** → **Service Accounts**
4. Click **Generate new private key**
5. Download the JSON file
6. Extract these values:
   - `project_id` → Save as `FIREBASE_PROJECT_ID`
   - `client_email` → Save as `FIREBASE_CLIENT_EMAIL`
   - `private_key` → Save as `FIREBASE_PRIVATE_KEY`
     - **Important:** Keep the literal `\n` characters (don't convert to actual newlines)
     - Example: `"-----BEGIN PRIVATE KEY-----\nMIIEvQIBAD...\n-----END PRIVATE KEY-----\n"`

### 1.4 RevenueCat (Optional)

**For testing only:** Use placeholder:
```
REVENUECAT_WEBHOOK_SECRET=placeholder_for_testing
```

**For production:** Sign up at [revenuecat.com](https://www.revenuecat.com) and get webhook secret

---

## Phase 2: Enable Vertex AI in GCP (10 minutes)

### 2.1 Enable Vertex AI API

```bash
# Set your project
gcloud config set project wellness-os-app

# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com
```

### 2.2 Grant Service Account Permissions

**Find your Cloud Functions service account:**
```bash
# If functions are already deployed:
gcloud functions describe postChat --region=us-central1 --format="value(serviceConfig.serviceAccountEmail)"

# If not deployed yet, use default:
# wellness-os-app@appspot.gserviceaccount.com
```

**Grant Vertex AI User role:**
```bash
# Replace [SERVICE_ACCOUNT_EMAIL] with email from above
gcloud projects add-iam-policy-binding wellness-os-app \
  --member="serviceAccount:[SERVICE_ACCOUNT_EMAIL]" \
  --role="roles/aiplatform.user"
```

### 2.3 Verify Access

```bash
gcloud ai models list --region=us-central1 --limit=1
```

You should see a list of available models (or no error).

---

## Phase 3: Configure GitHub Secrets (10 minutes)

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each:

| Secret Name | Value | Where to Get It |
|-------------|-------|-----------------|
| `GCP_SA_KEY` | Full service account JSON | Firebase service account download |
| `FIREBASE_PROJECT_ID` | wellness-os-app | From service account JSON |
| `FIREBASE_CLIENT_EMAIL` | service-account@... | From service account JSON |
| `FIREBASE_PRIVATE_KEY` | -----BEGIN PRIVATE KEY----- | From service account JSON (keep `\n` literal) |
| `SUPABASE_URL` | https://xxx.supabase.co | Supabase dashboard |
| `SUPABASE_ANON_KEY` | eyJhbGci... | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJhbGci... | Supabase → Settings → API |
| `SUPABASE_JWT_SECRET` | your-jwt-secret | Supabase → Settings → API → JWT |
| `PINECONE_API_KEY` | pcsk_... | Pinecone dashboard → API Keys |
| `PINECONE_INDEX_NAME` | wellness-protocols | The index name you created |
| `REVENUECAT_WEBHOOK_SECRET` | placeholder_for_testing | Placeholder or RevenueCat value |

---

## Phase 4: Deploy Cloud Functions (15 minutes)

### 4.1 Commit and Push Changes

```bash
cd functions
npm install
npm run build

# Commit all changes
git add .
git commit -m "feat: migrate to Vertex AI Gemini 2.0 Flash"
git push origin main
```

This will trigger the GitHub Actions workflow to deploy all 3 functions.

### 4.2 Monitor Deployment

1. Go to GitHub repository → **Actions** tab
2. Watch the "CD: Deploy Backend Functions" workflow
3. Wait for all 3 functions to deploy successfully (5-10 minutes)

### 4.3 Verify Deployment

```bash
# List deployed functions
gcloud functions list --region=us-central1

# Should show:
# - generateDailySchedules
# - generateAdaptiveNudges
# - postChat
```

---

## Phase 5: Set Up Cloud Scheduler (10 minutes)

### 5.1 Create Pub/Sub Topics

```bash
gcloud pubsub topics create daily-tick --project=wellness-os-app
gcloud pubsub topics create hourly-tick --project=wellness-os-app
```

### 5.2 Create Scheduler Jobs

**Daily scheduler (runs at 2 AM UTC):**
```bash
gcloud scheduler jobs create pubsub daily-scheduler \
  --location=us-central1 \
  --schedule="0 2 * * *" \
  --topic=daily-tick \
  --message-body='{"trigger":"daily"}' \
  --time-zone="UTC" \
  --project=wellness-os-app
```

**Hourly nudge engine:**
```bash
gcloud scheduler jobs create pubsub hourly-nudge-engine \
  --location=us-central1 \
  --schedule="0 * * * *" \
  --topic=hourly-tick \
  --message-body='{"trigger":"hourly"}' \
  --time-zone="UTC" \
  --project=wellness-os-app
```

### 5.3 Verify Schedulers

```bash
gcloud scheduler jobs list --location=us-central1 --project=wellness-os-app
```

---

## Phase 6: Seed Pinecone Index (20 minutes)

### 6.1 Configure Seeding Script

```bash
cd scripts
cp .env.example .env
```

Edit `.env` with your credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=wellness-protocols
GCP_PROJECT_ID=wellness-os-app
GCP_LOCATION=us-central1
```

### 6.2 Authenticate with Google Cloud

**Option A: Using gcloud CLI (recommended for local development):**
```bash
gcloud auth application-default login
```

**Option B: Using service account key:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

### 6.3 Run Seeding Script

```bash
npm install
npm run seed
```

Expected output:
```
🌱 Starting Pinecone seeding process...
✅ Found 18 active protocols
🤖 Generating embeddings with Vertex AI...
   [1/18] (5.6%) Embedding: Morning Light Exposure...
   ...
✅ Successfully generated 18 embeddings
📤 Upserting vectors to Pinecone...
🎉 Seeding complete!
```

This will take ~5-10 minutes (18 protocols × embedding generation time).

---

## Phase 7: Testing (30 minutes)

### 7.1 Test Daily Scheduler Function

**Create test user in Supabase:**
```sql
INSERT INTO users (id, display_name) VALUES
  ('test-user-123', 'Test User');

INSERT INTO module_enrollment (user_id, module_id) VALUES
  ('test-user-123', 'mod_sleep');
```

**Trigger manually:**
```bash
gcloud pubsub topics publish daily-tick \
  --message='{"test":true}' \
  --project=wellness-os-app
```

**Verify in Firestore:**
- Navigate to Firebase Console → Firestore
- Check `/schedules/test-user-123/[TODAY'S DATE]`
- Should see document with protocol array

### 7.2 Test Nudge Engine

**Trigger manually:**
```bash
gcloud pubsub topics publish hourly-tick \
  --message='{"test":true}' \
  --project=wellness-os-app
```

**Verify in Firestore:**
- Check `/live_nudges/test-user-123/entries`
- Should see new nudge document with AI-generated text

### 7.3 Test Chat API

**Get function URL:**
```bash
gcloud functions describe postChat \
  --region=us-central1 \
  --format="value(serviceConfig.uri)"
```

**Test with curl:**
```bash
# Get Firebase Auth token for test user first
# (Use Firebase Admin SDK or client app)

curl -X POST [FUNCTION_URL]/postChat \
  -H "Authorization: Bearer [YOUR_FIREBASE_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"message": "How can I improve my sleep quality?"}'
```

**Expected response:**
```json
{
  "response": "Based on evidence-based protocols...",
  "conversationId": "...",
  "citations": ["Huberman et al., 2021"]
}
```

### 7.4 Test Client Integration

```bash
cd client
npm start
```

1. Authenticate as test user
2. Tap AI Coach button
3. Send message: "What protocols should I try?"
4. Verify response appears with citations
5. Check Home screen for daily schedule and nudges

---

## Phase 8: Monitoring & Costs (10 minutes)

### 8.1 Set Up Billing Alerts

1. GCP Console → **Billing** → **Budgets & alerts**
2. Create budget: **$20/month**
3. Set alerts at: 50%, 90%, 100%
4. Add email notifications

### 8.2 Monitor Vertex AI Usage

1. GCP Console → **Vertex AI** → **Billing**
2. Check daily costs
3. Expected: **$0.20-0.50/day** during testing

### 8.3 View Function Logs

```bash
# View chat function logs
gcloud functions logs read postChat \
  --region=us-central1 \
  --limit=50

# View scheduler logs
gcloud functions logs read generateDailySchedules \
  --region=us-central1 \
  --limit=50
```

---

## Cost Summary

**Development/Testing (< 100 users):**
- Vertex AI (Gemini 2.0 Flash): **$4-8/month**
- Pinecone (free tier): **$0**
- Supabase (free tier): **$0**
- Firebase/Firestore: **$0-5/month**
- **Total: $4-13/month**

**Savings vs OpenAI:** **96%** ($120-180/month → $4-8/month)

---

## Troubleshooting

### Function Deployment Fails

**Error:** Missing environment variables
```bash
# Check if secrets are set in GitHub
gh secret list

# Manually set env vars on deployed function
gcloud functions describe postChat --region=us-central1 --format="value(serviceConfig.environmentVariables)"
```

### Vertex AI Permission Denied

**Error:** `Permission 'aiplatform.endpoints.predict' denied`
```bash
# Re-grant permissions
gcloud projects add-iam-policy-binding wellness-os-app \
  --member="serviceAccount:[YOUR_SERVICE_ACCOUNT]" \
  --role="roles/aiplatform.user"
```

### Pinecone Index Not Found

**Error:** `Index 'wellness-protocols' not found`
- Verify index name matches in Pinecone dashboard
- Check `PINECONE_INDEX_NAME` environment variable
- Ensure index is in "ready" state

### Embedding Dimension Mismatch

**Error:** `Expected 768-dimensional embedding`
- Verify you created Pinecone index with 768 dimensions
- Delete and recreate index if wrong dimension
- Re-run seeding script

---

## Next Steps

After successful setup:

1. **Add more test users** - Verify system scales
2. **Test scheduled jobs** - Wait for next hour/day to verify automatic execution
3. **Monitor costs** - Check GCP billing daily for first week
4. **Implement rate limiting** - Add Cloud Armor or API Gateway
5. **Enable authentication** - Remove `--allow-unauthenticated` from functions
6. **Create production environment** - Separate from testing

---

## Support

- **Vertex AI Docs:** [cloud.google.com/vertex-ai/docs](https://cloud.google.com/vertex-ai/docs)
- **Pinecone Docs:** [docs.pinecone.io](https://docs.pinecone.io)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Cloud Functions Docs:** [cloud.google.com/functions/docs](https://cloud.google.com/functions/docs)

---

## Quick Reference Commands

```bash
# Deploy functions manually
cd functions && npm run build
gcloud functions deploy postChat --gen2 --runtime=nodejs20 ...

# Trigger schedulers manually
gcloud pubsub topics publish daily-tick --message='{}'
gcloud pubsub topics publish hourly-tick --message='{}'

# View logs
gcloud functions logs read postChat --region=us-central1

# Check costs
gcloud billing accounts list
gcloud alpha billing budgets list

# List all functions
gcloud functions list --region=us-central1
```

---

**Created:** November 2025
**Last Updated:** November 19, 2025
**Version:** 1.0 (Vertex AI Migration)
