# Backend Deployment Guide - Step by Step

**Project:** WellnessApp (wellness-os-app)  
**Date:** November 24, 2025  
**Goal:** Deploy Google Cloud Functions + Configure Supabase + Connect Frontend

---

## Prerequisites Checklist

Before we start, verify you have:
- [ ] Google Cloud Console access (wellness-os-app project)
- [ ] Supabase project access
- [ ] GitHub repository access (to set secrets)
- [ ] Terminal/Command Prompt access

---

## Phase 1: Google Cloud Setup (15 minutes)

### Step 1.1: Verify Google Cloud Project

1. **Go to:** https://console.cloud.google.com/
2. **Select Project:** `wellness-os-app` (top dropdown)
3. **Verify these APIs are enabled:**
   - Go to: **APIs & Services** > **Dashboard**
   - Required APIs:
     - ✅ Cloud Functions API
     - ✅ Cloud Run API
     - ✅ Cloud Scheduler API
     - ✅ Cloud Pub/Sub API
     - ✅ Firestore API

**If any are missing:**
- Click **+ ENABLE APIS AND SERVICES**
- Search for the API name
- Click **ENABLE**

### Step 1.2: Create Service Account

1. **Go to:** https://console.cloud.google.com/iam-admin/serviceaccounts
2. **Click:** "+ CREATE SERVICE ACCOUNT"
3. **Fill in:**
   - **Name:** `wellness-github-deployer`
   - **ID:** `wellness-github-deployer@wellness-os-app.iam.gserviceaccount.com`
   - **Description:** "Service account for GitHub Actions deployments"
4. **Click:** "CREATE AND CONTINUE"

### Step 1.3: Grant Permissions

**Add these roles** (click "ADD ANOTHER ROLE" for each):
- `Cloud Functions Admin`
- `Cloud Run Admin`
- `Service Account User`
- `Cloud Scheduler Admin`
- `Pub/Sub Admin`
- `Firebase Admin`

**Click:** "CONTINUE" then "DONE"

### Step 1.4: Generate Service Account Key

1. **Click on the service account** you just created
2. **Go to:** "KEYS" tab
3. **Click:** "ADD KEY" > "Create new key"
4. **Select:** "JSON"
5. **Click:** "CREATE"

**Important:** A JSON file will download. Keep it safe! You'll need it in the next phase.

The file looks like this:
```json
{
  "type": "service_account",
  "project_id": "wellness-os-app",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "wellness-github-deployer@wellness-os-app.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

---

## Phase 2: Supabase Setup (10 minutes)

### Step 2.1: Get Supabase Credentials

1. **Go to:** https://supabase.com/dashboard
2. **Select your project**
3. **Go to:** Settings > API
4. **Copy these values** (you'll need them for GitHub Secrets):
   - **Project URL:** `https://[your-project-ref].supabase.co`
   - **anon public key:** `eyJhbGci...` (starts with eyJ)
   - **service_role key:** `eyJhbGci...` (different, longer key)

5. **Go to:** Settings > Database > Connection String
6. **Copy:** JWT Secret

### Step 2.2: Run Database Migrations

**Option A: Via Supabase Dashboard (Recommended)**

1. **Go to:** SQL Editor in Supabase Dashboard
2. **Create a new query**
3. **Copy and run** each migration file from `supabase/migrations/` in order:

**Run these in order:**

**Migration 1:** `0001_create_users_table.sql`
```sql
-- Copy contents from: supabase/migrations/0001_create_users_table.sql
-- Run in Supabase SQL Editor
```

**Migration 2:** `0002_enable_rls.sql`
```sql
-- Copy contents from: supabase/migrations/0002_enable_rls.sql
-- Run in Supabase SQL Editor
```

**Continue for all 9 migration files...**

**Check if migrations already ran:**
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see:
- users
- modules
- protocols
- module_protocol_map
- job_run_state
- waitlist_entry
- (and others)

### Step 2.3: Check for Missing Tables

Run this query to see which tables are missing:

