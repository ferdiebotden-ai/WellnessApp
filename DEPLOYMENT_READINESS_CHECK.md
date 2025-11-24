# Deployment Readiness Check
**Date:** November 24, 2025  
**Status:** Pre-Deployment Verification

---

## ✅ Prerequisites Verified

### 1. **Code Quality**
- [x] Functions build successfully (`npm run build` in functions/)
- [x] No TypeScript compilation errors
- [x] All 3 entry points exist:
  - `generateDailySchedules` (dailyScheduler.ts)
  - `generateAdaptiveNudges` (nudgeEngine.ts)
  - `api` (api.ts via index.ts)

### 2. **GitHub Configuration**
- [x] Workflow file exists: `.github/workflows/deploy-backend.yml`
- [x] Workflow triggers on push to `main` with changes to `functions/**`
- [x] Service Account Key secret configured: `GCP_SA_KEY`
- [x] All environment secrets configured (per user confirmation):
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_JWT_SECRET`
  - `PINECONE_API_KEY`
  - `PINECONE_INDEX_NAME`
  - `REVENUECAT_WEBHOOK_SECRET`

### 3. **GCP Resources**
- [x] Project exists: `wellness-os-app`
- [x] Service account created with deployment permissions
- [x] Pinecone index created (per user confirmation)

---

## ⚠️ Required Manual Steps Before Deployment

### Critical: Create Pub/Sub Topics

The Cloud Functions need these Pub/Sub topics to exist:

```bash
# Create daily-tick topic (for generateDailySchedules)
gcloud pubsub topics create daily-tick --project=wellness-os-app

# Create hourly-tick topic (for generateAdaptiveNudges)
gcloud pubsub topics create hourly-tick --project=wellness-os-app
```

**Note:** If these topics don't exist, the HTTP function (`api`) will deploy successfully, but the Pub/Sub-triggered functions (`generateDailySchedules` and `generateAdaptiveNudges`) will fail during deployment.

---

## 🚀 Deployment Plan

### Option A: Deploy All Functions (Recommended)
This will deploy all 3 functions via GitHub Actions:

1. **Commit a change** to the functions/ directory
2. **Push to main** branch
3. **Monitor GitHub Actions**: https://github.com/ferdiebotden-ai/WellnessApp/actions
4. **Wait ~10-15 minutes** for deployment to complete

### Option B: Deploy API Only (Quick Test)
If Pub/Sub topics aren't created yet, you can deploy just the API function manually:

```bash
cd functions
npm run build
gcloud functions deploy api \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=api \
  --trigger-http \
  --allow-unauthenticated \
  --project=wellness-os-app \
  --set-env-vars="SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY,..."
```

---

## 📊 What to Monitor During Deployment

### GitHub Actions Workflow Steps:
1. ✅ **Checkout Code** (~10s)
2. ✅ **Setup Node.js** (~5s)
3. ✅ **Install Dependencies** (~30s)
4. ✅ **Authenticate with Google Cloud** (~5s)
5. ✅ **Set up Cloud SDK** (~5s)
6. 🔄 **Deploy generateDailySchedules** (~3-5 min)
   - Watches for: "Deploying function..."
   - Success: "Service URL: https://..."
7. 🔄 **Deploy generateAdaptiveNudges** (~3-5 min)
8. 🔄 **Deploy api** (~3-5 min)

**Total Time:** 10-15 minutes

### Common Errors to Watch For:

**Error 1:** "Topic not found: daily-tick"
- **Cause:** Pub/Sub topics not created
- **Fix:** Run the gcloud commands above

**Error 2:** "Permission denied"
- **Cause:** Service account lacks permissions
- **Fix:** Add missing IAM roles (Cloud Functions Admin, etc.)

**Error 3:** "Invalid value for field 'function.build_config.environment_variables'"
- **Cause:** Secret formatting issue (multiline keys)
- **Fix:** Already handled by env-vars-file approach in workflow

**Error 4:** "Resource not found: Vertex AI"
- **Cause:** Vertex AI API not enabled
- **Fix:** Enable Vertex AI API in GCP Console

---

## ✅ Post-Deployment Verification

### Step 1: Check Function Status

**Via GCP Console:**
1. Go to: https://console.cloud.google.com/functions/list?project=wellness-os-app
2. Verify all 3 functions show "Active" status:
   - `api` (HTTP trigger)
   - `generateDailySchedules` (Pub/Sub: daily-tick)
   - `generateAdaptiveNudges` (Pub/Sub: hourly-tick)

### Step 2: Test API Function

**Get the API URL:**
- From GitHub Actions logs OR
- From GCP Console Functions page

**Test health endpoint:**
```bash
curl https://us-central1-wellness-os-app.cloudfunctions.net/api
```

**Expected response:**
```json
{"status":"ok","service":"wellness-api"}
```

**Test modules endpoint:**
```bash
curl "https://us-central1-wellness-os-app.cloudfunctions.net/api/modules?tier=core"
```

**Expected response:**
```json
{
  "modules": [
    {
      "id": "sleep-optimization",
      "name": "Sleep Optimization",
      ...
    }
  ]
}
```

### Step 3: Test Chat Endpoint (Requires Auth)

**With Firebase token:**
```bash
curl -X POST https://us-central1-wellness-os-app.cloudfunctions.net/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "message": "How can I improve my sleep?",
    "conversationId": "test-001"
  }'
