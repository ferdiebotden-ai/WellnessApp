# PHASE III IMPLEMENTATION PLAN
## Apex OS — Real-time Nervous System Build

**Version:** 1.0.0
**Created:** December 3, 2025
**Author:** Lead AI Architect (Claude Opus 4.5)
**Target Executor:** Claude Opus 4.5
**Status:** Ready for Implementation

---

## DOCUMENT PURPOSE

This implementation plan guides the Phase III build of Apex OS — the "Nervous System" layer that connects real wearable data, calendar context, and intelligent reasoning to deliver personalized, evidence-based nudges.

**Critical Context for Opus 4.5:**
- This document is AUTHORITATIVE — follow it exactly as written
- Every TypeScript interface is COMPLETE — do not infer missing fields
- Every acceptance criterion is TESTABLE — verify before marking complete
- If blocked, document the specific issue in STATUS.md before proceeding

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Phase III Architecture Overview](#2-phase-iii-architecture-overview)
3. [Research Synthesis & Gap Analysis](#3-research-synthesis--gap-analysis)
4. [Component 1: Wearable Sync Service](#4-component-1-wearable-sync-service)
5. [Component 2: Recovery Score Engine](#5-component-2-recovery-score-engine)
6. [Component 3: Wake Detection System](#6-component-3-wake-detection-system)
7. [Component 4: Calendar Integration](#7-component-4-calendar-integration)
8. [Component 5: Real-time Sync Architecture](#8-component-5-real-time-sync-architecture)
9. [Component 6: Reasoning UX System](#9-component-6-reasoning-ux-system)
10. [Component 7: Lite Mode (No-Wearable Fallback)](#10-component-7-lite-mode-no-wearable-fallback)
11. [Database Migrations](#11-database-migrations)
12. [Implementation Sessions](#12-implementation-sessions)
13. [Quality Gates](#13-quality-gates)
14. [Open Questions for Human Decision](#14-open-questions-for-human-decision)

---

## 1. EXECUTIVE SUMMARY

### What Phase III Delivers

Phase III transforms Apex OS from a prototype with mock data into a living system that:

1. **Syncs real wearable data** from Oura Ring, Apple HealthKit, and Health Connect (Android)
2. **Calculates personalized recovery scores** using peer-reviewed algorithms with confidence intervals
3. **Detects wake events** to trigger Morning Anchor at the optimal 5-15 minute window
4. **Integrates calendar data** for privacy-first meeting load detection and MVD activation
5. **Provides real-time sync** via webhooks and OS background APIs (no polling from clients)
6. **Explains every recommendation** with the 4-panel "Why?" reasoning system

### Phase Dependencies

```
Phase 1 (Spinal Cord) ✅ COMPLETE
├── Supabase deployed with RLS
├── Protocol library seeded
└── Firebase RTDB structure ready

Phase 2 (Brain) ✅ COMPLETE
├── Pinecone RAG pipeline
├── Nudge decision engine
├── MVD logic
└── Weekly synthesis generator

Phase 3 (Nervous System) ← YOU ARE HERE
├── Wearable sync endpoints
├── Recovery score calculation
├── Wake detection logic
├── Calendar integration
├── Real-time sync architecture
└── Reasoning UX components
```

### Estimated Sessions

| Component | Sessions | Complexity |
|-----------|----------|------------|
| Wearable Sync Service | 2 | High |
| Recovery Score Engine | 1.5 | High |
| Wake Detection System | 1 | Medium |
| Calendar Integration | 1.5 | Medium |
| Real-time Sync Architecture | 1.5 | High |
| Reasoning UX System | 1.5 | Medium |
| Lite Mode | 1 | Medium |
| **Total** | **10 sessions** | — |

---

## 2. PHASE III ARCHITECTURE OVERVIEW

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WEARABLE DEVICES                             │
│  Oura Ring  │  Apple Watch  │  Garmin  │  Fitbit  │  WHOOP (future) │
└──────┬──────┴───────┬───────┴────┬─────┴────┬─────┴────────────────┘
       │              │            │          │
       ▼              ▼            ▼          ▼
┌─────────────┐  ┌──────────┐  ┌─────────────────────────────────────┐
│ Oura Cloud  │  │HealthKit │  │    Health Connect (Android)         │
│   (OAuth)   │  │ (on-device) │  (on-device, replaces Google Fit) │
└──────┬──────┘  └─────┬─────┘  └───────────────┬───────────────────┘
       │               │                        │
       │ Webhook       │ Background             │ WorkManager
       ▼               │ Delivery               │ + Changelog API
┌─────────────────────────────────────────────────────────────────────┐
│                    APEX OS BACKEND (Cloud Run)                       │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │ Webhook      │  │ Wearable     │  │ Normalization             │ │
│  │ Receivers    │──│ Ingestion    │──│ Pipeline                  │ │
│  │ /api/webhooks│  │ Queue (PubSub)│ │ → DailyMetrics            │ │
│  └──────────────┘  └──────────────┘  └──────────┬─────────────────┘ │
│                                                  │                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────▼─────────────────┐ │
│  │ Recovery     │  │ Wake         │  │ Supabase                   │ │
│  │ Calculator   │──│ Detector     │──│ (Canonical Store)          │ │
│  │              │  │              │  │ → daily_metrics            │ │
│  └──────────────┘  └──────────────┘  │ → user_baselines           │ │
│                                       │ → recovery_scores          │ │
│  ┌──────────────┐  ┌──────────────┐  └──────────┬─────────────────┘ │
│  │ Calendar     │  │ Nudge        │              │                   │
│  │ Service      │──│ Engine       │              │ Sync              │
│  │ (OAuth)      │  │ (Phase 2)    │              ▼                   │
│  └──────────────┘  └──────────────┘  ┌──────────────────────────────┐ │
│                                       │ Firestore                    │ │
│                                       │ (Real-time Client Reads)     │ │
│                                       │ → todayMetrics               │ │
│                                       │ → activeNudges               │ │
│                                       └──────────┬───────────────────┘ │
└──────────────────────────────────────────────────┼───────────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    REACT NATIVE CLIENT                               │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Morning      │  │ Nudge Cards  │  │ Reasoning Panels         │  │
│  │ Anchor       │  │ + "Why?"     │  │ (4-panel expansion)      │  │
│  │ Dashboard    │  │ Expansion    │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ HealthKit    │  │ Health       │  │ Local Metrics            │  │
│  │ Observer     │  │ Connect      │  │ Cache (SQLite)           │  │
│  │ (iOS)        │  │ Client (And) │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Tech Stack Alignment

| Layer | Technology | Notes |
|-------|------------|-------|
| Wearable Cloud APIs | Oura v2, Garmin Health, Fitbit | OAuth 2.0, webhooks |
| Mobile Health APIs | HealthKit (iOS), Health Connect (Android) | On-device, background delivery |
| Backend Compute | Cloud Run (Gen 2) | Auto-scaling, handles webhooks |
| Event Queue | Cloud Pub/Sub | Decouples webhook receivers from workers |
| Canonical DB | Supabase (Postgres 15) | RLS enabled, daily_metrics table |
| Real-time DB | Firebase Firestore | Client subscriptions, low latency |
| Client | React Native (Expo 54) | TypeScript, NativeWind, Reanimated |

---

## 3. RESEARCH SYNTHESIS & GAP ANALYSIS

### Research Documents Incorporated

This plan synthesizes 6 comprehensive research documents:

1. **APEX_OS_WEARABLE_APIS_v1.md** — OAuth flows, rate limits, data schemas for Oura, HealthKit, Health Connect, WHOOP (future), Garmin
2. **APEX_OS_RECOVERY_ALGORITHM_v1.md** — Recovery score formula, baseline calculation, edge case handling (alcohol, illness, travel, menstrual cycle)
3. **APEX_OS_WAKE_DETECTION_v1.md** — Multi-signal algorithm (movement, HR, HRV, time context), background processing for iOS/Android
4. **APEX_OS_CALENDAR_INTEGRATION_v1.md** — Google Calendar freebusy scope, Apple EventKit, meeting load calculation, MVD thresholds
5. **APEX_OS_REALTIME_SYNC_v1.md** — Webhook architecture, polling fallbacks, data freshness SLAs, TypeScript service interfaces
6. **APEX_OS_REASONING_SYSTEM_v1.md** — 4-panel "Why?" UX, animation specs, confidence scoring, accessibility requirements

### Critical Gaps Identified (Co-Founder Analysis)

<gap id="1" severity="high">
<title>No Wearable Fallback UX</title>
<description>
Research assumes all users have Oura/Apple Watch. No defined experience for:
- Users without wearables (manual input)
- Users with unsupported wearables
- First 7 days before baseline established
</description>
<solution>
Implement "Lite Mode" (Component 7) with:
- Phone unlock time as wake proxy
- Manual morning check-in for subjective metrics
- Simplified recovery score using sleep duration + subjective energy
</solution>
</gap>

<gap id="2" severity="medium">
<title>Recovery Score Scientific Honesty</title>
<description>
Research presents recovery formula as validated, but admits:
- No gold-standard validation exists (WHOOP/Oura are heuristics)
- HRV explains less than 50% of actual readiness
- Individual variability is significant
</description>
<solution>
Add "Recovery Score Transparency" to reasoning panel:
- Always display confidence level
- Show which inputs were available vs. missing
- Caveat: "Based on population averages; individual results vary"
</solution>
</gap>

<gap id="3" severity="medium">
<title>Meeting Load Thresholds Unvalidated</title>
<description>
Calendar research cites 4-6 hours as "heavy day" threshold, but sources are industry blogs (Slack, Microsoft), not peer-reviewed studies.
</description>
<solution>
- Default threshold: 4 hours (conservative)
- User configurable: Allow override in settings
- Track correlation: Log whether MVD activation improves user outcomes
</solution>
</gap>

<gap id="4" severity="high">
<title>No "Magic Moment" for Non-Wearable Users</title>
<description>
Wearable users get personalized recovery scores. Non-wearable users get... nothing? This creates a two-tier experience.
</description>
<solution>
Lite Mode provides:
- "Energy Score" based on sleep hours + subjective check-in
- Morning Anchor still fires (based on phone unlock)
- Nudges still work (using defaults, not personalization)
</solution>
</gap>

<gap id="5" severity="low">
<title>Data Overwhelm Prevention</title>
<description>
WHOOP criticism: 8-12 notifications/day causes fatigue. Oura criticism: Too much data without guidance.
</description>
<solution>
- Already addressed by Phase 2 suppression engine
- Reinforce: Max 3 nudges/day unless user opts into "power user" mode
- Progressive disclosure: Show detailed metrics only on tap
</solution>
</gap>

### Competitive Intelligence Integration

**From WHOOP:**
- Traffic light system (red/yellow/green) is effective — adopt for recovery zones
- Strain score is proprietary and unexplainable — avoid black boxes, show our math

**From Oura:**
- 60% weekly engagement with AI Advisor — target similar or higher
- Readiness score contributors (HRV, RHR, sleep balance) — we adopt similar structure but add citations

**Apex OS Differentiator:**
- Every recommendation includes DOI citation — neither competitor does this
- 4-panel "Why?" system with personalized data — neither competitor shows individual correlation

---

## 4. COMPONENT 1: WEARABLE SYNC SERVICE

<component name="WearableSync">

### Scope

Build the backend service that connects to wearable cloud APIs (Oura, Garmin, Fitbit) and normalizes data into `DailyMetrics` format for Apex OS consumption.

### Prerequisites (Read Before Starting)

```
Files to read:
├── PRD Documents/Phase_II_III_Rsearch_Files - Gemini Synthesis/APEX_OS_WEARABLE_APIS_v1.md
├── PRD Documents/Phase_II_III_Rsearch_Files - Gemini Synthesis/APEX_OS_REALTIME_SYNC_v1.md
├── functions/src/services/           # Existing service structure
└── supabase/migrations/              # Existing schema
```

### TypeScript Interfaces

```typescript
// =============================================================================
// FILE: functions/src/types/wearable.types.ts
// =============================================================================

/**
 * Supported wearable data sources.
 * IMPORTANT: Google Fit is DEPRECATED (June 2025). Use Health Connect for Android.
 */
export type WearableSource =
  | 'oura'           // Oura Ring Gen 3/4 (cloud API)
  | 'apple_health'   // Apple HealthKit (on-device)
  | 'health_connect' // Android Health Connect (on-device, replaces Google Fit)
  | 'garmin'         // Garmin Connect (cloud API, requires commercial license)
  | 'fitbit'         // Fitbit (cloud API)
  | 'whoop'          // WHOOP (cloud API, enterprise partnership required)
  | 'manual';        // User-entered data (Lite Mode)

/**
 * OAuth token storage for cloud wearable providers.
 * Tokens are encrypted at rest (AES-256).
 */
export interface WearableIntegration {
  id: string;
  userId: string;
  provider: WearableSource;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  expiresAt: Date | null;
  scopes: string[];
  webhookChannelId: string | null;      // For providers with webhook support
  webhookResourceId: string | null;
  webhookExpiresAt: Date | null;
  lastSyncAt: Date | null;
  lastSyncStatus: 'success' | 'failed' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Normalized daily metrics from any wearable source.
 * This is the canonical format stored in Supabase.
 */
export interface DailyMetrics {
  id: string;
  userId: string;
  date: string;                         // YYYY-MM-DD format

  // Sleep metrics
  sleepDurationHours: number | null;    // Total sleep time in hours (e.g., 7.5)
  sleepEfficiency: number | null;       // Percentage (0-100)
  sleepOnsetMinutes: number | null;     // Time to fall asleep
  bedtimeStart: string | null;          // ISO 8601 timestamp
  bedtimeEnd: string | null;            // ISO 8601 timestamp

  // Sleep stages (percentages of total sleep)
  remPercentage: number | null;         // Target: 20-25%
  deepPercentage: number | null;        // Target: 15-25%
  lightPercentage: number | null;
  awakePercentage: number | null;

  // Heart metrics
  hrvAvg: number | null;                // RMSSD in milliseconds
  hrvMethod: 'rmssd' | 'sdnn' | null;   // Track measurement method
  rhrAvg: number | null;                // Resting heart rate in bpm
  respiratoryRateAvg: number | null;    // Breaths per minute

  // Activity metrics
  steps: number | null;
  activeMinutes: number | null;
  activeCalories: number | null;

  // Temperature
  temperatureDeviation: number | null;  // Celsius deviation from baseline

  // Recovery (calculated, not raw)
  recoveryScore: number | null;         // 0-100 (calculated by RecoveryEngine)
  recoveryConfidence: number | null;    // 0.0-1.0

  // Metadata
  wearableSource: WearableSource;
  rawPayload: object | null;            // Store original for debugging (optional)
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Webhook event envelope received from wearable providers.
 */
export interface WebhookEvent {
  id: string;                           // Unique event ID for idempotency
  provider: WearableSource;
  userExternalId: string;               // Provider's user ID
  eventType: 'sleep' | 'activity' | 'readiness' | 'hrv' | 'rhr' | 'workout';
  occurredAt: Date;
  rawPayload: unknown;                  // Provider-specific payload
  processedAt: Date | null;
  status: 'pending' | 'processed' | 'failed';
}

/**
 * Oura API v2 response types.
 * Reference: https://cloud.ouraring.com/v2/docs
 */
export interface OuraSleepResponse {
  id: string;
  day: string;                          // YYYY-MM-DD
  bedtime_start: string;                // ISO 8601
  bedtime_end: string;                  // ISO 8601
  average_breath: number;               // Breaths per minute
  average_heart_rate: number;           // BPM
  average_hrv: number;                  // RMSSD in milliseconds
  awake_time: number;                   // Seconds
  deep_sleep_duration: number;          // Seconds
  efficiency: number;                   // Percentage (0-100)
  latency: number;                      // Sleep onset in seconds
  light_sleep_duration: number;         // Seconds
  lowest_heart_rate: number;            // BPM
  rem_sleep_duration: number;           // Seconds
  restless_periods: number;
  time_in_bed: number;                  // Seconds
  total_sleep_duration: number;         // Seconds
  type: 'long_sleep' | 'late_nap' | 'rest';
}

export interface OuraReadinessResponse {
  id: string;
  day: string;
  score: number;                        // 0-100
  temperature_deviation: number | null; // Celsius
  temperature_trend_deviation: number | null;
  contributors: {
    activity_balance: number;
    body_temperature: number;
    hrv_balance: number;
    previous_day_activity: number;
    previous_night_sleep: number;
    recovery_index: number;
    resting_heart_rate: number;
    sleep_balance: number;
  };
}

/**
 * Normalization result from any wearable source.
 */
export interface NormalizationResult {
  success: boolean;
  metrics: Partial<DailyMetrics>;
  warnings: string[];                   // Non-fatal issues (e.g., missing HRV)
  errors: string[];                     // Fatal issues (e.g., invalid data)
}
```

### Service Implementation

```typescript
// =============================================================================
// FILE: functions/src/services/wearable/WearableIngestionService.ts
// =============================================================================

import { WearableSource, DailyMetrics, WebhookEvent } from '../../types/wearable.types';
import { OuraClient } from './clients/OuraClient';
import { HealthConnectClient } from './clients/HealthConnectClient';
import { MetricsNormalizer } from './MetricsNormalizer';
import { DailyMetricsRepository } from '../../repositories/DailyMetricsRepository';
import { BaselineService } from '../recovery/BaselineService';

export class WearableIngestionService {
  constructor(
    private readonly ouraClient: OuraClient,
    private readonly normalizer: MetricsNormalizer,
    private readonly metricsRepo: DailyMetricsRepository,
    private readonly baselineService: BaselineService
  ) {}

  /**
   * Handle incoming webhook from wearable provider.
   * IMPORTANT: Respond to webhook within 3 seconds. Queue heavy work.
   */
  async handleWebhook(event: WebhookEvent): Promise<void> {
    // 1. Check idempotency (already processed?)
    const existing = await this.metricsRepo.getWebhookEvent(event.id);
    if (existing?.status === 'processed') {
      console.log(`Webhook ${event.id} already processed, skipping`);
      return;
    }

    // 2. Mark as pending
    await this.metricsRepo.upsertWebhookEvent({
      ...event,
      status: 'pending',
      processedAt: null
    });

    // 3. Fetch full data from provider (webhook payload is often incomplete)
    const userId = await this.resolveUserId(event.userExternalId, event.provider);
    if (!userId) {
      console.error(`Unknown user for ${event.provider}:${event.userExternalId}`);
      await this.metricsRepo.updateWebhookStatus(event.id, 'failed');
      return;
    }

    // 4. Fetch and normalize data based on event type
    let normalizedMetrics: Partial<DailyMetrics>;

    switch (event.provider) {
      case 'oura':
        normalizedMetrics = await this.processOuraEvent(userId, event);
        break;
      case 'fitbit':
        normalizedMetrics = await this.processFitbitEvent(userId, event);
        break;
      default:
        throw new Error(`Unsupported provider: ${event.provider}`);
    }

    // 5. Merge with existing metrics for this date (if any)
    const date = normalizedMetrics.date!;
    const existingMetrics = await this.metricsRepo.getByUserAndDate(userId, date);

    const mergedMetrics: DailyMetrics = {
      ...(existingMetrics || this.createEmptyMetrics(userId, date)),
      ...normalizedMetrics,
      updatedAt: new Date()
    };

    // 6. Calculate recovery score if we have enough data
    if (this.hasMinimumDataForRecovery(mergedMetrics)) {
      const baseline = await this.baselineService.getBaseline(userId);
      const recovery = await this.calculateRecovery(mergedMetrics, baseline);
      mergedMetrics.recoveryScore = recovery.score;
      mergedMetrics.recoveryConfidence = recovery.confidence;
    }

    // 7. Persist to Supabase
    await this.metricsRepo.upsert(mergedMetrics);

    // 8. Sync to Firestore for real-time client access
    await this.syncToFirestore(userId, date, mergedMetrics);

    // 9. Mark webhook as processed
    await this.metricsRepo.updateWebhookStatus(event.id, 'processed');
  }

  /**
   * Backfill historical data for new user.
   * Call during onboarding to populate baseline.
   */
  async backfillUserData(
    userId: string,
    provider: WearableSource,
    startDate: string,
    endDate: string
  ): Promise<{ daysProcessed: number; errors: string[] }> {
    const errors: string[] = [];
    let daysProcessed = 0;

    // Oura allows date range queries
    if (provider === 'oura') {
      const sleepData = await this.ouraClient.fetchSleepRange(userId, startDate, endDate);

      for (const sleep of sleepData) {
        try {
          const normalized = this.normalizer.normalizeOuraSleep(sleep);
          await this.metricsRepo.upsert({
            ...this.createEmptyMetrics(userId, sleep.day),
            ...normalized.metrics,
            wearableSource: 'oura'
          });
          daysProcessed++;
        } catch (err) {
          errors.push(`Failed to process ${sleep.day}: ${err}`);
        }
      }
    }

    return { daysProcessed, errors };
  }

  private async processOuraEvent(
    userId: string,
    event: WebhookEvent
  ): Promise<Partial<DailyMetrics>> {
    const today = new Date().toISOString().split('T')[0];

    switch (event.eventType) {
      case 'sleep':
        const sleepData = await this.ouraClient.fetchLatestSleep(userId);
        return this.normalizer.normalizeOuraSleep(sleepData).metrics;

      case 'readiness':
        const readinessData = await this.ouraClient.fetchLatestReadiness(userId);
        return this.normalizer.normalizeOuraReadiness(readinessData).metrics;

      default:
        return { date: today };
    }
  }

  private hasMinimumDataForRecovery(metrics: DailyMetrics): boolean {
    // Need at least HRV or (RHR + sleep duration)
    return (
      metrics.hrvAvg !== null ||
      (metrics.rhrAvg !== null && metrics.sleepDurationHours !== null)
    );
  }

  private createEmptyMetrics(userId: string, date: string): DailyMetrics {
    return {
      id: `${userId}-${date}`,
      userId,
      date,
      sleepDurationHours: null,
      sleepEfficiency: null,
      sleepOnsetMinutes: null,
      bedtimeStart: null,
      bedtimeEnd: null,
      remPercentage: null,
      deepPercentage: null,
      lightPercentage: null,
      awakePercentage: null,
      hrvAvg: null,
      hrvMethod: null,
      rhrAvg: null,
      respiratoryRateAvg: null,
      steps: null,
      activeMinutes: null,
      activeCalories: null,
      temperatureDeviation: null,
      recoveryScore: null,
      recoveryConfidence: null,
      wearableSource: 'manual',
      rawPayload: null,
      syncedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
```

### Acceptance Criteria

<acceptance_criteria>
1. **OAuth Flow**
   - [ ] User can connect Oura Ring via OAuth 2.0
   - [ ] Access token stored encrypted in `user_integrations` table
   - [ ] Token refresh happens proactively (before 24-hour expiry)
   - [ ] 426 error (Oura app version too old) displays user-friendly message

2. **Webhook Receiver**
   - [ ] Cloud Run endpoint `/api/webhooks/oura` responds within 3 seconds
   - [ ] Webhook signature validated before processing
   - [ ] Duplicate events (same ID) are idempotently ignored
   - [ ] Failed webhooks retry with exponential backoff

3. **Data Normalization**
   - [ ] Oura sleep data normalized to `DailyMetrics` format
   - [ ] HRV stored in milliseconds with method='rmssd'
   - [ ] Sleep stages converted to percentages
   - [ ] All timestamps stored in UTC

4. **Backfill**
   - [ ] New users get 30 days of historical data on connection
   - [ ] Backfill respects rate limits (max 5000 req/5 min for Oura)
   - [ ] Progress reported to user ("Syncing 15 of 30 days...")

5. **Error Handling**
   - [ ] Network failures logged and retried
   - [ ] Invalid data logged but doesn't crash service
   - [ ] User notified of sync failures in app
</acceptance_criteria>

### Anti-Patterns (What NOT to Do)

<anti_patterns>
1. **Never poll from client** — All wearable API calls happen server-side
2. **Never store raw tokens unencrypted** — Always use AES-256 encryption
3. **Never process webhook inline** — Queue to Pub/Sub, respond 204 immediately
4. **Never trust webhook payload** — Always fetch fresh data from API
5. **Never skip idempotency check** — Webhooks can be delivered multiple times
6. **Never mix HRV methods** — RMSSD and SDNN are not directly comparable
</anti_patterns>

</component>

---

## 5. COMPONENT 2: RECOVERY SCORE ENGINE

<component name="RecoveryScoreEngine">

### Scope

Calculate a personalized 0-100 recovery score from normalized wearable data, using a weighted formula based on peer-reviewed research. Include confidence intervals and edge case detection.

### Prerequisites (Read Before Starting)

```
Files to read:
├── PRD Documents/Phase_II_III_Rsearch_Files - Gemini Synthesis/APEX_OS_RECOVERY_ALGORITHM_v1.md
├── Master_Protocol_Library.md                # Protocol science references
└── Component 1 output (DailyMetrics type)
```

### Recovery Formula (Peer-Reviewed Basis)

```
Recovery = (HRV_Score × 0.40) +
           (RHR_Score × 0.25) +
           (Sleep_Quality × 0.20) +
           (Sleep_Duration × 0.10) +
           (Respiratory_Rate × 0.05) -
           Temperature_Penalty

Where:
- All component scores are 0-100
- Temperature_Penalty is 0 to -15 (negative only)
- Final score clamped to 0-100
```

**Scientific Justification:**
- HRV as primary marker: Correlates with autonomic balance and next-day performance (WHOOP MLB study)
- RHR elevation: Indicates incomplete recovery (3-6 bpm increase during overreaching)
- Sleep architecture: Deep + REM sleep essential for physical and cognitive recovery
- Respiratory rate: Early illness indicator (+2-3 breaths/min precedes symptoms by 24-48h)
- Temperature: Detects illness onset (+0.5°C from baseline)

### TypeScript Interfaces

```typescript
// =============================================================================
// FILE: functions/src/types/recovery.types.ts
// =============================================================================

/**
 * User's personalized baselines for recovery calculation.
 * Updated daily with rolling 14-day window.
 */
export interface UserBaseline {
  userId: string;

  // HRV baseline (log-transformed)
  hrvLnMean: number;              // Natural log of RMSSD mean
  hrvLnStdDev: number;            // Std dev of ln(RMSSD)
  hrvCoefficientOfVariation: number; // Normal: 2-20%
  hrvMethod: 'rmssd' | 'sdnn';
  hrvSampleCount: number;

  // RHR baseline
  rhrMean: number;                // BPM
  rhrStdDev: number;              // Typically 2-4 bpm
  rhrSampleCount: number;

  // Respiratory rate baseline
  respiratoryRateMean: number;    // Breaths per minute
  respiratoryRateStdDev: number;

  // Sleep baseline
  sleepDurationTarget: number;    // Minutes (75th percentile of user's sleep)

  // Temperature baseline
  temperatureBaselineCelsius: number;

  // Menstrual cycle tracking (optional)
  menstrualCycleTracking: boolean;
  cycleDay: number | null;        // 1-28
  lastPeriodStart: Date | null;

  // Metadata
  confidenceLevel: 'low' | 'medium' | 'high';
  lastUpdated: Date;
  createdAt: Date;
}

/**
 * Recovery calculation result with full transparency.
 */
export interface RecoveryResult {
  score: number;                  // 0-100
  confidence: number;             // 0.0-1.0
  zone: 'red' | 'yellow' | 'green';

  // Component breakdown (for "Why?" panel)
  components: {
    hrv: {
      raw: number | null;         // Actual value in ms
      score: number;              // 0-100 normalized
      vsBaseline: string;         // e.g., "+12% above baseline"
      weight: 0.40;
    };
    rhr: {
      raw: number | null;
      score: number;
      vsBaseline: string;
      weight: 0.25;
    };
    sleepQuality: {
      efficiency: number | null;
      deepPct: number | null;
      remPct: number | null;
      score: number;
      weight: 0.20;
    };
    sleepDuration: {
      hours: number | null;
      vsTarget: string;           // e.g., "-30 min from target"
      score: number;
      weight: 0.10;
    };
    respiratoryRate: {
      raw: number | null;
      score: number;
      vsBaseline: string;
      weight: 0.05;
    };
    temperaturePenalty: {
      deviation: number | null;
      penalty: number;            // 0 to -15
    };
  };

  // Edge case detection
  edgeCases: {
    alcoholDetected: boolean;
    illnessRisk: 'none' | 'low' | 'medium' | 'high';
    travelDetected: boolean;
    menstrualPhaseAdjustment: boolean;
  };

  // Reasoning for "Why?" panel
  reasoning: string;
  recommendations: RecoveryRecommendation[];

  // Data quality
  dataCompleteness: number;       // 0-100 (what % of inputs were available)
  missingInputs: string[];        // e.g., ['respiratoryRate', 'temperature']
}

export interface RecoveryRecommendation {
  type: 'training' | 'rest' | 'health' | 'recovery';
  headline: string;
  body: string;
  protocols: string[];            // Protocol IDs to activate
  activateMVD?: boolean;
}

/**
 * Confidence factors for recovery score calculation.
 */
export interface ConfidenceFactors {
  dataRecency: number;            // 0-1: Data from last 12h vs 48h+
  sampleSize: number;             // 0-1: Baseline sample count
  correlationStrength: number;    // 0-1: Historical correlation
  userEngagement: number;         // 0-1: Protocol adherence rate
  contextMatch: number;           // 0-1: Calendar/location match
}
```

### Service Implementation

```typescript
// =============================================================================
// FILE: functions/src/services/recovery/RecoveryCalculator.ts
// =============================================================================

import { DailyMetrics } from '../../types/wearable.types';
import { UserBaseline, RecoveryResult, RecoveryRecommendation } from '../../types/recovery.types';

export class RecoveryCalculator {
  /**
   * Calculate recovery score from today's metrics and user's baseline.
   *
   * IMPORTANT: Returns null if baseline not yet established (< 7 days data).
   */
  calculate(
    metrics: DailyMetrics,
    baseline: UserBaseline | null
  ): RecoveryResult | null {
    // Minimum 7 days baseline required
    if (!baseline || baseline.hrvSampleCount < 7) {
      return null;
    }

    // Calculate each component score
    const hrvScore = this.calculateHRVScore(metrics.hrvAvg, baseline);
    const rhrScore = this.calculateRHRScore(metrics.rhrAvg, baseline);
    const sleepQualityScore = this.calculateSleepQualityScore(metrics);
    const sleepDurationScore = this.calculateSleepDurationScore(
      metrics.sleepDurationHours,
      baseline.sleepDurationTarget
    );
    const respiratoryScore = this.calculateRespiratoryScore(
      metrics.respiratoryRateAvg,
      baseline
    );
    const temperaturePenalty = this.calculateTemperaturePenalty(
      metrics.temperatureDeviation,
      baseline.menstrualCycleTracking,
      baseline.cycleDay
    );

    // Detect edge cases
    const edgeCases = this.detectEdgeCases(metrics, baseline);

    // Calculate data completeness
    const { completeness, missing } = this.calculateDataCompleteness(metrics);

    // Weighted composite score
    let rawScore =
      (hrvScore.score * 0.40) +
      (rhrScore.score * 0.25) +
      (sleepQualityScore.score * 0.20) +
      (sleepDurationScore.score * 0.10) +
      (respiratoryScore.score * 0.05) -
      temperaturePenalty.penalty;

    // Apply data completeness factor (reduce score if missing data)
    const adjustedScore = rawScore * (0.7 + (completeness * 0.3));

    // Clamp to 0-100
    const finalScore = Math.max(0, Math.min(100, Math.round(adjustedScore)));

    // Calculate confidence
    const confidence = this.calculateConfidence(baseline, metrics, completeness);

    // Determine zone
    const zone = this.determineZone(finalScore);

    // Generate reasoning text
    const reasoning = this.generateReasoning(finalScore, hrvScore, rhrScore, edgeCases);

    // Generate recommendations
    const recommendations = this.generateRecommendations(finalScore, edgeCases);

    return {
      score: finalScore,
      confidence,
      zone,
      components: {
        hrv: { ...hrvScore, weight: 0.40 },
        rhr: { ...rhrScore, weight: 0.25 },
        sleepQuality: { ...sleepQualityScore, weight: 0.20 },
        sleepDuration: { ...sleepDurationScore, weight: 0.10 },
        respiratoryRate: { ...respiratoryScore, weight: 0.05 },
        temperaturePenalty
      },
      edgeCases,
      reasoning,
      recommendations,
      dataCompleteness: completeness * 100,
      missingInputs: missing
    };
  }

  /**
   * Calculate HRV score using z-score against baseline.
   * Uses natural log scale (HRV is log-normally distributed).
   */
  private calculateHRVScore(
    todayHRV: number | null,
    baseline: UserBaseline
  ): { raw: number | null; score: number; vsBaseline: string } {
    if (todayHRV === null) {
      return { raw: null, score: 60, vsBaseline: 'No HRV data available' };
    }

    const lnToday = Math.log(todayHRV);
    const zScore = (lnToday - baseline.hrvLnMean) / baseline.hrvLnStdDev;

    // Convert z-score to 0-100:
    // +2 SD = 100, baseline = 70, -2 SD = 40, -3 SD = 0
    let score = 70 + (zScore * 15);
    score = Math.max(0, Math.min(100, score));

    // Generate comparison text
    const percentChange = ((todayHRV - Math.exp(baseline.hrvLnMean)) / Math.exp(baseline.hrvLnMean)) * 100;
    const vsBaseline = percentChange >= 0
      ? `+${percentChange.toFixed(0)}% above baseline`
      : `${percentChange.toFixed(0)}% below baseline`;

    return { raw: todayHRV, score, vsBaseline };
  }

  /**
   * Calculate RHR score (inverse: lower RHR = better score).
   */
  private calculateRHRScore(
    todayRHR: number | null,
    baseline: UserBaseline
  ): { raw: number | null; score: number; vsBaseline: string } {
    if (todayRHR === null) {
      return { raw: null, score: 60, vsBaseline: 'No RHR data available' };
    }

    const delta = todayRHR - baseline.rhrMean;
    const zScore = delta / baseline.rhrStdDev;

    // Inverse scoring (lower RHR = better)
    let score = 70 - (zScore * 15);
    score = Math.max(0, Math.min(100, score));

    const vsBaseline = delta >= 0
      ? `+${delta.toFixed(0)} bpm above baseline`
      : `${delta.toFixed(0)} bpm below baseline`;

    return { raw: todayRHR, score, vsBaseline };
  }

  /**
   * Calculate sleep quality score from efficiency and stage percentages.
   */
  private calculateSleepQualityScore(metrics: DailyMetrics): {
    efficiency: number | null;
    deepPct: number | null;
    remPct: number | null;
    score: number;
  } {
    const efficiency = metrics.sleepEfficiency;
    const deepPct = metrics.deepPercentage;
    const remPct = metrics.remPercentage;

    if (efficiency === null) {
      return { efficiency, deepPct, remPct, score: 60 };
    }

    // Efficiency score (50% of sleep quality)
    const efficiencyScore = Math.min(100, efficiency * 1.1); // 90% efficiency = 99 score

    // Deep sleep score (25% of sleep quality, target 15-25%)
    const deepScore = this.scoreAgainstRange(deepPct || 0, 15, 25);

    // REM sleep score (25% of sleep quality, target 20-25%)
    const remScore = this.scoreAgainstRange(remPct || 0, 20, 25);

    const combinedScore = (efficiencyScore * 0.50) + (deepScore * 0.25) + (remScore * 0.25);

    return { efficiency, deepPct, remPct, score: combinedScore };
  }

  private scoreAgainstRange(value: number, targetMin: number, targetMax: number): number {
    if (value >= targetMin && value <= targetMax) return 100;
    if (value < targetMin) return Math.max(0, 50 + (value - targetMin) * 10);
    return Math.max(0, 100 - (value - targetMax) * 5);
  }

  /**
   * Calculate sleep duration score against personal target.
   */
  private calculateSleepDurationScore(
    durationHours: number | null,
    targetMinutes: number
  ): { hours: number | null; vsTarget: string; score: number } {
    if (durationHours === null) {
      return { hours: null, vsTarget: 'No sleep duration data', score: 60 };
    }

    const durationMinutes = durationHours * 60;
    const delta = durationMinutes - targetMinutes;
    const absDelta = Math.abs(delta);

    // Perfect score if within 30 min of target
    if (absDelta <= 30) {
      return { hours: durationHours, vsTarget: 'On target', score: 100 };
    }

    // Penalty: -5 points per 30 min deviation
    const penalty = Math.floor(absDelta / 30) * 5;
    const score = Math.max(0, 100 - penalty);

    const vsTarget = delta >= 0
      ? `+${(delta / 60).toFixed(1)}h above target`
      : `${(delta / 60).toFixed(1)}h below target`;

    return { hours: durationHours, vsTarget, score };
  }

  /**
   * Calculate respiratory rate score.
   * Elevated rate is early illness indicator.
   */
  private calculateRespiratoryScore(
    todayRR: number | null,
    baseline: UserBaseline
  ): { raw: number | null; score: number; vsBaseline: string } {
    if (todayRR === null) {
      return { raw: null, score: 70, vsBaseline: 'No respiratory data' };
    }

    const delta = Math.abs(todayRR - baseline.respiratoryRateMean);

    // Normal variation: ±1 breath/min
    if (delta <= 1.0) {
      return { raw: todayRR, score: 100, vsBaseline: 'Normal range' };
    }

    // Penalty: -15 points per additional breath/min
    const penalty = (delta - 1.0) * 15;
    const score = Math.max(0, 100 - penalty);

    const vsBaseline = todayRR > baseline.respiratoryRateMean
      ? `+${delta.toFixed(1)} breaths/min above baseline`
      : `${delta.toFixed(1)} breaths/min below baseline`;

    return { raw: todayRR, score, vsBaseline };
  }

  /**
   * Calculate temperature penalty (negative only, never boosts score).
   * Respects menstrual cycle tracking to avoid false illness signals.
   */
  private calculateTemperaturePenalty(
    deviation: number | null,
    trackingCycle: boolean,
    cycleDay: number | null
  ): { deviation: number | null; penalty: number } {
    if (deviation === null) {
      return { deviation: null, penalty: 0 };
    }

    // If tracking menstrual cycle, adjust for luteal phase (days 15-28)
    let adjustedDeviation = deviation;
    if (trackingCycle && cycleDay !== null && cycleDay >= 15) {
      // Luteal phase: expect +0.3-0.5°C elevation
      adjustedDeviation = deviation - 0.4; // Reduce effective deviation
    }

    const absDeviation = Math.abs(adjustedDeviation);

    if (absDeviation <= 0.3) return { deviation, penalty: 0 };
    if (absDeviation > 0.5) return { deviation, penalty: 15 };
    if (absDeviation > 0.4) return { deviation, penalty: 10 };
    return { deviation, penalty: 5 };
  }

  /**
   * Detect edge cases that affect recovery interpretation.
   */
  private detectEdgeCases(
    metrics: DailyMetrics,
    baseline: UserBaseline
  ): RecoveryResult['edgeCases'] {
    return {
      alcoholDetected: this.detectAlcohol(metrics, baseline),
      illnessRisk: this.detectIllnessRisk(metrics, baseline),
      travelDetected: false, // TODO: Implement via location/timezone change
      menstrualPhaseAdjustment: baseline.menstrualCycleTracking &&
        (baseline.cycleDay !== null && baseline.cycleDay >= 15)
    };
  }

  /**
   * Detect likely alcohol consumption from metrics signature.
   * Pattern: High RHR + Low HRV + Low REM
   */
  private detectAlcohol(metrics: DailyMetrics, baseline: UserBaseline): boolean {
    if (!metrics.rhrAvg || !metrics.hrvAvg || !metrics.remPercentage) {
      return false;
    }

    const rhrElevated = metrics.rhrAvg > (baseline.rhrMean + 5);
    const hrvSuppressed = metrics.hrvAvg < (Math.exp(baseline.hrvLnMean) * 0.75);
    const remSuppressed = metrics.remPercentage < 15; // Target is 20-25%

    return rhrElevated && hrvSuppressed && remSuppressed;
  }

  /**
   * Detect illness risk from elevated temperature and respiratory rate.
   */
  private detectIllnessRisk(
    metrics: DailyMetrics,
    baseline: UserBaseline
  ): 'none' | 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Temperature (strongest signal)
    if (metrics.temperatureDeviation !== null) {
      if (metrics.temperatureDeviation > 0.5) riskScore += 40;
      else if (metrics.temperatureDeviation > 0.3) riskScore += 20;
    }

    // Respiratory rate
    if (metrics.respiratoryRateAvg !== null) {
      const rrDelta = metrics.respiratoryRateAvg - baseline.respiratoryRateMean;
      if (rrDelta > 2) riskScore += 30;
    }

    // RHR + HRV combined
    if (metrics.rhrAvg !== null && metrics.hrvAvg !== null) {
      const rhrElevated = metrics.rhrAvg > (baseline.rhrMean + 5);
      const hrvSuppressed = metrics.hrvAvg < (Math.exp(baseline.hrvLnMean) * 0.70);
      if (rhrElevated && hrvSuppressed) riskScore += 30;
    }

    if (riskScore >= 70) return 'high';
    if (riskScore >= 40) return 'medium';
    if (riskScore >= 20) return 'low';
    return 'none';
  }

  /**
   * Determine recovery zone (traffic light system).
   */
  private determineZone(score: number): 'red' | 'yellow' | 'green' {
    if (score >= 67) return 'green';
    if (score >= 34) return 'yellow';
    return 'red';
  }

  /**
   * Calculate confidence based on data quality and baseline maturity.
   */
  private calculateConfidence(
    baseline: UserBaseline,
    metrics: DailyMetrics,
    dataCompleteness: number
  ): number {
    let confidence = 0;

    // Data recency (30%)
    const lastSync = new Date(metrics.syncedAt);
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    if (hoursSinceSync < 12) confidence += 0.30;
    else if (hoursSinceSync < 24) confidence += 0.20;
    else confidence += 0.10;

    // Sample size (25%)
    if (baseline.hrvSampleCount >= 30) confidence += 0.25;
    else if (baseline.hrvSampleCount >= 14) confidence += 0.20;
    else if (baseline.hrvSampleCount >= 7) confidence += 0.10;

    // Data completeness (25%)
    confidence += dataCompleteness * 0.25;

    // Coefficient of variation stability (20%)
    if (baseline.hrvCoefficientOfVariation < 10) confidence += 0.20;
    else if (baseline.hrvCoefficientOfVariation < 15) confidence += 0.15;
    else confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  private calculateDataCompleteness(metrics: DailyMetrics): {
    completeness: number;
    missing: string[];
  } {
    const fields = [
      { key: 'hrvAvg', name: 'HRV', weight: 0.40 },
      { key: 'rhrAvg', name: 'Resting Heart Rate', weight: 0.25 },
      { key: 'sleepEfficiency', name: 'Sleep Efficiency', weight: 0.10 },
      { key: 'deepPercentage', name: 'Deep Sleep', weight: 0.05 },
      { key: 'remPercentage', name: 'REM Sleep', weight: 0.05 },
      { key: 'sleepDurationHours', name: 'Sleep Duration', weight: 0.10 },
      { key: 'respiratoryRateAvg', name: 'Respiratory Rate', weight: 0.05 }
    ];

    const missing: string[] = [];
    let completeness = 0;

    for (const field of fields) {
      if ((metrics as any)[field.key] !== null) {
        completeness += field.weight;
      } else {
        missing.push(field.name);
      }
    }

    return { completeness, missing };
  }

  private generateReasoning(
    score: number,
    hrvScore: any,
    rhrScore: any,
    edgeCases: RecoveryResult['edgeCases']
  ): string {
    const parts: string[] = [`Recovery: ${score}%\n`];

    // Primary drivers
    if (hrvScore.raw !== null) {
      if (hrvScore.score < 50) {
        parts.push(`⚠️ HRV is ${hrvScore.vsBaseline}. Your nervous system needs recovery.`);
      } else if (hrvScore.score > 80) {
        parts.push(`✓ HRV is elevated. Strong parasympathetic activity.`);
      }
    }

    if (rhrScore.raw !== null && rhrScore.score < 50) {
      parts.push(`⚠️ RHR ${rhrScore.vsBaseline}. Sign of incomplete recovery.`);
    }

    // Edge cases
    if (edgeCases.illnessRisk === 'high') {
      parts.push(`🚨 Illness risk detected. Temperature and respiratory rate elevated.`);
    }

    if (edgeCases.alcoholDetected) {
      parts.push(`⚠️ Alcohol impact detected. REM sleep suppressed.`);
    }

    if (edgeCases.menstrualPhaseAdjustment) {
      parts.push(`📅 Luteal phase: Baseline adjusted for normal hormonal changes.`);
    }

    return parts.join('\n');
  }

  private generateRecommendations(
    score: number,
    edgeCases: RecoveryResult['edgeCases']
  ): RecoveryRecommendation[] {
    const recs: RecoveryRecommendation[] = [];

    // Score-based recommendations
    if (score >= 70) {
      recs.push({
        type: 'training',
        headline: 'Green light for high-intensity training.',
        body: 'Your recovery supports demanding activity today.',
        protocols: ['morning_movement', 'resistance_training']
      });
    } else if (score >= 40) {
      recs.push({
        type: 'training',
        headline: 'Moderate intensity only.',
        body: 'Avoid max efforts. Zone 2 cardio recommended.',
        protocols: ['morning_movement']
      });
    } else {
      recs.push({
        type: 'rest',
        headline: 'Active recovery only.',
        body: 'Your body needs restoration resources.',
        protocols: ['nsdr', 'breathwork'],
        activateMVD: true
      });
    }

    // Edge case recommendations
    if (edgeCases.illnessRisk === 'high') {
      recs.push({
        type: 'health',
        headline: 'Illness risk detected.',
        body: 'Prioritize rest, hydration, and early sleep.',
        protocols: ['early_sleep_cutoff'],
        activateMVD: true
      });
    }

    if (edgeCases.alcoholDetected) {
      recs.push({
        type: 'recovery',
        headline: 'Alcohol impact detected.',
        body: 'Hydration + light movement will help. Avoid intensity for 24-48h.',
        protocols: ['hydration_protocol']
      });
    }

    return recs;
  }
}
```

### Acceptance Criteria

<acceptance_criteria>
1. **Recovery Calculation**
   - [ ] Score calculated using documented formula with weights
   - [ ] Z-scores use natural log transformation for HRV
   - [ ] All component scores exposed in result (for "Why?" panel)
   - [ ] Score only calculated after 7+ days baseline

2. **Baseline Management**
   - [ ] 14-day rolling window baseline updated daily
   - [ ] Baseline includes coefficient of variation tracking
   - [ ] Rapid baseline changes (±10% in 3 days) flagged for review

3. **Edge Case Detection**
   - [ ] Alcohol detection pattern identified (high RHR + low HRV + low REM)
   - [ ] Illness risk scored 'none' | 'low' | 'medium' | 'high'
   - [ ] Menstrual cycle phase adjusts temperature baseline
   - [ ] Edge cases included in reasoning text

4. **Confidence Scoring**
   - [ ] Confidence 0.0-1.0 based on data quality factors
   - [ ] Low confidence (< 0.4) suppresses nudge entirely
   - [ ] Confidence factors documented in result

5. **Zone Classification**
   - [ ] Green: 67-100 (high-intensity OK)
   - [ ] Yellow: 34-66 (moderate intensity)
   - [ ] Red: 0-33 (active recovery only)
</acceptance_criteria>

### Anti-Patterns (What NOT to Do)

<anti_patterns>
1. **Never calculate recovery without baseline** — Return null, not a guess
2. **Never compare raw HRV across users** — Always use personal z-scores
3. **Never penalize normal menstrual temperature** — Adjust baseline for cycle phase
4. **Never claim precision beyond data quality** — Show confidence level
5. **Never suppress illness warning** — Even on "green" days, flag high illness risk
</anti_patterns>

</component>

---

## 6. COMPONENT 3: WAKE DETECTION SYSTEM

<component name="WakeDetection">

### Scope

Detect when users wake up to trigger Morning Anchor within the optimal 5-15 minute window. Use multi-signal detection from wearables with phone unlock fallback.

### Prerequisites (Read Before Starting)

```
Files to read:
├── PRD Documents/Phase_II_III_Rsearch_Files - Gemini Synthesis/APEX_OS_WAKE_DETECTION_v1.md
├── client/src/services/               # Existing client service structure
└── Component 1 output (wearable integration)
```

### Multi-Signal Detection Algorithm

```
Wake Confidence = f(movement, ΔHR, ΔHRV, time_context)

Signal Weights:
- Movement (sustained 60s+): 30%
- Heart Rate (increase >8%): 25%
- HRV Shift (LF/HF ratio >1.2): 25%
- Time Context (within ±2h of typical): 20%

Confidence Levels:
- High (4/4 signals): Trigger immediately
- Medium (3/4 signals): Wait 5 min, re-check
- Low (≤2 signals): Use fallback
```

### TypeScript Interfaces

```typescript
// =============================================================================
// FILE: functions/src/types/wake.types.ts
// =============================================================================

/**
 * Detected wake event from wearable or fallback.
 */
export interface WakeEvent {
  userId: string;
  wakeTime: Date;
  source: 'oura' | 'healthkit' | 'health_connect' | 'phone_unlock' | 'alarm' | 'prediction' | 'manual';
  confidence: number;             // 0.0-1.0
  signals: {
    movement: boolean;
    heartRate: boolean;
    hrv: boolean;
    timeContext: boolean;
  };
  triggeredMorningAnchor: boolean;
  createdAt: Date;
}

/**
 * User's typical wake patterns for prediction.
 */
export interface WakePattern {
  userId: string;
  weekdayTypicalWake: string;     // HH:MM format
  weekdayVarianceMinutes: number;
  weekendTypicalWake: string;
  weekendVarianceMinutes: number;
  lastUpdated: Date;
}

/**
 * Morning Anchor trigger configuration.
 */
export interface MorningAnchorConfig {
  earliestNotificationTime: string; // HH:MM (user setting, default "05:00")
  idealTriggerWindowMinutes: {
    min: 5;                         // Don't trigger before 5 min post-wake
    max: 15;                        // Trigger by 15 min post-wake
  };
  suppressUntilDataSync: boolean;   // Wait for wearable sync before triggering
}
```

### Acceptance Criteria

<acceptance_criteria>
1. **Oura Wake Detection**
   - [ ] Parse `bedtime_end` from sleep endpoint as wake time
   - [ ] Handle data latency (up to 30 min post-wake)
   - [ ] Multi-signal validation if detailed data available

2. **HealthKit Wake Detection (iOS)**
   - [ ] Query `HKCategoryTypeIdentifierSleepAnalysis` for latest sleep sample
   - [ ] Use `endDate` of most recent "asleep" sample as wake time
   - [ ] Background delivery enabled for real-time detection

3. **Health Connect Wake Detection (Android)**
   - [ ] Query `SleepSessionRecord` using Changelog API
   - [ ] WorkManager scheduled to check around predicted wake time
   - [ ] Handle rate limits gracefully

4. **Phone Unlock Fallback**
   - [ ] iOS: Detect first `willEnterForegroundNotification` after 4 AM
   - [ ] Android: Detect `ACTION_USER_PRESENT` broadcast
   - [ ] Only trigger once per day

5. **Morning Anchor Triggering**
   - [ ] Trigger 5-15 min post-wake detection
   - [ ] Respect user's "earliest notification time" setting
   - [ ] Skip if before 5 AM local (likely false positive)
   - [ ] Push notification with actionable buttons
</acceptance_criteria>

</component>

---

## 7. COMPONENT 4: CALENDAR INTEGRATION

<component name="CalendarIntegration">

### Scope

Integrate with Google Calendar and Apple Calendar to detect meeting load and activate MVD on heavy days. Privacy-first design using free/busy only for Google.

### Prerequisites (Read Before Starting)

```
Files to read:
├── PRD Documents/Phase_II_III_Rsearch_Files - Gemini Synthesis/APEX_OS_CALENDAR_INTEGRATION_v1.md
└── functions/src/services/suppression/  # Existing suppression engine
```

### Meeting Load Thresholds

| Meeting Hours | Classification | Impact | Apex OS Action |
|---------------|---------------|--------|----------------|
| 0-2 hours | Light | Normal productivity | Full protocol day |
| 2-4 hours | Moderate | 10-15% decline | Suppress STANDARD nudges |
| **4-6 hours** | **Heavy** | 25-30% decline | **Activate MVD** |
| **6+ hours** | **Overload** | 40%+ decline | **Full MVD + message** |

### TypeScript Interfaces

```typescript
// =============================================================================
// FILE: functions/src/types/calendar.types.ts
// =============================================================================

/**
 * Meeting load metrics calculated from calendar data.
 */
export interface MeetingLoadMetrics {
  date: string;                   // YYYY-MM-DD
  totalHours: number;             // Total meeting time in hours
  meetingCount: number;
  backToBackCount: number;        // Meetings with <15 min gap
  density: number;                // Meetings per hour of workday
  heavyDay: boolean;              // >= 4 hours
  overload: boolean;              // >= 6 hours
  calculatedAt: Date;
}

/**
 * Calendar integration settings per user.
 */
export interface CalendarIntegration {
  id: string;
  userId: string;
  provider: 'google_calendar' | 'apple_calendar';
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  expiresAt: Date | null;
  scope: 'freebusy' | 'readonly';  // Start with freebusy for privacy
  webhookChannelId: string | null;
  webhookExpiresAt: Date | null;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Daily calendar metrics stored for trend analysis.
 */
export interface DailyCalendarMetrics {
  id: string;
  userId: string;
  date: string;
  meetingHours: number;
  meetingCount: number;
  backToBackCount: number;
  density: number;
  heavyDay: boolean;
  overload: boolean;
  mvdActivated: boolean;
  createdAt: Date;
}
```

### Service Implementation

```typescript
// =============================================================================
// FILE: functions/src/services/calendar/CalendarService.ts
// =============================================================================

import { google } from 'googleapis';
import { MeetingLoadMetrics, CalendarIntegration } from '../../types/calendar.types';

export class CalendarService {
  private readonly MEETING_LOAD_THRESHOLDS = {
    MODERATE: 2,    // 0-2 hours: Normal
    HEAVY: 4,       // 2-4 hours: Suppress STANDARD
    OVERLOAD: 6     // 4+ hours: Activate MVD
  };

  /**
   * Calculate meeting load for today using free/busy API.
   * Privacy-first: Only knows busy blocks, not meeting titles.
   */
  async calculateMeetingLoad(
    userId: string,
    date: Date
  ): Promise<MeetingLoadMetrics> {
    const integration = await this.getIntegration(userId, 'google_calendar');
    if (!integration) {
      // No calendar connected - return zero load
      return this.emptyMetrics(date);
    }

    const oauth2Client = await this.getOAuthClient(integration);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Query free/busy for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        items: [{ id: 'primary' }]
      }
    });

    const busyBlocks = response.data.calendars?.['primary']?.busy || [];

    return this.calculateMetrics(busyBlocks, date);
  }

  private calculateMetrics(
    busyBlocks: Array<{ start?: string; end?: string }>,
    date: Date
  ): MeetingLoadMetrics {
    // Sort by start time
    const sorted = busyBlocks
      .filter(b => b.start && b.end)
      .map(b => ({
        start: new Date(b.start!),
        end: new Date(b.end!)
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    let totalMinutes = 0;
    let backToBackCount = 0;

    for (let i = 0; i < sorted.length; i++) {
      const block = sorted[i];
      const duration = (block.end.getTime() - block.start.getTime()) / (1000 * 60);
      totalMinutes += duration;

      // Detect back-to-back (< 15 min gap)
      if (i > 0) {
        const prevBlock = sorted[i - 1];
        const gap = (block.start.getTime() - prevBlock.end.getTime()) / (1000 * 60);
        if (gap < 15) {
          backToBackCount++;
        }
      }
    }

    const totalHours = totalMinutes / 60;
    const workdayHours = 9; // 9am-6pm assumption
    const density = sorted.length / workdayHours;

    return {
      date: date.toISOString().split('T')[0],
      totalHours,
      meetingCount: sorted.length,
      backToBackCount,
      density,
      heavyDay: totalHours >= this.MEETING_LOAD_THRESHOLDS.HEAVY,
      overload: totalHours >= this.MEETING_LOAD_THRESHOLDS.OVERLOAD,
      calculatedAt: new Date()
    };
  }

  private emptyMetrics(date: Date): MeetingLoadMetrics {
    return {
      date: date.toISOString().split('T')[0],
      totalHours: 0,
      meetingCount: 0,
      backToBackCount: 0,
      density: 0,
      heavyDay: false,
      overload: false,
      calculatedAt: new Date()
    };
  }
}
```

### Acceptance Criteria

<acceptance_criteria>
1. **Google Calendar OAuth**
   - [ ] OAuth flow with `calendar.freebusy` scope only
   - [ ] Incremental authorization (request when user enables MVD feature)
   - [ ] Token refresh before expiry

2. **Meeting Load Calculation**
   - [ ] Sum busy blocks from free/busy API
   - [ ] Detect back-to-back meetings (<15 min gap)
   - [ ] Calculate meeting density (meetings per hour)

3. **Threshold Detection**
   - [ ] 4+ hours triggers `heavyDay = true`
   - [ ] 6+ hours triggers `overload = true`
   - [ ] Store daily metrics for trend analysis

4. **MVD Integration**
   - [ ] Heavy day suppresses STANDARD nudges
   - [ ] Overload activates full MVD + sends message
   - [ ] User can configure personal threshold in settings

5. **Privacy**
   - [ ] Never store meeting titles or attendees
   - [ ] Only store aggregate metrics (hours, count)
   - [ ] Clear messaging: "We only see when you're busy"
</acceptance_criteria>

</component>

---

## 8. COMPONENT 5: REAL-TIME SYNC ARCHITECTURE

<component name="RealtimeSync">

### Scope

Implement the hybrid sync architecture that keeps wearable data fresh using webhooks (cloud) and OS background APIs (mobile), with no client-side polling.

### Prerequisites (Read Before Starting)

```
Files to read:
├── PRD Documents/Phase_II_III_Rsearch_Files - Gemini Synthesis/APEX_OS_REALTIME_SYNC_v1.md
├── functions/src/index.ts              # Existing function exports
└── client/src/services/firebase/       # Existing Firebase setup
```

### Data Freshness SLAs

| Signal | Use Case | Acceptable Freshness | Implementation |
|--------|----------|---------------------|----------------|
| Sleep | Morning recovery | +1-2h after wake | Webhook (Oura) or background delivery (HealthKit) |
| HRV | Daily tracking | Same day | Single fetch per day |
| Steps | Afternoon nudges | ≤30-60 min | OS background collection |
| Resting HR | Recovery calc | ≤2h lag | Bundled with sleep sync |

### Backend Webhook Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WEBHOOK RECEIVER (Cloud Run)                      │
│                                                                      │
│  POST /api/webhooks/oura                                            │
│  ├── 1. Validate signature (HMAC)                                   │
│  ├── 2. Extract event metadata                                       │
│  ├── 3. Publish to Pub/Sub queue                                    │
│  └── 4. Return 204 immediately (< 3 seconds)                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PUB/SUB QUEUE                                     │
│                    (Decouples receiver from worker)                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    WORKER (Cloud Run Job)                            │
│                                                                      │
│  1. Consume message from queue                                       │
│  2. Check idempotency (already processed?)                          │
│  3. Fetch full data from provider API                               │
│  4. Normalize to DailyMetrics                                       │
│  5. Calculate recovery score                                        │
│  6. Upsert to Supabase                                              │
│  7. Sync to Firestore (real-time client reads)                      │
│  8. Mark webhook as processed                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Mobile Background Sync

```typescript
// =============================================================================
// FILE: client/src/services/health/HealthKitObserver.ts (iOS)
// =============================================================================

import { HKHealthStore, HKObserverQuery, HKAnchoredObjectQuery } from 'react-native-healthkit';

export class HealthKitObserver {
  private healthStore: HKHealthStore;
  private observerQueries: HKObserverQuery[] = [];

  /**
   * Setup background delivery for key health metrics.
   * Call in AppDelegate.application(_:didFinishLaunchingWithOptions:)
   */
  async setupBackgroundDelivery(): Promise<void> {
    const dataTypes = [
      { type: 'HKQuantityTypeIdentifierStepCount', frequency: 'hourly' },
      { type: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN', frequency: 'immediate' },
      { type: 'HKCategoryTypeIdentifierSleepAnalysis', frequency: 'immediate' }
    ];

    for (const { type, frequency } of dataTypes) {
      await this.healthStore.enableBackgroundDelivery(type, frequency);

      const query = new HKObserverQuery(type, null, (query, completion, error) => {
        if (error) {
          console.error(`HealthKit observer error for ${type}:`, error);
          completion();
          return;
        }

        // Fetch new data and sync to backend
        this.fetchAndSync(type).finally(() => {
          completion(); // CRITICAL: Must call immediately
        });
      });

      this.healthStore.execute(query);
      this.observerQueries.push(query);
    }
  }

  private async fetchAndSync(dataType: string): Promise<void> {
    // Use anchored query to get only new samples
    const anchor = await this.getStoredAnchor(dataType);
    const results = await this.healthStore.queryAnchoredObjects(dataType, anchor);

    if (results.samples.length > 0) {
      // Store new anchor
      await this.storeAnchor(dataType, results.newAnchor);

      // Sync to backend
      await this.syncToBackend(dataType, results.samples);
    }
  }
}
```

### Acceptance Criteria

<acceptance_criteria>
1. **Webhook Receiver**
   - [ ] Cloud Run endpoint responds < 3 seconds
   - [ ] Signature validation for each provider
   - [ ] Pub/Sub message published for async processing
   - [ ] 204 returned regardless of downstream success

2. **Worker Processing**
   - [ ] Idempotent (duplicate events ignored)
   - [ ] Exponential backoff on provider API failures
   - [ ] Dead letter queue for failed messages
   - [ ] Metrics logged (processing time, success rate)

3. **iOS Background Delivery**
   - [ ] HealthKit background delivery enabled in entitlements
   - [ ] Observer queries survive app termination
   - [ ] Anchored queries fetch only new samples
   - [ ] Completion handler called immediately

4. **Android WorkManager**
   - [ ] Periodic work scheduled for wake window
   - [ ] Changelog API used for incremental sync
   - [ ] Battery/network constraints respected
   - [ ] Doze mode handled gracefully

5. **Firestore Real-time**
   - [ ] `todayMetrics/{date}` document updated after each sync
   - [ ] Client subscribes with `onSnapshot` (no polling)
   - [ ] Optimistic UI updates before server confirmation
</acceptance_criteria>

</component>

---

## 9. COMPONENT 6: REASONING UX SYSTEM

<component name="ReasoningUX">

### Scope

Build the 4-panel "Why?" expansion system that explains every recommendation with mechanism, evidence (DOI), personalized data, and confidence level.

### Prerequisites (Read Before Starting)

```
Files to read:
├── PRD Documents/Phase_II_III_Rsearch_Files - Gemini Synthesis/APEX_OS_REASONING_SYSTEM_v1.md
├── client/src/components/              # Existing component structure
├── Master_Protocol_Library.md          # Protocol citations
└── BRAND_GUIDE.md                       # Design system
```

### 4-Panel Framework

| Panel | Content | Character Limit | Example |
|-------|---------|-----------------|---------|
| **Mechanism** | Physiological explanation | 80-150 chars | "Bright light triggers cortisol release, advancing circadian phase" |
| **Evidence** | Peer-reviewed citation with DOI | 60-120 chars | "Wright et al. (2013). DOI: 10.1016/j.cub.2013.06.039" |
| **Your Data** | Personalized context | 80-150 chars | "Your sleep onset averages 45 min. Morning light correlates with 14 min improvement." |
| **Confidence** | AI confidence level | 30-60 chars | "High confidence — Based on 30+ days of data" |

### Animation Specifications

```css
/* Card Expansion */
animation-duration: 280ms;
animation-timing-function: ease-in-out;

/* Text Fade-In */
animation-duration: 180ms;
animation-timing-function: ease-in;
animation-delay: 50ms;

/* Chevron Rotation */
animation-duration: 250ms;
animation-timing-function: ease-out;
transform: rotate(180deg);
```

### TypeScript Component Interface

```typescript
// =============================================================================
// FILE: client/src/components/ReasoningPanel/ReasoningPanel.types.ts
// =============================================================================

export interface ReasoningPanelProps {
  nudgeId: string;
  isExpanded: boolean;
  onToggle: () => void;

  mechanism: {
    text: string;                 // 80-150 chars
    protocolId: string;           // Reference to Master_Protocol_Library
  };

  evidence: {
    authors: string;              // e.g., "Wright et al."
    year: number;
    title: string;                // Abbreviated if > 40 chars
    doi: string;                  // Full DOI (10.xxxx/xxxxx)
    url: string;                  // https://doi.org/10.xxxx/xxxxx
  };

  userData: {
    text: string;                 // 80-150 chars
    metrics: {
      key: string;                // e.g., "sleepOnset"
      value: number;
      unit: string;
      comparison: string;         // e.g., "vs. 20 min target"
    }[];
  };

  confidence: {
    level: 'high' | 'medium' | 'low';
    score: number;                // 0.0-1.0
    explanation: string;          // e.g., "Based on 30+ days of your data"
  };
}

export interface ConfidenceDisplayConfig {
  high: {
    threshold: 0.7;
    color: '#63E6BE';             // Teal
    label: 'High confidence';
  };
  medium: {
    threshold: 0.4;
    color: '#5B8DEF';             // Blue
    label: 'Medium confidence';
  };
  low: {
    threshold: 0;
    color: '#A7B4C7';             // Gray
    label: 'Limited confidence';
    // Note: Low confidence nudges should be suppressed entirely
  };
}
```

### Accessibility Requirements (WCAG 2.2)

| Requirement | Implementation |
|-------------|----------------|
| Tap target | Minimum 44x44px (iOS) / 48x48px (Android) |
| Color contrast | ≥4.5:1 for text, ≥3:1 for UI elements |
| Screen reader | `accessibilityRole="button"`, `accessibilityState={{ expanded }}` |
| Focus indicator | 3px solid teal with 2px offset |
| Keyboard nav | Tab to focus, Enter/Space to toggle |

### Acceptance Criteria

<acceptance_criteria>
1. **Inline Expansion**
   - [ ] Tap card header to expand/collapse
   - [ ] Animation completes in 280ms with ease-in-out
   - [ ] Content fades in 180ms after expansion starts
   - [ ] Chevron rotates 180° on expand

2. **4-Panel Content**
   - [ ] Mechanism section shows plain-language physiology
   - [ ] Evidence section includes tappable DOI link
   - [ ] Your Data section shows personalized metrics
   - [ ] Confidence badge colored by tier (teal/blue/gray)

3. **DOI Links**
   - [ ] Full URL format: `https://doi.org/10.xxxx/xxxxx`
   - [ ] Opens in in-app browser (WebView)
   - [ ] External link icon (↗) displayed
   - [ ] Tap feedback: 0.7 opacity on press

4. **Accessibility**
   - [ ] VoiceOver/TalkBack announces expansion state
   - [ ] Tap targets meet minimum size requirements
   - [ ] Color contrast verified for all themes
   - [ ] Works with system font scaling up to 200%

5. **Character Limits Enforced**
   - [ ] Mechanism: 80-150 chars
   - [ ] Evidence: 60-120 chars
   - [ ] Your Data: 80-150 chars
   - [ ] Confidence: 30-60 chars
   - [ ] Total: 250-480 chars (no scrolling needed)
</acceptance_criteria>

</component>

---

## 10. COMPONENT 7: LITE MODE (NO-WEARABLE FALLBACK)

<component name="LiteMode">

### Scope

Provide a meaningful experience for users without wearables, using phone unlock detection, manual check-ins, and simplified scoring.

### Why This Matters (Gap #1 and #4)

Research assumed all users have wearables. Without Lite Mode:
- Users without wearables get zero personalization
- First 7 days before baseline = no recovery score
- 30-40% of target market excluded

### Lite Mode Features

| Feature | Wearable Mode | Lite Mode |
|---------|---------------|-----------|
| Wake detection | Wearable sleep end | Phone unlock time |
| Recovery score | HRV + RHR + Sleep stages | Sleep hours + subjective energy |
| Morning Anchor trigger | 5-15 min post-wake | On first app open after 5 AM |
| Personalization | Data-driven correlations | Population averages + defaults |
| Nudge timing | Real-time based on metrics | Fixed schedule + adjustments |

### Lite Mode Energy Score

```
Energy Score = (Sleep_Duration_Score × 0.50) + (Subjective_Energy × 0.50)

Where:
- Sleep_Duration_Score: User-reported hours → 0-100 scale
  - 7-9 hours = 100
  - 6-7 hours = 75
  - 5-6 hours = 50
  - <5 hours = 25

- Subjective_Energy: Morning check-in (1-5 scale) → 0-100 scale
  - 5 = 100
  - 4 = 80
  - 3 = 60
  - 2 = 40
  - 1 = 20
```

### TypeScript Interfaces

```typescript
// =============================================================================
// FILE: functions/src/types/litemode.types.ts
// =============================================================================

/**
 * Lite Mode morning check-in data.
 */
export interface LiteModeCheckIn {
  userId: string;
  date: string;                   // YYYY-MM-DD

  // User-reported metrics
  sleepHoursEstimate: number;     // e.g., 7.5
  subjectiveEnergy: 1 | 2 | 3 | 4 | 5;  // 1=exhausted, 5=energized
  wakeTime: Date | null;          // From phone unlock or manual

  // Calculated
  energyScore: number;            // 0-100
  zone: 'red' | 'yellow' | 'green';

  // Metadata
  source: 'morning_checkin' | 'phone_unlock';
  createdAt: Date;
}

/**
 * Lite Mode user configuration.
 */
export interface LiteModeConfig {
  enabled: boolean;               // Auto-enabled if no wearable connected
  checkInReminderTime: string;    // HH:MM (default: "07:00")
  typicalWakeTime: {
    weekday: string;              // HH:MM
    weekend: string;
  };
  preferredProtocolDifficulty: 'minimal' | 'moderate' | 'full';
}
```

### Morning Check-In UI

```
┌─────────────────────────────────────────────┐
│                                             │
│  🌅 Good morning!                           │
│                                             │
│  How many hours did you sleep?              │
│  ┌───────────────────────────────────┐      │
│  │  ◀  7.5 hours  ▶                 │      │
│  └───────────────────────────────────┘      │
│                                             │
│  How's your energy this morning?            │
│                                             │
│  😴  😐  😊  😄  🔥                         │
│   1   2   3   4   5                         │
│                                             │
│  ┌─────────────────────────────────┐        │
│  │     Continue to Morning Anchor  │        │
│  └─────────────────────────────────┘        │
│                                             │
└─────────────────────────────────────────────┘
```

### Acceptance Criteria

<acceptance_criteria>
1. **Auto-Activation**
   - [ ] Lite Mode auto-enables if no wearable connected after onboarding
   - [ ] Toggle in settings: "I don't have a wearable"
   - [ ] Clear messaging about what's different in Lite Mode

2. **Phone Unlock Wake Detection**
   - [ ] Detect first phone unlock after 4 AM as wake proxy
   - [ ] Trigger Morning Anchor within 5 minutes of unlock
   - [ ] Only trigger once per day

3. **Morning Check-In**
   - [ ] Prompt for sleep hours (slider: 4-12 hours)
   - [ ] Prompt for subjective energy (1-5 emoji scale)
   - [ ] Calculate Energy Score using formula
   - [ ] Store check-in in `lite_mode_checkins` table

4. **Energy Score Display**
   - [ ] Show Energy Score instead of Recovery Score
   - [ ] Same traffic light zones (green/yellow/red)
   - [ ] "Why?" panel explains calculation

5. **Graceful Degradation**
   - [ ] All nudges still work with default timing
   - [ ] No personalized correlations (use population averages)
   - [ ] Encourage wearable connection without being pushy
</acceptance_criteria>

</component>

---

## 11. DATABASE MIGRATIONS

### New Tables for Phase III

```sql
-- =============================================================================
-- Migration: 20251203_phase3_wearables_recovery.sql
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User wearable integrations (OAuth tokens)
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN (
    'oura', 'apple_health', 'health_connect', 'garmin', 'fitbit', 'whoop', 'manual'
  )),
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
  webhook_channel_id TEXT,
  webhook_resource_id TEXT,
  webhook_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'failed', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

-- Daily metrics from wearables
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Sleep metrics
  sleep_duration_hours NUMERIC(4,2),
  sleep_efficiency NUMERIC(5,2),
  sleep_onset_minutes INTEGER,
  bedtime_start TIMESTAMPTZ,
  bedtime_end TIMESTAMPTZ,

  -- Sleep stages (percentages)
  rem_percentage NUMERIC(5,2),
  deep_percentage NUMERIC(5,2),
  light_percentage NUMERIC(5,2),
  awake_percentage NUMERIC(5,2),

  -- Heart metrics
  hrv_avg NUMERIC(6,2),
  hrv_method TEXT CHECK (hrv_method IN ('rmssd', 'sdnn')),
  rhr_avg NUMERIC(5,2),
  respiratory_rate_avg NUMERIC(4,2),

  -- Activity
  steps INTEGER,
  active_minutes INTEGER,
  active_calories INTEGER,

  -- Temperature
  temperature_deviation NUMERIC(4,2),

  -- Recovery (calculated)
  recovery_score INTEGER CHECK (recovery_score >= 0 AND recovery_score <= 100),
  recovery_confidence NUMERIC(3,2) CHECK (recovery_confidence >= 0 AND recovery_confidence <= 1),

  -- Metadata
  wearable_source TEXT NOT NULL CHECK (wearable_source IN (
    'oura', 'apple_health', 'health_connect', 'garmin', 'fitbit', 'whoop', 'manual'
  )),
  raw_payload JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- User baselines for recovery calculation
CREATE TABLE user_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- HRV baseline (log-transformed)
  hrv_ln_mean NUMERIC(6,4),
  hrv_ln_std_dev NUMERIC(6,4),
  hrv_coefficient_of_variation NUMERIC(5,2),
  hrv_method TEXT CHECK (hrv_method IN ('rmssd', 'sdnn')),
  hrv_sample_count INTEGER DEFAULT 0,

  -- RHR baseline
  rhr_mean NUMERIC(5,2),
  rhr_std_dev NUMERIC(4,2),
  rhr_sample_count INTEGER DEFAULT 0,

  -- Respiratory rate
  respiratory_rate_mean NUMERIC(4,2),
  respiratory_rate_std_dev NUMERIC(4,2),

  -- Sleep
  sleep_duration_target INTEGER, -- minutes

  -- Temperature
  temperature_baseline_celsius NUMERIC(4,2),

  -- Menstrual cycle (optional)
  menstrual_cycle_tracking BOOLEAN DEFAULT FALSE,
  cycle_day INTEGER CHECK (cycle_day IS NULL OR (cycle_day >= 1 AND cycle_day <= 35)),
  last_period_start DATE,

  -- Confidence
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')) DEFAULT 'low',

  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recovery scores (historical)
CREATE TABLE recovery_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  score INTEGER CHECK (score >= 0 AND score <= 100),
  confidence NUMERIC(3,2),
  zone TEXT CHECK (zone IN ('red', 'yellow', 'green')),

  -- Component breakdown
  hrv_score NUMERIC(5,2),
  rhr_score NUMERIC(5,2),
  sleep_quality_score NUMERIC(5,2),
  sleep_duration_score NUMERIC(5,2),
  respiratory_score NUMERIC(5,2),
  temperature_penalty NUMERIC(4,2),

  -- Edge cases
  alcohol_detected BOOLEAN DEFAULT FALSE,
  illness_risk TEXT CHECK (illness_risk IN ('none', 'low', 'medium', 'high')),
  travel_detected BOOLEAN DEFAULT FALSE,
  menstrual_phase_adjustment BOOLEAN DEFAULT FALSE,

  -- Data quality
  data_completeness NUMERIC(5,2),
  missing_inputs TEXT[],

  -- Reasoning
  reasoning TEXT,
  recommendations JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- Wake events
CREATE TABLE wake_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wake_time TIMESTAMPTZ NOT NULL,
  source TEXT CHECK (source IN (
    'oura', 'healthkit', 'health_connect', 'phone_unlock', 'alarm', 'prediction', 'manual'
  )),
  confidence NUMERIC(3,2),
  signals JSONB, -- { movement: bool, heartRate: bool, hrv: bool, timeContext: bool }
  triggered_morning_anchor BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar integrations
CREATE TABLE calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google_calendar', 'apple_calendar')),
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT CHECK (scope IN ('freebusy', 'readonly')),
  webhook_channel_id TEXT,
  webhook_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

-- Daily calendar metrics
CREATE TABLE daily_calendar_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meeting_hours NUMERIC(4,2),
  meeting_count INTEGER,
  back_to_back_count INTEGER,
  density NUMERIC(4,2),
  heavy_day BOOLEAN DEFAULT FALSE,
  overload BOOLEAN DEFAULT FALSE,
  mvd_activated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- Webhook events (for idempotency and debugging)
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY, -- Provider's event ID
  provider TEXT NOT NULL,
  user_external_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  raw_payload JSONB,
  status TEXT CHECK (status IN ('pending', 'processed', 'failed')) DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lite Mode check-ins
CREATE TABLE lite_mode_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_hours_estimate NUMERIC(3,1),
  subjective_energy INTEGER CHECK (subjective_energy >= 1 AND subjective_energy <= 5),
  wake_time TIMESTAMPTZ,
  energy_score INTEGER CHECK (energy_score >= 0 AND energy_score <= 100),
  zone TEXT CHECK (zone IN ('red', 'yellow', 'green')),
  source TEXT CHECK (source IN ('morning_checkin', 'phone_unlock')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);
CREATE INDEX idx_recovery_scores_user_date ON recovery_scores(user_id, date DESC);
CREATE INDEX idx_wake_events_user_time ON wake_events(user_id, wake_time DESC);
CREATE INDEX idx_daily_calendar_user_date ON daily_calendar_metrics(user_id, date DESC);
CREATE INDEX idx_webhook_events_status ON webhook_events(status, created_at);

-- Row Level Security
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE wake_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_calendar_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE lite_mode_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can access own integrations"
  ON user_integrations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can access own metrics"
  ON daily_metrics FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can access own baselines"
  ON user_baselines FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can access own recovery scores"
  ON recovery_scores FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can access own wake events"
  ON wake_events FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can access own calendar integrations"
  ON calendar_integrations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can access own calendar metrics"
  ON daily_calendar_metrics FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can access own checkins"
  ON lite_mode_checkins FOR ALL
  USING (auth.uid() = user_id);
```

---

## 12. IMPLEMENTATION SESSIONS

### Session Order (Revised December 4, 2025)

> **Strategic Change:** HealthKit-first approach. Oura deferred due to membership requirements and webhook reliability issues. See `OURA_INTEGRATION_REFERENCE.md` for preserved research.

| Session | Component | Dependencies | Deliverables |
|---------|-----------|--------------|--------------|
| 1 | Database Migrations + Types | None | ✅ COMPLETE — 5 tables, 3 type files |
| 2 | HealthKit Integration (iOS) | Session 1 | iOS background delivery, observer queries, normalization |
| 3 | Recovery Score Engine | Session 2 | Formula implementation, baseline calculation |
| 4 | Wake Detection | Sessions 2-3 | Multi-signal detection, Morning Anchor trigger |
| 5 | Calendar Integration | Session 1 | Google OAuth, meeting load calculation, MVD |
| 6 | Real-time Sync (Firestore) | Sessions 2-5 | Pub/Sub queue, Firestore sync |
| 7 | Reasoning UX | Session 3 | 4-panel component, animations, DOI links |
| 8 | Lite Mode | Sessions 1, 4 | Check-in UI, Energy Score, phone unlock wake |
| 9 | Health Connect (Android) | Session 2 | Android parity with iOS HealthKit |
| 10 | Cloud Wearables (Oura, Garmin) | Session 3 | DEFERRED — OAuth flows, scheduled sync |
| 11 | Integration Testing | All | End-to-end flows verified |

### Session 1: Database Migrations
**Files to create:**
- `supabase/migrations/20251203_phase3_wearables_recovery.sql`

**Acceptance:**
- [ ] `supabase db push` succeeds
- [ ] All tables created with correct constraints
- [ ] RLS policies active
- [ ] Indexes created

### Session 2: HealthKit Integration (iOS)
> **Priority:** This is now the primary wearable data source. HealthKit is free, on-device, and works with Apple Watch (market leader) plus any wearable that syncs to Apple Health (including Oura).

**Files to create:**
- `client/src/services/health/HealthKitService.ts` — Main service class
- `client/src/services/health/HealthKitObserver.ts` — Background delivery observer
- `client/src/services/health/HealthKitNormalizer.ts` — Convert HealthKit → DailyMetrics
- `client/src/hooks/useHealthKit.ts` — React hook for components
- Native module configuration (iOS entitlements, Info.plist)

**Data types to request:**
- `HKCategoryTypeIdentifierSleepAnalysis` — Sleep sessions
- `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` — HRV (note: HealthKit uses SDNN, not RMSSD)
- `HKQuantityTypeIdentifierRestingHeartRate` — Resting HR
- `HKQuantityTypeIdentifierRespiratoryRate` — Respiratory rate
- `HKQuantityTypeIdentifierStepCount` — Steps
- `HKQuantityTypeIdentifierActiveEnergyBurned` — Active calories

**Acceptance:**
- [ ] HealthKit permissions requested correctly (modal with explanation)
- [ ] Background delivery enabled for sleep and HRV
- [ ] Observer queries fire on new data availability
- [ ] Data normalized to `DailyMetrics` format
- [ ] Data synced to backend via `/api/wearables/sync`
- [ ] HRV method stored as 'sdnn' (HealthKit native format)
- [ ] Works with Apple Watch and any HealthKit-compatible wearable

### Session 3: Recovery Score Engine
**Files to create:**
- `functions/src/types/recovery.types.ts` — ✅ Already created (Session 1)
- `functions/src/services/recovery/RecoveryCalculator.ts`
- `functions/src/services/recovery/BaselineService.ts`
- `functions/src/services/recovery/EdgeCaseDetector.ts`

**Acceptance:**
- [ ] Formula calculates with documented weights (HRV 40%, RHR 25%, etc.)
- [ ] Baseline updates daily with 14-day rolling window
- [ ] Edge cases detected (alcohol, illness, travel)
- [ ] Confidence scores match expected ranges
- [ ] Works with HealthKit data (SDNN → recovery score conversion)

### Session 4: Wake Detection
**Files to create:**
- `functions/src/types/wake.types.ts` — ✅ Already created (Session 1)
- `functions/src/services/wake/WakeDetector.ts`
- `client/src/services/wake/PhoneUnlockDetector.ts`
- `client/src/services/wake/HealthKitWakeDetector.ts`

**Acceptance:**
- [ ] Wake detected from HealthKit sleep analysis (`HKCategoryValueSleepAnalysisAsleepCore` end time)
- [ ] Phone unlock fallback works (Lite Mode)
- [ ] Morning Anchor triggers 5-15 min post-wake
- [ ] Multiple wake detection methods ranked by confidence

### Session 5: Calendar Integration
**Files to create:**
- `functions/src/types/calendar.types.ts`
- `functions/src/services/calendar/CalendarService.ts`
- `functions/src/routes/calendar.routes.ts`

**Acceptance:**
- [ ] Google OAuth flow with `calendar.readonly` or `calendar.events.readonly` scope
- [ ] FreeBusy API used (privacy-first: no event details)
- [ ] Meeting load calculated correctly
- [ ] Heavy day (4+ hours) triggers MVD consideration
- [ ] Metrics stored in `daily_metrics` for trends

### Session 6: Real-time Sync (Firestore)
**Files to create:**
- `functions/src/services/sync/SyncOrchestrator.ts`
- `functions/src/services/sync/FirestoreSync.ts`
- Cloud Pub/Sub topic and subscription configuration

**Acceptance:**
- [ ] HealthKit data → Backend → Firestore flow works
- [ ] Firestore `todayMetrics` document updated after each sync
- [ ] Client receives real-time updates via Firestore listeners
- [ ] Idempotency prevents duplicate processing
- [ ] Recovery score synced to Firestore for Morning Anchor

### Session 7: Reasoning UX
**Files to create:**
- `client/src/components/ReasoningPanel/` — 4-panel expansion
- `client/src/components/ConfidenceBadge/` — Tier-colored badge
- `client/src/components/RecoveryBreakdown/` — Component scores
- Animation configurations (Reanimated)

**Acceptance:**
- [ ] 4-panel expansion animates smoothly (280ms spring animation)
- [ ] DOI links open in in-app WebView
- [ ] Confidence badge colored by tier (low=red, medium=yellow, high=green)
- [ ] Accessibility requirements met (VoiceOver labels)
- [ ] Component breakdown shows HRV, RHR, Sleep Quality, etc.

### Session 8: Lite Mode
**Files to create:**
- `client/src/screens/LiteModeCheckIn.tsx` — Morning check-in UI
- `client/src/components/EnergyScoreCard.tsx` — Energy Score display
- `functions/src/services/litemode/LiteModeService.ts` — Energy calculation
- `client/src/services/wake/PhoneUnlockDetector.ts` — Wake detection fallback

**Acceptance:**
- [ ] Auto-activates when no wearable connected
- [ ] Morning check-in captures: sleep hours (slider), energy level (1-5)
- [ ] Energy Score calculated from manual inputs
- [ ] Phone unlock triggers Morning Anchor (Lite Mode wake detection)
- [ ] Nudges still work with lower personalization

### Session 9: Health Connect (Android)
**Files to create:**
- `client/src/services/health/HealthConnectService.ts` — Main service
- `client/src/services/health/HealthConnectNormalizer.ts` — Convert to DailyMetrics
- Native module configuration (AndroidManifest.xml, permissions)

**Acceptance:**
- [ ] Health Connect permissions requested correctly
- [ ] Sleep, HRV, HR, steps data queried
- [ ] Data normalized to `DailyMetrics` format
- [ ] Background sync via WorkManager
- [ ] Parity with iOS HealthKit experience

### Session 10: Cloud Wearables (Oura, Garmin, Fitbit)
> **Status:** DEFERRED until core flow works. See `OURA_INTEGRATION_REFERENCE.md` for Oura research.

**Files to create (when implemented):**
- `functions/src/services/wearable/OuraClient.ts`
- `functions/src/services/wearable/GarminClient.ts`
- `functions/src/routes/oura.routes.ts` — OAuth endpoints
- `functions/src/services/encryption/tokenEncryption.ts` — AES-256

**Acceptance:**
- [ ] OAuth flows for each provider
- [ ] Token encryption (AES-256-GCM)
- [ ] Proactive token refresh (before 24h expiry)
- [ ] Scheduled sync via Cloud Scheduler
- [ ] Data normalized to DailyMetrics

### Session 11: Integration Testing
**Focus:**
- End-to-end flow: HealthKit sync → Recovery calculation → Morning Anchor → Nudges
- Edge cases: No wearable (Lite Mode), missing data, sync failures
- Performance: <5 second Morning Anchor load
- Accessibility: VoiceOver/TalkBack testing
- Platform parity: iOS HealthKit and Android Health Connect

---

## 13. QUALITY GATES

### Before Marking Any Component Complete

- [ ] TypeScript compiles with zero errors
- [ ] No `any` types (use proper interfaces)
- [ ] All acceptance criteria verified
- [ ] Error handling implemented
- [ ] STATUS.md updated with progress
- [ ] Changes committed and pushed

### Before Marking Phase III Complete

- [ ] All 10 components functional (Sessions 1-10)
- [ ] End-to-end flow tested with real HealthKit data (iOS)
- [ ] Lite Mode fallback tested (no wearable)
- [ ] Recovery score matches expected values for test data
- [ ] Morning Anchor triggers within 15 min of wake
- [ ] Reasoning panel displays correctly
- [ ] No console errors in production build
- [ ] Health Connect parity with HealthKit (Android)

---

## 14. OPEN QUESTIONS FOR HUMAN DECISION

### Question 1: Wearable Aggregator
**Context:** Research recommends using an aggregator (Terra, Rook) to simplify multi-vendor integration.
**Trade-off:**
- Direct integration: More control, no vendor lock-in, higher maintenance
- Aggregator: Faster development, unified schema, monthly cost ($0.05-0.10/user)

**Decision needed:** Use aggregator or direct integration for MVP?

### Question 2: WHOOP Partnership
**Context:** WHOOP API requires enterprise partnership (2-4 week approval).
**Question:** Initiate partnership application now, or defer to post-launch?

### Question 3: Meeting Load Threshold
**Context:** Research suggests 4 hours as "heavy day," but this is not peer-reviewed.
**Question:** Should users be able to configure their own threshold in settings?

### Question 4: Lite Mode Prominence
**Context:** Lite Mode provides degraded experience vs. wearable users.
**Question:** Should we actively encourage wearable connection, or treat Lite Mode as equal?

### Question 5: Recovery Score Display During Baseline
**Context:** First 7 days, no recovery score is available.
**Question:** Show "Building your baseline..." or hide the metric entirely?

---

## APPENDIX: REFERENCE LINKS

### Wearable API Documentation
- [Oura API v2](https://cloud.ouraring.com/v2/docs)
- [Apple HealthKit](https://developer.apple.com/documentation/healthkit)
- [Health Connect (Android)](https://developer.android.com/health-and-fitness/health-connect)

### Google Calendar API
- [Calendar API Overview](https://developers.google.com/workspace/calendar/api/guides/overview)
- [Push Notifications](https://developers.google.com/workspace/calendar/api/guides/push)

### Recovery Science
- WHOOP: "How to Use Heart Rate Variability (HRV) for Training"
- Kubios: "HRV Readiness Score" methodology

### Animation Guidelines
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/motion)
- [Material Design Motion](https://m3.material.io/styles/motion/overview)

---

*End of PHASE_III_IMPLEMENTATION_PLAN.md*
*Version 1.0.0 | December 3, 2025 | Claude Opus 4.5*
