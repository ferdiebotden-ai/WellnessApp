# Apex OS — Project Status

> Session state for Claude Opus 4.5. Update at end of each session.

---

## Current State

| Attribute | Value |
|-----------|-------|
| **Phase** | Phase 2: Brain (AI & Reasoning) |
| **Session** | 10 of 13 complete |
| **Progress** | 77% of Phase 2 |
| **Branch** | main |

---

## Development Environment

| Component | Value |
|-----------|-------|
| OS | Ubuntu 24.04 (WSL2) on Windows 11 |
| Node.js | v20.19.6 (via nvm) |
| Project Path | `/home/ferdi/projects/WellnessApp` |
| Expo SDK | 54 |

---

## Last Session

**Date:** December 3, 2025 (Session 27)
**Focus:** Phase II - Session 10: MVD Detector

**Accomplished:**
- Implemented MVD (Minimum Viable Day) Detector — automatic "easy mode" for struggling users
- Created `functions/src/mvd/` module with 7 files (~650 lines):
  - `types.ts` — MVDTrigger, MVDType, MVDState, MVD_CONFIG
  - `mvdProtocols.ts` — Protocol sets per MVD type (full/semi_active/travel)
  - `mvdStateManager.ts` — Firestore CRUD for `user_state/{userId}`
  - `mvdDataFetcher.ts` — Supabase queries (recovery, completion history)
  - `mvdDetector.ts` — Detection logic for 4 triggers
  - `mvdApi.ts` — API handlers for manual activation
  - `index.ts` — Module exports
- Integrated MVD into `nudgeEngine.ts`:
  - Replaced hardcoded `mvdActive = false` with real state fetch
  - Added detection + exit condition checks
  - Type-aware protocol filtering
- Integrated MVD into `dailyScheduler.ts`:
  - Filters protocols based on MVD type during schedule generation
- Created API endpoints:
  - `POST /api/mvd/activate` — "Tough Day" button
  - `GET /api/mvd/status` — Get current MVD state
  - `POST /api/mvd/deactivate` — Manual exit
  - `POST /api/mvd/detect` — Debug endpoint
- 50 unit tests passing in `mvdDetector.test.ts`
- **Deferred:** `heavy_calendar` trigger to Phase 3 (needs Calendar API OAuth)

**Files Created:**
```
functions/src/mvd/types.ts              — Type definitions (~100 lines)
functions/src/mvd/mvdProtocols.ts       — Protocol sets + filtering (~130 lines)
functions/src/mvd/mvdStateManager.ts    — Firestore CRUD (~200 lines)
functions/src/mvd/mvdDataFetcher.ts     — Supabase queries (~180 lines)
functions/src/mvd/mvdDetector.ts        — Detection logic (~220 lines)
functions/src/mvd/mvdApi.ts             — API handlers (~230 lines)
functions/src/mvd/index.ts              — Module exports (~50 lines)
functions/tests/mvdDetector.test.ts     — 50 unit tests (~400 lines)
```

**Files Modified:**
```
functions/src/nudgeEngine.ts            — MVD integration (~40 lines changed)
functions/src/dailyScheduler.ts         — MVD filtering (~15 lines added)
functions/src/api.ts                    — MVD routes (~10 lines added)
PRD Documents/PHASE_II_IMPLEMENTATION_PLAN.md — Marked Component 6 complete
```

**Commit:** `21f994d` — feat(phase2): implement MVD Detector (Session 10)

---

## Previous Session

**Date:** December 3, 2025 (Session 26)
**Focus:** PRD Documentation Update — Onboarding, Widgets, Progress Infrastructure

**Accomplished:**
- Added **Section 2.5: Progress Infrastructure** to main PRD
- Added **Section 2.6: Onboarding Experience** to main PRD
- Renamed Widget PRD and Analytics files
- Updated Widget PRD with gamification/analytics updates

**Commit:** `f7f03b0` — docs: add Progress Infrastructure, Onboarding, and Widget PRD documentation (Session 26)

---

## Previous Session

**Date:** December 3, 2025 (Session 25)
**Focus:** Phase II - Session 9: Weekly Synthesis (Part 2)

**Accomplished:**
- Upgraded Gemini 2.0 Flash → **Gemini 2.5 Flash** (GA since June 2025)
  - Better "thinking" capabilities for narrative generation
  - 54% on SWE-Bench (vs 48.9% for older versions)
  - Drop-in replacement, same API
