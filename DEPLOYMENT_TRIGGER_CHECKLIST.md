# 🚀 Deployment Trigger - Final Checklist

**Date:** November 24, 2025  
**Ready to Deploy:** YES ✅

---

## ⚠️ CRITICAL: Before You Push

### 1. Create Pub/Sub Topics (If Not Already Created)

**These topics MUST exist before deployment succeeds:**

#### Option A: Via Google Cloud Console (2 minutes, no CLI needed)
1. Go to: https://console.cloud.google.com/cloudpubsub/topic/list?project=wellness-os-app
2. Click **"CREATE TOPIC"**
3. Create topic with ID: `daily-tick`
4. Click **"CREATE TOPIC"** again
5. Create topic with ID: `hourly-tick`

#### Option B: Via gcloud CLI (if installed)
```bash
gcloud pubsub topics create daily-tick --project=wellness-os-app
gcloud pubsub topics create hourly-tick --project=wellness-os-app
```

**Why This Matters:**
- Without these topics, `generateDailySchedules` and `generateAdaptiveNudges` deployments will FAIL
- The `api` function will still deploy successfully
- You can create topics later and re-run deployment

---

## ✅ Deployment Checklist

### Prerequisites (User Confirmed ✅)
- [x] Google Cloud Service Account created
- [x] All GitHub Secrets configured (11 secrets)
- [x] Pinecone Index created
- [ ] **Pub/Sub topics created** (MUST DO BEFORE PUSH)

### Code Status
- [x] Functions build successfully (no TypeScript errors)
- [x] All entry points exist and exported correctly
- [x] Workflow file configured correctly
- [x] Documentation added to index.ts

---

## 🚀 Trigger Deployment

### Step 1: Commit Changes
```bash
cd "C:\Users\ferdi\OneDrive\Documents\NorBot Wellness Inc\Wellness App - Codebase\WellnessApp"

git add .
git commit -m "chore: add function documentation and deployment readiness check"
```

### Step 2: Push to GitHub
```bash
git push origin main
```

This will automatically trigger the GitHub Actions workflow:
`.github/workflows/deploy-backend.yml`

### Step 3: Monitor Deployment
**Go to:** https://github.com/ferdiebotden-ai/WellnessApp/actions

**Expected Timeline:**
- 0:00 - Workflow starts
- 0:30 - Dependencies installed, build complete
- 1:00 - Authentication successful
- 2:00 - Deploy generateDailySchedules starts
- 5:00 - Deploy generateAdaptiveNudges starts
- 8:00 - Deploy api starts
- 11:00 - All deployments complete ✅

**Total Time:** ~11-15 minutes

---

## 📊 What to Watch For

### Success Indicators (Green ✅)
Each deployment step should show:
```
Deploying function (may take a while - up to 2 minutes)...done.
availableMemoryMb: 512
buildId: [build-id]
...
serviceConfig:
  service: projects/wellness-os-app/locations/us-central1/services/[function-name]
  uri: https://us-central1-wellness-os-app.cloudfunctions.net/[function-name]
state: ACTIVE
updateTime: '[timestamp]'
```

### Error Indicators (Red ❌)

**Error 1: "Resource not found: Topic 'projects/wellness-os-app/topics/daily-tick'"**
- **Cause:** Pub/Sub topics not created
- **Fix:** Create topics using steps above, then re-run deployment

**Error 2: "Permission denied"**
- **Cause:** Service account lacks IAM permissions
- **Fix:** Verify service account has these roles:
  - Cloud Functions Admin
  - Service Account User
  - Pub/Sub Admin

**Error 3: "Invalid argument: FIREBASE_PRIVATE_KEY"**
- **Cause:** Private key formatting issue
- **Fix:** Ensure key has `\n` (not actual newlines) in GitHub Secret

**Error 4: "Vertex AI API not enabled"**
- **Cause:** Missing API enablement
- **Fix:** Enable Vertex AI API in GCP Console

---

## ✅ Post-Deployment Verification

### Immediate Tests (After Successful Deployment)

