<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Before running the following research prompt, understand our project from our project files, the instructions, etc. Think critically understanding Best Practises for December 2025.

## Research Prompt 6: Real-time Sync Architecture

**Purpose:** Design the data sync architecture for keeping wearable data fresh without draining battery or hitting rate limits.

---

### PROMPT 6: REAL-TIME WEARABLE DATA SYNC ARCHITECTURE

```
I'm building a wellness app that needs fresh wearable data to provide timely recommendations. I need to design a sync architecture that balances data freshness, battery life, and API limits.

CONTEXT:
- Multiple data sources: Oura, Apple HealthKit, Google Fit
- Data needed: HRV, sleep stages, steps, resting HR
- Use cases: Morning recovery score, afternoon energy estimate, sleep tracking
- Platform: React Native with Firebase/Supabase backend

RESEARCH QUESTIONS:

1. **Sync Strategies Comparison:**
   - Webhook-based (real-time push)
   - Polling-based (scheduled pull)
   - Hybrid (webhook for some, polling for others)
   - What do top health apps (WHOOP, Oura, Fitbit) use?
   - Pros/cons of each approach for mobile wellness apps

2. **Webhook Implementation:**
   - Which wearable APIs support webhooks? (Oura, Garmin, Fitbit)
   - Webhook reliability and retry policies
   - How to handle webhook failures
   - Webhook payload structure and verification
   - Backend infrastructure for webhook receivers

3. **Polling Optimization:**
   - Optimal polling intervals for different data types
   - Smart polling (increase frequency after wake, decrease overnight)
   - Rate limit management across multiple users
   - Backoff strategies when limits are hit
   - Queue-based polling for scalability

4. **Mobile Background Sync:**
   - iOS background app refresh limitations
   - iOS BGTaskScheduler for periodic updates
   - Android WorkManager for background sync
   - HealthKit background delivery setup
   - Google Fit Recording API for passive collection

5. **Data Freshness Requirements:**
   - How fresh does sleep data need to be? (acceptable: +2 hours)
   - How fresh does HRV need to be? (acceptable: same-day)
   - How fresh does step count need to be? (acceptable: +1 hour)
   - Trade-offs between freshness and battery/quota

6. **Architecture Design:**
   - Client-side sync vs. server-side sync
   - Caching strategies (local-first with sync)
   - Conflict resolution for multi-device scenarios
   - Data normalization pipeline
   - Event-driven architecture for real-time UI updates

7. **Scalability Considerations:**
   - Handling 10K, 100K, 1M users
   - Database design for time-series wearable data
   - Archiving old data (keeping 90 days hot, rest cold)
   - Cost optimization (API calls, storage, compute)

DELIVERABLES NEEDED:
- Recommended sync strategy per data source
- Polling interval table
- Background sync implementation (iOS/Android)
- Backend architecture diagram
- Data flow diagram (wearable → API → backend → client)
- TypeScript service interfaces
- Scalability recommendations
- Cost estimation model
```

Here’s the architecture and recommendations synthesized for Apex OS, tuned to December 2025 best practices and your PRD rules (“no polling where real‑time is available”, battery-aware, evidence-grade reliability).

***

## 1. Recommended Sync Strategy by Source \& Signal

### High-level strategy

- **Oura \& Other Cloud Wearables (Garmin, Fitbit, etc.)**
    - **Primary:** Server-side **webhooks → event queue → worker fetch**
    - **Secondary:** Low-frequency **catch-up polling** for gaps / missed events
- **Apple HealthKit / Google Fit**
    - **Primary:** **On-device passive collection + background delivery APIs**
    - **Secondary:** Server-side sync only for aggregated summaries (DailyMetrics)


### Per source / data type

| Source | Signals | Strategy | Freshness Target |
| :-- | :-- | :-- | :-- |
| **Oura Cloud** | Sleep, HRV, RHR, readiness | Webhooks + on-demand fetch | Sleep: **+1–2h** after wake; HRV: same day |
| **Garmin/Fitbit** | Steps, HR, sleep, HRV | Webhooks (subscriptions) + throttled polling | Steps: **≤ 30–60 min** lag |
| **Apple HealthKit** | Steps, HRV, Sleep | HKBackgroundDelivery + observer queries on device | Steps: **≤ 15–30 min**, HRV: daily |
| **Google Fit** | Steps, HR, sleep | Recording API + History API | Steps: **≤ 30–60 min**, Sleep: +1–2h |

