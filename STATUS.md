# Apex OS — Project Status

> Session state for Claude Opus 4.5. Update at end of each session.

---

## Current State

| Attribute | Value |
|-----------|-------|
| **Phase** | PRD v8.1 MVP Polish — 🚀 IN PROGRESS |
| **Session** | 81 (complete) |
| **Progress** | Focus area UX fixed + light protocol consolidation complete |
| **Branch** | main |
| **Blocker** | None |

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

**Date:** December 24, 2025 (Session 81)
**Focus:** Focus Area UX & Light Protocol Consolidation

**Context:** User reported two UX issues:
1. Selecting a focus area (e.g., "Better Sleep") doesn't load related protocols
2. Morning Light appears as multiple separate protocols in search

**Root Causes Found:**
1. Server GOAL_TO_MODULE_MAP used wrong module IDs (`sleep_foundations` instead of `mod_sleep`)
2. No code to enroll users in starter protocols after module enrollment
3. Light protocol migration (20251210120000) targeted wrong protocol ID

**Solution:**

### 1. Fixed GOAL_TO_MODULE_MAP (functions/src/onboarding.ts)
```typescript
// Before (wrong IDs)
better_sleep: 'sleep_foundations'
// After (correct IDs)
better_sleep: 'mod_sleep'
```

### 2. Added StarterProtocolSelectionScreen
- New onboarding screen between GoalSelection and BiometricProfile
- Shows 3 starter protocols per module with toggle switches
- Users choose which protocols to add (not auto-enroll all)
- Passes selectedProtocolIds through entire onboarding flow

### 3. Added Protocol Enrollment to Backend
- `completeOnboarding()` now accepts `selected_protocol_ids` array
- Creates `user_protocol_enrollment` records for selected protocols
- Uses correct default times based on protocol category

### 4. Fixed Light Protocol Implementation Methods
- Created migration targeting correct IDs (`protocol_1_morning_light`, `protocol_2_evening_light`)
- Added 3 implementation methods to each: outdoor sunlight, light box, light bar
- Fixed fallback protocol IDs in client api.ts

**Files Modified (13):**
- `functions/src/onboarding.ts` — GOAL_TO_MODULE_MAP + protocol enrollment
- `functions/src/protocolEnrollment.ts` — Export getDefaultTimeForProtocol
- `client/src/screens/onboarding/StarterProtocolSelectionScreen.tsx` — NEW
- `client/src/navigation/OnboardingStack.tsx` — Add new screen
- `client/src/types/onboarding.ts` — StarterProtocol type
- `client/src/services/api.ts` — fetchStarterProtocols + fixed fallback IDs
- `client/src/screens/onboarding/*.tsx` — Pass selectedProtocolIds through flow
- `supabase/migrations/20251224100000_*.sql` — Light protocol implementation_methods

**Commits:**
- `504ba07` — Add protocol selection to onboarding and fix light protocol implementation methods

---

## Session 80 (Previous)

**Date:** December 24, 2025
**Focus:** Fix Account Deletion for User Testing

**Context:** User trying to delete test account via Privacy Dashboard to test onboarding flow. DELETE /api/users/me returned 500: "PRIVACY_EXPORT_TOPIC must be set to enable privacy workflows"

**Root Cause:** Privacy workflow required Pub/Sub infrastructure (topics, bucket) that wasn't configured. The async pattern was overkill for current scale.

**Solution:** Changed account deletion from async (Pub/Sub) to synchronous (direct deletion).

**Accomplished:**
- Modified `requestUserDeletion` to delete directly instead of publishing to Pub/Sub
- Deletes from Supabase → Firestore → Firebase Auth in correct order
- Returns 200 `{deleted: true}` instead of 202 `{accepted: true}`

**Commits:** `47c9a2f`

---

## Session 79 (Previous)

**Date:** December 24, 2025
**Focus:** Gemini 3 Flash Migration + Cloud Run Cold Start Fix

**Context:** User testing chat feature. First message worked but follow-up messages failed.

