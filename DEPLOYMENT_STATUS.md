# Deployment Status & Monitoring Guide
**Date:** November 20, 2025
**Commit:** `a4f2ea4` - Fixed env-vars-file issue

---

## ✅ What Just Happened

**Fixed the deployment error!**

The workflow has been updated to use `--env-vars-file=.env.yaml` instead of inline `--set-env-vars`. This properly handles the multiline `FIREBASE_PRIVATE_KEY` secret.

**Changes Made:**
- Updated all 3 function deployments in [.github/workflows/deploy-backend.yml](.github/workflows/deploy-backend.yml)
- Each deployment now creates a temporary `.env.yaml` file
- YAML format handles special characters and newlines correctly
- Files are automatically cleaned up after deployment

**Pushed Commit:**
- Commit: `a4f2ea4`
- Branch: `main`
- GitHub Actions should start automatically

---

## 📊 Monitor the Deployment

### Step 1: Watch GitHub Actions

**Go to:** https://github.com/ferdiebotden-ai/WellnessApp/actions

You should see a new workflow run for commit `a4f2ea4` with the message:
> fix: use env-vars-file for Cloud Functions deployment

### Step 2: Watch for Success Indicators

The workflow has 5 steps:
1. ✅ Checkout Code (fast - 10s)
2. ✅ Setup Node.js (fast - 5s)
3. ✅ Install Dependencies (medium - 30s)
4. ✅ Authenticate with Google Cloud (fast - 5s)
5. ✅ Set up Cloud SDK (fast - 5s)

Then 3 deployment steps (each takes 2-4 minutes):
6. 🔄 Deploy generateDailySchedules
7. 🔄 Deploy generateAdaptiveNudges
8. 🔄 Deploy postChat

**Total Expected Time:** ~8-12 minutes

### Step 3: Look for Success Messages

Each deployment step should show:
```
Deploying function (may take a while - up to 2 minutes)...
✓ Function deployed successfully
Service URL: https://us-central1-wellness-os-app.cloudfunctions.net/[FUNCTION_NAME]
```

---

## ✅ Success Checklist

When deployment completes successfully, you'll see:

### In GitHub Actions:
- [ ] All jobs show green checkmarks ✅
- [ ] No red X marks or errors
- [ ] "Deploy generateDailySchedules" completed
- [ ] "Deploy generateAdaptiveNudges" completed
- [ ] "Deploy postChat" completed

### In GCP Console:
Go to: https://console.cloud.google.com/functions/list?project=wellness-os-app

You should see 3 functions:
- [ ] `generateDailySchedules` - Status: ACTIVE - Trigger: Pub/Sub (daily-tick)
- [ ] `generateAdaptiveNudges` - Status: ACTIVE - Trigger: Pub/Sub (hourly-tick)
- [ ] `postChat` - Status: ACTIVE - Trigger: HTTP

---

## 🐛 If Deployment Fails Again

### Check for Error Messages

Click on the failed step in GitHub Actions to see the error log.

### Common Issues:

**1. "Topic not found: daily-tick" or "hourly-tick"**
→ **Solution:** You need to create the Pub/Sub topics first!
   - Go to: https://console.cloud.google.com/cloudpubsub/topic/list?project=wellness-os-app
   - Create `daily-tick` and `hourly-tick` topics
   - Re-run the workflow

**2. "Permission denied"**
→ **Solution:** Check that `GCP_SA_KEY` secret has proper IAM roles:
   - Cloud Functions Admin
   - Service Account User
   - Pub/Sub Publisher

**3. "Secret not found: FIREBASE_PRIVATE_KEY"**
→ **Solution:** Verify the secret exists in GitHub:
   - Go to: https://github.com/ferdiebotden-ai/WellnessApp/settings/secrets/actions
   - Check all 11 secrets are present

**4. Still getting "unrecognized arguments"**
→ **Solution:** Check `FIREBASE_PRIVATE_KEY` format:
   - Should have escaped newlines: `\n` not actual newlines
   - Format: `-----BEGIN PRIVATE KEY-----\nMIIEvgI...\n-----END PRIVATE KEY-----\n`

---

## 🎯 After Successful Deployment

### 1. Get the Chat Coach URL

The `postChat` function will have a public HTTP URL. Find it:

**Via GitHub Actions logs:**
- Scroll to "Deploy postChat" step
- Look for: `Service URL: https://us-central1-wellness-os-app.cloudfunctions.net/postChat`