**Key pattern:**

- **Cloud vendors → server webhooks**
- **Phone OS aggregators → mobile background delivery**

***

## 2. Sync Strategies: Webhook vs Polling vs Hybrid

### Webhooks (push)

**Used for:** Oura, Fitbit, Garmin, aggregators like Terra, Rook, SpikeAPI.

**Pros**

- Near real-time, low-latency (minutes after device sync)(https://tryterra.co/integrations/oura),(https://cloud.ouraring.com/v2/docs)[^1][^2]
- Great for **battery** (no client polling) and **API quotas**
- Natural fit with event-driven backend (Cloud Run/Firebase Functions, Pub/Sub)

**Cons**

- Requires **public, secure endpoint** with strict SLAs (e.g., Fitbit disables endpoints with >10% failures or >3s latency)(https://stackoverflow.com/questions/16195289/fitbit-subscription-api)[^3]
- Must implement **retry, idempotency, and queueing**; misconfig can drop events
- Subscription management (create/update webhooks) can be brittle (e.g., Oura webhook issues mid‑2025)(https://www.reddit.com/r/ouraring/comments/1nqj4ua/oura_api/)[^4]


### Polling (pull)

**Used for:**

- Historical backfill, data correction
- Vendors without webhook support
- Fallback when webhooks are flaky

**Pros**

- Simple to reason about
- Client or server controlled cadence
- Works even if webhooks temporarily fail

**Cons**

- **Battery risk** if done from device
- Easy to blow **rate limits** at scale (Fitbit: 150 req/user/hour)(https://stackoverflow.com/questions/16195289/fitbit-subscription-api)[^3]
- Not “real-time” unless intervals are aggressive (and therefore costly)


### Hybrid (recommended)

- **Webhook as “change notification”** → enqueue job → worker fetches latest data.
- **Daily or hourly catch-up polling** for:
    - Users with no webhook support
    - Filling missed events / API brownouts
- Fits Apex rule in PRD: **“Never Poll any API” from the client**; only controlled server-side polling allowed.

***

## 3. Webhook Implementation Details

### 3.1 Which APIs support webhooks (Dec 2025)

- **Oura API v2**
    - Official webhooks for sleep, readiness, activity, etc.(https://cloud.ouraring.com/v2/docs)[^2]
    - Issues reported in 2025 around creating new subscriptions but read/update existing still work(https://www.reddit.com/r/ouraring/comments/1nqj4ua/oura_api/)[^4]
- **Fitbit**
    - Subscription/webhook API; sends notifications on user sync. Payload = update notification, **not full data**; you must call their APIs to fetch details(https://stackoverflow.com/questions/16195289/fitbit-subscription-api).[^3]
- **Garmin**
    - Health API / Garmin Connect subscriptions via webhooks (standard in 2024–2025 health integrations).
- **Aggregators (Terra, Rook, SpikeAPI)**
    - Provide normalized, webhook-pushed data with retries and unified schemas(https://tryterra.co/integrations/oura),(https://docs.tryrook.io/data-sources/oura/),(https://docs.spikeapi.com/sdk-docs/ios/background-delivery).[^5][^6][^1]

**Recommendation for Apex OS:** strongly consider using **an aggregator (Terra/Rook/Spike)** to:

- Offload vendor-specific OAuth, webhook quirks, and rate limit juggling.
- Get normalized HRV/sleep/steps across Oura/WHOOP/Garmin/Fitbit.


### 3.2 Reliability, retries, and failure handling

- **Webhook receiver constraints:**
    - Respond **< 3s**; Fitbit disables if 10% failures or slow responses(https://stackoverflow.com/questions/16195289/fitbit-subscription-api)[^3]
    - Always respond 2xx/204 as quickly as possible; **never** do heavy work inline.
- **Pattern:**

1. Webhook arrives at Cloud Run / Firebase HTTPS Function (`/api/webhooks/oura`, `/api/webhooks/fitbit`, `/api/webhooks/terra`).
2. Validate signature / auth header (each vendor’s HMAC / secret).
3. Write a tiny message to **Pub/Sub / Firestore “webhook_events”** and immediately return HTTP 204.
4. Downstream worker processes asynchronously (fetches fresh data, writes Supabase + Firestore).
- **Idempotency:**
    - Use `event_id` from vendor or composite `(source, user_id, timestamp, type)` to detect duplicates.
    - Store processed events (or last processed change token) in Supabase.
- **Retries \& dead letters:**
    - Rely on vendor’s own retry strategy (Fitbit: exponential backoff; Oura/Terra similar).
    - For your workers, implement:
        - **Exponential backoff** on 429/5xx from vendor.
        - **Dead-letter queue** if >N retries so you can investigate.


### 3.3 Payload structure \& verification

- **Fitbit:**
    - Subscriptions send minimal change-notification JSON; your subscriber URL must handle **GET with `verify` query** for verification and POST with notifications(https://stackoverflow.com/questions/16195289/fitbit-subscription-api).[^3]
- **Oura:**
    - Oura v2 webhooks provide event type (e.g., `sleep`, `daily_readiness`) and data or URLs to fetch more(https://cloud.ouraring.com/v2/docs).[^2]
- **Aggregators:**
    - Typically push normalized JSON for sleep, activity, readiness within **minutes of event completion**(https://tryterra.co/integrations/oura),(https://docs.tryrook.io/data-sources/oura/).[^1][^5]

***

## 4. Polling Optimization Strategy

Use **server-side polling only**, and **only** for:

- Historical backfill (e.g., first 30 days of Oura history).
- Catch-up when webhooks fail.
- Vendors with no push support.


### 4.1 Recommended polling intervals (server-side)

**Baseline (for non-webhook or fallback paths):**


| Data Type | Interval (active hours) | Interval (overnight) |
| :-- | :-- | :-- |
| Steps | **30–60 min** | 2–3 hours |
| Resting HR | 1–2 hours | 2–3 hours |
| HRV (RMSSD) | **1–2 times per day** (e.g., morning \& evening) | Not needed frequent overnight |
| Sleep summary | Once after expected wake (e.g., wake + 1h) and **once more** mid-morning | N/A |

### 4.2 Smart polling

- Use **user timezone + circadian heuristics**:
    - Increase poll during **06:00–10:00** and **15:00–19:00** local for “morning recovery” and “afternoon energy”.
    - Lower poll frequency overnight; rely on **single “sleep complete” fetch** after device sync.
- Use Apex’s **DailyMetrics** model and “wake detection” logic from PRD:
    - If no new sleep data by **wake+2h**, trigger a **one-off fetch**.


### 4.3 Rate-limit management

- Centralize **per-provider quotas**:
    - Track `(provider, user_id) → last_fetch_at, last_window_count`.
    - For Fitbit: keep api calls **<150 req/user/hour** with headroom(https://stackoverflow.com/questions/16195289/fitbit-subscription-api).[^3]
- Implement **exponential backoff** when hitting 429:
    - E.g., 1 min → 5 min → 30 min, plus flag user for “data delayed” state (UI copy).


### 4.4 Queue-based polling

- Cron-like jobs enqueue **“segment polling tasks”**:
    - Example: “poll_steps:provider=fitbit:segment=users_1_1000”.
- Worker consumes, fetches for that batch, writes to Supabase \& Firestore.

***

## 5. Mobile Background Sync (iOS \& Android)

### 5.1 iOS – HealthKit \& BGTaskScheduler

**Key APIs:**

- `HKHealthStore.enableBackgroundDelivery(for:frequency:withCompletion:)` – pushes changes even when app is backgrounded or terminated(https://developer.apple.com/documentation/HealthKit/HKHealthStore/enableBackgroundDelivery(for:frequency:withCompletion:)),(https://stackoverflow.com/questions/26375767/healthkit-background-delivery-when-app-is-not-running).[^7][^8]
- `HKObserverQuery` and `HKAnchoredObjectQuery` – observe and fetch new samples.

**Pattern:**

1. In `AppDelegate.application(_:didFinishLaunchingWithOptions:)`:
    - Create `HKHealthStore`.
    - Request permissions for steps, HRV, sleep.
    - Configure `HKObserverQuery` for each data type.
    - Call `enableBackgroundDelivery` with frequency:
        - Steps: `.hourly` or `.immediate` for more frequent updates (iOS 17 confirms immediate can work while app is terminated)(https://stackoverflow.com/questions/26375767/healthkit-background-delivery-when-app-is-not-running).[^7]
        - HRV: `.daily`.
        - Sleep: `.daily` or `.immediate` near expected wake.
2. In the observer callback:
    - Use `HKAnchoredObjectQuery` to fetch new samples.
    - Persist locally (SQLite/Realm/AsyncStorage) and update UI via React Native bridge.
    - Optionally, sync summary metrics to backend when network OK \& within usage budget.
3. Use **BGTaskScheduler** for “catch-up” or aggregation tasks:
    - Register `BGAppRefreshTask` (e.g., `com.apexos.healthsync`) in Info.plist and at launch(https://developer.apple.com/documentation/backgroundtasks/bgtaskscheduler),(https://codepushgo.com/blog/ios-background-task/).[^9][^10]
    - In handler, perform **lightweight aggregation** (e.g., recalc daily metrics, push to server) within 30s limit.

**Important constraints:**

- iOS heavily throttles background work; **HK background delivery** is your main reliable path for *passive* sync, not active polling.
- Widget updates: rely on HK delivery + `WidgetCenter.reloadTimelines` instead of additional network fetches.


### 5.2 Android – Google Fit + WorkManager

**Key components:**

- **Google Fit Recording API** – passive collection (steps, HR, etc.) without app running.
- **History API** – batched reads for new data.
- **WorkManager** – reliable background jobs with constraints (network, battery).

**Pattern:**

1. Use Recording API to **subscribe** to steps, HR, sleep.
2. Schedule a `PeriodicWorkRequest`:
    - Steps: every **30–60 min**.
    - HRV: daily or 2x/day.
    - Sleep: run once in morning (wake+1–2h).
3. In worker:
    - Use History API to fetch deltas since last anchor.
    - Write to local DB and send summary to backend (respecting network \& battery constraints).

***

## 6. Data Freshness Requirements \& Trade-offs

### Recommended SLAs (aligned with your use-cases)

| Signal | Use Cases | Acceptable Freshness | Rationale |
| :-- | :-- | :-- | :-- |
| Sleep stages | Morning recovery score, sleep insights | **+1–2h** after wake | Oura/WHOOP data often available within minutes of phone sync; a 1–2h window is acceptable for “Morning Anchor” if copy explains data freshness. |
| HRV | Daily recovery, trend tracking | **Same day (e.g., 1–3 points/day)** | HRV is noisy intra-day; daily aggregates are sufficient for your protocol gating. |
| Resting HR | Recovery, strain | **≤ 2h** lag | Reasonably stable; small delay fine. |
| Steps / Activity | Afternoon energy, movement nudges | **≤ 30–60 min** | For ambient nudges, 30–60 min lag feels real-time enough. |

**Trade-off guidance:**

- **Never burn battery for sub-5-minute granularity**; your product isn’t ECG monitoring.
- Favor **aggregated DailyMetrics** pipeline:
    - Use fine-grained samples locally (for user-facing charts) but only sync **DailyMetrics** objects (HRVavg, steps, sleepDurationHours, etc.) to Supabase/Firestore as defined in PRD.

***

## 7. Architecture Design

### 7.1 Client-side vs Server-side sync

**Client-side (phone) responsibilities:**

- Integrate with **HealthKit** / **Google Fit**:
    - Gather raw samples and compute local aggregates.
    - Drive UI and offline experience.
- Expose a **SyncService** to:
    - Push DailyMetrics summaries \& protocol logs to backend.
    - Handle token refresh UX for cloud wearables.

**Server-side responsibilities:**

- Manage **OAuth and webhooks** for Oura/Fitbit/Garmin or an aggregator.
- Normalize all vendor payloads into **DailyMetrics** (as in PRD) and protocol logs.
- Drive Apex’s **nudgeEngine** and recovery calculations.

Given your **hybrid Firebase + Supabase** setup:

- **Firestore**: real-time UI state (“today’s DailyMetrics \& nudges”).
- **Supabase/Postgres**: long-term, canonical time-series (DailyMetrics, ProtocolLog, Nudge).


### 7.2 Caching \& conflict resolution

- Use **local-first**:
    - Local DB as source for graphs and last 7 days.
    - On app open, **merge** server metrics:
        - If conflicts (same date, different values), prefer **server** as canonical unless user has explicit local-only data (e.g., manual logs).
- Multi-device:
    - All devices sync via Supabase/Firestore.
    - On device boot, fetch **DailyMetrics** for last 14 days and update local cache; any differences are overwritten by server.


### 7.3 Data normalization pipeline

1. **Ingestion layer:** webhook or mobile sync → raw vendor payload.
2. **Normalization worker:** convert to internal `DailyMetrics` structure:
    - Normalize HR units (ms), BPM.
    - Map vendor sleep stages → `REM`, `DEEP`, `LIGHT`, `AWAKE` percentages.
    - Store raw if needed in cold storage (e.g., BigQuery) but don’t expose raw to core nudge engine.
3. **Derived metrics:** compute `recoveryscore` using your PRD formula (HRV, sleepEfficiency, sleepDurationScore, RHRDelta).
4. **Storage:** write:
    - **Supabase.daily_metrics** (canonical).
    - **Firestore.dailyMetricsToday** for fast client reads \& triggers for `wearablesSync` function already mentioned in PRD.

### 7.4 Event-driven UI updates

- **Server → Firestore:** when DailyMetrics or new Nudges computed.
- **Client:** React Native subscribes to Firestore document(s):
    - `users/{id}/todayMetrics/{date}`
    - `users/{id}/nudges`
- Morning Anchor widget uses Firestore as real-time source (no client polling).

***

## 8. Scalability \& Cost

### 8.1 Time-series database design

- In **Supabase/Postgres**:

```sql
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  date DATE,
  sleep_duration_hours NUMERIC,
  sleep_efficiency NUMERIC,
  sleep_onset_minutes NUMERIC,
  rem_percentage NUMERIC,
  deep_percentage NUMERIC,
  hrv_avg NUMERIC,
  rhr_avg NUMERIC,
  recovery_score NUMERIC,
  steps BIGINT,
  activity_minutes BIGINT,
  strain_score NUMERIC,
  wearable_source TEXT,
  synced_at TIMESTAMPTZ,
  UNIQUE (user_id, date)
);
```

- Index on `(user_id, date desc)` for last-30-days queries.


### 8.2 Retention policy

- **Hot data (90 days):**
    - Full DailyMetrics and nudge logs in primary Postgres.
    - Firestore mirrors “today + last 7 days” for fast UI.
- **Warm/cold data (>90 days):**
    - Move to cheaper storage:
        - BigQuery or S3/Parquet, partitioned by month.
    - Roll-up daily metrics if necessary (e.g., weekly averages).


### 8.3 Scaling user counts

- **10K users:**
    - Single Cloud Run/Firebase region, modest Pub/Sub usage.
    - Webhook traffic manageable on single service.
- **100K users:**
    - Partition workers by provider.
    - Rate-limit aware schedulers per vendor.
    - Horizontal autoscaling of Cloud Run jobs based on Pub/Sub backlog.
- **1M users:**
    - Mandatory:
        - Aggregator use (Terra/Rook) for multi-vendor scaling.
        - Strict quotas and usage analytics per provider.
    - Storage:
        - Postgres for last 6–12 months, older in BigQuery.
    - Potentially separate **read vs write** DB replicas.


### 8.4 Rough cost levers

- **Cloud vendor API costs / rate overages**
    - Primary lever is **polling frequency**. Your hybrid webhook-first approach minimizes this.
- **Cloud infra:**
    - Pub/Sub + Cloud Run scale with event volume.
    - Firestore reads primarily from daily doc(s): keep doc fan-out low (1 doc/day/user for metrics + a small collection for nudges).
- **Storage:**
    - DailyMetrics per user/day is tiny; 1M users * 365 days ≈ 365M rows.
    - Postgres + BigQuery partitioning keeps performance OK with right indexing.

***

## 9. Polling Interval Table (Condensed)

| Provider / Path | Data | Interval | Notes |
| :-- | :-- | :-- | :-- |
| **Oura webhook** | All | N/A (push) | Only backfill or gap-repair via polling |
| **Oura fallback poll** | Sleep | wake + 1h; retry at +3h | Max 2 fetches/day per user |
| **Fitbit webhook** | All | N/A (push) | Must fetch data via API on event |
| **Fitbit fallback** | Steps | 30–60 min (day), 2–3h night | Obey 150 req/user/hour |
| **HealthKit (HK)** | Steps | `.immediate` or `.hourly` background delivery | No manual polling |
| **HealthKit** | HRV, Sleep | `.daily` / `.immediate` around wake | Single daily sync sufficient |
| **Google Fit** | Steps | 30–60 min via WorkManager | Uses Recording+History APIs |
| **Google Fit** | Sleep/HRV | Daily at morning | Use History API; 2 calls/day |


***

## 10. TypeScript Service Interfaces (Backend-centric)

Sketching key interfaces for your Node/Cloud Run services:

```ts
// Shared types
export type WearableSource = 'oura' | 'fitbit' | 'garmin' | 'apple_health' | 'google_fit' | 'aggregator';

export interface DailyMetrics {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  sleepDurationHours?: number;
  sleepEfficiency?: number; // 0-100
  sleepOnsetMinutes?: number;
  remPercentage?: number;
  deepPercentage?: number;
  hrvAvg?: number;   // ms
  rhrAvg?: number;   // bpm
  recoveryScore?: number; // 0-100
  steps?: number;
  activityMinutes?: number;
  strainScore?: number;
  wearableSource: WearableSource;
  syncedAt: string; // ISO 8601
}

// Webhook event envelope
export interface WebhookEvent {
  id: string;
  provider: WearableSource;
  userExternalId: string;
  type: 'sleep' | 'activity' | 'readiness' | 'hrv' | 'rhr';
  occurredAt: string; // ISO 8601
  rawPayload: unknown;
}

// Core service interfaces
export interface WearableIngestionService {
  handleWebhook(event: WebhookEvent): Promise<void>;
  backfillUserData(userId: string, provider: WearableSource, startDate: string, endDate: string): Promise<void>;
}

export interface ProviderClient {
  fetchSleep(userExternalId: string, date: string): Promise<unknown>;
  fetchDailyMetrics(userExternalId: string, date: string): Promise<DailyMetrics>;
  fetchActivity(userExternalId: string, start: string, end: string): Promise<unknown>;
}

export interface MetricsNormalizationService {
  normalizeSleep(payload: unknown, provider: WearableSource): Promise<Partial<DailyMetrics>>;
  normalizeActivity(payload: unknown, provider: WearableSource): Promise<Partial<DailyMetrics>>;
  computeRecoveryScore(metrics: Partial<DailyMetrics>): number;
}

export interface DailyMetricsRepository {
  upsert(metrics: DailyMetrics): Promise<void>;
  getByUserAndDate(userId: string, date: string): Promise<DailyMetrics | null>;
}

export interface SyncOrchestrator {
  processWebhookQueue(): Promise<void>; // consumes Pub/Sub / Firestore queue
  runPollingCycle(provider: WearableSource, date: string): Promise<void>;
}
```

On the **client (React Native)** side, you’d have:

```ts
export interface LocalMetricsStore {
  getDailyMetrics(date: string): Promise<DailyMetrics | null>;
  saveDailyMetrics(metrics: DailyMetrics): Promise<void>;
}

export interface SyncService {
  syncToBackend(dateRange: { start: string; end: string }): Promise<void>;
  reconcileWithServer(serverMetrics: DailyMetrics[]): Promise<void>;
}
```


***

## 11. Data Flow Diagram (Textual)

1. **Device sensors → OS:**
    - Oura/WHOOP/Garmin → Vendor cloud
    - Apple Watch → HealthKit
    - Android watch / phone → Google Fit
2. **Cloud wearables → Apex backend:**
    - Vendor/aggregator posts webhook → Cloud Run/Firebase HTTPS (`/api/webhooks/:provider`).
    - Receiver validates, enqueues `WebhookEvent` in Pub/Sub / Firestore.
3. **Worker:**
    - Consumes `WebhookEvent`, calls `ProviderClient` to fetch latest detailed data.
    - `MetricsNormalizationService` builds `DailyMetrics`, computes `recoveryScore`.
    - `DailyMetricsRepository.upsert` writes to Supabase and Firestore.
4. **Mobile client:**
    - Subscribes to Firestore for `todayMetrics`.
    - HealthKit/Google Fit collectors update local cache and optionally sync to backend via `SyncService`.
5. **Nudge engine:**
    - Firestore trigger / cron reads latest DailyMetrics, runs nudgeEngine (as in PRD).
    - Writes new `Nudge` documents; client listens and updates Morning Anchor, etc.

***

## 12. Background Sync Implementation (Summary)

- **iOS:**
    - HealthKit permissions + `enableBackgroundDelivery` for steps/HRV/sleep.
    - Observer queries + `HKAnchoredObjectQuery` to fetch deltas (even when app terminated).
    - `BGTaskScheduler` for periodic light refresh and aggregation into DailyMetrics.
- **Android:**
    - Google Fit Recording API for passive data.
    - WorkManager periodic jobs to read History API and push aggregated metrics to backend.

***

## Key Takeaways

- Use a **hybrid architecture**: webhooks for cloud wearables, OS background-delivery APIs for HealthKit/Google Fit, minimal server-side polling as safety net.
- For Apex’s needs (morning recovery, afternoon energy, sleep tracking), **+1–2h** freshness for sleep and **same-day HRV** are scientifically adequate; don’t sacrifice battery or quotas for pseudo-real-time.
- An **event-driven backend** (webhooks → queue → workers → Supabase+Firestore) aligns with your PRD’s “no polling from clients” and supports scaling to **100K–1M users**.
- Strongly consider a **wearable aggregator** (Terra/Rook/Spike) to simplify multi-vendor integration and normalize data.

If you’d like, I can next translate this into a concrete **backend architecture diagram + specific Firebase/Supabase collections and cron jobs** tailored to your existing `wearablesSync` function and DailyMetrics model.
<span style="display:none">[^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21]</span>

<div align="center">⁂</div>

[^1]: https://tryterra.co/integrations/oura

[^2]: https://cloud.ouraring.com/v2/docs

[^3]: https://stackoverflow.com/questions/16195289/fitbit-subscription-api

[^4]: https://www.reddit.com/r/ouraring/comments/1nqj4ua/oura_api/

[^5]: https://docs.tryrook.io/data-sources/oura/

[^6]: https://docs.spikeapi.com/sdk-docs/ios/background-delivery

[^7]: https://stackoverflow.com/questions/26375767/healthkit-background-delivery-when-app-is-not-running

[^8]: https://developer.apple.com/documentation/HealthKit/HKHealthStore/enableBackgroundDelivery(for:frequency:withCompletion:)

[^9]: https://codepushgo.com/blog/ios-background-task/

[^10]: https://developer.apple.com/documentation/backgroundtasks/bgtaskscheduler

[^11]: APEX_OS_PRD_FINAL_v6.md

[^12]: https://n8n.io/integrations/webhook/and/fitbit/

[^13]: https://n8n.io/integrations/webhook/and/oura/

[^14]: https://pipedream.com/community/t/how-can-i-setup-fitbit-subscribers-webhooks-via-pipedream/9750

[^15]: https://www.reddit.com/r/iOSProgramming/comments/1hn0u4m/background_tasks_bgtaskscheduler_questions/

[^16]: https://community.fitbit.com/t5/Web-API-Development/Webhook-is-not-working/td-p/5761997

[^17]: https://jsr.io/@pinta365/oura-api/doc

[^18]: https://www.fitbit.com/dev

[^19]: https://github.com/mpneuried/fitbit-subscription-example

[^20]: https://github.com/Pinta365/oura_api

[^21]: https://community.fitbit.com/t5/Web-API-Development/bd-p/dev/page/2