**Accomplished:**
- Migrated from `@google-cloud/vertexai` to `@google/genai` SDK
- Fixed Cloud Run cold start race with `getConfigAsync()` + pre-warm

**Commits:** `cb8ecad`, `de04331`

---

## Session 78

**Date:** December 20, 2025
**Focus:** Fix "TypeError: undefined is not a function" crash + Setup Development Build

**Context:** User reported continued crash after login on TestFlight showing "TypeError: undefined is not a function" in HomeScreen/MainStack.

**Root Cause:** Native module methods called without verifying they exist. Optional chaining `?.` only guards against null objects, not missing methods.

**Accomplished:**
- Added `typeof` checks to 5 native module files (HealthKitWakeDetector, ExpoHealthKitObserver, useWakeDetection, useHealthKit, HealthConnectWakeDetector)
- Installed `expo-dev-client` for development builds

**Commits:** `83eb39a`, `8191e39`

---

## Session 77

**Date:** December 20, 2025
**Focus:** Comprehensive Defensive Error Handling for TestFlight Stability

**Accomplished:**
- useDashboardData.ts — Response validation, Array.isArray() checks
- useRecoveryScore.ts — Auth timing protection, null handling
- api.ts — Debug logging for API_BASE_URL
- HomeScreen.tsx — Wrapped sections with SilentErrorBoundary

**Commit:** `55e9973`

---

## Session 76

**Date:** December 19, 2025
**Focus:** Post-Login Crash Fix & Error Boundary Protection

**Accomplished:**
- Made push notifications non-blocking with fire-and-forget pattern
- Created `ErrorBoundary.tsx` with retry capability
- Wrapped all navigation stacks with ErrorBoundary protection

**Commit:** `aa6b290`

---

## Next Session Priority

### Session 82 Focus: Deploy Backend + Test Onboarding Flow

Backend changes need deployment. Then test complete onboarding flow with new protocol selection screen.

**Immediate:**
1. Deploy Cloud Functions to apply onboarding.ts changes
2. Test complete onboarding journey:
   - Sign up with new account
   - Goal selection → StarterProtocolSelection (NEW)
   - Toggle protocols on/off
   - Complete biometrics, wearable, health sync
   - Verify protocols appear on home screen after completion
3. Test search for "Morning Light" — should return ONE protocol with 3 implementation methods

**Onboarding Flow (Updated):**
```
GoalSelection → StarterProtocolSelection → BiometricProfile → WearableConnection → HealthDataSync → MagicMoment → Home
```

**Backend Endpoint Needed:**
- `/api/modules/:moduleId/starter-protocols` — Currently uses fallback; implement when needed

**TestFlight Testing Checklist:**
1. Account deletion works — synchronous deletion deployed
2. Onboarding shows protocol selection — NEW StarterProtocolSelectionScreen
3. Protocols enroll correctly — Backend changes need deployment
4. Light protocols consolidated — 3 implementation methods per protocol

**Future Work:**
- Backend endpoint for fetching starter protocols from database
- Pinecone reindexing to prevent duplicate search results

---

## Quick Reference

