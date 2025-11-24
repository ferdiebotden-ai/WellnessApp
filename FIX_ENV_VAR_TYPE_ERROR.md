# Fix: Environment Variable Type Mismatch Error

**Error:** `Cannot update environment variable [FIREBASE_PROJECT_ID] to string literal because it has already been set with a different type.`

**Cause:** Previous deployment attempts set environment variables in a different format (likely as secret references), and Google Cloud won't let you change the "type" of an env var.

---

## 🔧 Solution: Delete & Redeploy

We need to delete the existing functions and deploy fresh. Here are two options:

---

## Option 1: Delete Functions via Google Cloud Console (Easiest - 3 minutes)

### Step 1: Go to Cloud Functions
https://console.cloud.google.com/functions/list?project=wellness-os-app

### Step 2: Delete All Existing Functions
For each function you see (if any exist):
1. Click the checkbox next to the function name
2. Click **DELETE** button at the top
3. Confirm deletion

**Delete these if they exist:**
- `api`
- `generateDailySchedules`
- `generateAdaptiveNudges`
- Any other wellness-related functions

### Step 3: Wait for Deletion
Takes about 30 seconds per function.

### Step 4: Re-trigger GitHub Actions
Once all functions are deleted:

**Option A: Re-run workflow**
1. Go to: https://github.com/ferdiebotden-ai/WellnessApp/actions
2. Click on the failed workflow
3. Click **"Re-run all jobs"**

**Option B: Push a small change**
```bash
cd "C:\Users\ferdi\OneDrive\Documents\NorBot Wellness Inc\Wellness App - Codebase\WellnessApp"
echo "# Env vars fixed" >> FIX_ENV_VAR_TYPE_ERROR.md
git add .
git commit -m "fix: redeploy after deleting existing functions"
git push
```

---

## Option 2: Update Workflow to Use Cloud Run Secrets (Better Long-term)

Instead of passing env vars as strings, we can use Google Cloud Secret Manager, which is the recommended approach for production.

### Benefits:
- ✅ No type mismatch issues
- ✅ More secure (secrets encrypted at rest)
- ✅ Easier rotation of credentials
- ✅ Better audit logging

**This requires creating secrets in Google Cloud Secret Manager first.**

Would you like me to update the workflow to use Secret Manager instead?

---

## Option 3: Use --clear-env-vars Flag (Quick Fix)

We can modify the workflow to clear all env vars first, then set new ones.

This is what I'll implement now as the quickest fix.

---

## 🚀 Implementing Option 3: Clear and Reset Env Vars

I'll update the deployment workflow to:
1. Clear existing environment variables
2. Set new ones as needed
3. This avoids the type mismatch issue

Let me update the workflow now...

