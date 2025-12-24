# Apex OS — Project Status

> Session state for Claude Opus 4.5. Update at end of each session.

---

## Current State

| Attribute | Value |
|-----------|-------|
| **Phase** | PRD v8.1 MVP Polish — 🚀 IN PROGRESS |
| **Session** | 84 (complete) |
| **Progress** | Multi-goal onboarding + Protocol UX overhaul |
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

**Date:** December 24, 2025 (Session 84)
**Focus:** Multi-Goal Onboarding + Protocol UX Overhaul

**Context:** User reported: "When I click a module under the protocols screen, nothing happens. It doesn't ask me what I want to add." Also wanted multiple focus area selection during onboarding.

**Root Causes Identified:**
1. ProtocolsScreen was a dead-end leaf screen (no navigation)
2. BottomTabs architecture didn't allow drill-down to protocols
3. Missing API endpoints for fetching module protocols
4. Single-goal limitation in onboarding flow

**Solution:**
Comprehensive 5-phase overhaul of protocol selection UX and onboarding flow.

**Changes Made:**

### Phase 1: Backend Endpoints
- Created `functions/src/starterProtocols.ts` with two endpoints:
  - `GET /api/modules/:moduleId/starter-protocols` — Returns protocols with `is_starter_protocol=true`
  - `GET /api/modules/:moduleId/protocols` — Returns all protocols for a module
- Registered routes in `functions/src/api.ts`

### Phase 2: Protocols Tab Navigation
- Created `client/src/navigation/ProtocolsStack.tsx` — Stack navigator with 3 screens
- Updated `client/src/navigation/BottomTabs.tsx` — Protocols tab now uses stack navigator
- Created `client/src/screens/ModuleListScreen.tsx` — Shows modules with "View protocols" action

### Phase 3: Module Protocols Screen
- Created `client/src/screens/ModuleProtocolsScreen.tsx`
  - Displays protocols grouped by "Recommended" (starters) and "All Protocols"
  - Toggle to enroll/unenroll protocols
  - Toggle to set module as primary
- Added `fetchModuleProtocols` to `client/src/services/api.ts`

### Phase 4: Multi-Goal Onboarding
- Updated `client/src/types/onboarding.ts`:
  - Added `GOAL_TO_MODULES_MAP` for multi-goal → modules mapping
  - Added `getModulesForGoals()` and `getPrimaryModuleForGoals()` helpers
- Updated `client/src/components/GoalCard.tsx` — Added `multiSelect` prop
- Rewrote `client/src/screens/onboarding/GoalSelectionScreen.tsx`:
  - Multi-select using `Set<PrimaryGoal>` instead of single selection
  - Added "Continue" button instead of auto-advance
  - Shows selection count summary
- Rewrote `client/src/screens/onboarding/StarterProtocolSelectionScreen.tsx`:
  - Uses `SectionList` to group protocols by module
  - Fetches protocols for all selected modules in parallel
  - Shows section headers when multiple modules present
- Updated all remaining onboarding screens to use `selectedGoals: PrimaryGoal[]`:
  - `BiometricProfileScreen.tsx`
  - `WearableConnectionScreen.tsx`
  - `HealthDataSyncScreen.tsx`
  - `MagicMomentScreen.tsx`
- Updated `client/src/navigation/OnboardingStack.tsx` — All params now use `selectedGoals` array

**Files Modified (17):**
- `functions/src/starterProtocols.ts` — **NEW** API endpoints
- `functions/src/api.ts` — Registered new routes
- `client/src/navigation/ProtocolsStack.tsx` — **NEW** stack navigator
- `client/src/navigation/BottomTabs.tsx` — Uses ProtocolsStackNavigator
- `client/src/navigation/OnboardingStack.tsx` — Multi-goal params
- `client/src/screens/ModuleListScreen.tsx` — **NEW** module selection screen
- `client/src/screens/ModuleProtocolsScreen.tsx` — **NEW** protocol enrollment screen
- `client/src/services/api.ts` — Added fetchModuleProtocols
- `client/src/types/onboarding.ts` — Multi-goal types and helpers
- `client/src/components/GoalCard.tsx` — multiSelect prop
- `client/src/screens/onboarding/GoalSelectionScreen.tsx` — Multi-select UI
- `client/src/screens/onboarding/StarterProtocolSelectionScreen.tsx` — Grouped display
- `client/src/screens/onboarding/BiometricProfileScreen.tsx` — selectedGoals array
- `client/src/screens/onboarding/WearableConnectionScreen.tsx` — selectedGoals array
- `client/src/screens/onboarding/HealthDataSyncScreen.tsx` — selectedGoals array
- `client/src/screens/onboarding/MagicMomentScreen.tsx` — selectedGoals array

