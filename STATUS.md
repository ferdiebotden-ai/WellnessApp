# Apex OS — Project Status

> This file maintains session state for Claude Opus 4.5.
> Claude updates this file at the end of each session.

---

## Current Phase
**Phase 1: Spinal Cord (Infrastructure & Data)** — 70% Complete

---

## Last Session
**Date:** November 29, 2025 (Session 6)
**Accomplished:**
- Fixed Vertex AI IAM permission (added `roles/aiplatform.user` to service account)
- Seed script runs successfully in GitHub Actions (18 protocols + embeddings)
- Diagnosed why protocol search still returns null enriched fields

**Root Cause Identified:**
Protocol search returns `description: null`, `benefits: null`, etc. because:
1. Pinecone has OLD vectors with `proto_*` IDs from previous seeding
2. The migration `20251129000000_add_protocol_fields.sql` may not have been applied to Supabase
3. Without the columns existing, Supabase ignores enriched fields during upsert

**Files Created/Modified:**
- `supabase/migrations/20251129000000_add_protocol_fields.sql` (needs commit)
- `scripts/seed-full-system.ts` (updated, needs commit)

---

## Next Session Priority (CRITICAL)

### Step 1: Verify Migration Was Applied
Run in Supabase Dashboard → SQL Editor:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'protocols'
  AND column_name IN ('description', 'benefits', 'constraints', 'citations', 'tier_required', 'is_active');
```
**Expected:** 6 rows. If 0 rows, migration needs to be applied.

### Step 2: Apply Migration (if needed)
Run in SQL Editor:
```sql
ALTER TABLE public.protocols ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.protocols ADD COLUMN IF NOT EXISTS tier_required text CHECK (tier_required IS NULL OR tier_required IN ('core', 'pro', 'elite'));
ALTER TABLE public.protocols ADD COLUMN IF NOT EXISTS benefits text;
ALTER TABLE public.protocols ADD COLUMN IF NOT EXISTS constraints text;
ALTER TABLE public.protocols ADD COLUMN IF NOT EXISTS citations text[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.protocols ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_protocols_is_active ON public.protocols (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_protocols_tier_required ON public.protocols (tier_required);
```

### Step 3: Re-Run Seed Script
Trigger "Manual: Seed Database & RAG" GitHub Action after confirming columns exist.

### Step 4: Verify Fix
```bash
curl "https://api-26324650924.us-central1.run.app/api/protocols/search?q=morning light"
```
Protocols should have filled `description`, `benefits`, `citations` fields.

---

## Session History (Last 5)

### Session 6 (November 29, 2025)
- Fixed Vertex AI IAM permission (added `roles/aiplatform.user`)
- Seed script runs successfully (green checkmark in GitHub Actions)
- Protocol search still returns null enriched fields
- Root cause: Migration likely not applied to Supabase before seed ran
- Phase 1 progress: 65% → 70%

### Session 5 (November 29, 2025)
- GitHub MCP: Switched to Docker approach (more reliable on Windows)
- Discovered protocol search schema mismatch (missing columns)
- Created migration `20251129000000_add_protocol_fields.sql`
- Updated seed script to include all protocol fields
- Phase 1 progress: 50% → 65%

### Session 4 (November 29, 2025)
- Diagnosed GitHub MCP authentication failure
- Root cause: Windows npx requires `cmd /c` wrapper
- Updated mcp.json with proper config (inline env, cmd wrapper)
- Awaiting Claude Code restart to verify fix

### Session 3 (November 29, 2025)
- Fixed root cause: Missing `client/.env` causing mock data display
- Discovered API is Cloud Run (`api-26324650924.us-central1.run.app`) not Cloud Functions
- Created `client/.env` with correct API URL and Firebase config
- Updated GitHub PAT in `mcp.json`
- API verified working: modules, auth, health check all functional
- Phase 1 progress: 0% → 50%

### Session 2 (November 29, 2025)
- Root folder cleanup complete
- Archived: Mission debriefs (23), deployment history (9), legacy docs (10), old PRDs (3), Opus setup files
- Deleted duplicate Codex Debrief Reports folder
- Codebase ready for Phase 1 implementation

---

## Architecture Decisions Log
*Add decisions here as they are made*

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-11-29 | Hybrid DB (Supabase READ / Firebase WRITE) | Real-time updates without polling |
| 2025-11-29 | Opus 4.5 as default model | Best reasoning for architecture decisions |
| 2025-11-29 | Vertex AI for embeddings | Uses `text-embedding-005` (768 dims), integrated with GCP |

---

## Known Issues / Tech Debt
*Track items that need future attention*

- [x] ~~Review and clean up legacy Cloud Functions~~ (Not applicable - using Cloud Run)
- [x] ~~Verify Supabase migrations are up to date~~ (Modules API working)
- [x] ~~Protocol schema mismatch~~ (Migration created: 20251129000000_add_protocol_fields.sql)
- [x] ~~Vertex AI IAM permission denied~~ (Fixed: added roles/aiplatform.user)
- [ ] **Apply migration to Supabase** (manual step via Dashboard) ← CURRENT BLOCKER
- [ ] Re-run seed script after migration applied
- [ ] Clean up old `proto_*` vectors in Pinecone (optional)
- [ ] Configure Cloud Scheduler for daily/hourly jobs
- [ ] Check Firebase RTDB structure
- [ ] Documentation says Cloud Functions URL but actual deployment is Cloud Run

---

## Quick Reference

**Key Commands:**
```bash
# Type check
cd client && npx tsc --noEmit

# Start dev server
cd client && npx expo start

# Run backend locally
cd functions && npm run serve

# Deploy functions
cd functions && npm run deploy

# Test protocol search
curl "https://api-26324650924.us-central1.run.app/api/protocols/search?q=morning light"
```

**Environment:**
- Node: v18+
- Expo SDK: 54
- Firebase Project: wellness-os-app
- Supabase Project: vcrdogdyjljtwgoxpkew
- Pinecone Index: wellness-protocols
- **API URL (Cloud Run):** https://api-26324650924.us-central1.run.app

---

*Last Updated: November 29, 2025 (Session 6)*
