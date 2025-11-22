# Next Steps - Action Plan
**Date:** November 20, 2025
**Status:** ✅ Code Fixed & Pushed | ⚠️ Infrastructure Setup Required

---

## What Just Happened

✅ **Committed and Pushed Critical Fixes:**
- Fixed Daily Scheduler data structure ([dailyScheduler.ts](functions/src/dailyScheduler.ts))
- Fixed Nudge Engine data structure ([nudgeEngine.ts](functions/src/nudgeEngine.ts))
- Fixed client path listening ([useTaskFeed.ts](client/src/hooks/useTaskFeed.ts))
- Documentation: [IMPLEMENTATION_REVIEW.md](IMPLEMENTATION_REVIEW.md)

✅ **Deployment Triggered:**
- Commit `5465a0c` pushed to `main` branch
- GitHub Actions workflow should start automatically
- **However**: Deployment will fail without Pub/Sub topics and GitHub Secrets

---

## ⚠️ CRITICAL: Deployment Will Fail Without These

### 1. Pub/Sub Topics Must Exist BEFORE Deployment

The deployment workflow tries to create functions with:
- `--trigger-topic=daily-tick` (for Daily Scheduler)
- `--trigger-topic=hourly-tick` (for Nudge Engine)

**If these topics don't exist, deployment fails!**

### 2. GitHub Secrets Must Be Configured

The workflow needs these secrets (see [.github/workflows/deploy-backend.yml](.github/workflows/deploy-backend.yml)):
- `GCP_SA_KEY` - Google Cloud Service Account JSON key
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

---

## 🎯 Immediate Action Required (You Need to Do This)

### Step 1: Create Pub/Sub Topics (5 minutes)

**MUST DO THIS FIRST** - Open your terminal and run:

```bash
# Authenticate if not already done
gcloud auth login
gcloud config set project wellness-os-app

# Create the two required Pub/Sub topics
gcloud pubsub topics create daily-tick --project=wellness-os-app
gcloud pubsub topics create hourly-tick --project=wellness-os-app

# Verify they were created
gcloud pubsub topics list --project=wellness-os-app
```

**Expected Output:**
```
Created topic [projects/wellness-os-app/topics/daily-tick].
Created topic [projects/wellness-os-app/topics/hourly-tick].

---listed 2 items.---
projects/wellness-os-app/topics/daily-tick
projects/wellness-os-app/topics/hourly-tick
```

### Step 2: Configure GitHub Secrets (10 minutes)

Go to: https://github.com/ferdiebotden-ai/WellnessApp/settings/secrets/actions

Click "New repository secret" and add each of these:

#### Get Firebase Credentials:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract these values:
   - `FIREBASE_PROJECT_ID`: `"project_id"` field
   - `FIREBASE_CLIENT_EMAIL`: `"client_email"` field
   - `FIREBASE_PRIVATE_KEY`: `"private_key"` field (including `-----BEGIN/END PRIVATE KEY-----`)
   - `GCP_SA_KEY`: The entire JSON file contents

