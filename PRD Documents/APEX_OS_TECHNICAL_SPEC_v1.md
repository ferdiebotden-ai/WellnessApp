# APEX OS: Technical Specification v1.0

> **Implementation Reference for Opus 4.5**

**Version:** 1.0
**Date:** December 9, 2025
**Status:** Canonical
**Companion To:** APEX_OS_PRD_v8.1.md

---

## 1. Document Purpose & Scope

This document provides **implementation details** that complement the vision-focused PRD v8.1. Use this reference when:

- Implementing algorithms (recovery scoring, confidence calculation, MVD detection)
- Understanding existing architecture (data models, API endpoints, components)
- Debugging or extending features
- Onboarding new developers

**This document does NOT replace PRD v8.1.** The PRD defines WHAT and WHY; this spec defines HOW.

---

## 2. Implementation Status Matrix

### Phase 1: Spinal Cord (Infrastructure) — 100% COMPLETE

| Component | Status | Location |
|-----------|--------|----------|
| Database schema (Supabase) | ✅ | `/supabase/migrations/` (25 migrations) |
| Authentication (Firebase) | ✅ | `/client/src/services/AuthService.ts` |
| API structure (Express) | ✅ | `/functions/src/index.ts` |
| Firebase setup (Firestore) | ✅ | `/client/src/services/firebase.ts` |
| Supabase setup (PostgreSQL) | ✅ | `/functions/src/lib/supabase.ts` |
| Protocol library (18 protocols) | ✅ | `/Master_Protocol_Library.md` + seeded DB |
| Vertex AI integration | ✅ | `/functions/src/lib/vertexai.ts` |

### Phase 2: Brain (AI & Reasoning) — 100% COMPLETE (13/13 Sessions)

| Component | Status | Location |
|-----------|--------|----------|
| Memory layer | ✅ | `/functions/src/memory/userMemory.ts` |
| Confidence scoring | ✅ | `/functions/src/reasoning/confidenceScorer.ts` |
| Suppression engine (9 rules) | ✅ | `/functions/src/suppression/suppressionEngine.ts` |
| Safety scanning | ✅ | `/functions/src/safety/crisisDetection.ts` |
| Weekly synthesis | ✅ | `/functions/src/synthesis/weeklySynthesis.ts` |
| MVD detector | ✅ | `/functions/src/mvd/mvdDetector.ts` |
| Outcome correlation | ✅ | `/functions/src/correlations.ts` |
| Why Engine | ✅ | `/functions/src/reasoning/whyEngine.ts` |
| Reasoning UX | ✅ | `/client/src/components/ReasoningExpansion.tsx` |

### Phase 3: Nervous System (Real Data Flow) — 91% COMPLETE (10/11 Sessions)

| Component | Status | Location |
|-----------|--------|----------|
| Database migrations + types | ✅ | `/supabase/migrations/20251204*` |
| HealthKit (iOS) | ✅ | `/modules/expo-healthkit-observer/` |
| Recovery score | ✅ | `/functions/src/services/recoveryScore.ts` |
| Wake detection | ✅ | `/functions/src/services/wake/WakeDetector.ts` |
| Calendar integration | ✅ | `/functions/src/services/calendar/CalendarService.ts` |
| Real-time Firestore | ✅ | `/client/src/services/firebase.ts` |
| Reasoning UX (edge cases) | ✅ | `/client/src/components/EdgeCaseBadge.tsx` |
| Lite Mode | ✅ | `/functions/src/services/checkInScore.ts` |
| Health Connect (Android) | ✅ | `/client/src/services/health/HealthConnectAdapter.ts` |
| Integration testing | ✅ | `/functions/src/__tests__/integration/` |
| Cloud wearables (Oura/WHOOP) | 🔲 DEFERRED | Session 11 — Users sync via on-device Health APIs |

### Current Architecture Decision: "God Mode"

**All features unlocked for all users during testing phase.**

- No tier gating (Foundation/Performance/Elite tiers disabled)
- No paywall triggers
- No trial limitations
- All 18 protocols accessible immediately

**Monetization/Paywalls:** Deferred to post-testing phase. Infrastructure exists (RevenueCat) but is not enforced.

---

## 3. Algorithm Specifications

### 3.1 Recovery Score Formula

