# Pub/Sub Topics Setup Guide
**Date:** November 20, 2025

---

## Option 1: Google Cloud Console (Recommended - No Installation)

### Step 1: Access Pub/Sub in Console
1. Go to: https://console.cloud.google.com/cloudpubsub/topic/list?project=wellness-os-app
2. Make sure you're logged in with your Google account
3. Verify project is "wellness-os-app" (shown at top)

### Step 2: Create `daily-tick` Topic
1. Click **"CREATE TOPIC"** button
2. Fill in:
   - **Topic ID:** `daily-tick`
   - **Encryption:** Google-managed (default)
   - **Message retention:** 7 days (default)
3. Click **"CREATE"**

### Step 3: Create `hourly-tick` Topic
1. Click **"CREATE TOPIC"** button again
2. Fill in:
   - **Topic ID:** `hourly-tick`
   - **Encryption:** Google-managed (default)
   - **Message retention:** 7 days (default)
3. Click **"CREATE"**

### Step 4: Verify
You should see both topics in the list:
- ✅ daily-tick
- ✅ hourly-tick

**Screenshot of what you should see:**
```
Topics (2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name                  Subscriptions
daily-tick            0
hourly-tick           0
```

---

## Option 2: gcloud CLI (If Installed)

### Install gcloud CLI (Windows)
1. Download: https://cloud.google.com/sdk/docs/install#windows
2. Run installer: `GoogleCloudSDKInstaller.exe`
3. Follow prompts (check "Run 'gcloud init'" at end)
4. Restart terminal after installation

### Authenticate
```bash
gcloud auth login
gcloud config set project wellness-os-app
```

### Create Topics
```bash
# Create daily-tick topic
gcloud pubsub topics create daily-tick --project=wellness-os-app

# Create hourly-tick topic
gcloud pubsub topics create hourly-tick --project=wellness-os-app
```

### Verify
```bash
gcloud pubsub topics list --project=wellness-os-app
```

Expected output:
```
name: projects/wellness-os-app/topics/daily-tick
---
name: projects/wellness-os-app/topics/hourly-tick
```

---

## Next Steps After Creating Topics

### 1. Re-trigger GitHub Actions Deployment

The deployment should auto-retry, but you can force it:

**Option A: Via GitHub Web Interface**
1. Go to: https://github.com/ferdiebotden-ai/WellnessApp/actions
2. Click on the latest workflow run
3. Click **"Re-run all jobs"**

**Option B: Push a small change**
```bash
cd "c:\Users\ferdi\OneDrive\Documents\NorBot Wellness Inc\Wellness App - Codebase\WellnessApp"
echo "# Topics created" >> PUBSUB_SETUP.md
git add PUBSUB_SETUP.md
git commit -m "chore: confirm Pub/Sub topics created"
git push
```

### 2. Monitor Deployment
Watch at: https://github.com/ferdiebotden-ai/WellnessApp/actions

**Success indicators:**
- ✅ Deploy generateDailySchedules (should take ~2-3 min)
- ✅ Deploy generateAdaptiveNudges (should take ~2-3 min)
- ✅ Deploy postChat (should take ~2-3 min)

### 3. Verify Functions Deployed

**Via GCP Console:**
Go to: https://console.cloud.google.com/functions/list?project=wellness-os-app

You should see:
- `generateDailySchedules` - Status: ACTIVE - Trigger: Pub/Sub (daily-tick)
- `generateAdaptiveNudges` - Status: ACTIVE - Trigger: Pub/Sub (hourly-tick)
- `postChat` - Status: ACTIVE - Trigger: HTTP

---

## Troubleshooting

### "Permission Denied" when creating topics
→ Make sure you're logged in with an account that has Editor/Owner role on the project

### Topics created but deployment still fails
→ Check GitHub Actions logs for the specific error
→ Verify all GitHub Secrets are set correctly

### Can't find Pub/Sub in Console
→ Direct link: https://console.cloud.google.com/cloudpubsub/topic/list?project=wellness-os-app
→ Or: Console menu (☰) → Pub/Sub → Topics

---

## Verification Checklist

Before deployment:
- [ ] Both Pub/Sub topics created (daily-tick, hourly-tick)
- [ ] GitHub Secrets configured (you said these exist ✅)
- [ ] Code pushed to main branch (commit 5465a0c ✅)

After deployment:
- [ ] All 3 functions show as ACTIVE in GCP Console
- [ ] postChat has HTTP trigger URL
- [ ] No errors in GitHub Actions logs

---

## What Happens Next

Once functions are deployed:

1. **Chat Coach works immediately** (no scheduler needed)
   - HTTP endpoint available
   - Can test right away

2. **Daily Scheduler needs Cloud Scheduler job**
   - Manually trigger for testing
   - Or create scheduler job (separate step)

3. **Nudge Engine needs Cloud Scheduler job**
   - Manually trigger for testing
   - Or create scheduler job (separate step)

See [NEXT_STEPS.md](NEXT_STEPS.md) for testing instructions.
