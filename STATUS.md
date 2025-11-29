# Apex OS — Project Status

> This file maintains session state for Claude Opus 4.5.
> Claude updates this file at the end of each session.

---

## Current Phase
**Phase 1: Spinal Cord (Infrastructure & Data)** — 50% Complete

---

## Last Session
**Date:** November 29, 2025 (Session 3)
**Accomplished:**
- **ROOT CAUSE FIXED**: App showing mock data due to missing `client/.env` file
- Discovered backend is deployed as **Cloud Run** (not Cloud Functions):
  - Wrong URL: `https://us-central1-wellness-os-app.cloudfunctions.net/api` (404)
  - Correct URL: `https://api-26324650924.us-central1.run.app` (200 OK)
- Created `client/.env` with correct Cloud Run API URL + Firebase config
- Updated `mcp.json` with new GitHub PAT
- Verified API endpoints:
  - `GET /` → `{"status":"ok","service":"wellness-api"}`
  - `GET /api/modules` → Returns 8 modules from Supabase ✅
  - Auth working correctly ✅
  - Protocol search needs Pinecone setup ⚠️

**Blockers:**
- Protocol search fails (Pinecone may need vector seeding)

---

## Next Session Priority
1. Restart Expo and verify real data loads in app
2. Seed Pinecone vectors for protocol search
3. Test full user flow (auth → onboarding → modules)

---

## Session History (Last 5)

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

### Session 1 (November 29, 2025)
- Claude Code environment setup complete
- CLAUDE.md, STATUS.md, mcp.json configured
- Ready for Phase 1 implementation

---

## Architecture Decisions Log
*Add decisions here as they are made*

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-11-29 | Hybrid DB (Supabase READ / Firebase WRITE) | Real-time updates without polling |
| 2025-11-29 | Opus 4.5 as default model | Best reasoning for architecture decisions |

---

## Known Issues / Tech Debt
*Track items that need future attention*

- [x] ~~Review and clean up legacy Cloud Functions~~ (Not applicable - using Cloud Run)
- [x] ~~Verify Supabase migrations are up to date~~ (Modules API working)
- [ ] Check Firebase RTDB structure
- [ ] Seed Pinecone vectors (protocol search failing)
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
```

**Environment:**
- Node: v18+
- Expo SDK: 54
- Firebase Project: wellness-os-app
- Supabase Project: vcrdogdyjljtwgoxpkew
- Pinecone Index: wellness-protocols
- **API URL (Cloud Run):** https://api-26324650924.us-central1.run.app

---

*Last Updated: November 29, 2025 (Session 3)*