**Location:** `/functions/src/services/recoveryScore.ts`

```
Recovery = (HRV × 0.40) + (RHR × 0.25) + (SleepQuality × 0.20)
         + (SleepDuration × 0.10) + (RespiratoryRate × 0.05) - TempPenalty
```

**Component Details:**

| Component | Weight | Normalization | Notes |
|-----------|--------|---------------|-------|
| HRV | 40% | Log-transformed (hrvLnMean) | More accurate than raw RMSSD |
| RHR | 25% | Inverse (lower = better) | Compared to user baseline |
| Sleep Quality | 20% | Efficiency + Deep% + REM% | Composite score |
| Sleep Duration | 10% | vs user's 75th percentile | Personalized target |
| Respiratory Rate | 5% | Deviation from baseline | Early illness indicator |
| Temperature Penalty | -15 max | If temp > baseline + 0.5°C | Fever detection |

**Recovery Zones:**
- **Green (75-100):** Full protocol day, high intensity OK
- **Yellow (40-74):** Normal day, moderate intensity
- **Red (0-39):** MVD activation, foundation protocols only

**Confidence Scoring:**
- Data completeness score (0.0-1.0)
- Edge case flags affect confidence
- First 7-14 days = calibration period (lower confidence)

### 3.2 Confidence Scoring Model (5 Factors)

**Location:** `/functions/src/reasoning/confidenceScorer.ts`

```typescript
interface ConfidenceFactors {
  dataDays: number;           // Days of data available
  correlationStrength: number; // Pearson r value (0-1)
  baselineStability: number;   // Variance in baseline (lower = better)
  volatility: number;          // User's historical data variance
  extrapolationRisk: number;   // Predicting beyond data range
}
```

**Thresholds:**
- **High (>0.8):** 14+ days of data, strong correlation (r > 0.6)
- **Medium (0.6-0.8):** 7-14 days, emerging pattern
- **Low (<0.6):** Insufficient data, general guidance

**Caveat (always displayed):** "Based on population averages; individual results vary."

### 3.3 MVD Detection Logic (6 Triggers)

**Location:** `/functions/src/mvd/mvdDetector.ts`

| Trigger | Threshold | MVD Type | Notes |
|---------|-----------|----------|-------|
| Recovery Score | <35% | Full MVD | 3 protocols only |
| Calendar Load | 6+ hours meetings | Full MVD | Via Google Calendar API |
| Manual Activation | User request | User-selected | Explicit /api/mvd/activate |
| Travel | >2h timezone change | Travel MVD | Extended morning light |
| Consistency Drop | 3+ missed days | Semi-Active MVD | Gentle re-engagement |
| Illness Indicators | Resp +3bpm OR Temp +0.5°C | Recovery MVD | Foundation + rest |

**MVD Protocol Sets:**
- **Full MVD (3):** Morning Light, Hydration, Early Sleep Cutoff
- **Semi-Active MVD (5):** Full MVD + Movement + Breathwork
- **Travel MVD:** Extended Morning Light, Delayed Caffeine, Hydration

### 3.4 Suppression Engine (9 Rules)

**Location:** `/functions/src/suppression/suppressionEngine.ts`

| Rule | Condition | Action | Priority |
|------|-----------|--------|----------|
| Recovery Threshold | Recovery >75% | Max 2 nudges/day | 1 |
| Calendar Load | >4 hours meetings | Quiet mode + MVD | 2 |
| App Active | Used in last 30 min | No nudges | 3 |
| Quiet Hours | 10pm-7am (user configurable) | No nudges | 4 |
| Meeting Detection | Currently in meeting | Defer 30 min | 5 |
| Fatigue Detection | 3+ dismissed today | Back off 4 hours | 6 |
| Recent Completion | Same protocol in 2 hours | No repeat | 7 |
| Daily Cap | 5 sent today | No more today | 8 |
| User Preference | Category disabled | Never nudge | 9 |

**Result:** 3-5 high-value nudges/day vs. competitor's 8-12.

### 3.5 Meeting Load Thresholds

**Location:** `/functions/src/services/calendar/CalendarService.ts`

