# Delete Existing Functions - Required Step

**Issue:** The `--clear-env-vars` flag isn't working because environment variables are locked at the Cloud Run service level (Cloud Functions Gen 2 uses Cloud Run internally).

**Solution:** Delete existing functions manually, then redeploy fresh.

---

## 🗑️ Delete Functions via Google Cloud Console (3 minutes)

### Step 1: Open Cloud Functions
https://console.cloud.google.com/functions/list?project=wellness-os-app

### Step 2: Delete All Functions

**For each function that exists:**
1. ✅ Click the **checkbox** next to the function name
2. 🗑️ Click **DELETE** button at the top
3. ✅ Confirm deletion

**Delete these (if they exist):**
- `api`
- `generateDailySchedules`
- `generateAdaptiveNudges`
- Any other wellness functions

### Step 3: Wait for Deletion
Each function takes about 30-60 seconds to delete. Wait until all are gone.

---

## 🚀 After Deletion: Re-trigger Deployment

### Option A: Re-run GitHub Actions Workflow
1. Go to: https://github.com/ferdiebotden-ai/WellnessApp/actions
2. Click on the latest failed workflow
3. Click **"Re-run all jobs"**
4. Wait 10-15 minutes for fresh deployment

### Option B: Make a Small Change and Push
```bash
cd "C:\Users\ferdi\OneDrive\Documents\NorBot Wellness Inc\Wellness App - Codebase\WellnessApp"
echo "# Functions deleted, ready for fresh deployment" >> DELETE_FUNCTIONS_FIRST.md
git add DELETE_FUNCTIONS_FIRST.md
git commit -m "chore: functions deleted, ready for fresh deployment"
git push
```

---

## ✅ What Will Happen

**After you delete the functions and re-run:**
- ✅ No existing Cloud Run services with locked env vars
- ✅ Fresh deployment with correct environment variable types
- ✅ Should deploy successfully (except Pub/Sub topics if not created)

---

## 📋 Full Cleanup Checklist

### Delete All Old Resources:
- [ ] Deleted all Cloud Functions in console
- [ ] Waited for deletion to complete (functions list is empty)

### Create Required Topics (If Not Done):
- [ ] Created `daily-tick` Pub/Sub topic
- [ ] Created `hourly-tick` Pub/Sub topic

### Re-trigger Deployment:
- [ ] Re-ran GitHub Actions workflow OR pushed new commit
- [ ] Monitoring deployment progress

---

## ⚠️ Alternative: Clean Cloud Run Services Directly

If functions won't delete, you can also delete the underlying Cloud Run services:

1. Go to: https://console.cloud.google.com/run?project=wellness-os-app
2. Find these services (if they exist):
   - `api`
   - `generatedailyschedules`
   - `generateadaptivenudges`
3. Delete each one
4. Then re-run deployment

---

**DO THIS NOW:** Delete the existing functions in Google Cloud Console, then let me know when it's done so we can re-trigger the deployment!

