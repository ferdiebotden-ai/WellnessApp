# Apex OS — Project Status

> This file maintains session state for Claude Opus 4.5.
> Claude updates this file at the end of each session.

---

## Development Environment

**Primary Setup:** WSL2 + Ubuntu 24.04 + VS Code Remote
**Migrated:** December 1, 2025

| Component | Version | Location |
|-----------|---------|----------|
| OS | Ubuntu 24.04 (WSL2) | Windows 11 host |
| Node.js | v20.19.6 (via nvm) | WSL |
| npm | 10.9.2 | WSL |
| Editor | VS Code + WSL Remote | Windows → WSL |
| Project Path | `/home/ferdi/projects/WellnessApp` | WSL filesystem |

**Installed CLIs:**
- Claude Code CLI (`claude --version`)
- Firebase CLI (`firebase --version`)
- Supabase CLI (`supabase --version`)
- Google Cloud SDK (`gcloud --version`)
- GitHub CLI (`gh --version`)

**Quick Start:**
```bash
# Open project in VS Code (from WSL terminal)
cd ~/projects/WellnessApp && code .

# Or use the desktop shortcut: "WellnessApp (WSL)"
```

---

## Current Phase
**Phase 1: Spinal Cord (Infrastructure & Data)** — 100% Complete ✅
**Phase 2: Brain (AI & Reasoning)** — Ready to Start 🚀

---

## Last Session
**Date:** December 2, 2025 (Session 14)
**Accomplished:**
- ✅ Set up web browser preview (simplest dev workflow)
- ✅ Installed web dependencies: `react-dom`, `react-native-web`
- ✅ Created ADB shim at `~/android-sdk/platform-tools/adb` for WSL→Windows bridge
- ✅ Configured ANDROID_HOME in `.bashrc` pointing to shim directory
- ✅ Successfully launched Android emulator with Expo Go auto-install
- ✅ Verified web preview working at http://localhost:8081
- ✅ Updated CLAUDE.md Section 13 with preview environment documentation

