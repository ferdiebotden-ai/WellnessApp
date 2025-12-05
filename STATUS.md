# Apex OS — Project Status

> Session state for Claude Opus 4.5. Update at end of each session.

---

## Current State

| Attribute | Value |
|-----------|-------|
| **Phase** | Phase 3: Nervous System (Real Data Flow) — 🚀 IN PROGRESS |
| **Session** | 48 (next) |
| **Progress** | 64% of Phase 3 (7/11 sessions) |
| **Branch** | main |
| **Blocker** | ⚠️ `is_primary` column missing — see Active Blockers |

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

**Date:** December 5, 2025 (Session 47)
**Focus:** Firebase→Supabase User Sync Fix (Critical Bug)

**Problem Discovered:**
App showing "No active modules available" after onboarding. Root cause: Firebase UID vs Supabase UUID mismatch.

**Accomplished:**
- ✅ Created `/api/users/sync` endpoint — bridges Firebase Auth → Supabase users table
- ✅ Updated `onboardingComplete.ts` — looks up user by `firebase_uid`, uses UUID for FKs
- ✅ Updated `firstWinNudge.ts` — accepts both Firebase UID and Supabase UUID
- ✅ Added `syncUser()` in `api.ts` — client-side sync function
- ✅ Added sync call in `AuthProvider.tsx` — syncs on auth state change
- ✅ Added CORS middleware — allows localhost:8081/19006/3000
- ✅ Fixed module ID mappings — changed `sleep_foundations` → `mod_sleep`
- ✅ Deployed backend to Cloud Run
- ✅ Committed and pushed all changes (commit `b0884f6`)

**Files Created (2 new):**
- `backend/src/routes/userSync.ts` — User sync endpoint
- `backend/src/server.ts` — Express server entry point

**Files Modified (10):**
- `backend/src/index.ts` — Added CORS, userSync route
- `backend/src/routes/onboardingComplete.ts` — Firebase UID lookup, UUID for FK
- `backend/src/services/firstWinNudge.ts` — Dual ID format support
- `backend/src/services/firstWinNudge.test.ts` — Updated tests
- `backend/package.json` — Added cors dependency
- `client/src/providers/AuthProvider.tsx` — Added syncUser on auth change
- `client/src/services/api.ts` — Added syncUser function
- `client/src/services/AuthService.ts` — Minor sync integration
- `client/src/types/onboarding.ts` — Fixed module ID mappings

**Blocker Found:** `module_enrollment` table missing `is_primary` column (see Active Blockers)

---

## Previous Session

**Date:** December 5, 2025 (Session 46)
**Focus:** Phase 3 Session 7 — Edge Case Badges + Confidence Breakdown UI

**Accomplished:**
- Implemented edge case badges for health conditions (alcohol, illness, cycle)
- Implemented confidence factor breakdown visualization
- Integrated badges into RecoveryScoreCard and NudgeCard Why panel
- Design: Bloomberg Terminal meets luxury health tech aesthetic

**Files:** 8 new + 4 modified

---

## Next Session Priority

### Phase 3 Session 8: Lite Mode (No-Wearable Fallback)

**Focus:** Enable app functionality for users without wearables.

**Scope:**
- Manual wellness inputs (sleep quality, energy level, mood)
- Simplified recovery score without biometric data
- Protocol recommendations based on user reports
- Fallback UI when no wearable connected

**Key Files to Review:**
- `client/src/screens/HomeScreen.tsx` — Dashboard with wearable data
- `functions/src/services/recoveryScore.ts` — Needs manual input support
- `client/src/hooks/useRecoveryScore.ts` — Data source handling

**Expected Output:**
- Manual input components for wellness tracking
- Modified recovery calculation for manual-only mode
- Graceful degradation when wearable unavailable

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

### ⚠️ CRITICAL: `module_enrollment` Table Missing `is_primary` Column

**Problem:**
The `/api/onboarding/complete` endpoint returns 500 error because code tries to insert `is_primary: true` but the column doesn't exist.

