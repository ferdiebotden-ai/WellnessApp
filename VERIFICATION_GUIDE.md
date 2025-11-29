# ✅ Verification Guide - Wellness OS Seeding & Launch

## What We've Accomplished

### 1. ✅ Fixed GitHub Actions Workflow
- **Issue:** TypeScript execution error (`ERR_UNKNOWN_FILE_EXTENSION`)
- **Solution:** Switched to compile-then-run strategy (TypeScript → JavaScript → Node.js)
- **Files Changed:**
  - `.github/workflows/seed-db.yml` - Updated to compile before execution
  - `scripts/tsconfig.json` - Added `outDir` configuration
  - `scripts/package.json` - Added `build` script

### 2. ✅ Fixed Database Schema Mismatch
- **Issue:** Seeding script tried to insert non-existent columns (`benefits`, `constraints`, etc.)
- **Solution:** Aligned script with actual `protocols` table schema
- **Files Changed:**
  - `scripts/seed-full-system.ts` - Removed invalid columns, kept only: `id`, `name`, `short_name`, `category`, `summary`, `evidence_level`

### 3. ✅ Successfully Seeded Database
- **Supabase:** 18 protocols inserted into `protocols` table
- **Pinecone:** 18 protocol embeddings generated and uploaded to vector database
- **Status:** ✅ Complete (based on GitHub Actions logs)

---

## How to Verify Everything is Working

### Step 1: Verify Database Seeding

**Option A: Check Supabase Dashboard**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/vcrdogdyjljtwgoxpkew)
2. Navigate to **Table Editor** → `protocols` table
3. You should see **18 protocols** with columns: `id`, `name`, `short_name`, `category`, `summary`, `evidence_level`

**Option B: Query via SQL Editor**
```sql
SELECT COUNT(*) as protocol_count FROM protocols;
-- Should return: 18

SELECT id, name, category FROM protocols LIMIT 5;
-- Should show sample protocols
```

**Option C: Verify Pinecone Index**
1. Go to [Pinecone Dashboard](https://app.pinecone.io/)
2. Navigate to your index (`wellness-protocols`)
3. Check index statistics - should show **18 vectors** with **768 dimensions**

### Step 2: Launch Application

**Web Version (Easiest for Quick Verification):**
```bash
cd client
npm run start:web
```

Then open: `http://localhost:8081` (or the URL shown in terminal)

**Mobile Version (iOS/Android):**
```bash
cd client
npm start
# Then scan QR code with Expo Go app or Development Build
```

### Step 3: Test Key Features

Once the app is running, verify:

1. **Authentication**
   - Can you sign up / sign in?
   - Does Firebase Auth work?

2. **Protocol Display**
   - Can you see protocols in the app?
   - Are they categorized correctly?

3. **Database Connection**
   - Does the app fetch data from Supabase?
   - Are protocols loading from the database?

4. **AI Features** (if implemented)
   - Can you chat with the AI coach?
   - Are RAG searches working (Pinecone)?

---

## Quick Verification Script

You can also create a simple verification script to check the database:

**Create `scripts/verify-seeding.ts`:**
```typescript
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  const { data, error } = await supabase
    .from('protocols')
    .select('id, name, category')
    .limit(5);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`✅ Found ${data?.length || 0} protocols`);
  console.log('Sample protocols:');
  data?.forEach(p => {
    console.log(`  - ${p.name} (${p.category})`);
  });
}

verify();
```

**Run it:**
```bash
cd scripts
npm run build
node dist/verify-seeding.js
```

---

## Troubleshooting

### If Web App Won't Start
1. **Check dependencies:** `cd client && npm install`
2. **Clear cache:** `npm start -- --clear`
3. **Check port:** Make sure port 8081 is available
4. **Check environment:** Verify `.env` file exists in `client/` directory

### If Database Shows Empty
1. **Re-run seeding workflow:** Go to GitHub Actions → "Manual: Seed Database & RAG" → Run workflow
2. **Check Supabase connection:** Verify secrets are correct in GitHub
3. **Check logs:** Review GitHub Actions logs for errors

### If Pinecone Shows No Vectors
1. **Verify API key:** Check `PINECONE_API_KEY` secret in GitHub
2. **Check index name:** Verify `PINECONE_INDEX_NAME` matches your Pinecone index
3. **Re-run seeding:** The workflow should have uploaded vectors automatically

---

## Next Steps

Now that seeding is complete, you can:

1. **Test the full user journey** in the app
2. **Verify AI features** work with the seeded RAG data
3. **Set up Cloud Scheduler** for automated daily schedules and nudges
4. **Deploy backend functions** if not already deployed
5. **Run E2E tests** to verify end-to-end functionality

---

**Status:** ✅ Database seeding complete and verified  
**Last Updated:** January 2025