**App Preview Setup (Complete):**
| Method | Command | Status |
|--------|---------|--------|
| Web Browser | `npx expo start --web` | ✅ Ready (http://localhost:8081) |
| Android Emulator | `npx expo start --android` | ✅ Ready (Expo Go installed) |
| iOS Device | `npx expo start` + Expo Go | ✅ Ready (scan QR) |

**Environment Configuration:**
| Component | Location | Status |
|-----------|----------|--------|
| Web deps | `client/package.json` | Installed |
| ADB shim | `~/android-sdk/platform-tools/adb` | Created |
| ANDROID_HOME | `~/android-sdk` (in .bashrc) | Set |
| Expo Go | Android emulator | Installed |

---

## Previous Session
**Date:** December 2, 2025 (Session 13)
**Accomplished:**
- ✅ Researched mobile emulator options for WSL2 + VS Code development
- ✅ Determined Android emulator runs on Windows, bridges to WSL via ADB
- ✅ Created Android development scripts: `scripts/android-bridge.sh`, `scripts/start-android.sh`, `scripts/check-android-setup.sh`
- ✅ Added npm scripts: `npm run start:android`, `npm run android:check`, `npm run start:web`
- ✅ User installed Android Studio on Windows with Pixel 9 AVD (API 36.1)
- ✅ Configured WSL2 mirrored networking for ADB bridge
- ✅ Analyzed iOS vs Android parity (95% identical for UI, wearables differ)

---

## Previous Session
**Date:** December 2, 2025 (Session 12)
**Accomplished:**
- ✅ Created definitive standalone PRD: `APEX_OS_PRD_FINAL_v6.md` (~8,500 words)
- ✅ Created Phase II Implementation Plan: `PHASE_II_IMPLEMENTATION_PLAN.md`
- ✅ Conducted comprehensive competitive research (Dec 2025 landscape)
- ✅ Researched market data ($11.27B → $33.78B, 14.9% CAGR)
- ✅ Researched AI-optimized PRD best practices (OpenAI template)
- ✅ Documented all 5 Core Experiences with acceptance criteria
- ✅ Defined 9 Phase 2 components with P0/P1/P2 prioritization
- ✅ Created 13-session implementation roadmap

**Documents Created:**
- `PRD Refinement/APEX_OS_PRD_FINAL_v6.md` — Definitive standalone PRD
- `PRD Refinement/PHASE_II_IMPLEMENTATION_PLAN.md` — 9-component implementation guide

---

## Previous Session
**Date:** December 1, 2025 (Session 11)
**Accomplished:**
- ✅ **PHASE 1 COMPLETE**: End-to-end nudge generation pipeline verified working
- ✅ Created E2E test script (`scripts/test-e2e-nudge-flow.ts`)
- ✅ Found existing user (ferdie.botden@gmail.com) in Firebase, created Supabase profile
- ✅ Fixed `module_enrollment` FK constraint (was pointing to `auth.users`, now `public.users`)
- ✅ Fixed Cloud Functions missing env vars (`SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`, `PINECONE_API_KEY`)
- ✅ Verified nudges appear in Firestore with correct structure

---

## Session Before That
**Date:** December 1, 2025 (Session 10)
**Accomplished:**
- ✅ Complete testing infrastructure overhaul for Expo SDK 54 + React 19
- ✅ Added comprehensive native module mocks to `client/src/setupTests.ts`
- ✅ Fixed Jest configuration with proper module mappings
- ✅ Configured Playwright E2E with webServer auto-start
- ✅ Committed and pushed: `12955f5`

---

## Session Before That
**Date:** December 1, 2025 (Session 9)
**Accomplished:**
- ✅ Installed GitHub MCP server for PR/issue management and auto-sync
- ✅ Enabled Expo New Architecture (`newArchEnabled: true` in app.json)
- ✅ Updated CLAUDE.md with Section 11 (MCP Servers) and auto-sync workflow
- ✅ Added critical rules 7 & 8 for git sync discipline
- ✅ Installed `example-skills` plugin (frontend-design, webapp-testing, etc.)
- ✅ Configured gcloud CLI with service account for GCP access

---

## Session Before That
**Date:** November 30, 2025 (Session 8)
**Accomplished:**
- ✅ Installed Google Cloud CLI on local machine for direct GCP management
- ✅ Verified Cloud Scheduler jobs are ENABLED and running (via screenshot + gcloud)
- ✅ Fixed missing environment variables on Cloud Functions (SUPABASE_ANON_KEY, JWT_SECRET, PINECONE_API_KEY)
- ✅ Created missing `module_enrollment` table migration
- ✅ Verified scheduler functions execute without errors
- ✅ Corrected documentation: Using **Firestore** (not Firebase RTDB)

**Issues Found & Fixed:**
| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Scheduler functions failing | Missing env vars (SUPABASE_ANON_KEY, etc.) | Added via `gcloud run services update` |
| Schema cache error | `module_enrollment` table didn't exist | Created migration `20251130000000_create_module_enrollment.sql` |
| Functions not finding new table | Supabase schema cache | Restarted Cloud Run services |

**Cloud Scheduler Status (Verified):**
| Job Name | State | Last Run | Result |
|----------|-------|----------|--------|
| daily-scheduler | ENABLED | Nov 30, 12:00 AM | ✅ Success |
| hourly-nudge-engine | ENABLED | Nov 30, 6:40 PM | ✅ Success |

**Files Created:**
- `supabase/migrations/20251130000000_create_module_enrollment.sql`

---

## Next Session Priority

### Phase 2: Brain (AI & Reasoning) — Begin Implementation
**Reference Documents:**
- `PRD Refinement/APEX_OS_PRD_FINAL_v6.md` — Master PRD (canonical)
- `PRD Refinement/PHASE_II_IMPLEMENTATION_PLAN.md` — Implementation guide

### P0 Components (Sessions 1-6)
1. **Memory Layer** — Store/retrieve user learnings
   - Create: `functions/src/memory/userMemory.ts`
   - 6 memory types, decay logic, max 150 per user

2. **Confidence Scoring** — Score AI recommendations
   - Create: `functions/src/reasoning/confidenceScorer.ts`
   - 5 scoring factors, threshold filtering

3. **Suppression Engine** — 9-rule intelligent suppression
   - Create: `functions/src/suppression/suppressionEngine.ts`
   - Max 5 nudges/day, priority overrides

4. **Safety & Compliance** — Crisis detection, GDPR endpoints
   - Create: `functions/src/safety/crisisDetection.ts`
   - Create: `functions/src/compliance/dataPrivacy.ts`

### Current Test Status
```
Client:    45/64 passing (Jest)
Functions: 7 passing (Vitest)
Backend:   3 passing (Jest)
E2E:       ✅ 1 passing (nudge flow)
```

### Quick Verification Commands
```bash
# Test API endpoints
curl "https://api-26324650924.us-central1.run.app/"
curl "https://api-26324650924.us-central1.run.app/api/modules"
curl "https://api-26324650924.us-central1.run.app/api/protocols/search?q=sleep"

# Trigger scheduler jobs manually (requires gcloud CLI)
gcloud scheduler jobs run hourly-nudge-engine --location=us-central1 --project=wellness-os-app
gcloud scheduler jobs run daily-scheduler --location=us-central1 --project=wellness-os-app

# Check function logs
gcloud functions logs read generateAdaptiveNudges --project=wellness-os-app --limit=20
```

---

## Session History (Last 5)

### Session 9 (December 1, 2025)
- Installed GitHub MCP server for PR/issue management
- Enabled Expo New Architecture in app.json
- Updated CLAUDE.md with MCP Servers section (11) and Google Cloud Access (12)
- Configured gcloud CLI with service account authentication
- Added IAM roles: cloudscheduler.viewer, logging.viewer
- Updated README.md and EXPO_SETUP.md for Claude Code workflow
- Installed example-skills plugin (pending restart)
- Phase 1 progress: 95% (unchanged)

### Session 8 (November 30, 2025)
- Installed Google Cloud CLI for direct GCP management
- Verified Cloud Scheduler: Both jobs ENABLED and running successfully
- Fixed Cloud Functions: Added missing env vars (SUPABASE_ANON_KEY, JWT_SECRET, PINECONE_API_KEY, REVENUECAT_WEBHOOK_SECRET)
- Created `module_enrollment` table (was completely missing from database)
- Restarted Cloud Run services to refresh Supabase schema cache
- **VERIFIED:** Scheduler functions now execute without errors
- Clarified architecture: Using Firestore for real-time data, not Firebase RTDB
- Phase 1 progress: 80% → 95%

### Session 7 (November 30, 2025)
- Diagnosed root cause: ID mismatch between old `proto_*` and new `morning_light_exposure` IDs
- Updated seed script with clean slate approach (delete before upsert)
- Added `deleteAllPineconeVectors()` function
- Added Supabase delete step and Pinecone clear step
- **VERIFIED:** Protocol search now returns full data (description, benefits, citations)
- Phase 1 progress: 70% → 80%

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
- [x] ~~Commit seed script fix and re-run seed~~ (VERIFIED WORKING - protocols return full data)
- [x] ~~Verify Cloud Scheduler jobs~~ (Session 8: Both jobs ENABLED and running)
- [x] ~~Check Firebase RTDB structure~~ (Session 8: Using Firestore, not RTDB)
- [x] ~~Missing Cloud Function env vars~~ (Session 8: Added SUPABASE_ANON_KEY, JWT_SECRET, PINECONE_API_KEY)
- [x] ~~Missing module_enrollment table~~ (Session 8: Created migration 20251130000000)
- [ ] Add Firestore security rules (HIPAA compliance)
- [x] ~~Test end-to-end nudge generation with enrolled user~~ (Session 11: Verified working!)
- [x] ~~Fix module_enrollment FK constraint~~ (Session 11: Now references public.users)
- [x] ~~Fix Cloud Functions env vars~~ (Session 11: Added missing SUPABASE_ANON_KEY, etc.)
- [ ] Update VERIFY_NOW.md with correct Cloud Run URLs
- [ ] Consider moving scheduler config to Terraform (IaC best practice)
- [ ] Fix ai_audit_log schema (missing created_at column)

---

## Quick Reference

**Key Commands (run from WSL terminal):**
```bash
# Navigate to project
cd ~/projects/WellnessApp

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

# Open in VS Code
code .
```

**Cloud Environment:**
- Firebase Project: wellness-os-app
- Supabase Project: vcrdogdyjljtwgoxpkew
- Pinecone Index: wellness-protocols
- **API URL (Cloud Run):** https://api-26324650924.us-central1.run.app

**Local Environment (WSL2):**
- Node: v20.19.6 (via nvm)
- Expo SDK: 54
- Project: `/home/ferdi/projects/WellnessApp`

---

*Last Updated: December 1, 2025 (Session 11 - Phase 1 Complete: E2E Nudge Flow Verified)*