| Load | Hours | Nudge Behavior | MVD Impact |
|------|-------|----------------|------------|
| Light | 0-2h | Normal (5 nudges max) | None |
| Moderate | 2-4h | Reduced (3 nudges max) | None |
| Heavy | 4-6h | Minimal (2 nudges max) | Semi-Active MVD |
| Extreme | 6h+ | Essential only (1 nudge) | Full MVD |

### 3.6 Lite Mode Scoring (No Wearable)

**Location:** `/functions/src/services/checkInScore.ts`

**Daily Check-in Inputs:**
- Sleep quality: 0-10 slider
- Stress level: 0-10 slider
- Energy level: 0-10 slider

**Formula:**
```
Lite Mode Score = ((Sleep + (10 - Stress) + Energy) / 30) × 100
```

**Mapping to Recovery Zones:**
- 75-100 → Green
- 40-74 → Yellow
- 0-39 → Red

---

## 4. Data Architecture

### 4.1 Supabase Tables (PostgreSQL 15)

**Core Tables:**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Account data | firebase_uid, email, created_at |
| `user_profiles` | Extended profile | timezone, health_goals, avatar_url |
| `modules_protocols` | Protocol library | module_id, protocol_id, evidence, tier |
| `module_enrollment` | User subscriptions | user_id, module_id, is_primary |
| `protocol_logs` | Engagement tracking | user_id, protocol_id, action, timestamp |
| `ai_audit_log` | AI transparency | function, input, output, reasoning |
| `user_memories` | Memory layer | type, content, relevance, expires_at |
| `weekly_syntheses` | Weekly reports | week_start, narrative, correlations |
| `wearable_data_archive` | Historical health | source, data_type, value, timestamp |
| `user_push_tokens` | FCM/APNs tokens | platform, token, active_at |
| `waitlist_entries` | Waitlist | email, signup_date, activated_at |
| `calendar_events` | Calendar cache | event_id, start, end, duration_minutes |
| `wake_events` | Wake detection | detected_time, confirmed_time, method |
| `recovery_baselines` | User baselines | avg_recovery, confidence |
| `checkIn_scores` | Lite mode | sleep, stress, energy, date |

**Total Migrations:** 25 (all applied)

### 4.2 Firestore Collections (Real-time)

| Collection | Purpose | Update Frequency |
|------------|---------|------------------|
| `users/{uid}/nudges` | Task feed | Real-time on changes |
| `users/{uid}/todayMetrics` | Today's health | On wearable sync |
| `users/{uid}/todayMetadata` | Context (wake, MVD) | On events |
| `users/{uid}/feedback` | Nudge responses | On user action |
| `users/{uid}/goals` | Module enrollment | On user change |

### 4.3 Key Data Models

**WearableIntegration:**
```typescript
interface WearableIntegration {
  id: string;
  userId: string;
  provider: 'oura' | 'apple_health' | 'health_connect' | 'fitbit' | 'whoop' | 'manual';
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  expiresAt?: Date;
  scopes: string[];
  lastSyncAt: Date;
  lastSyncStatus: 'success' | 'failed' | 'pending';
}
```

**UserBaseline:**
```typescript
interface UserBaseline {
  userId: string;
  hrvLnMean: number;        // Log-transformed HRV
  hrvLnStdDev: number;
  hrvCoeffVariation: number; // Normal: 2-20%
  hrvMethod: 'rmssd' | 'sdnn';
  rhrMean: number;
  rhrStdDev: number;
  respiratoryRateMean: number;
  sleepDurationTarget: number; // 75th percentile
  temperatureBaseline: number; // Celsius
  confidence: 'low' | 'medium' | 'high';
  sampleCount: number;
}
```

**RecoveryResult:**
```typescript
interface RecoveryResult {
  score: number;              // 0-100
  zone: 'red' | 'yellow' | 'green';
  confidence: number;         // 0.0-1.0
  components: {
    hrv: { raw: number; normalized: number; vsBaseline: number };
    rhr: { raw: number; normalized: number; vsBaseline: number };
    sleepQuality: { raw: number; normalized: number };
    sleepDuration: { raw: number; normalized: number };
    respiratoryRate: { raw: number; normalized: number };
    temperaturePenalty: number;
  };
  edgeCases: {
    alcohol: boolean;
    illness: boolean;
    travel: boolean;
    menstrualCycle: boolean;
    calibrationPeriod: boolean;
  };
  dataCompleteness: number;   // 0.0-1.0
  caveat: string;
}
```

