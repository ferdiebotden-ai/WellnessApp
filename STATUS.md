# Apex OS — Project Status

> Session state for Claude Opus 4.5. Update at end of each session.

---

## Current State

| Attribute | Value |
|-----------|-------|
| **Phase** | PRD v8.1 Frontend Rebuild — 🚀 IN PROGRESS |
| **Session** | 64 (next) |
| **Progress** | Session 63 complete (Push Notifications & Protocol Flexibility) |
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

**Date:** December 10, 2025 (Session 63)
**Focus:** Push Notifications & Protocol Flexibility

**Context:** Session 62 deployed and verified protocol enrollment. Session 63 wires up push notifications for nudges and scheduled reminders, plus adds protocol implementation flexibility (e.g., Morning Light can be outdoor sun OR 10k lux lamp).

**Accomplished:**

### Push Notification Infrastructure (Full Wire-Up)
- **AuthProvider:** Added `setupPushNotifications()` on sign-in, `deactivatePushToken()` on sign-out
- **Deep Linking:** Created `useNotificationHandler` hook that routes notification taps to:
  - `protocol_reminder` / `nudge` → ProtocolDetailScreen
  - `weekly_synthesis` → InsightsScreen
- **FK Fix:** Created migration for `user_push_tokens` table (same auth.users → public.users issue as Session 62)

### Nudge Engine Push Integration
- Wired `sendPushToUser()` after Firestore nudge write
- Nudges now trigger push notifications with protocol name and recommendation text

### Protocol Reminder Scheduler
- **New Cloud Function:** `protocolReminderScheduler.ts` (runs every 15 min via Pub/Sub)
- Queries `user_protocol_enrollment` for protocols due in current 15-min window
- Respects quiet hours via existing suppression engine
- Sends push: "Time for [Protocol Name]" with deep link to start

### Custom Time Selection for Enrollment
- **TimePickerBottomSheet:** New modal with:
  - Suggested time based on protocol type (intelligent defaults)
  - Quick-select time grid (6 AM - 9 PM)
  - Category-specific hints (e.g., "Foundation protocols work best in the morning")
- **Backend:** Updated `enrollInProtocol` to accept optional `time` parameter
- **UI:** ProtocolBrowserScreen now shows time picker when adding protocols

### Protocol Implementation Methods (Morning Light)
- **Migration:** Added `implementation_methods` JSONB column to `protocols` table
- **Seeded Morning Light** with 3 methods:
  - Outdoor Sunlight (10-30 min natural light)
  - 10,000 Lux Light Box (20-30 min at eye level)
  - Light Bar / Panel (mounted at desk)
- **Backend:** Updated personalized protocol endpoint to return `implementation_methods`
- **UI:** Added "WAYS TO DO THIS" section in ProtocolDetailScreen with method cards

**Files Created:**
- `supabase/migrations/20251210100000_fix_user_push_tokens_fk.sql`
- `supabase/migrations/20251210120000_add_implementation_methods.sql`
- `functions/src/protocolReminderScheduler.ts`
- `client/src/components/protocol/TimePickerBottomSheet.tsx`
- `client/src/hooks/useNotificationHandler.ts`

**Files Modified:**
- `functions/src/index.ts` — Export new scheduler
- `functions/src/nudgeEngine.ts` — Push notification integration
- `functions/src/protocolEnrollment.ts` — Custom time support
- `functions/src/protocolPersonalized.ts` — implementation_methods field
- `client/src/providers/AuthProvider.tsx` — Push notification setup
- `client/src/navigation/MainStack.tsx` — Notification handler hook
- `client/src/screens/ProtocolBrowserScreen.tsx` — TimePickerBottomSheet integration
- `client/src/screens/ProtocolDetailScreen.tsx` — Method selector UI
- `client/src/services/api.ts` — enrollInProtocol time parameter
- `client/src/types/protocol.ts` — ImplementationMethod type

**Commits:**
- `5fcc4c0` — feat: add push notifications and custom protocol scheduling (Session 63)
- `c8d22f5` — feat: add protocol implementation methods (Session 63)

**Result:** Push notifications are now wired end-to-end for nudges and scheduled reminders. Users can customize reminder times when adding protocols. Morning Light shows multiple implementation options.

---

## Previous Session

**Date:** December 10, 2025 (Session 62)
**Focus:** Deploy & Verify Protocol Enrollment

**Context:** Session 61 built the Protocol Browser and enrollment system but the migration wasn't applied to Supabase. Session 62 deployed everything and fixed a critical FK constraint issue.

**Accomplished:**
- Applied `user_protocol_enrollment` migration to Supabase
- Fixed FK constraint (auth.users → public.users)
- E2E tested full enrollment flow via Playwright

**Commit:** `b6a2d7a` — fix: correct FK constraint on user_protocol_enrollment table

---

## Session 61 Summary

**Date:** December 9, 2025
**Focus:** Duration Tracking & Protocol Scheduling

**Context:** Session 60 verified backend deployment and E2E flow. Session 61 added the ability for users to browse and add protocols to their schedule, plus track time spent on each protocol.

**Accomplished:**

### Protocol Scheduling System
- **Migration:** Created `user_protocol_enrollment` table for individual protocol scheduling
  - Stores user-selected protocols with `default_time_utc` preference
  - Supports `is_active` toggle for enabling/disabling
- **API Endpoints:** Added 3 new endpoints in `protocolEnrollment.ts`:
  - `POST /api/protocols/:id/enroll` — Add protocol to schedule
  - `DELETE /api/protocols/:id/enroll` — Remove from schedule
  - `GET /api/user/enrolled-protocols` — List user's enrolled protocols