#### Get Supabase Credentials:
1. Go to Supabase Dashboard → Project Settings → API
2. Copy:
   - `SUPABASE_URL`: Project URL (https://vcrdogdyjljtwgoxpkew.supabase.co)
   - `SUPABASE_ANON_KEY`: anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role key (secret)
3. Go to Settings → Database → Connection string
   - Look for JWT Secret in the connection info
   - `SUPABASE_JWT_SECRET`: JWT Secret

#### Get Pinecone Credentials:
1. Go to Pinecone Console → API Keys
2. Copy:
   - `PINECONE_API_KEY`: Your API key
   - `PINECONE_INDEX_NAME`: `wellness-protocols`

#### RevenueCat (Optional - can use dummy value):
- `REVENUECAT_WEBHOOK_SECRET`: Get from RevenueCat dashboard or use `dummy-secret-for-dev`

### Step 3: Trigger Deployment Manually (2 minutes)

Once topics and secrets are added:

**Option A: Push a small change**
```bash
# Make a trivial change to trigger workflow
echo "# Updated" >> functions/README.md
git add functions/README.md
git commit -m "chore: trigger deployment after infrastructure setup"
git push
```

**Option B: Re-run the failed workflow**
1. Go to: https://github.com/ferdiebotden-ai/WellnessApp/actions
2. Click on the latest workflow run
3. Click "Re-run all jobs"

### Step 4: Monitor Deployment (5 minutes)

Watch the deployment: https://github.com/ferdiebotden-ai/WellnessApp/actions

**Success looks like:**
```
✅ Deploy generateDailySchedules - Function deployed successfully
✅ Deploy generateAdaptiveNudges - Function deployed successfully
✅ Deploy postChat - Function deployed successfully
```

**Verify in GCP Console:**
```bash
gcloud functions list --region=us-central1 --project=wellness-os-app
```

Expected output:
```
NAME                         STATE    TRIGGER                  REGION
generateDailySchedules       ACTIVE   Pub/Sub: daily-tick     us-central1
generateAdaptiveNudges       ACTIVE   Pub/Sub: hourly-tick    us-central1
postChat                     ACTIVE   HTTP Trigger            us-central1
```

---

## 🚀 Once Deployment Succeeds

### Test Chat Coach Immediately (No scheduler needed!)

1. **Get the postChat URL:**
   ```bash
   gcloud functions describe postChat --region=us-central1 --format="value(serviceConfig.uri)"
   ```
   Should be: `https://us-central1-wellness-os-app.cloudfunctions.net/postChat`

2. **Test with curl:**
   ```bash
   curl -X POST https://us-central1-wellness-os-app.cloudfunctions.net/postChat \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
     -d '{"message": "How can I improve my sleep?", "conversationId": "test-conv-001"}'
   ```

3. **Test in preview app:**
   - Open app
   - Tap "AI" button in top nav
   - Type: "How can I improve my sleep?"
   - Expect: AI response with protocol citations! 🎉

---

## 📋 After Chat Coach Works

### Create Cloud Scheduler Jobs (Enables autonomous features)

```bash
# Daily Scheduler - runs at 2 AM PST
gcloud scheduler jobs create pubsub daily-schedule-trigger \
  --schedule="0 2 * * *" \
  --topic=daily-tick \
  --message-body='{"trigger":"daily"}' \
  --time-zone="America/Los_Angeles" \
  --location=us-central1 \
  --project=wellness-os-app

# Hourly Nudge Engine - runs every hour
gcloud scheduler jobs create pubsub hourly-nudge-trigger \
  --schedule="0 * * * *" \
  --topic=hourly-tick \
  --message-body='{"trigger":"hourly"}' \
  --time-zone="America/Los_Angeles" \
  --location=us-central1 \
  --project=wellness-os-app

# Verify
gcloud scheduler jobs list --location=us-central1 --project=wellness-os-app
```

### Seed Pinecone with Protocol Embeddings

```bash
cd scripts

# Create .env file
cp .env.example .env

# Edit .env with your credentials:
# SUPABASE_URL=https://vcrdogdyjljtwgoxpkew.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# PINECONE_API_KEY=your-pinecone-key
# PINECONE_INDEX_NAME=wellness-protocols

# Authenticate with GCP
gcloud auth application-default login

# Run seed script
npm install
npm run seed
```

**Expected Output:**
```
✅ Protocol 'Morning Light Exposure' embedded (768 dims)
✅ Protocol 'Evening Light Management' embedded (768 dims)
✅ Protocol 'NSDR (Non-Sleep Deep Rest)' embedded (768 dims)
✅ Protocol 'Hydration Protocol' embedded (768 dims)
✅ Protocol 'Deep Work Protocol' embedded (768 dims)
✅ Seeded 5 protocols to Pinecone index 'wellness-protocols'
```

### Create Test User and Enroll in Module

1. **Create user in Firebase Console:**
   - Go to Firebase Console → Authentication
   - Add user → Email/Password
   - Note the UID

2. **Add to Supabase:**
   ```sql
   -- In Supabase SQL Editor
   INSERT INTO users (id, email, display_name, created_at)
   VALUES ('YOUR-FIREBASE-UID', 'test@example.com', 'Test User', NOW());

   -- Enroll in Sleep Optimization module
   INSERT INTO module_enrollment (user_id, module_id, enrolled_at)
   VALUES ('YOUR-FIREBASE-UID', 'sleep-optimization', NOW());
   ```

### Test Daily Scheduler

```bash
# Manual trigger
gcloud scheduler jobs run daily-schedule-trigger \
  --location=us-central1 \
  --project=wellness-os-app

# Check Firestore
# Go to Firebase Console → Firestore
# Look for: schedules/{YOUR-USER-ID}/days/{TODAY-DATE}
# Should see task documents with titles like "Morning Light Exposure"

# Check in app
# Open app → HomeScreen → "Today's Plan" section should show schedules
```

### Test Nudge Engine

```bash
# Manual trigger
gcloud scheduler jobs run hourly-nudge-trigger \
  --location=us-central1 \
  --project=wellness-os-app

# Check Firestore
# Look for: live_nudges/{YOUR-USER-ID}/entries
# Should see nudge documents with AI-generated motivational text

# Check in app
# Nudges should appear in "Today's Plan" with high emphasis
```

---

## 🎯 Success Criteria

### Phase 1: Chat Coach (TODAY)
- [ ] Pub/Sub topics created
- [ ] GitHub Secrets configured
- [ ] Functions deployed successfully
- [ ] Chat UI responds with AI answers
- [ ] Citations appear in responses
- [ ] No errors in Cloud Functions logs

### Phase 2: Autonomous Features (THIS WEEK)
- [ ] Cloud Scheduler jobs created
- [ ] Pinecone seeded with 5+ protocols
- [ ] Test user enrolled in module
- [ ] Daily schedules appear in app
- [ ] Nudges appear in app
- [ ] Audit logs in Supabase show AI reasoning

---

## 🐛 Troubleshooting

### If Deployment Fails: "Topic not found"
→ **You forgot Step 1!** Create Pub/Sub topics first.

### If Deployment Fails: "Secret not found"
→ **You forgot Step 2!** Add all GitHub Secrets.

### If Functions Deploy But Chat Fails: "Pinecone error"
→ Pinecone index empty. Seed it (see "Seed Pinecone" section).

### If Schedules Don't Appear in App
→ Check Firestore: `schedules/{userId}/days/{date}` has documents?
→ Check each document has: `title`, `status`, `scheduled_for` fields
→ Check client is authenticated with correct userId

### If Nudges Don't Appear
→ Same as above, check: `live_nudges/{userId}/entries`

---

## 📊 Monitoring

### Check Cloud Functions Logs:
```bash
# Daily Scheduler
gcloud functions logs read generateDailySchedules --region=us-central1 --limit=50

# Nudge Engine
gcloud functions logs read generateAdaptiveNudges --region=us-central1 --limit=50

# Chat Coach
gcloud functions logs read postChat --region=us-central1 --limit=50
```

### Check Supabase Audit Logs:
```sql
-- In Supabase SQL Editor
SELECT * FROM ai_audit_log
ORDER BY created_at DESC
LIMIT 20;
```

Should show AI decisions with:
- `decision_type`: 'nudge_generated', 'chat_response'
- `model_used`: 'gemini-2.0-flash-001'
- `prompt`, `response`, `reasoning`, `citations`

---

## 📞 Quick Reference

- **GitHub Actions**: https://github.com/ferdiebotden-ai/WellnessApp/actions
- **Firebase Console**: https://console.firebase.google.com/project/wellness-os-app
- **GCP Console**: https://console.cloud.google.com/functions?project=wellness-os-app
- **Supabase**: https://supabase.com/dashboard/project/vcrdogdyjljtwgoxpkew
- **Pinecone**: https://app.pinecone.io

---

## What I (Claude) Can Do Next

Once you complete Steps 1-4 above, I can help you:
- Debug any deployment errors
- Test the API endpoints
- Create more sophisticated test scenarios
- Add more protocols to Pinecone
- Optimize prompt engineering
- Add monitoring/alerting
- Create user documentation

**Just let me know when the deployment succeeds!** 🚀
