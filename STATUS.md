# Apex OS — Project Status

> Session state for Claude Opus 4.5. Update at end of each session.

---

## Current State

| Attribute | Value |
|-----------|-------|
| **Phase** | Phase 3: Nervous System (Real Data Flow) — 🚀 IN PROGRESS |
| **Session** | 50 (next) |
| **Progress** | 73% of Phase 3 (8/11 sessions) |
| **Branch** | main |
| **Blocker** | ✅ None |

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

**Date:** December 5, 2025 (Session 49)
**Focus:** Lite Mode (No-Wearable Fallback)

**Problem:**
Users without wearables couldn't use the app meaningfully. The `/api/recovery` endpoint didn't exist, blocking both wearable and lite mode users.

**Accomplished:**
- ✅ Created Check-in Score algorithm (3-component weighted score)
- ✅ Implemented GET `/api/recovery` endpoint (handles both wearable and Lite Mode)
- ✅ Implemented POST/GET `/api/manual-check-in` endpoints
- ✅ Built wake-triggered check-in UX (3-question flow in WakeConfirmationOverlay)
- ✅ Created LiteModeScoreCard component with zone badges and expandable reasoning
- ✅ Updated HomeScreen with conditional rendering (RecoveryScoreCard vs LiteModeScoreCard)
- ✅ Updated useRecoveryScore hook to return `isLiteMode` and `checkInData`
- ✅ Deployed backend to Cloud Run (revision `api-00146-tk4`)
- ✅ Wrote 55 unit tests for checkInScore.ts (all passing)

**Architecture Decisions:**
- "Check-in Score" branding (distinct from wearable "Recovery Score")
- Max confidence: 0.60 for manual inputs (vs 0.90 for wearables)
- 3 inputs only: Sleep Quality (1-5), Sleep Hours (categorical), Energy Level (1-5)
- Formula: Score = (SleepQuality × 0.40) + (SleepDuration × 0.35) + (Energy × 0.25)
- Wake-triggered UX — check-in surfaces at natural wake moment

**Files Created (7):**
- `functions/src/types/checkIn.types.ts` — Server-side type definitions
- `functions/src/services/checkInScore.ts` — Score calculation algorithm
- `functions/src/recovery.ts` — GET /api/recovery endpoint
- `functions/src/manualCheckIn.ts` — POST/GET manual check-in endpoints
- `functions/tests/checkInScore.test.ts` — 55 unit tests
- `client/src/types/checkIn.ts` — Client-side type definitions
- `client/src/components/LiteModeScoreCard.tsx` — Score card UI for Lite Mode
- `client/src/components/CheckInQuestionnaire.tsx` — 3-question check-in flow

**Files Modified (4):**
- `functions/src/api.ts` — Added recovery and check-in routes
- `client/src/hooks/useRecoveryScore.ts` — Added Lite Mode detection and data handling
- `client/src/screens/HomeScreen.tsx` — Conditional rendering for score cards
- `client/src/components/WakeConfirmationOverlay.tsx` — Integrated questionnaire flow

**Result:** Lite Mode fully operational. Users without wearables can complete a morning check-in and receive personalized guidance.

---

## Previous Session

**Date:** December 5, 2025 (Session 48)
**Focus:** Fix `is_primary` Column Blocker

**Problem:**
Onboarding endpoint returned 500 error because `is_primary: true` was being inserted but column didn't exist in `module_enrollment` table.

**Accomplished:**
- Created migration `20251205200000_add_is_primary_to_enrollment.sql`
- Applied migration to Supabase with `supabase db push`
- Deployed backend to Cloud Run (revision `api-00143-q2w`)

**Result:** Blocker resolved. Onboarding completes successfully.

---

## Next Session Priority

### Phase 3 Session 9: Health Connect (Android)

**Focus:** Enable Android health data integration via Health Connect.

**Scope:**
- Research Health Connect APIs (permissions, data types, background sync)
- Implement health data sync module for Android
- Map Health Connect data types to our daily_metrics schema
- Test data flow from Android wearables (Samsung, Fitbit, Garmin)

**Key Files to Review:**
- `client/src/modules/expo-healthkit-observer/` — Reference iOS implementation
- `functions/src/wearablesSync.ts` — Backend data processing
- `PRD Documents/Perplexity Research Papers/` — May need fresh research

**Expected Output:**
- Health Connect integration module for Android
- Parity with iOS HealthKit functionality
- Cross-platform daily metrics sync

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
Client:    45/64 passing (Jest) + 50 new calendar tests
Functions: 464 passing (Vitest) — includes 84 recoveryScore + 55 checkInScore + 52 suppression + 93 safety + 51 synthesis + 10 narrative + 50 MVD + 36 whyEngine + 26 wakeDetector
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

✅ **No active blockers.**

---

## Phase 3 Progress

| Session | Component | Status |
|---------|-----------|--------|
| 1 | Database Migrations + Types | ✅ Complete (5 tables, 3 type files) |
| 2 | HealthKit Integration (iOS) | ✅ Complete (expo-healthkit-observer module + UI) |
| 3 | Recovery Score Engine | ✅ Complete (weighted algorithm, 84 tests, Dashboard UI) |
| 4 | Wake Detection | ✅ Complete (26 tests, full server+client pipeline) |
| 5 | Calendar Integration | ✅ Complete (50 tests, full-stack, privacy-first) |
| 6 | Real-time Sync (Firestore) | ✅ Complete (14 files, swipe gestures, offline queue) |
| 7 | Reasoning UX (Edge Case Badges + Confidence) | ✅ Complete (12 files, badges, 5-factor breakdown) |
| 8 | Lite Mode (no-wearable fallback) | ✅ Complete (Session 49) — Check-in Score, 55 tests |
| 9 | Health Connect (Android) | 🔜 Next |
| 10 | Cloud Wearables (Oura, Garmin) | 🔲 Deferred — See OURA_INTEGRATION_REFERENCE.md |
| 11 | Integration Testing | 🔲 Pending |

**Phase 3 Status: 8/11 sessions complete (73%)**

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

*Last Updated: December 5, 2025 (Session 49 - Lite Mode complete)*