```sql
-- Check what exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Required tables:**
- ✅ users
- ✅ modules
- ✅ protocols
- ✅ module_protocol_map
- ⚠️ module_enrollment (if missing, we need to create it)
- ⚠️ protocol_logs (if missing, we need to create it)
- ⚠️ wearable_data_archive (if missing, we need to create it)
- ⚠️ ai_audit_log (if missing, we need to create it)

**If tables are missing, I'll provide the CREATE TABLE statements.**

---

## Phase 3: Pinecone Setup (5 minutes)

### Step 3.1: Create Pinecone Account

1. **Go to:** https://www.pinecone.io/
2. **Sign up** or **Log in**
3. **Free tier is fine** for testing

### Step 3.2: Create Index

1. **Click:** "Create Index"
2. **Settings:**
   - **Name:** `wellness-protocols`
   - **Dimensions:** `1536` (for OpenAI embeddings)
   - **Metric:** `cosine`
   - **Region:** Choose closest to your users
3. **Click:** "Create Index"

### Step 3.3: Get API Key

1. **Go to:** API Keys section
2. **Copy your API Key** (starts with `pcsk_`)

---

## Phase 4: GitHub Secrets Configuration (10 minutes)

### Step 4.1: Navigate to GitHub Secrets

1. **Go to:** https://github.com/[your-username]/WellnessApp/settings/secrets/actions
2. **Or:** Repository > Settings > Secrets and variables > Actions

### Step 4.2: Add Required Secrets

**Click "New repository secret" for each:**

#### From Google Cloud Service Account JSON:

**Secret:** `GCP_SA_KEY`  
**Value:** Entire contents of the service account JSON file you downloaded
```json
{
  "type": "service_account",
  "project_id": "wellness-os-app",
  ...entire JSON file...
}
```

**Secret:** `FIREBASE_PROJECT_ID`  
**Value:** `wellness-os-app`

**Secret:** `FIREBASE_CLIENT_EMAIL`  
**Value:** `wellness-github-deployer@wellness-os-app.iam.gserviceaccount.com`
(from the service account JSON)

**Secret:** `FIREBASE_PRIVATE_KEY`  
**Value:** Copy the entire private key INCLUDING the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFA...
...entire key with all newlines preserved...
-----END PRIVATE KEY-----
```

#### From Supabase:

**Secret:** `SUPABASE_URL`  
**Value:** `https://[your-project-ref].supabase.co`

**Secret:** `SUPABASE_ANON_KEY`  
**Value:** The anon public key from Supabase (starts with eyJhbGci...)

**Secret:** `SUPABASE_SERVICE_ROLE_KEY`  
**Value:** The service_role key from Supabase (starts with eyJhbGci...)

**Secret:** `SUPABASE_JWT_SECRET`  
**Value:** The JWT secret from Supabase Database settings

#### From Pinecone:

**Secret:** `PINECONE_API_KEY`  
**Value:** Your Pinecone API key (starts with pcsk_)

**Secret:** `PINECONE_INDEX_NAME`  
**Value:** `wellness-protocols`

#### Other Secrets:

**Secret:** `OPENAI_API_KEY`  
**Value:** Your OpenAI API key (if you have one, otherwise use placeholder)
**Temporary:** `sk-placeholder-for-testing`

**Secret:** `REVENUECAT_WEBHOOK_SECRET`  
**Value:** (if you have RevenueCat set up, otherwise use placeholder)
**Temporary:** `placeholder_for_testing`

### Step 4.3: Verify All Secrets

After adding all secrets, you should see **12 repository secrets**:
1. GCP_SA_KEY
2. FIREBASE_PROJECT_ID
3. FIREBASE_CLIENT_EMAIL
4. FIREBASE_PRIVATE_KEY
5. SUPABASE_URL
6. SUPABASE_ANON_KEY
7. SUPABASE_SERVICE_ROLE_KEY
8. SUPABASE_JWT_SECRET
9. PINECONE_API_KEY
10. PINECONE_INDEX_NAME
11. OPENAI_API_KEY
12. REVENUECAT_WEBHOOK_SECRET

---

## Phase 5: Deploy Backend Functions (5 minutes)

### Step 5.1: Trigger Deployment

**Option A: Push to Main (Recommended)**

1. **Open terminal** in project root
2. **Create a deployment commit:**
```bash
git add .
git commit -m "chore: trigger backend deployment"
git push origin main
```

