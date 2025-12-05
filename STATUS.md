# Apex OS — Project Status

> Session state for Claude Opus 4.5. Update at end of each session.

---

## Current State

| Attribute | Value |
|-----------|-------|
| **Phase** | Phase 3: Nervous System (Real Data Flow) — 🚀 IN PROGRESS |
| **Session** | 43 (next) |
| **Progress** | 36% of Phase 3 (4/11 sessions) |
| **Branch** | main |

---

## Strategic Decision (Session 36)

### HealthKit-First Strategy

**Decision:** Prioritize HealthKit (iOS on-device) over Oura cloud integration.

**Rationale:**
| Factor | Oura | HealthKit |
|--------|------|-----------|
| Cost | $5.99/mo membership required (Gen 3/4) | **Free** |
| Architecture | Cloud OAuth, token management | **On-device**, no OAuth |
| Reliability | Webhooks unreliable (504 errors Dec 2025) | **Background delivery works** |
| Market | Oura Ring users | **Apple Watch (market leader) + Oura via Health** |

**Key Insight:** Oura syncs to Apple Health anyway, so HealthKit gives us Oura data plus all other Apple Health sources.

**Impact:**
- Oura moves from Session 2 → Session 10 (deferred)
- HealthKit becomes Session 2 (next priority)
- See `OURA_INTEGRATION_REFERENCE.md` for preserved Oura research

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

**Date:** December 5, 2025 (Session 42)
**Focus:** Phase 3 Session 4 — Wake Detection System

**Accomplished:**
- Implemented complete Wake Detection pipeline (server + client)
- Created WakeDetector.ts with confidence scoring for HealthKit, phone unlock, and manual sources
- Created WakeEventRepository.ts for database CRUD on wake_events table
- Created MorningAnchorService.ts to trigger morning nudge generation with skip conditions
- Added API routes: POST /api/wake-events, GET /api/wake-events/today
- Wrote 26 comprehensive unit tests (all passing)
- Created client-side HealthKitWakeDetector, PhoneUnlockDetector, WakeEventService
- Created WakeConfirmationOverlay.tsx (animated modal for Lite Mode users)
- Created useWakeDetection.ts hook orchestrating detection based on user config
- Integrated wake detection with HomeScreen.tsx

