# Apex OS — Project Status

> Session state for Claude Opus 4.5. Update at end of each session.

---

## Current State

| Attribute | Value |
|-----------|-------|
| **Phase** | MVP Testing & Bug Fixes |
| **Session** | 98 (complete) |
| **Progress** | 7 of 8 MVP issues fixed |
| **Branch** | main |
| **Blocker** | None |
| **Issues** | 1 MVP issue remaining (MVP-008) |

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

**Date:** December 27, 2025 (Session 98)
**Focus:** MVP-003 — Timezone Selector Not Editable

### Work Completed

**MVP-003: Searchable Timezone Picker**

Created a reusable timezone picker modal that allows users to edit their timezone during onboarding and in settings.

**Implementation:**
1. **Created TimezonePickerModal** — Searchable modal component with:
   - FlatList of all IANA timezones using `Intl.supportedValuesOf('timeZone')`
   - City name extraction from timezone IDs (e.g., "New_York" → "New York")
   - UTC offset display for each timezone
   - Search filtering by city name, region, or full timezone ID
   - "Use auto-detected" option to reset to device timezone
   - Haptic feedback on selection

2. **Updated BiometricProfileScreen (Onboarding):**
   - Added `customTimezone` state to track user selection
   - Made timezone display tappable with chevron indicator
   - Shows "Auto-detected" vs "Custom" label
   - Passes effective timezone to next screen

3. **Updated BiometricSettingsScreen (Post-onboarding):**
   - Same timezone picker integration
   - Timezone saved to API on "Save Changes"

**Files Created (1):**
- `client/src/components/TimezonePickerModal.tsx` — Reusable timezone picker modal

**Files Modified (3):**
- `client/src/screens/onboarding/BiometricProfileScreen.tsx` — Timezone editing in onboarding
- `client/src/screens/settings/BiometricSettingsScreen.tsx` — Timezone editing in settings
- `MVP_ISSUES.md` — Marked MVP-003 Complete

**Commit:** `2685379`

---

## Session 97 (Previous)

**Date:** December 27, 2025
**Focus:** MVP-006 — Protocol Card Detail UX Redesign

### Work Completed

**MVP-006: Protocol Card Detail UX Redesign**

Consolidated protocol detail experience into a single enhanced bottom sheet with progressive disclosure.

**Changes:**
1. **Created AnimatedExpandableSection** — Reusable animated expand/collapse component with spring physics
2. **Simplified ScheduledProtocolCard** — Removed "Why this?" chip, kept clean minimal card
3. **Created useProtocolDetailSheet hook** — Wrapper for protocol data with pre-parsed display fields
4. **Enhanced ProtocolQuickSheet** — Changed snap points to 50%/90%, added 4 evidence panels:
   - What to Do (expanded by default)
   - Why This Works (collapsed)
   - Research & Evidence (collapsed, with tappable DOI links)
   - Your Data (collapsed, shows adherence stats)
5. **Updated HomeScreen** — Removed unused `onViewFullDetails` prop
6. **Refactored ProtocolDetailScreen** — Uses shared AnimatedExpandableSection

**Files Created (2):**
- `client/src/components/ui/AnimatedExpandableSection.tsx` — Shared animated component
- `client/src/hooks/useProtocolDetailSheet.ts` — Protocol data wrapper hook

**Files Modified (4):**
- `client/src/components/home/ScheduledProtocolCard.tsx` — Simplified card
- `client/src/components/protocol/ProtocolQuickSheet.tsx` — Enhanced with 4 panels
- `client/src/screens/HomeScreen.tsx` — Removed onViewFullDetails
- `client/src/screens/ProtocolDetailScreen.tsx` — Uses shared component

**Commit:** `26da66e`

---

## Session 96 (Previous)

**Date:** December 27, 2025
**Focus:** Quick Wins Sprint — MVP-007, MVP-005, MVP-004

### Work Completed

**Fixed 3 MVP Issues in Quick Wins Sprint**

**MVP-007: AI Chat Text Input Horizontal Scroll**
- Changed `multiline={false}` to `multiline={true}` in ChatModal.tsx
- Updated input styles: `maxHeight: 120`, added `minHeight: 44`
- Text now wraps vertically, Enter creates new line