**Option B: Manual Deployment (if GitHub Actions doesn't work)**

```bash
# We'll provide manual deployment commands if needed
```

### Step 5.2: Monitor Deployment

1. **Go to:** https://github.com/[your-username]/WellnessApp/actions
2. **Watch the workflow:** "CD: Deploy Backend Functions"
3. **Expected duration:** 8-12 minutes

**You should see:**
- ✅ Checkout Code
- ✅ Setup Node.js
- ✅ Install Dependencies
- ✅ Authenticate with Google Cloud
- ✅ Deploy generateDailySchedules (2-3 min)
- ✅ Deploy generateAdaptiveNudges (2-3 min)
- ✅ Deploy api (2-3 min)

### Step 5.3: Get Function URLs

After deployment completes, the workflow logs will show:

```
Service URL: https://us-central1-wellness-os-app.cloudfunctions.net/api
```

**Copy this URL** - you'll need it for the next phase.

---

## Phase 6: Connect Frontend to Backend (2 minutes)

### Step 6.1: Update Client Environment Variable

**Open:** `client/.env`

**Find the line:**
```
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
```

**Replace with:**
```
EXPO_PUBLIC_API_BASE_URL=https://us-central1-wellness-os-app.cloudfunctions.net/api
```

**Save the file.**

### Step 6.2: Restart Development Server

**In terminal where Expo is running:**
1. Press `Ctrl+C` to stop
2. Run: `npm run start:web`
3. Wait for Metro bundler to reload
4. Press `r` to refresh the app

---

## Phase 7: Test the Deployment (5 minutes)

### Step 7.1: Test API Endpoint

**In browser or curl:**
```bash
curl https://us-central1-wellness-os-app.cloudfunctions.net/api/health
```

**Expected response:**
```json
{"status":"ok"}
```

### Step 7.2: Test in App

1. **Open the app** in browser
2. **Check browser console** for logs
3. **Look for:**
   - ✅ "Firebase configuration loaded successfully"
   - ✅ API requests going to the real URL (not example.com)
   - ✅ No more "Backend API unavailable" warnings

### Step 7.3: Test Authentication

1. **Sign up** with a test email
2. **Check Supabase Dashboard** > Table Editor > users
3. **You should see** a new user record

### Step 7.4: Test Module Enrollment

1. **Complete onboarding** in the app
2. **Check Supabase** > module_enrollment table
3. **You should see** an enrollment record

---

## Phase 8: Setup Scheduled Jobs (5 minutes)

### Step 8.1: Create Pub/Sub Topics

1. **Go to:** https://console.cloud.google.com/cloudpubsub
2. **Create Topic:** "daily-tick"
   - Click "CREATE TOPIC"
   - Topic ID: `daily-tick`
   - Click "CREATE"
3. **Create Topic:** "hourly-tick"
   - Same process, ID: `hourly-tick`

### Step 8.2: Create Cloud Scheduler Jobs

1. **Go to:** https://console.cloud.google.com/cloudscheduler
2. **Click:** "CREATE JOB"

**Job 1: Daily Scheduler**
- **Name:** `daily-schedule-trigger`
- **Region:** `us-central1`
- **Frequency:** `0 6 * * *` (6 AM daily)
- **Timezone:** Your timezone
- **Target:** Pub/Sub
- **Topic:** `daily-tick`
- **Payload:** `{"trigger":"scheduled"}`
- **Click:** "CREATE"

**Job 2: Hourly Nudges**
- **Name:** `hourly-nudge-trigger`
- **Region:** `us-central1`
- **Frequency:** `0 * * * *` (every hour)
- **Timezone:** Your timezone
- **Target:** Pub/Sub
- **Topic:** `hourly-tick`
- **Payload:** `{"trigger":"scheduled"}`
- **Click:** "CREATE"

---

## Troubleshooting

### Issue: GitHub Actions Fails

**Check:**
1. All 12 secrets are set correctly
2. Service account has all required roles
3. APIs are enabled in Google Cloud

**View logs:**
- Go to failed workflow run
- Click on the failed step
- Read error messages

### Issue: "Permission denied" errors

**Fix:**
- Service account needs more roles
- Go to IAM & Admin > IAM
- Find your service account
- Add missing roles

### Issue: Functions deploy but return 500 errors

**Check:**
1. Function logs: https://console.cloud.google.com/logs
2. Look for environment variable errors
3. Verify Supabase credentials are correct

### Issue: App still shows mock data

**Verify:**
1. `EXPO_PUBLIC_API_BASE_URL` is updated in client/.env
2. Dev server was restarted after changing .env
3. Browser cache was cleared (hard refresh: Ctrl+Shift+R)

---

## Success Indicators

When everything is working, you should see:

### In Google Cloud Console:
- ✅ 3 Cloud Functions deployed (api, generateDailySchedules, generateAdaptiveNudges)
- ✅ 2 Cloud Scheduler jobs running
- ✅ 2 Pub/Sub topics created

### In Supabase:
- ✅ All tables exist
- ✅ Users table has test user
- ✅ Modules and protocols are seeded
- ✅ module_enrollment has records

### In The App:
- ✅ Real data loads (not mock data)
- ✅ Authentication works
- ✅ Protocol logging syncs to Supabase
- ✅ Health metrics update
- ✅ Daily schedule generates

---

## Next Steps After Deployment

1. **Seed Protocol Data** - Populate protocols with real content and citations
2. **Test All Features** - Go through each screen and verify functionality
3. **Monitor Logs** - Check Cloud Functions logs for any errors
4. **Optimize** - Tune Cloud Functions memory/timeout settings if needed

---

## Need Help?

**Common Questions:**

**Q: Do I need OpenAI API key now?**  
A: Not required for basic functionality. You can use placeholder until you're ready for AI features.

**Q: Can I test without deploying everything?**  
A: Yes! Start with just the `api` function. Others can be deployed later.

**Q: How much will this cost?**  
A: Google Cloud free tier covers testing. Expect < $5/month for low usage.

**Q: Can I deploy manually without GitHub Actions?**  
A: Yes, I can provide manual `gcloud` commands if needed.

---

Let me know when you're ready to start, and we'll go step by step!






