# Apex OS — Project Status

> Session state for Claude Opus 4.5. Update at end of each session.

---

## Current State

| Attribute | Value |
|-----------|-------|
| **Phase** | PRD v8.1 MVP Polish — 🚀 IN PROGRESS |
| **Session** | 90 (complete) |
| **Progress** | Protocol Data Fix + AI Coach UX Enhancement |
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

**Date:** December 26, 2025 (Session 90)
**Focus:** Protocol Data Fix + AI Coach UX Enhancement

**Context:** User testing revealed Programs tab showing "No Protocols Available" despite seeded data, and AI Coach suggestion chips needed UX enhancement.

**Problems Fixed:**

### Issue 1: Protocol Data Not Loading
**Root Cause:** Protocol ID mismatch between migration file (`protocol_*` format) and seed file (`proto_*` format). The `module_protocol_map` table referenced `proto_*` IDs that didn't exist in the `protocols` table, causing JOIN queries to return empty results.

**Solution:**
- Created migration `20251227000000_fix_module_protocol_map_ids.sql`
- Deletes orphaned rows referencing non-existent protocols
- Inserts correct mappings using `protocol_*` IDs
- Updates `starter_protocols` arrays in modules table
- Applied migration with `supabase db push`

### Issue 2: Silent API Failures
**Root Cause:** `fetchModuleProtocols` returned empty array on failure instead of throwing, making it impossible for UI to show meaningful error states.

**Solution:**
- Changed `api.ts` to throw on failure with actionable error message
- Added error state + retry UI to `ModuleProtocolsScreen.tsx`
- Error card with icon, message, and "Try Again" button

### Issue 3: AI Coach Preview Questions UX
**Root Cause:** Horizontal chip layout was cramped, questions appeared truncated, and tapping only filled input (required manual send).

**Solution:**
- Created new `SuggestionCard` component with vertical card layout
- Icon + question title + description + arrow chevron
- Auto-sends question immediately on tap
- Full question visible in chat bubble after send
- Removed old horizontal ScrollView chips

**Files Modified (4) + Created (2):**
- `supabase/migrations/20251227000000_fix_module_protocol_map_ids.sql` — NEW: Fix protocol ID mappings
- `client/src/components/chat/SuggestionCard.tsx` — NEW: Vertical suggestion card component
- `client/src/services/api.ts` — Improved error handling
- `client/src/screens/ModuleProtocolsScreen.tsx` — Error UI with retry
- `client/src/components/ChatModal.tsx` — Vertical layout + auto-send

**Commit:** `8e7e200`

---

## Session 89 (Previous)

**Date:** December 26, 2025
**Focus:** Apple Health Settings UX + Module Error Fix

**Solution:**
- Added dedicated health card to ProfileScreen
- Context-specific error messages for simulator/module_missing/device_unsupported

**Commit:** `b88f927`

---

## Session 88 (Previous)

**Date:** December 26, 2025
**Focus:** AI Coach Context Fix + Health Empty State

**Context:** Addresses Issues 3 & 4 from `SESSION_87_FIXES.md`.

**Solution:**
- Moved context banner to `ListHeaderComponent`
- Added floating suggestion chips above input
- Created `HealthEmptyState` component
- Changed `useMockData` default to `false`

**Commit:** `48d0c93`

---

## Session 87 (Previous)

**Date:** December 26, 2025
**Focus:** HomeScreen Redundancy Cleanup + QuickSheet Scroll Fix

**Context:** User testing in Session 86 identified UX issues documented in `SESSION_87_FIXES.md`. This session addresses Issues 1 & 2.

**Solution:**
- Removed TodaysFocusCard (conflicted with MyScheduleSection)
- Renamed "MY SCHEDULE" → "TODAY'S PROTOCOLS"
- Fixed ProtocolQuickSheet scroll constraints

**Commit:** `2f77f2a`

---

## Next Session Priority

### Session 91 Focus: TBD

All issues from `SESSION_87_FIXES.md` have been addressed (Issues 1-5 complete).
Session 90 addressed protocol data issues and AI Coach UX enhancement.

**Potential Focus Areas:**
- User testing and feedback collection on iOS device
- EAS Development Build testing on physical iPhone
- Performance optimization
- Today's Protocols card data validation (verify protocol info displays correctly)

**Known Pre-existing TypeScript Issues (Non-blocking):**
- `ProtocolDetailScreen.tsx:620` — ViewStyle array type
- `firebase.ts` — Firestore null handling
- Test files — Mock type mismatches

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

*Last Updated: December 26, 2025 (Session 90 closed - Protocol data fix + AI Coach UX enhancement)*