- Implemented narrative generator with 5-section structure:
  - Win, Watch, Pattern, Trajectory, Experiment
  - ~200 words target (150-250 range)
  - Safety scanning via scanAIOutput()
- Created Expo Push notification system:
  - `user_push_tokens` table in Supabase
  - Backend: `pushService.ts` with Expo Push API
  - Client: `pushNotifications.ts` with token registration
  - API endpoints: POST/DELETE `/api/push-tokens`
- Implemented scheduled function `generateWeeklySyntheses`:
  - Pub/Sub triggered, Sunday 8:45am UTC
  - Timezone-aware delivery using `getUserLocalHour()`
  - Stores synthesis + sends push notification
- 10 unit tests for narrative generation (all passing)
- Updated CLAUDE.md tech stack
- Migrations applied to remote Supabase

**Files Created:**
```
functions/src/synthesis/narrativeGenerator.ts     — AI narrative generation (~280 lines)
functions/src/notifications/pushService.ts        — Expo Push API wrapper (~210 lines)
functions/src/notifications/index.ts              — Module exports (~13 lines)
functions/src/weeklySynthesisScheduler.ts         — Scheduled function (~220 lines)
functions/src/pushTokens.ts                       — Push token API handlers (~125 lines)
client/src/services/pushNotifications.ts          — Client token registration (~210 lines)
functions/tests/narrativeGenerator.test.ts        — 10 unit tests (~240 lines)
supabase/migrations/20251203200000_add_notification_sent_to_syntheses.sql
supabase/migrations/20251203200001_create_user_push_tokens.sql
```

**Commit:** `6b20b34` — feat(phase2): implement Weekly Synthesis Part 2 (Session 9)

---

## Next Session Priority

### Session 11: Reasoning Transparency UI

**Reference:** `PRD Documents/PHASE_II_IMPLEMENTATION_PLAN.md` — Component 7

**Tasks:**
1. Reasoning UI:
   - Modify `client/src/components/NudgeCard.tsx`
   - Create `client/src/components/ReasoningExpansion.tsx`
   - Add "Why?" tap handler with expand animation

2. Panel Sections:
   - Mechanism (physiological explanation)
   - Evidence (citation + DOI link)
   - Your Data (personalized stat)
   - Confidence (level + explanation)

3. Animation:
   - Expand duration: 200ms ease-out
   - Content fade-in: 100ms delay
   - Collapse on outside tap

**Acceptance Criteria:**
- [ ] "Why?" tap expands reasoning panel
- [ ] All 4 sections displayed
- [ ] DOI links open in browser
- [ ] Smooth expand/collapse animation

---

## Quick Reference

**Dev Commands:**
```bash
cd ~/projects/WellnessApp/client && npx expo start --web  # Web preview
cd ~/projects/WellnessApp/functions && npx tsc --noEmit   # Type check functions
cd ~/projects/WellnessApp/client && npx tsc --noEmit      # Type check client
```

**API:** `https://api-26324650924.us-central1.run.app/`
**Supabase:** `vcrdogdyjljtwgoxpkew`
**Firebase:** `wellness-os-app`

**Slash Commands:**
- `/start` — Begin session, read STATUS.md
- `/close` — End session, verify sync, update STATUS.md
- `/status` — Quick status check
- `/verify` — Run quality gates
- `/plan` — Enter planning mode

---

## Test Status

```
Client:    45/64 passing (Jest)
Functions: 263 passing (Vitest) — includes 52 suppression + 93 safety + 51 synthesis + 10 narrative + 50 MVD
E2E:       1 passing (nudge flow)
```

---

## Active Blockers

None currently.

---

## P0/P1 Progress (Phase 2)

| Session | Component | Status |
|---------|-----------|--------|
| 1-3 | Memory Layer | ✅ Complete |
| 4 | Confidence Scoring | ✅ Complete |
| 5-6 | Suppression Engine | ✅ Complete (9 rules, 52 tests) |
| 7 | Safety & Compliance | ✅ Complete (18+ keywords, 93 tests) |
| 8 | Weekly Synthesis Part 1 | ✅ Complete (aggregation, correlations, 51 tests) |
| 9 | Weekly Synthesis Part 2 | ✅ Complete (narrative gen, push, scheduler, 10 tests) |
| 10 | MVD Detector | ✅ Complete (4 triggers, 50 tests, calendar deferred) |

---

*Last Updated: December 3, 2025 (Session 27)*
