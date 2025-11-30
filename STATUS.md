# Apex OS — Project Status

> This file maintains session state for Claude Opus 4.5.
> Claude updates this file at the end of each session.

---

## Current Phase
**Phase 1: Spinal Cord (Infrastructure & Data)** — 75% Complete

---

## Last Session
**Date:** November 30, 2025 (Session 7)
**Accomplished:**
- Diagnosed root cause of null enriched fields: **ID mismatch**
- Old Supabase rows have `proto_*` IDs, new seed data uses `morning_light_exposure` IDs
- Pinecone vectors pointed to old IDs, causing API to fetch wrong rows
- Fixed seed script to delete existing data before upserting (clean slate approach)

**Root Cause (CONFIRMED):**
| Layer | Old IDs | New IDs |
|-------|---------|---------|
| Supabase | `proto_morning_light` | `morning_light_exposure` |
| Pinecone | `proto_morning_light` | (should be new IDs) |

**Fix Applied:**
1. Added `deleteAllPineconeVectors()` function to clear old vectors
2. Added Supabase delete step before protocol upsert
3. Added Pinecone clear step before vector upsert
4. Seed now performs clean slate before seeding

**Files Modified:**
- `scripts/seed-full-system.ts` (added clean slate logic)

---

## Next Session Priority

### Step 1: Commit and Push Changes
The seed script has been updated with clean slate logic. Commit and push to trigger CI.

### Step 2: Trigger Seed Workflow
1. Go to GitHub repo → Actions tab
2. Find "Manual: Seed Database & RAG" workflow
3. Click "Run workflow"
4. Wait for green checkmark

### Step 3: Verify Fix
**Supabase Check:**
```sql
SELECT id, name, description, benefits FROM protocols LIMIT 3;
```
**Expected:** IDs like `morning_light_exposure`, all fields populated

**API Check:**
```bash
curl "https://api-26324650924.us-central1.run.app/api/protocols/search?q=morning light"
```
**Expected:** `description`, `benefits`, `citations` have actual values (not null)

---

## Session History (Last 5)

### Session 7 (November 30, 2025)
- Diagnosed root cause: ID mismatch between old `proto_*` and new `morning_light_exposure` IDs
- Updated seed script with clean slate approach (delete before upsert)
- Added `deleteAllPineconeVectors()` function
- Added Supabase delete step and Pinecone clear step
- Phase 1 progress: 70% → 75%

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
- [x] ~~Apply migration to Supabase~~ (Migration applied, columns exist)
- [x] ~~Clean up old `proto_*` vectors in Pinecone~~ (Seed script now clears before upserting)
- [ ] **Commit seed script fix and re-run seed** ← CURRENT PRIORITY
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

*Last Updated: November 30, 2025 (Session 7)*