**UX Decision:**
- Wearable users: Auto-trigger Morning Anchor (high confidence from HealthKit)
- Lite Mode users: Show confirmation overlay ("Good morning! Ready?" with Let's Go/Later)
- Phone unlock confirmation boosts confidence from 0.60 → 0.85

**Key Features:**
- Nap detection (sleep < 3 hours after noon = don't trigger Morning Anchor)
- Edge case handling: too early (<4am), too late (>2pm), already triggered today
- Snooze (10 minutes) and skip-for-today options
- Timezone-aware detection

**Files Created:**
```
functions/src/services/wake/WakeDetector.ts
functions/src/services/wake/WakeEventRepository.ts
functions/src/services/wake/MorningAnchorService.ts
functions/src/services/wake/index.ts
functions/src/wakeEvents.ts
functions/tests/services/wake/WakeDetector.test.ts (26 tests)
client/src/services/wake/HealthKitWakeDetector.ts
client/src/services/wake/PhoneUnlockDetector.ts
client/src/services/wake/WakeEventService.ts
client/src/services/wake/index.ts
client/src/components/WakeConfirmationOverlay.tsx
client/src/hooks/useWakeDetection.ts
```

**Files Modified:**
```
functions/src/api.ts (added wake event routes)
client/src/screens/HomeScreen.tsx (integrated wake detection)
```

---

## Previous Session

**Date:** December 4, 2025 (Session 41)
**Focus:** Fix Playwright Test Issues & Console Warnings

**Accomplished:**
- Created platform-aware shadow utility (`client/src/utils/shadows.ts`)
- Fixed deprecated shadow* props in TopNavigationBar, GoalCard, ModuleCard
- Fixed pointerEvents prop warning in NudgeCard
- Fixed ProfileScreen to use graceful fallback instead of showing error
- Verified all 15 Playwright tests still passing
- Verified console warnings removed on Expo web

**Commit:** `b369de9` — fix: resolve web console warnings and improve ProfileScreen error handling

---

## Next Session Priority

### Phase 3 Session 5: Calendar Integration

**Reference:** `PRD Documents/PHASE_III_IMPLEMENTATION_PLAN.md` (Component 5)

**Priority Tasks:**
1. Integrate with device calendar (Expo Calendar API)
2. Detect meetings, events, and time blocks
3. Use calendar data to adjust nudge timing
4. Avoid nudging during meetings/focused work
5. Surface calendar context in nudge reasoning

**Key Considerations:**
- Request calendar permissions gracefully
- Parse event titles for context (meeting, focus time, etc.)
- Handle recurring events and all-day events
- Timezone handling for travel scenarios

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

## Source of Truth

| Document | Purpose |
|----------|---------|
| `PRD Documents/APEX_OS_PRD_v7.md` | Master PRD (all phases) |
| `PRD Documents/PHASE_II_IMPLEMENTATION_PLAN.md` | Phase 2 implementation guide |
| `PRD Documents/PHASE_III_IMPLEMENTATION_PLAN.md` | Phase 3 implementation guide |
| `Master_Protocol_Library.md` | Protocol evidence library |
| `CLAUDE.md` | Agent operating instructions |
| `UI_UX_TESTING_REPORT.md` | Playwright MCP testing findings (Session 40) |

---

## Test Status

```
Client:    45/64 passing (Jest)
Functions: 409 passing (Vitest) — includes 84 recoveryScore + 52 suppression + 93 safety + 51 synthesis + 10 narrative + 50 MVD + 36 whyEngine + 26 wakeDetector
E2E:       15/35 passing + 20 skipped (Playwright) — Session 34 expanded coverage
```

### Playwright E2E Status
- **Setup:** ✅ Working (Chromium installed, dependencies configured)
- **Test Files:** 12 files, 35 total tests
- **Passing:** 15 tests (auth-flow: 7, main-navigation: 5, forgot-password: 3)
- **Skipped:** 20 tests (native-only features: biometrics, feature flags, monetization, etc.)
- **See:** CLAUDE.md Section 15 for full Playwright documentation

### Test File Summary
| File | Passing | Skipped | Notes |
|------|---------|---------|-------|
| auth-flow.spec.ts | 7 | 0 | All auth form tests |
| main-navigation.spec.ts | 5 | 2 | Authenticated tests need test user |
| forgot-password.spec.ts | 3 | 0 | Password reset UI |
| biometric-setup.spec.ts | 0 | 4 | Native runtime only |
| biometric-auth.spec.ts | 0 | 2 | Native runtime only |
| feature-flags.spec.ts | 0 | 3 | Native runtime only |
| social-toggle.spec.ts | 0 | 3 | Native runtime only |
| paywall-and-trial.spec.ts | 0 | 2 | Native runtime only |
| Others | 0 | 4 | Native runtime only |

---

## Active Blockers

None — Wake Detection system complete.

---

## Phase 3 Progress

| Session | Component | Status |
|---------|-----------|--------|
| 1 | Database Migrations + Types | ✅ Complete (5 tables, 3 type files) |
| 2 | HealthKit Integration (iOS) | ✅ Complete (expo-healthkit-observer module + UI) |
| 3 | Recovery Score Engine | ✅ Complete (weighted algorithm, 84 tests, Dashboard UI) |
| 4 | Wake Detection | ✅ Complete (26 tests, full server+client pipeline) |
| 5 | Calendar Integration | 🔜 Next |
| 6 | Real-time Sync (Firestore) | 🔲 Pending |
| 7 | Reasoning UX (4-panel) | 🔲 Pending |
| 8 | Lite Mode (no-wearable fallback) | 🔲 Pending |
| 9 | Health Connect (Android) | 🔲 Pending |
| 10 | Cloud Wearables (Oura, Garmin) | 🔲 Deferred — See OURA_INTEGRATION_REFERENCE.md |
| 11 | Integration Testing | 🔲 Pending |

**Phase 3 Status: 4/11 sessions complete (36%)**

---

## Phase 2 Completion Summary

| Session | Component | Status |
|---------|-----------|--------|
| 1-3 | Memory Layer | ✅ Complete |
| 4 | Confidence Scoring | ✅ Complete |
| 5-6 | Suppression Engine | ✅ Complete (9 rules, 52 tests) |
| 7 | Safety & Compliance | ✅ Complete (18+ keywords, 93 tests) |
| 8 | Weekly Synthesis Part 1 | ✅ Complete (aggregation, correlations, 51 tests) |
| 9 | Weekly Synthesis Part 2 | ✅ Complete (narrative gen, push, scheduler, 10 tests) |
| 10 | MVD Detector | ✅ Complete (4 triggers, 50 tests, calendar deferred to Phase 3) |
| 11 | Outcome Correlation | ✅ Complete (API + Dashboard UI, 8 files) |
| 12 | AI Processing Animation + Why Engine | ✅ Complete (shimmer animation, whyEngine, 36 tests) |
| 13 | Reasoning Transparency UI | ✅ Complete (NudgeCard + 4-panel expansion) |

**🎉 Phase 2: 13/13 sessions complete (100%)**

---

*Last Updated: December 5, 2025 (Session 42 - Wake Detection System complete)*
