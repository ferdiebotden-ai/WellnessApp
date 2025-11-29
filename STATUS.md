# Apex OS — Project Status

> This file maintains session state for Claude Opus 4.5.
> Claude updates this file at the end of each session.

---

## Current Phase
**Phase 1: Spinal Cord (Infrastructure & Data)** — 0% Complete

---

## Last Session
**Date:** November 29, 2025 (Session 2)
**Accomplished:**
- Major root folder cleanup — archived 35+ outdated files
- Created `archive/` folder with 5 subfolders (debrief-reports, old-prd-versions, deployment-history, legacy-docs, opus-setup)
- Deleted duplicate `Codex Debrief Reports/` folder
- Cleaned `Claude Reference Docs/` — kept only active files (BACKEND_ARCHITECTURE.md, AI_NORTH_STAR_GUIDE.md, Design Files/)
- Updated `.gitignore` to exclude `archive/`
- Root now has 11 clean, active markdown files

**Blockers:**
- None

---

## Next Session Priority
1. Begin Phase 1: Infrastructure & Data implementation per APEX_OS_FINAL_PRD.md
2. Audit Cloud Functions deployment status
3. Verify Supabase migrations and seed protocol library

---

## Session History (Last 5)

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

- [ ] Review and clean up legacy Cloud Functions
- [ ] Verify Supabase migrations are up to date
- [ ] Check Firebase RTDB structure

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
- Firebase Project: wellness-os-app (Gen 2 Functions)
- Supabase Project: vcrdogdyjljtwgoxpkew
- Pinecone Index: wellness-protocols

---

*Last Updated: November 29, 2025*