**CalendarContext:**
```typescript
interface CalendarContext {
  userId: string;
  date: string;
  meetingMinutes: number;
  meetingCount: number;
  meetingLoad: 'light' | 'moderate' | 'heavy' | 'extreme';
  busyPeriods: Array<{ start: Date; end: Date; isAllDay: boolean }>;
  longestFreeBlock: number;   // minutes
  morningFreeUntil: Date;
  titlesSynced: false;        // Privacy: never sync titles
  source: 'google' | 'apple' | 'manual';
}
```

---

## 5. API Reference (37+ Endpoints)

### 5.1 User Management

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/users` | Create user + Supabase sync |
| POST | `/api/users/sync` | Alias for create (client compat) |
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/me` | Update user profile |
| DELETE | `/api/users/me` | GDPR deletion request |
| POST | `/api/users/me/export` | GDPR data export |
| GET | `/api/users/me/privacy` | Privacy dashboard data |
| GET | `/api/users/me/monetization` | Subscription status |
| GET | `/api/users/me/correlations` | Outcome correlations |

### 5.2 AI & Chat

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chat` | Chat with Vertex AI Gemini |
| GET | `/api/protocols/search` | Vector search + RAG |

### 5.3 Onboarding & Waitlist

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/onboarding/complete` | Mark onboarding done |
| POST | `/api/waitlist` | Join/activate waitlist |

### 5.4 Modules & Protocols

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/modules` | Get all 5 core modules |
| PATCH | `/api/modules/enrollment` | Switch primary module |

### 5.5 MVD (Minimum Viable Day)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/mvd/activate` | Manually trigger MVD |
| GET | `/api/mvd/status` | Get current MVD state |
| POST | `/api/mvd/deactivate` | Exit MVD |
| POST | `/api/mvd/detect` | Auto-detect MVD |

### 5.6 Wake & Recovery

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/wake-events` | Create wake event |
| GET | `/api/wake-events/today` | Get today's wake time |
| GET | `/api/recovery` | Recovery score + baseline |

### 5.7 Calendar

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/calendar/sync` | Sync Google Calendar |
| GET | `/api/calendar/today` | Today's meeting load |
| GET | `/api/calendar/status` | Calendar sync status |
| DELETE | `/api/calendar/disconnect` | Revoke access |
| GET | `/api/calendar/recent` | Last 7 days data |

### 5.8 Lite Mode

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/manual-check-in` | Submit daily check-in |
| GET | `/api/manual-check-in/today` | Get today's check-in |

### 5.9 Push Notifications

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/push-tokens` | Register FCM/APNs token |
| DELETE | `/api/push-tokens` | Deregister (logout) |

