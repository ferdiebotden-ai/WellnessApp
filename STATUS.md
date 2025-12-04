# Apex OS — Project Status

> Session state for Claude Opus 4.5. Update at end of each session.

---

## Current State

| Attribute | Value |
|-----------|-------|
| **Phase** | Phase 3: Nervous System (Real Data Flow) — 🚀 IN PROGRESS |
| **Session** | 39 (closing) |
| **Progress** | 18% of Phase 3 (2/11 sessions) |
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

**Date:** December 4, 2025 (Session 39)
**Focus:** Phase 3 Session 2: HealthKit Integration + Playwright MCP Setup

**Accomplished:**
- Created native Swift HealthKit module using Expo Modules API (`expo-healthkit-observer`)
- Implemented HealthKitManager.swift with background delivery observers
- Implemented ExpoHealthKitObserverModule.swift (Expo bridge layer)
- Implemented ExpoHealthKitObserverAppDelegate.swift (app lifecycle hook)
- Created TypeScript types and module exports with full type safety
- Updated wearablesSync.ts with dual-table architecture (archive + daily_metrics)
- Created useHealthKit React hook for clean HealthKit integration
- Created WearableSettingsScreen.tsx with connection status, sync controls, and background toggle
- Updated app.json with HealthKit entitlements and background modes
- All TypeScript compiles successfully, no errors in new HealthKit files
- **Added Playwright MCP for autonomous UI testing** (`claude mcp add playwright`)
- Updated CLAUDE.md with Section 16 (Playwright MCP documentation)
- Updated PHASE_III_IMPLEMENTATION_PLAN.md to mark HealthKit as complete
- Committed Perplexity research papers for future reference

**Key Technical Decisions:**
- Native Swift via Expo Modules API (not JS wrapper) for reliability
- HRV stored as SDNN with `hrv_method:'sdnn'` tag (Apple's format, cannot convert to RMSSD)
- Dual-write to both `wearable_data_archive` and `daily_metrics` tables
- completionHandler() called within 2 seconds to avoid iOS 3-strike backoff
- Requires expo-dev-client (not Expo Go) for native module support
- Playwright MCP installed for future autonomous UI testing workflows

**Commits:**
- `e2341cb` — feat(phase3): implement HealthKit integration with native Swift module
- `bbcf279` — docs(session39): add Playwright MCP, mark HealthKit complete

**Files Created:**
```
modules/expo-healthkit-observer/package.json
modules/expo-healthkit-observer/expo-module.config.json
modules/expo-healthkit-observer/tsconfig.json
modules/expo-healthkit-observer/ios/ExpoHealthKitObserver.podspec
modules/expo-healthkit-observer/ios/HealthKitManager.swift
modules/expo-healthkit-observer/ios/ExpoHealthKitObserverModule.swift
modules/expo-healthkit-observer/ios/ExpoHealthKitObserverAppDelegate.swift
modules/expo-healthkit-observer/src/types.ts
modules/expo-healthkit-observer/src/ExpoHealthKitObserver.ts
modules/expo-healthkit-observer/src/index.ts
client/src/hooks/useHealthKit.ts
client/src/screens/settings/WearableSettingsScreen.tsx
PRD Documents/Perplexity Research Papers/autonomous UI testing for Claude Code Research Report.md
```

**Files Modified:**
```
functions/src/wearablesSync.ts — Dual-table architecture with daily_metrics upsert
client/app.json — HealthKit entitlements and background modes
client/package.json — Added expo-build-properties
CLAUDE.md — Added Section 16 (Playwright MCP)
PRD Documents/PHASE_III_IMPLEMENTATION_PLAN.md — Marked Session 2 complete
```

---

## Previous Session

**Date:** December 4, 2025 (Session 38)
**Focus:** AI Workspace Optimization (Perplexity + Claude Projects)

**Accomplished:**
- Researched Perplexity Space custom instruction best practices
- Enhanced user's Perplexity Space instructions for multi-domain research
- Researched Claude Opus 4.5 prompting best practices (Anthropic docs)
- Reviewed and enhanced Claude Projects co-founder instructions

**Commit:** `92de8d7` — docs: add research retrieval workflow, fix onboarding state update

---

## Next Session Priority

### Phase 3 Session 3: Recovery Score Engine

**Reference:** `PRD Documents/PHASE_III_IMPLEMENTATION_PLAN.md` (Component 3)

**Priority Tasks:**
1. Create RecoveryScoreService with weighted algorithm (HRV, sleep quality, RHR)
2. Handle SDNN HRV data (from HealthKit) vs RMSSD (from Oura)
3. Calculate morning readiness score (0-100)
4. Store scores in `daily_metrics.recovery_score`
5. Surface recovery score in Dashboard UI

**Files to Create:**
- `functions/src/services/recoveryScore.ts`
- `functions/src/services/recoveryScore.test.ts`

**Key Considerations:**
- Must handle both SDNN (Apple) and RMSSD (Oura) HRV methods
- Consider sleep stages (deep, REM) vs total sleep time
- Weight resting heart rate relative to user's baseline

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
Functions: 299 passing (Vitest) — includes 52 suppression + 93 safety + 51 synthesis + 10 narrative + 50 MVD + 36 whyEngine
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
| 3 | Recovery Score Engine | 🔜 Next |
| 4 | Wake Detection | 🔲 Pending |
| 5 | Calendar Integration | 🔲 Pending |
| 6 | Real-time Sync (Firestore) | 🔲 Pending |
| 7 | Reasoning UX (4-panel) | 🔲 Pending |
| 8 | Lite Mode (no-wearable fallback) | 🔲 Pending |
| 9 | Health Connect (Android) | 🔲 Pending |
| 10 | Cloud Wearables (Oura, Garmin) | 🔲 Deferred — See OURA_INTEGRATION_REFERENCE.md |
| 11 | Integration Testing | 🔲 Pending |

**Phase 3 Status: 2/11 sessions complete (18%)**

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

*Last Updated: December 4, 2025 (Session 39 - HealthKit + Playwright MCP Complete)*