#### 1. Check Function Status
Go to: https://console.cloud.google.com/functions/list?project=wellness-os-app

**Expected:**
- ✅ `api` - ACTIVE (HTTP trigger)
- ✅ `generateDailySchedules` - ACTIVE (Pub/Sub: daily-tick)
- ✅ `generateAdaptiveNudges` - ACTIVE (Pub/Sub: hourly-tick)

#### 2. Test API Health Check
```bash
curl https://us-central1-wellness-os-app.cloudfunctions.net/api
```

**Expected Response:**
```json
{"status":"ok","service":"wellness-api"}
```

#### 3. Test Modules Endpoint
```bash
curl "https://us-central1-wellness-os-app.cloudfunctions.net/api/modules?tier=core"
```

**Expected:** List of modules (or empty array if not seeded yet)

#### 4. Check Logs
1. Go to: https://console.cloud.google.com/logs/query?project=wellness-os-app
2. Filter: `resource.labels.function_name="api"`
3. Look for startup logs and any errors

---

## 🔄 If Deployment Fails

### Quick Fixes

**If Pub/Sub functions fail but API succeeds:**
1. Create missing Pub/Sub topics
2. Go to GitHub Actions → Click failed workflow
3. Click "Re-run failed jobs"

**If all functions fail:**
1. Check GitHub Secrets are all present and formatted correctly
2. Verify service account has proper IAM roles
3. Check GCP Console for any API enablement issues

**If deployment succeeds but functions don't work:**
1. Check function logs for runtime errors
2. Verify environment variables are loading correctly
3. Test Supabase connection (check RLS policies)

---

## 📋 Next Steps After Successful Deployment

### Phase 1: Basic Testing (5 minutes)
- [x] Deployment complete
- [ ] API health check passes
- [ ] Modules endpoint responds
- [ ] No errors in function logs

### Phase 2: Create Cloud Scheduler Jobs (5 minutes)
```bash
# Daily scheduler - runs at 6 AM Pacific (2 PM UTC)
gcloud scheduler jobs create pubsub daily-scheduler \
  --schedule="0 14 * * *" \
  --topic=daily-tick \
  --message-body='{"trigger":"daily"}' \
  --location=us-central1 \
  --project=wellness-os-app

# Hourly nudges
gcloud scheduler jobs create pubsub hourly-nudges \
  --schedule="0 * * * *" \
  --topic=hourly-tick \
  --message-body='{"trigger":"hourly"}' \
  --location=us-central1 \
  --project=wellness-os-app
```

### Phase 3: Update Frontend (3 minutes)
Update `client/.env`:
```bash
EXPO_PUBLIC_API_BASE_URL=https://us-central1-wellness-os-app.cloudfunctions.net/api
```

### Phase 4: Database Seeding (10 minutes)
- Run Supabase migrations (if not done)
- Seed modules and protocols data
- Create test user

### Phase 5: End-to-End Testing (15 minutes)
- Test user registration
- Test onboarding flow
- Test AI chat
- Test protocol logging
- Verify streaks calculation

---

## 📞 Quick Reference

**GitHub Actions:** https://github.com/ferdiebotden-ai/WellnessApp/actions  
**GCP Functions:** https://console.cloud.google.com/functions/list?project=wellness-os-app  
**GCP Pub/Sub:** https://console.cloud.google.com/cloudpubsub/topic/list?project=wellness-os-app  
**GCP Logs:** https://console.cloud.google.com/logs/query?project=wellness-os-app  

---

## 🎯 Ready to Deploy?

**Before you proceed, confirm:**
1. You've created the Pub/Sub topics (daily-tick, hourly-tick)
2. You're ready to commit and push changes
3. You have 15 minutes to monitor the deployment

**If yes, run:**
```bash
cd "C:\Users\ferdi\OneDrive\Documents\NorBot Wellness Inc\Wellness App - Codebase\WellnessApp"
git add .
git commit -m "chore: add function documentation and trigger deployment"
git push origin main
```

**Then immediately go to:** https://github.com/ferdiebotden-ai/WellnessApp/actions

---

**Status:** Ready to deploy! 🚀