```

### Step 4: Check Logs

**Via GCP Console:**
1. Go to: https://console.cloud.google.com/logs/query?project=wellness-os-app
2. Filter by function name: `resource.labels.function_name="api"`
3. Look for request logs and any errors

---

## 🔄 Next Steps After Successful Deployment

1. **Create Cloud Scheduler Jobs** (to trigger Pub/Sub topics)
   ```bash
   # Daily scheduler (6 AM Pacific = 2 PM UTC)
   gcloud scheduler jobs create pubsub daily-scheduler \
     --schedule="0 14 * * *" \
     --topic=daily-tick \
     --message-body='{"trigger":"daily"}' \
     --location=us-central1 \
     --project=wellness-os-app

   # Hourly nudge engine
   gcloud scheduler jobs create pubsub hourly-nudges \
     --schedule="0 * * * *" \
     --topic=hourly-tick \
     --message-body='{"trigger":"hourly"}' \
     --location=us-central1 \
     --project=wellness-os-app
   ```

2. **Update Frontend Environment Variables**
   - Set `EXPO_PUBLIC_API_BASE_URL` to the deployed API URL

3. **Run Database Migrations**
   - Verify all Supabase tables exist
   - Seed with modules/protocols data

4. **Test End-to-End**
   - Create test user in Firebase Auth
   - Test onboarding flow
   - Test AI chat feature
   - Verify protocol logging works

---

## 📋 Troubleshooting Guide

### Deployment Fails with "Function execution error"
**Check:**
1. Environment variables are set correctly
2. Supabase database is accessible
3. Firebase Admin SDK credentials are valid
4. Vertex AI API is enabled

### API Returns 500 Errors
**Check:**
1. GCP Function logs for error details
2. Supabase RLS policies allow service role access
3. Firebase authentication is working

### Pub/Sub Functions Never Run
**Check:**
1. Cloud Scheduler jobs are created and enabled
2. Pub/Sub topics exist
3. Function logs show no invocations

---

## 📞 Quick Reference Links

- **GitHub Actions**: https://github.com/ferdiebotden-ai/WellnessApp/actions
- **GCP Functions Console**: https://console.cloud.google.com/functions/list?project=wellness-os-app
- **GCP Pub/Sub Console**: https://console.cloud.google.com/cloudpubsub/topic/list?project=wellness-os-app
- **GCP Logs**: https://console.cloud.google.com/logs/query?project=wellness-os-app
- **Firebase Console**: https://console.firebase.google.com/project/wellness-os-app
- **Supabase Dashboard**: https://supabase.com/dashboard

---

## 🎯 Ready to Deploy?

**If you've confirmed:**
- [x] All GitHub Secrets are configured
- [x] GCP Service Account exists with proper permissions
- [x] Pinecone index is created
- [ ] Pub/Sub topics are created (run gcloud commands above)

**Then proceed with deployment by:**
1. Making a small change to trigger the workflow
2. Pushing to main branch
3. Monitoring GitHub Actions

**Estimated time to production:** 15-20 minutes from trigger to fully deployed and tested.

