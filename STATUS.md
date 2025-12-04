# Apex OS — Project Status

> Session state for Claude Opus 4.5. Update at end of each session.

---

## Current State

| Attribute | Value |
|-----------|-------|
| **Phase** | Phase 3: Nervous System (Real Data Flow) — 🚀 IN PROGRESS |
| **Session** | 41 (next) |
| **Progress** | 27% of Phase 3 (3/11 sessions) |
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

**Date:** December 4, 2025 (Session 40)
**Focus:** Phase 3 Session 3: Recovery Score Engine

**Accomplished:**
- Created RecoveryScoreService with weighted algorithm:
  - HRV (40%), RHR (25%), Sleep Quality (20%), Sleep Duration (10%), Respiratory Rate (5%)
  - Temperature penalty applied when deviation > 0.3°C
- Created BaselineService for 14-day rolling baselines with confidence levels
- Implemented Z-score normalization with log-transformed HRV values
- Weight redistribution when Oura-only metrics (respiratory rate, temp) unavailable
- Edge case detection (alcohol, illness, travel, menstrual cycle)
- 84 comprehensive unit tests covering all scenarios
- Integrated recovery calculation into wearablesSync.ts
- Created RecoveryScoreCard component with zone-colored display and expandable breakdown
- Created useRecoveryScore hook for API integration
- Added data source preference setting (Latest/Apple Health/Oura/WHOOP)
- Dashboard integration in HomeScreen

**Key Technical Decisions:**
- Separate baselines for SDNN (Apple) vs RMSSD (Oura) HRV - cannot compare directly
- Zone mapping: Red (0-33), Yellow (34-66), Green (67-100)
- Confidence levels: low (<7 days), medium (7-14), high (14+)
- Weight redistribution via MutableWeights type to work with const weights
- User-configurable data source preference stored in AsyncStorage

**Commit:**
- `531e9da` — feat(phase3): implement Recovery Score Engine with UI

**Files Created:**
```
functions/src/services/recoveryScore.ts — Core recovery calculation algorithm
functions/src/services/baselineService.ts — 14-day rolling baseline management
functions/src/services/index.ts — Barrel export for services
functions/tests/recoveryScore.test.ts — 84 unit tests
client/src/components/RecoveryScoreCard.tsx — Zone-colored score display
client/src/hooks/useRecoveryScore.ts — API integration hook
client/src/hooks/useDataSourcePreference.ts — Data source preference
```

**Files Modified:**
```
functions/src/wearablesSync.ts — Added calculateAndStoreRecovery integration
client/src/screens/HomeScreen.tsx — RecoveryScoreCard integration
client/src/screens/settings/WearableSettingsScreen.tsx — Data source preference UI
```

---

## Previous Session

**Date:** December 4, 2025 (Session 39)
**Focus:** Phase 3 Session 2: HealthKit Integration + Playwright MCP Setup

**Accomplished:**
- Created native Swift HealthKit module using Expo Modules API (`expo-healthkit-observer`)
- Implemented HealthKitManager.swift with background delivery observers
- Created useHealthKit React hook and WearableSettingsScreen
- Added Playwright MCP for autonomous UI testing

**Commits:**
- `e2341cb` — feat(phase3): implement HealthKit integration with native Swift module
- `bbcf279` — docs(session39): add Playwright MCP, mark HealthKit complete

---

## Next Session Priority

### Phase 3 Session 4: Wake Detection

**Reference:** `PRD Documents/PHASE_III_IMPLEMENTATION_PLAN.md` (Component 4)

**Priority Tasks:**
1. Detect morning wake using sleep end time from HealthKit/Oura
2. Trigger morning nudge generation when wake detected
3. Handle timezone considerations for wake detection
4. Create wake detection API endpoint
5. Connect to nudge engine for Morning Stack generation

**Key Considerations:**
- Use sleep analysis end time as primary wake signal
- Fallback to first activity if no sleep data
- Handle cases where user wakes but doesn't sync immediately

### Prerequisites Before Testing HealthKit
- Build iOS development client: `npx expo prebuild --platform ios`
- Run on physical iOS device (HealthKit not available in simulator)
- Test on device with Apple Watch paired for real HRV data

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

---

## Test Status

```
Client:    45/64 passing (Jest)
Functions: 383 passing (Vitest) — includes 84 recoveryScore + 52 suppression + 93 safety + 51 synthesis + 10 narrative + 50 MVD + 36 whyEngine
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

None currently.

---

## Phase 3 Progress

| Session | Component | Status |
|---------|-----------|--------|
| 1 | Database Migrations + Types | ✅ Complete (5 tables, 3 type files) |
| 2 | HealthKit Integration (iOS) | ✅ Complete (expo-healthkit-observer module + UI) |
| 3 | Recovery Score Engine | ✅ Complete (weighted algorithm, 84 tests, Dashboard UI) |
| 4 | Wake Detection | 🔜 Next |
| 5 | Calendar Integration | 🔲 Pending |
| 6 | Real-time Sync (Firestore) | 🔲 Pending |
| 7 | Reasoning UX (4-panel) | 🔲 Pending |
| 8 | Lite Mode (no-wearable fallback) | 🔲 Pending |
| 9 | Health Connect (Android) | 🔲 Pending |
| 10 | Cloud Wearables (Oura, Garmin) | 🔲 Deferred — See OURA_INTEGRATION_REFERENCE.md |
| 11 | Integration Testing | 🔲 Pending |

**Phase 3 Status: 3/11 sessions complete (27%)**

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

*Last Updated: December 4, 2025 (Session 40 - Recovery Score Engine Complete)*