### 5.10 Webhooks

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/webhooks/revenuecat` | Subscription events |
| GET | `/` | Health check |

---

## 6. Client Architecture

### 6.1 Screens (22 Total)

| Screen | Location | Purpose |
|--------|----------|---------|
| HomeScreen | `/screens/HomeScreen.tsx` | Dashboard, recovery, tasks |
| InsightsScreen | `/screens/InsightsScreen.tsx` | Correlations, charts |
| ProtocolsScreen | `/screens/ProtocolsScreen.tsx` | Browse 18 protocols |
| ProtocolDetailScreen | `/screens/ProtocolDetailScreen.tsx` | Full protocol + evidence |
| ProtocolSearchScreen | `/screens/ProtocolSearchScreen.tsx` | Vector search |
| ProfileScreen | `/screens/ProfileScreen.tsx` | Settings, logout |
| PrivacyDashboardScreen | `/screens/PrivacyDashboardScreen.tsx` | GDPR compliance |
| SignUpScreen | `/screens/auth/SignUpScreen.tsx` | Registration |
| SignInScreen | `/screens/auth/SignInScreen.tsx` | Login |
| BiometricSetupScreen | `/screens/auth/BiometricSetupScreen.tsx` | Face/Touch ID |
| ForgotPasswordScreen | `/screens/auth/ForgotPasswordScreen.tsx` | Password reset |
| WearableConnectionScreen | `/screens/onboarding/WearableConnectionScreen.tsx` | Health permissions |
| GoalSelectionScreen | `/screens/onboarding/GoalSelectionScreen.tsx` | Module selection |
| AICoachIntroScreen | `/screens/onboarding/AICoachIntroScreen.tsx` | Nudge explainer |
| CalendarSettingsScreen | `/screens/CalendarSettingsScreen.tsx` | Google Calendar |
| WearableSettingsScreen | `/screens/WearableSettingsScreen.tsx` | Health sources |
| WaitlistScreen | `/screens/WaitlistScreen.tsx` | Waitlist signup |
| SplashScreen | `/screens/SplashScreen.tsx` | Loading |

### 6.2 Key Components (35+)

| Component | Purpose |
|-----------|---------|
| RecoveryScoreCard | Recovery % with baseline |
| LiteModeScoreCard | Manual check-in recovery |
| TaskList | Nudge feed with swipe |
| NudgeCard | Individual nudge + reasoning |
| ReasoningExpansion | 4-panel Why display |
| HealthMetricCard | HRV, RHR, sleep data |
| ModuleEnrollmentCard | Primary module display |
| CorrelationCard | Outcome attribution |
| EdgeCaseBadge | Context flags (illness, travel) |
| ConfidenceBreakdown | 5-factor visualization |
| WakeConfirmationOverlay | Morning confirmation |
| ChatModal | AI chat interface |
| PaywallModal | RevenueCat products |
| TrialBanner | Trial countdown |
| BiometricLockScreen | App unlock |

### 6.3 Custom Hooks (26+)

| Hook | Purpose |
|------|---------|
| useTaskFeed | Real-time nudges from Firestore |
| useRecoveryScore | Recovery %, baseline, lite mode |
| useNudgeActions | Complete/dismiss with optimistic |
| useTodayMetrics | Real-time HRV, RHR, sleep |
| useWakeDetection | Wake events, confirmation |
| useProtocolSearch | Vector search via Vertex |
| useProtocolDetail | Full protocol + reasoning |
| useCorrelations | User outcome correlations |
| useHealthKit | iOS HealthKit data |
| useHealthConnect | Android Health Connect |
| useWearablePermissions | Request/check permissions |
| useCalendar | Google Calendar sync |
| useModules | Primary/secondary enrollment |
| useFeatureFlags | Remote A/B flags |

### 6.4 Services (15+)

| Service | Purpose |
|---------|---------|
| AuthService | Firebase Auth operations |
| firebase.ts | Firestore listeners + offline |
| RevenueCatService | Subscription management |
| CalendarService | Google Calendar OAuth |
| HealthConnectAdapter | Android health aggregator |
| WakeEventService | Wake submission |
| pushNotifications | FCM/APNs handling |
| secureCredentials | Encrypted storage |

---

## 7. Safety & Compliance

### 7.1 Crisis Detection

**Location:** `/functions/src/safety/crisisDetection.ts`

**18+ Crisis Keywords:**
- suicide, suicidal, kill myself, end my life
- self-harm, cutting, hurting myself
- want to die, death, dying
- overdose, pills
- (full list in implementation)

**Detection Flow:**
1. All user inputs scanned for keywords
2. If match: Gemini 2.5 Flash analyzes context
3. If confirmed crisis: Block AI response
4. Display crisis resources (988 Lifeline, Crisis Text Line)
5. Log incident for safety review

**AI Responses Never Include:**
- Medical diagnosis
- Prescription advice
- Therapy or mental health treatment
- Claims of certainty without data

### 7.2 GDPR Compliance

**Features:**
- Data export: `/api/users/me/export` (JSON format)
- User deletion: `/api/users/me/delete` (30-day processing)
- Privacy dashboard: Shows all stored data types
- Consent tracking: Stored in user_profiles

### 7.3 AI Output Scanning

**Location:** `/functions/src/safety/aiOutputScanner.ts`

All Gemini responses scanned before display for:
- Medical advice (blocked)
- Harmful content (blocked)
- Overconfident claims (flagged)
- Off-topic responses (redirected)

---

## 8. Integration Details

### 8.1 Apple HealthKit (iOS)

**Location:** `/modules/expo-healthkit-observer/`

**Data Types:**
- HRV (RMSSD)
- Resting Heart Rate
- Sleep Analysis (efficiency, stages)
- Steps, Active Calories
- Workout sessions

**Sync Method:** Background delivery (no polling)

### 8.2 Google Health Connect (Android)

**Location:** `/client/src/services/health/HealthConnectAdapter.ts`

**Library:** `react-native-health-connect`

**Data Types:** Same as HealthKit

**Sync Method:** Periodic background sync

### 8.3 Google Calendar

**Location:** `/functions/src/services/calendar/CalendarService.ts`

**Scope:** `calendar.readonly` (freebusy only)
**Privacy:** Never syncs event titles
**OAuth:** Secure credential storage (encrypted)

### 8.4 Lite Mode (Manual Entry)

**Location:** `/functions/src/services/checkInScore.ts`

**Daily Prompts:**
1. How did you sleep? (0-10)
2. Stress level? (0-10)
3. Energy level? (0-10)

**Recovery Calculation:** See Section 3.6

---

## 9. Test Coverage

### 9.1 Backend Tests (Vitest)

| Suite | Tests | Status |
|-------|-------|--------|
| nudgeEngine.test.ts | 85 | ✅ |
| recoveryScore.test.ts | 84 | ✅ |
| suppression.test.ts | 52 | ✅ |
| mvdDetector.test.ts | 50 | ✅ |
| safety.test.ts | 93 | ✅ |
| synthesis.test.ts | 51 | ✅ |
| correlations.test.ts | 8 | ✅ |
| checkInScore.test.ts | 18 | ✅ |
| wearablesSync.test.ts | 12 | ✅ |
| **Total Unit** | **464** | ✅ |

### 9.2 Integration Tests

| Suite | Tests | Status |
|-------|-------|--------|
| calendar-mvd.test.ts | 12 | ✅ |
| wake-morning-anchor.test.ts | 18 | ✅ |
| lite-mode-checkin.test.ts | 15 | ✅ |
| wearable-recovery.test.ts | 20 | ✅ |
| firestore-sync.test.ts | 14 | ✅ |
| nudge-suppression.test.ts | 10 | ✅ |
| **Total Integration** | **89** | ✅ |

### 9.3 E2E Tests (Playwright)

| Suite | Tests | Status |
|-------|-------|--------|
| auth-flow.spec.ts | 7 | ✅ |
| main-navigation.spec.ts | 5 | ✅ |
| forgot-password.spec.ts | 3 | ✅ |
| **E2E Passing** | **20+** | ✅ |

**Total Tests:** 553+

---

## 10. Deployment Status

### 10.1 Cloud Run Services

| Service | URL | Status |
|---------|-----|--------|
| Wellness API | `https://api-26324650924.us-central1.run.app/` | ✅ LIVE |