**Location:** `backend/src/routes/onboardingComplete.ts:84-89`
```typescript
const enrollmentPayload = {
  user_id: supabaseUserId,
  module_id: primaryModuleId,
  is_primary: true,  // <-- THIS COLUMN DOESN'T EXIST IN DATABASE
  enrolled_at: now.toISOString(),
};
```

**Current Table Schema:** (from `supabase/migrations/20250529000001_create_module_enrollment.sql`)
```sql
create table public.module_enrollment (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users (id) on delete cascade,
    module_id text not null references public.modules (id) on delete cascade,
    last_active_date date,
    enrolled_at timestamptz not null default timezone('utc', now()),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (user_id, module_id)
);
```

---

## Execution Plan for Next Session

**Priority:** Fix the `is_primary` column blocker, then test end-to-end.

### Step 1: Add Migration (5 minutes)

Create migration file:
```bash
touch supabase/migrations/20251205200000_add_is_primary_to_enrollment.sql
```

Content:
```sql
-- Add is_primary column to module_enrollment
-- Allows tracking which module is the user's primary focus module

ALTER TABLE public.module_enrollment
ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

-- Create index for efficient lookup of primary module
CREATE INDEX IF NOT EXISTS idx_module_enrollment_is_primary
ON public.module_enrollment (user_id, is_primary)
WHERE is_primary = true;

COMMENT ON COLUMN public.module_enrollment.is_primary IS
'Whether this is the users primary focus module selected during onboarding';
```

### Step 2: Apply Migration (2 minutes)

```bash
supabase db push
```

### Step 3: Add Better Error Logging (3 minutes)

Update `backend/src/routes/onboardingComplete.ts:95-98`:
```typescript
if (enrollmentError) {
  console.error('[onboardingComplete] Enrollment error:', enrollmentError);  // ADD THIS
  res.status(500).json({ error: 'Failed to enroll user in module' });
  return;
}
```

### Step 4: Deploy Backend (5 minutes)

```bash
cd backend && npm run build && gcloud run deploy api --source . --region us-central1 --project wellness-os-app
```

### Step 5: Test End-to-End (10 minutes)

1. Start Expo: `cd client && npx expo start --web`
2. Create fresh test user (e.g., `test-e2e-final@example.com`)
3. Complete onboarding selecting "Better Sleep"
4. Verify:
   - Console shows `✅ User synced to Supabase: created`
   - No 500 error on `/api/onboarding/complete`
   - User lands on HomeScreen (not onboarding)
   - Check Supabase: `module_enrollment` row exists with `is_primary = true`

### Step 6: Commit & Update STATUS.md

```bash
git add -A
git commit -m "fix(db): add is_primary column to module_enrollment"
git push origin main
```

**Estimated Time:** ~25 minutes total

---

### Alternative Fix (If Migration Is Problematic)

Remove `is_primary` from the insert payload instead of adding column:

Edit `backend/src/routes/onboardingComplete.ts:84-89`:
```typescript
const enrollmentPayload = {
  user_id: supabaseUserId,
  module_id: primaryModuleId,
  // is_primary: true,  // REMOVE THIS LINE
  enrolled_at: now.toISOString(),
};
```

**Trade-off:** Loses ability to track primary module, but unblocks immediately.

---

### No Deep Research Needed

This is a straightforward schema mismatch, not an architectural issue. The column simply doesn't exist. The fix is deterministic.

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
| 8 | Lite Mode (no-wearable fallback) | 🔜 Next |
| 9 | Health Connect (Android) | 🔲 Pending |
| 10 | Cloud Wearables (Oura, Garmin) | 🔲 Deferred — See OURA_INTEGRATION_REFERENCE.md |
| 11 | Integration Testing | 🔲 Pending |

**Phase 3 Status: 7/11 sessions complete (64%)**

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

*Last Updated: December 5, 2025 (Session 47 - Firebase→Supabase sync complete, is_primary column blocker documented)*