**Via GCP Console:**
- Go to: https://console.cloud.google.com/functions/list?project=wellness-os-app
- Click on `postChat`
- Copy the "Trigger URL"

### 2. Test the Chat Coach API

**Quick Test (via curl):**
```bash
curl -X POST https://us-central1-wellness-os-app.cloudfunctions.net/postChat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "message": "How can I improve my sleep?",
    "conversationId": "test-conv-001"
  }'
```

**Expected Response:**
```json
{
  "assistantMessage": "To improve sleep, try viewing morning sunlight...",
  "citations": ["Morning Light Exposure Protocol"],
  "conversationId": "test-conv-001"
}
```

### 3. Test in Preview App

1. Open your React Native preview app
2. Tap the "AI" button in the top navigation bar
3. ChatModal should open
4. Type: "How can I improve my sleep?"
5. You should get an AI-generated response with protocol citations! 🎉

---

## 📋 Next Steps After Deployment

### Phase 1: Test Chat Coach (Immediate)
- [x] Functions deployed
- [ ] Test Chat API endpoint
- [ ] Test in preview app
- [ ] Verify citations appear
- [ ] Check Supabase `ai_audit_log` table

### Phase 2: Enable Autonomous Features (Later)

**Create Cloud Scheduler Jobs:**
```bash
# Daily Scheduler (runs at 2 AM PST)
gcloud scheduler jobs create pubsub daily-schedule-trigger \
  --schedule="0 2 * * *" \
  --topic=daily-tick \
  --message-body='{"trigger":"daily"}' \
  --time-zone="America/Los_Angeles" \
  --location=us-central1 \
  --project=wellness-os-app

# Hourly Nudge Engine
gcloud scheduler jobs create pubsub hourly-nudge-trigger \
  --schedule="0 * * * *" \
  --topic=hourly-tick \
  --message-body='{"trigger":"hourly"}' \
  --time-zone="America/Los_Angeles" \
  --location=us-central1 \
  --project=wellness-os-app
```

**Seed Pinecone with Embeddings:**
```bash
cd scripts
cp .env.example .env
# Edit .env with your credentials
gcloud auth application-default login
npm run seed
```

**Create Test User:**
1. Firebase Console → Authentication → Add user
2. Supabase → SQL Editor:
   ```sql
   INSERT INTO users (id, email, display_name) VALUES ('firebase-uid', 'test@example.com', 'Test User');
   INSERT INTO module_enrollment (user_id, module_id) VALUES ('firebase-uid', 'sleep-optimization');
   ```

---

## 🔍 Monitoring & Logs

### View Function Logs:

**Via GCP Console:**
- Go to: https://console.cloud.google.com/functions/list?project=wellness-os-app
- Click on function name
- Click "LOGS" tab

**Via gcloud CLI (if installed):**
```bash
# Chat Coach logs
gcloud functions logs read postChat --region=us-central1 --limit=50

# Daily Scheduler logs
gcloud functions logs read generateDailySchedules --region=us-central1 --limit=50

# Nudge Engine logs
gcloud functions logs read generateAdaptiveNudges --region=us-central1 --limit=50
```

### Check AI Audit Logs:

**In Supabase:**
- Go to: https://supabase.com/dashboard/project/vcrdogdyjljtwgoxpkew
- Table Editor → `ai_audit_log`
- Should show AI decisions with model, prompt, response, reasoning, citations

---

## 📞 Quick Links

- **GitHub Actions:** https://github.com/ferdiebotden-ai/WellnessApp/actions
- **GCP Functions:** https://console.cloud.google.com/functions/list?project=wellness-os-app
- **GCP Pub/Sub:** https://console.cloud.google.com/cloudpubsub/topic/list?project=wellness-os-app
- **Firebase Console:** https://console.firebase.google.com/project/wellness-os-app
- **Supabase Dashboard:** https://supabase.com/dashboard/project/vcrdogdyjljtwgoxpkew
- **Pinecone Console:** https://app.pinecone.io

---

## 💬 Status Update

**Current Status:** Deployment in progress (commit `a4f2ea4`)

**Once deployment succeeds:**
- Chat Coach ready for immediate testing
- Daily Scheduler and Nudge Engine deployed (need schedulers to run)
- All Vertex AI integration active

**You should see results in ~10 minutes!** 🚀

Check the GitHub Actions link above to monitor progress.