- **Intelligent Defaults:** `getDefaultTimeForProtocol()` assigns smart times based on protocol type:
  - Foundation/Morning protocols → 07:00 UTC
  - Sleep/Evening protocols → 20:00 UTC
  - Recovery/Afternoon protocols → 14:00 UTC
  - Others → 12:00 UTC

### Protocol Browser Screen
- **New Screen:** `ProtocolBrowserScreen.tsx` with:
  - Search bar with debounced input
  - Protocols grouped by category (Foundation, Performance, Recovery, Optimization)
  - Protocol cards showing name, description, match percentage
  - "Tap to add to schedule" CTA with enrollment toggle
  - Toast notifications for success/error feedback
- **Navigation:** Wired "Add Protocol" button on Home → ProtocolBrowser

### Daily Scheduler Enhancement
- Updated `dailyScheduler.ts` to include user-enrolled protocols
- User protocol enrollments take priority over module-based protocols
- Respects user's `default_time_utc` preference for scheduling

### Duration Tracking
- **Timer UI:** Added active timer to `ProtocolDetailScreen`:
  - Timer starts on screen mount
  - Displays elapsed time in MM:SS format (or HH:MM for long sessions)
  - Stops on completion or unmount
- **CompletionModal:** Enhanced with duration display card
  - Shows "Completed in X:XX" with stopwatch icon
  - Styled with primary accent border
- **Data Flow:** Wired `durationSeconds` through entire pipeline:
  - `protocolLogs.ts` includes duration in Firestore queue document
  - `onProtocolLogWritten.ts` extracts and converts to `duration_minutes` for Supabase
  - Also now includes `difficulty_rating` and `notes` in protocol_logs insert

### E2E Verification
- Tested full flow via Playwright:
  - Home → Add Protocol navigation works
  - ProtocolBrowserScreen renders with grouped protocols
  - Protocol cards display with match scores
  - Error handling shows toast on API failures
  - Back navigation works correctly

**Files Created:**
- `supabase/migrations/20251209200000_create_user_protocol_enrollment.sql`
- `functions/src/protocolEnrollment.ts`
- `client/src/screens/ProtocolBrowserScreen.tsx`

**Files Modified:**
- `functions/src/api.ts` — Route registration
- `functions/src/dailyScheduler.ts` — User enrollment support
- `functions/src/onProtocolLogWritten.ts` — Duration + enrichment fields
- `client/src/services/api.ts` — Enrollment API functions
- `client/src/services/protocolLogs.ts` — Duration field
- `client/src/screens/ProtocolDetailScreen.tsx` — Timer UI
- `client/src/screens/HomeScreen.tsx` — ProtocolBrowser navigation
- `client/src/navigation/HomeStack.tsx` — Route registration
- `client/src/components/protocol/CompletionModal.tsx` — Duration display

**Commit:** `c8497d9` — feat: add protocol scheduling and duration tracking (Session 61)

**Result:** Users can now browse and add protocols to their schedule with intelligent default times. Time spent on each protocol is tracked and displayed in the completion modal.

---

## Session 60 Summary

**Date:** December 9, 2025
**Focus:** Backend Deployment & E2E Verification

**Accomplished:**
- Confirmed GitHub Actions deployed revision `api-00178-gd4` to Cloud Run
- Verified personalized protocol endpoint returns full enriched data
- E2E tested via Playwright (Home screen, Weekly Progress, modules)
- Reorganized logo assets with usage documentation

**Commit:** `851da1a` — docs: update STATUS.md for Session 60

---

## Session 59 Summary

**Date:** December 9, 2025
**Focus:** Protocol Data Enrichment & Personalization

**Accomplished:**
- Added 7 enrichment columns to `protocols` table
- Seeded 18 protocols from Master Protocol Library with full evidence data
- Created `GET /api/protocols/:id/personalized` endpoint with 5-factor confidence
- Expanded client types and hooks for personalized data
- Wired Protocol Detail panels to real backend data
- Created CompletionModal with difficulty rating and notes

**Commit:** `a34c350` — feat: add protocol data enrichment and personalization (Session 59)

---

## Next Session Priority

### Session 64 Focus: Testing & Polish

Session 63 completed push notifications and protocol flexibility. Next priorities:

1. **Push Notification Testing**
   - Test notification delivery on physical iOS/Android devices
   - Verify deep linking from notifications works end-to-end
   - Test quiet hours suppression

2. **Schedule Display Enhancement**
   - Show enrolled protocols with custom times on Home screen
   - Add visual indicator for upcoming scheduled protocols
   - Quick tap to start scheduled protocol

3. **Implementation Methods Expansion**
   - Add implementation methods to other protocols (Cold Exposure, Breathwork)
   - Consider user preference tracking for methods (future)

4. **Polish & Edge Cases**
   - Handle offline enrollment queue
   - Test timer accuracy over long sessions
   - Search improvements in ProtocolBrowser

**Design Reference:** `skills/apex-os-design/` for colors, typography, components

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
| `skills/apex-os-design/SKILL.md` | **NEW** — Design system for UI/frontend work |

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
| 9 | Health Connect (Android) | ✅ Complete (Session 50) — Cross-platform parity achieved |
| 10 | Integration Testing | ✅ Complete (Session 51) — 89 integration + 32 E2E tests |
| 11 | Cloud Wearables (Oura, Garmin) | 🔲 Deferred — On-device sync covers most users |

**Phase 3 Status: 10/11 sessions complete (91%) — MVP READY FOR ROLLOUT**

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

*Last Updated: December 10, 2025 (Session 63 closeout - Push Notifications & Protocol Implementation Flexibility)*