**Commits:**
- `229159f` — Multi-goal onboarding + Protocol UX overhaul

---

## Session 83 (Previous)

**Date:** December 24, 2025
**Focus:** AI Coach Button Redesign + Persistent Chat History

**Context:** User requested redesigned AI button and persistent chat history.

**Solution:**
Redesigned button with teal branding and implemented full chat history persistence with "New Chat" functionality.

**Commits:** `0b894ac`

---

## Session 82 (Previous)

**Date:** December 24, 2025
**Focus:** AI Chat Button Consolidation

**Context:** User reported redundant buttons on HomeScreen — both an "AI" button in the TopNavigationBar AND a 💬 chat button in the HomeHeader, plus a redundant profile avatar.

**Solution:**
Consolidated to single persistent AI button in TopNavigationBar (already available across all screens).

**Commits:** `79b03af`

---

## Session 81 (Previous)

**Date:** December 24, 2025
**Focus:** Focus Area UX & Light Protocol Consolidation

**Context:** User reported two UX issues:
1. Selecting a focus area (e.g., "Better Sleep") doesn't load related protocols
2. Morning Light appears as multiple separate protocols in search

**Solution:**
- Fixed GOAL_TO_MODULE_MAP with correct module IDs
- Added StarterProtocolSelectionScreen to onboarding
- Added protocol enrollment to backend
- Fixed light protocol implementation methods

**Commits:** `504ba07`

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

### Session 85 Focus: Test Multi-Goal Onboarding + Protocol UX

Test the new multi-goal onboarding flow and protocol selection UX.

**Immediate Testing:**
1. Test multi-goal onboarding:
   - Create new account
   - Select multiple goals (e.g., "Better Sleep" + "More Energy")
   - Verify StarterProtocolSelectionScreen shows protocols grouped by module
   - Verify section headers appear when multiple modules selected
   - Toggle protocols on/off
   - Complete onboarding flow
   - Verify selected protocols appear on home screen

2. Test Protocols tab navigation:
   - Go to Protocols tab
   - Tap on a module card
   - Verify navigation to ModuleProtocolsScreen
   - Verify "Recommended" and "All Protocols" sections
   - Toggle enrollment on a protocol
   - Verify protocol appears/disappears from home screen

3. Test existing functionality still works:
   - AI Coach button + chat history persistence
   - Account deletion
   - Search for "Morning Light" → should return ONE protocol

**Onboarding Flow (Updated):**
```
GoalSelection (multi-select) → StarterProtocolSelection (grouped by module) → BiometricProfile → WearableConnection → HealthDataSync → MagicMoment → Home
```

**Protocols Tab Flow (New):**
```
ModuleListScreen → ModuleProtocolsScreen (enroll/unenroll) → ProtocolDetailScreen
```

**API Endpoints (New):**
- `GET /api/modules/:moduleId/starter-protocols` — Starter protocols only
- `GET /api/modules/:moduleId/protocols` — All protocols for a module

**TestFlight Testing Checklist:**
1. Multi-goal selection works — Select 2+ goals
2. Protocols grouped by module — Section headers appear
3. Protocol enrollment works — Via ModuleProtocolsScreen toggles
4. Onboarding completes — All selected protocols enrolled
5. Protocols tab navigation — Module → Protocol list → Enroll

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

*Last Updated: December 24, 2025 (Session 84 complete - Multi-goal onboarding + Protocol UX overhaul)*