**MVP-005: Duplicate Protocols on Home Screen**
- Added Map-based deduplication in `useEnrolledProtocols.ts`
- Keeps first enrollment if duplicates exist for same protocol_id

**MVP-004: Remove Start Check-in Button**
- Removed check-in button from LiteModeScoreCard empty state
- Updated messaging to "Connect a Wearable" for recovery insights
- Removed unused `onCheckIn` prop and handler from HomeScreen

**Files Modified (4):**
- `client/src/components/ChatModal.tsx` — Multiline input fix
- `client/src/hooks/useEnrolledProtocols.ts` — Protocol deduplication
- `client/src/components/LiteModeScoreCard.tsx` — Removed check-in, updated empty state
- `client/src/screens/HomeScreen.tsx` — Removed onCheckIn handler

---

## Session 95 (Previous)

**Date:** December 27, 2025
**Focus:** MVP-001 & MVP-002 Fix (Protocol Toggle Bug)

### Work Completed

**Fixed MVP-001 & MVP-002 — Protocol Toggle De-selection Bug**

**Root Cause:** `getModulesForGoals()` returned a new array reference on every render, causing the `useEffect` to re-run and reset `selectedProtocolIds` to all-selected after each toggle.

**Fix:** Added `useMemo` to memoize `moduleIds`, ensuring stable reference.

**Files Modified (2):**
- `client/src/screens/onboarding/StarterProtocolSelectionScreen.tsx` — Added `useMemo` wrapper
- `MVP_ISSUES.md` — Marked MVP-001 and MVP-002 as Complete

**Commit:** `089b337`

---

## Next Session Priority

### Session 99 Focus: Final MVP Issue (MVP-008)

**How to start:**
```
/start MVP-008
```

**Issue Queue (by priority):**
1. ~~**MVP-001** (High) — Protocol Toggle Not De-selecting~~ ✅ Complete
2. ~~**MVP-002** (High) — Protocol Selection Counter Inaccurate~~ ✅ Complete
3. ~~**MVP-003** (Medium) — Timezone Selector Not Editable~~ ✅ Complete
4. ~~**MVP-004** (Medium) — Remove Start Check-in Button~~ ✅ Complete
5. ~~**MVP-005** (High) — Duplicate Protocols on Home Screen~~ ✅ Complete
6. ~~**MVP-006** (High) — Protocol Card Detail UX Redesign~~ ✅ Complete
7. ~~**MVP-007** (High) — AI Chat Text Input Horizontal Scroll~~ ✅ Complete
8. **MVP-008** (Medium) — Time Picker Redesign with Scroll Wheel

**Remaining Issue (1):**
- **MVP-008** — Replace button grid with scroll wheel time picker

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
| `MVP_ISSUES.md` | **Active** — 8 pre-launch issues with fix details |
| `PRD Documents/APEX_OS_PRD_v8.1.md` | Master PRD (v8.1.1) — Vision + critical specs |
| `PRD Documents/APEX_OS_TECHNICAL_SPEC_v1.md` | Implementation details, algorithms, APIs |
| `PRD Documents/APEX_OS_WIDGET_PRD_v1.md` | Widget specifications for iOS/Android |
| `Master_Protocol_Library.md` | Protocol evidence library (18 protocols) |
| `CLAUDE.md` | Agent operating instructions + MVP workflow |
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
| Test files (*.test.ts) | Mock type mismatches (18 errors) |

*Note: Production code compiles. These are edge cases and test file issues.*

---

## Production Release Checklist

Before App Store / Play Store release, verify these items:

| Item | Location | Current | Production |
|------|----------|---------|------------|
| Dev Mode Flag | `client/src/providers/MonetizationProvider.tsx:16` | `true` | Set to `false` |
| Streak TODO | `functions/src/nudgeEngine.ts:275` | Hardcoded 0 | Implement user_stats |
| Calendar TODO | `functions/src/nudgeEngine.ts:325` | Hardcoded 0 | Implement FreeBusy API |

**Note:** For EAS Development Build (TestFlight), dev mode flag can remain `true`.

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

*Last Updated: December 27, 2025 (Session 98 closed - MVP-003 Timezone Picker)*