### 10.2 Cloud Functions (Gen 2)

| Function | Schedule | Status |
|----------|----------|--------|
| api | HTTP | ✅ LIVE |
| generateDailySchedules | 5am UTC | ✅ LIVE |
| generateAdaptiveNudges | 8am UTC | ✅ LIVE |
| generateWeeklySyntheses | Sun 8:45am | ✅ LIVE |
| runMemoryMaintenance | Daily | ✅ LIVE |
| onNudgeFeedback | Firestore trigger | ✅ LIVE |

### 10.3 External Services

| Service | Status |
|---------|--------|
| Firebase Auth | ✅ LIVE |
| Supabase | ✅ LIVE |
| Firebase Firestore | ✅ LIVE |
| RevenueCat | ✅ LIVE |
| Vertex AI | ✅ LIVE |
| Pinecone | ✅ LIVE |
| Google Calendar API | ✅ CONFIGURED |

---

## 11. Critical Implementation Rules

1. **NO Google Fit** — Deprecated June 2025; use Health Connect for Android
2. **Real-time over polling** — Use Firestore listeners, not polling APIs
3. **Hybrid database pattern** — READ from Supabase, WRITE to Firebase
4. **No gamification** — No streaks, badges, leaderboards, points
5. **Evidence citations** — All protocols must have DOI references
6. **Safety first** — All AI inputs/outputs scanned
7. **God Mode active** — No tier gating during testing phase

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 9, 2025 | Initial technical specification |

---

*This document complements APEX_OS_PRD_v8.1.md. For product vision and user experience, refer to the PRD.*

*Last Updated: December 9, 2025*