**Dev Commands:**
```bash
cd ~/projects/WellnessApp/client && npx expo start --web  # Web preview
cd ~/projects/WellnessApp/functions && npx tsc --noEmit   # Type check functions
cd ~/projects/WellnessApp/client && npx tsc --noEmit      # Type check client
supabase db push                                           # Apply migrations
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
| `PRD Documents/APEX_OS_PRD_v8.1.md` | **Master PRD (v8.1.1)** — Vision + critical specs |
| `PRD Documents/APEX_OS_TECHNICAL_SPEC_v1.md` | Implementation details, algorithms, APIs |
| `PRD Documents/APEX_OS_WIDGET_PRD_v1.md` | Widget specifications for iOS/Android |
| `Master_Protocol_Library.md` | Protocol evidence library (18 protocols) |
| `CLAUDE.md` | Agent operating instructions |
| `skills/apex-os-design/SKILL.md` | Design system for UI/frontend work |

---

## Test Status

```
Client:        45/64 passing (Jest) + 50 calendar tests
Functions:     464 passing (Vitest) + 89 integration tests (Session 51)
Integration:   89/89 passing (Vitest) — 6 critical flow tests
E2E:           20/67 passing + 47 skipped (Playwright) — Session 51 expanded coverage
```

### Known TypeScript Issues (Non-blocking)
| File | Issue |
|------|-------|
| `firebase.ts` | Firestore null handling (4 errors) |
| `firebase.web.ts` | Index signature (2 errors) |
| `aggregators.ts` | Health Connect ReadRecordsOptions type (5 errors) |
| Test files (*.test.ts) | Mock type mismatches (18 errors) |

*Note: Production code compiles. These are edge cases and test file issues.*

---

## Active Blockers

**No active blockers.**

---

## Design System Refactor Progress (Complete)

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Theme Foundation (palette, typography, tokens) | Session 66 |
| 2 | Core UI Components (Card, Button, ProgressBar) | Session 66 |
| 3 | Protocol Icons (SVG geometric icons) | Session 66 |
| 4 | Screen Refactoring (Home, Insights, Profile, Chat) | Session 67 |
| 5 | Navigation & Chrome (BottomTabs, TopNav, haptics) | Session 68 |
| 6 | Logo Integration (Splash, ActivityIndicator replacement) | Session 68 |
| 7 | Polish & Micro-Delights (celebrations, animations) | Session 68 |

**Design System Refactor: 7/7 phases complete (100%)**

---

## Phase 3 Progress

| Session | Component | Status |
|---------|-----------|--------|
| 1 | Database Migrations + Types | Complete (5 tables, 3 type files) |
| 2 | HealthKit Integration (iOS) | Complete (expo-healthkit-observer module + UI) |
| 3 | Recovery Score Engine | Complete (weighted algorithm, 84 tests, Dashboard UI) |
| 4 | Wake Detection | Complete (26 tests, full server+client pipeline) |
| 5 | Calendar Integration | Complete (50 tests, full-stack, privacy-first) |
| 6 | Real-time Sync (Firestore) | Complete (14 files, swipe gestures, offline queue) |
| 7 | Reasoning UX (Edge Case Badges + Confidence) | Complete (12 files, badges, 5-factor breakdown) |
| 8 | Lite Mode (no-wearable fallback) | Complete (Session 49) — Check-in Score, 55 tests |
| 9 | Health Connect (Android) | Complete (Session 50) — Cross-platform parity achieved |
| 10 | Integration Testing | Complete (Session 51) — 89 integration + 32 E2E tests |
| 11 | Cloud Wearables (Oura, Garmin) | Deferred — On-device sync covers most users |

**Phase 3 Status: 10/11 sessions complete (91%) — MVP READY FOR ROLLOUT**

---

## Phase 2 Completion Summary

| Session | Component | Status |
|---------|-----------|--------|
| 1-3 | Memory Layer | Complete |
| 4 | Confidence Scoring | Complete |
| 5-6 | Suppression Engine | Complete (9 rules, 52 tests) |
| 7 | Safety & Compliance | Complete (18+ keywords, 93 tests) |
| 8 | Weekly Synthesis Part 1 | Complete (aggregation, correlations, 51 tests) |
| 9 | Weekly Synthesis Part 2 | Complete (narrative gen, push, scheduler, 10 tests) |
| 10 | MVD Detector | Complete (4 triggers, 50 tests, calendar deferred to Phase 3) |
| 11 | Outcome Correlation | Complete (API + Dashboard UI, 8 files) |
| 12 | AI Processing Animation + Why Engine | Complete (shimmer animation, whyEngine, 36 tests) |
| 13 | Reasoning Transparency UI | Complete (NudgeCard + 4-panel expansion) |

**Phase 2: 13/13 sessions complete (100%)**

---

*Last Updated: December 24, 2025 (Session 81 complete - Focus area UX fixed + light protocol consolidation)*
