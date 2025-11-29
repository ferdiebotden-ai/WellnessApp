# Quick Deployment Verification - Run This Now

**Goal:** Verify your deployment includes the latest code changes (3 new backend routes)

---

## ✅ Step 1: Check Cloud Functions Deployment (2 minutes)

**Option A: Via Google Cloud Console**
1. Go to: https://console.cloud.google.com/functions/list?project=wellness-os-app
2. You should see 3 functions:

| Function Name | Trigger | Last Deployed |
|--------------|---------|---------------|
| `api` | HTTPS | Check timestamp |
| `generateDailySchedules` | Pub/Sub: daily-tick | Check timestamp |
| `generateAdaptiveNudges` | Pub/Sub: hourly-tick | Check timestamp |

**Option B: Via Command Line**
```bash
gcloud functions list --region=us-central1 --project=wellness-os-app
```

**❓ QUESTION:** What is the "Last Deployed" date for the `api` function?
- If it's **November 22, 2025 or later** → ✅ Latest code deployed
- If it's **earlier** → ⚠️ Need to redeploy

---

## ✅ Step 2: Verify Latest Code Includes New Routes (1 minute)

**Check if deployed code has the new routes:**

1. Get your API endpoint URL:
```bash
gcloud functions describe api --region=us-central1 --project=wellness-os-app --format="value(serviceConfig.uri)"
```

Should return: `https://us-central1-wellness-os-app.cloudfunctions.net/api`

2. Test new `/modules` endpoint:
```bash
curl -X GET "https://us-central1-wellness-os-app.cloudfunctions.net/api/modules?tier=core" \
  -H "Content-Type: application/json"
```

**Expected result:**
- ✅ If you get JSON with modules (even if empty array) → Route exists
- ❌ If you get 404 or "Cannot GET /modules" → Old code deployed, need to redeploy

---

## ✅ Step 3: Check Database Migrations (2 minutes)

**Verify `headline` column exists in modules table:**

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/vcrdogdyjljtwgoxpkew/sql/new
2. Run this query:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'modules'
ORDER BY ordinal_position;
```

**Expected columns:**
- `id`, `name`, **`headline`**, `description`, `icon_svg`, `tier`, `outcome_metric`, `starter_protocols`, `created_at`, `updated_at`

**❓ QUESTION:** Do you see `headline` in the results?
- ✅ Yes → Migration already run
- ❌ No → Need to run migration (Step 5 below)

---

## ✅ Step 4: Check Module Seeding (2 minutes)

**Verify modules are seeded with headlines:**

Run in Supabase SQL Editor:
```sql
SELECT id, name, headline, tier
FROM public.modules
ORDER BY tier, name;
```

**Expected result:**
- 6 rows returned
- Each row has a `headline` (e.g., "Sleep better, recover faster")

**❓ QUESTION:** How many modules do you see?
- ✅ 6 modules with headlines → Already seeded
- ⚠️ 6 modules but no headlines → Need to re-run seed script
- ❌ 0 modules → Need to run seed script for first time

---

## ✅ Step 5: Check Cloud Scheduler Jobs (1 minute)

**Verify scheduler jobs exist:**

1. Go to: https://console.cloud.google.com/cloudscheduler?project=wellness-os-app
2. You should see 2 jobs:

| Job Name | Frequency | Target | State |
|----------|-----------|--------|-------|
| `daily-schedule-trigger` | 0 6 * * * | Pub/Sub: daily-tick | ENABLED |
| `hourly-nudge-trigger` | 0 * * * * | Pub/Sub: hourly-tick | ENABLED |

**❓ QUESTION:** Do both jobs exist and are ENABLED?
- ✅ Yes → Autonomous features are operational
- ❌ No → Need to create jobs (Step 6 below)

---

## 🔧 REMEDIATION STEPS (If Any ❌ Above)

### If Functions Need Redeployment:

**Option A: Trigger GitHub Actions (Recommended)**
```bash
cd functions
echo "# Redeploy $(date)" >> README.md
git add README.md
git commit -m "chore: trigger redeployment with latest backend routes"
git push
```

Then monitor: https://github.com/ferdiebotden-ai/WellnessApp/actions

**Option B: Manual Deploy**
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

---

### If Database Migration Needed:

1. Go to: https://supabase.com/dashboard/project/vcrdogdyjljtwgoxpkew/sql/new
2. Copy entire contents of: `supabase/migrations/20251122000000_add_headline_to_modules.sql`
3. Paste and click "Run"
4. Verify with Step 3 query above

---

### If Module Seeding Needed:

1. In Supabase SQL Editor
2. Copy entire contents of: `supabase/seed/mission_009_modules_protocols.sql`
3. Paste and click "Run"
4. Verify with Step 4 query above

**Expected output:**
```
INSERT 0 6  (modules)
INSERT 0 18 (protocols)
INSERT 0 29 (module_protocol_map)
```

---

### If Cloud Scheduler Jobs Needed:

Run these commands:

```bash
# Daily Scheduler
gcloud scheduler jobs create pubsub daily-schedule-trigger \
  --schedule="0 6 * * *" \
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

---

## 📊 SUMMARY CHECKLIST

After running all verifications, check these:

- [ ] 3 Cloud Functions deployed (api, generateDailySchedules, generateAdaptiveNudges)
- [ ] API function includes `/modules`, `/onboarding/complete`, `/users/me/monetization` routes
- [ ] Database `modules` table has `headline` column
- [ ] 6 modules seeded with headlines
- [ ] 18 protocols seeded
- [ ] 2 Cloud Scheduler jobs enabled

**When all are checked:** Your MVP is fully deployed with the latest code! ✅

---

## 🎯 WHAT TO DO NOW

**Copy this into a new file and answer each ❓ QUESTION as you go through the checks.**

Then report back:
- Which steps passed ✅
- Which steps failed ❌
- I'll help you fix any failures

**This should take 8-10 minutes total.**
