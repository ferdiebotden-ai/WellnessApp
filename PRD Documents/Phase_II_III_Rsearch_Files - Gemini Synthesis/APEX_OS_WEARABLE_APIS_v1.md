<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Before running the following research prompt, understand our project from our project files, the instructions, etc. Think critically understanding Best Practises for December 2025.:

## Research Prompt 2: Wearable API Integration

**Purpose:** Get complete API specifications for Oura, Apple HealthKit, Google Fit, and Garmin including authentication, rate limits, webhooks, and data schemas.

---

### PROMPT 2: WEARABLE DATA INTEGRATION

```
I'm building a wellness app that integrates with multiple wearable devices. I need comprehensive technical documentation for implementing these integrations.

WEARABLES TO COVER:
1. Oura Ring (Generation 3) — Primary target
2. Apple HealthKit — iOS native
3. Google Fit (Android) — Android native
4. WHOOP — Enterprise/partner API (research for competitive intelligence)
5. Garmin Connect — Secondary target

FOR EACH PLATFORM, RESEARCH:

1. **Authentication & Authorization:**
   - OAuth 2.0 flow specifics (scopes, redirect URIs)
   - Token refresh patterns (expiration times, refresh logic)
   - API key management best practices
   - What permissions require user consent?
   - Are there enterprise vs. consumer API tiers?

2. **Data Availability & Schemas:**
   - What sleep data fields are available? (sleep_onset, wake_time, rem, deep, light, awake)
   - What HRV data is exposed? (RMSSD, SDNN, average, time-domain vs frequency-domain)
   - What activity data exists? (steps, calories, active minutes)
   - What's the data granularity? (minute-by-minute vs. daily summaries)
   - JSON schema examples for each data type

3. **Sync Patterns:**
   - Webhooks vs. polling: What's supported?
   - If polling, what are rate limits?
   - If webhooks, what's the setup process?
   - How do you handle backfill (historical data sync)?
   - What's the typical data latency (time from measurement to API availability)?

4. **Background Refresh (Mobile):**
   - iOS: How does HealthKit background delivery work?
   - Android: How do you register for Google Fit data updates?
   - Battery impact of different sync strategies
   - What triggers background sync (app launch, time interval, new data)?

5. **Error Handling:**
   - Common error codes and their meanings
   - Rate limiting behavior (429 responses, backoff patterns)
   - Token expiration handling
   - Network failure recovery patterns
   - Data validation requirements

6. **Platform-Specific Quirks:**
   - Oura: API v2 vs. API v1 differences, webhook reliability
   - Apple: HealthKit authorization UI requirements, privacy strings
   - Google: Fitness REST API vs. Recording API differences
   - Garmin: Connect IQ vs. Health API distinctions

7. **Privacy & Compliance:**
   - What data requires specific consent language?
   - HIPAA considerations for health data
   - Data retention requirements
   - Can you store raw data or only derived metrics?

DELIVERABLES NEEDED:
- Authentication flow diagrams for each platform
- API endpoint reference table (URL, method, params, response)
- Data schema TypeScript interfaces
- Rate limit summary table
- Sync strategy recommendation (webhook vs. polling)
- Error handling code patterns
- Privacy compliance checklist
- Integration priority recommendation (which to implement first)
```

Perfect! Now I have comprehensive information. Let me compile this into a detailed technical document.

# WEARABLE API INTEGRATION: COMPREHENSIVE TECHNICAL DOCUMENTATION

Based on my research of current documentation (December 2025) and understanding of Apex OS's requirements, here's your complete wearable integration guide.

***

## EXECUTIVE SUMMARY

**Critical Context for December 2025:**

1. **Google Fit is DEPRECATED** — APIs shut down June 30, 2025. Migration to **Health Connect (Android)** is mandatory.
2. **Apple HealthKit remains device-local only** — No backend API exists. Native iOS app required.
3. **Oura API V2** launched with improved data models, deprecating Personal Access Tokens by end of 2025.
4. **WHOOP API V2** launched July 2025 with UUID-based identifiers and improved webhooks.
5. **Garmin Health API** requires business partnership approval and commercial license fees.

**Implementation Priority Recommendation:**

1. **Apple HealthKit** (50% of your target market, richest dataset)
2. **Oura Ring API V2** (primary wearable for biohackers, best HRV accuracy)
3. **Health Connect (Android)** (replaces Google Fit, mandatory for Android)
4. **WHOOP API** (enterprise partnerships only, requires negotiation)
5. **Garmin Health API** (secondary, commercial license required)

***

## 1. OURA RING API V2 (Generation 3 \& 4)

### Authentication \& Authorization

**OAuth 2.0 Implementation:**

```
Authorization URL: https://cloud.ouraring.com/oauth/authorize
Token URL: https://api.ouraring.com/oauth/token
Grant Type: Authorization Code (recommended) or Implicit
```

**Required Scopes (8 available):**

- `email` — User email address
- `personal` — Gender, age, height, weight
- `daily` — Daily summaries (sleep, activity, readiness)
- `heartrate` — Daytime heart rate measurements
- `workout` — Workout data
- `tag` — User-created tags
- `session` — Recovery/stress sessions
- `spo2` — Blood oxygen levels

**Authorization Flow:**

```
1. Redirect user to: 
   https://cloud.ouraring.com/oauth/authorize?
     response_type=code&
     client_id=YOUR_CLIENT_ID&
     redirect_uri=YOUR_REDIRECT_URI&
     scope=email+personal+daily+heartrate&
     state=RANDOM_STATE

2. User grants permission → redirected with code

3. Exchange code for token:
   POST https://api.ouraring.com/oauth/token
   Body: grant_type=authorization_code&code=CODE&redirect_uri=SAME_URI
   Auth: Basic (client_id:client_secret)

4. Response:
   {
     "access_token": "...",
     "token_type": "Bearer",
     "expires_in": 86400,
     "refresh_token": "...",
     "scope": "email personal daily"
   }
```

**Token Refresh Pattern:**

- Access tokens expire in **24 hours** (86,400 seconds)
- Refresh tokens are long-lived (no explicit expiration)
- Refresh **proactively** before expiration to avoid gaps

**Critical Deprecation Notice:**
Personal Access Tokens (PATs) will be deprecated by **end of 2025**. All integrations MUST use OAuth 2.0.

***

### Data Availability \& Schemas

**Base URL:** `https://api.ouraring.com/v2/usercollection/`

**Sleep Data (`/sleep`):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "day": "2025-12-03",
  "bedtime_start": "2025-12-02T22:30:00+00:00",
  "bedtime_end": "2025-12-03T07:00:00+00:00",
  "average_breath": 15.5,
  "average_heart_rate": 52,
  "average_hrv": 68,
  "awake_time": 2400,
  "deep_sleep_duration": 7200,
  "efficiency": 88,
  "latency": 480,
  "light_sleep_duration": 18000,
  "low_battery_alert": false,
  "lowest_heart_rate": 48,
  "rem_sleep_duration": 5400,
  "restless_periods": 3,
  "time_in_bed": 30600,
  "total_sleep_duration": 28800,
  "type": "long_sleep"
}
```

**Key Sleep Fields:**

- `average_hrv` — RMSSD in milliseconds (most important recovery metric)
- `efficiency` — Percentage (total_sleep / time_in_bed × 100)
- Sleep stages: `deep_sleep_duration`, `light_sleep_duration`, `rem_sleep_duration` (all in seconds)
- `latency` — Time to fall asleep (seconds)

**HRV Data (`/heartrate`):**

```json
{
  "bpm": 68,
  "source": "sleep",
  "timestamp": "2025-12-03T03:15:00+00:00"
}
```

**Note:** Oura provides overnight HRV in the `/sleep` endpoint (`average_hrv`). Continuous HRV is NOT available — only heart rate.

**Daily Activity (`/daily_activity`):**

```json
{
  "id": "uuid",
  "day": "2025-12-03",
  "score": 82,
  "active_calories": 450,
  "average_met_minutes": 2.1,
  "steps": 8456,
  "equivalent_walking_distance": 6782,
  "high_activity_met_minutes": 45,
  "low_activity_met_minutes": 180,
  "medium_activity_met_minutes": 90,
  "inactive_met_minutes": 600,
  "inactivity_alerts": 2,
  "target_calories": 500,
  "target_meters": 8000
}
```

**Daily Readiness (`/daily_readiness`):**

```json
{
  "id": "uuid",
  "day": "2025-12-03",
  "score": 78,
  "temperature_deviation": -0.2,
  "temperature_trend_deviation": 0.1,
  "contributors": {
    "activity_balance": 85,
    "body_temperature": 95,
    "hrv_balance": 72,
    "previous_day_activity": 88,
    "previous_night_sleep": 80,
    "recovery_index": 90,
    "resting_heart_rate": 85,
    "sleep_balance": 75
  }
}
```

**Workout Data (`/workout`):**

```json
{
  "id": "uuid",
  "activity": "cycling",
  "start_datetime": "2025-12-03T08:00:00+00:00",
  "end_datetime": "2025-12-03T09:30:00+00:00",
  "calories": 680,
  "day": "2025-12-03",
  "distance": 25000,
  "intensity": "moderate",
  "label": null,
  "source": "manual"
}
```

**Data Granularity:**

- **Sleep:** Nightly summaries + second-by-second heart rate available via `/sleep/{id}/heart_rate`
- **Activity:** Daily summaries (no minute-by-minute data)
- **Heart Rate:** Daytime measurements every 5-10 minutes during activity
- **Readiness:** Daily score calculated each morning

***

### Sync Patterns \& Rate Limits

**Rate Limits:**

- **5,000 requests per 5-minute period** (generous for personal use)
- **No explicit daily cap** documented
- Rate limit headers included in responses:

```
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4987
X-RateLimit-Reset: 1638360000
```


**Webhooks:**

- **NOT supported by Oura API as of December 2025**
- Must use polling strategy

**Polling Strategy:**

- **Morning sync (7-9 AM user timezone):** Poll `/sleep` and `/daily_readiness` for overnight data
- **Evening sync (8-10 PM):** Poll `/daily_activity` for full day summary
- **Workout sync:** Poll `/workout` after user logs activity (or every 2-4 hours)
- **Data latency:** Sleep data typically available 1-2 hours after waking

**Backfill (Historical Data):**

```
GET /v2/usercollection/sleep?start_date=2025-11-01&end_date=2025-12-03
```

- Supports date range queries
- Maximum 30-day range per request recommended
- Use for initial onboarding to get baseline

**Error Handling:**


| Error Code | Meaning | Action |
| :-- | :-- | :-- |
| 401 | Invalid/expired token | Refresh access token |
| 426 | App version too old | Show user upgrade prompt |
| 429 | Rate limit exceeded | Exponential backoff (start with 60s) |
| 500 | Server error | Retry with exponential backoff (max 3 attempts) |


***

### Platform-Specific Quirks

1. **426 Error Code:** New in V2 — occurs when user's Oura mobile app doesn't meet minimum version. User MUST update app to share data. Display clear message: "Please update your Oura app to sync data."
2. **Access Token in Headers Only:** V2 removed query parameter support. MUST use:

```
Authorization: Bearer ACCESS_TOKEN
```

3. **Sleep Type Variations:**
    - `long_sleep` — Normal night sleep
    - `late_nap` — Afternoon/evening nap
    - `rest` — Rest period, not sleep
4. **Temperature Tracking:**
    - Only available on Generation 3 \& 4
    - `temperature_deviation` and `temperature_trend_deviation` in readiness data
    - Useful for illness detection and menstrual cycle tracking
5. **HRV Calculation:**
    - Oura uses **RMSSD** (Root Mean Square of Successive Differences)
    - **Most accurate wearable HRV** according to 2025 peer-reviewed study
    - Measured during deep sleep periods for consistency

***

## 2. APPLE HEALTHKIT (iOS NATIVE)

### Critical Architecture Constraint

**There is NO backend API for Apple Health.** All data lives on the user's iPhone/Apple Watch. You MUST build a native iOS app to access HealthKit.

**Architecture Pattern:**

```
User's iPhone (HealthKit) 
    ↓ (Native iOS App reads locally)
Your iOS App 
    ↓ (Syncs to your backend)
Your Backend API 
    ↓ (Feeds Apex OS)
```

This fundamentally shapes your entire mobile architecture.

***

### Authentication \& Authorization

**Capability Setup (Xcode):**

1. Enable HealthKit capability in Xcode
2. Add `Info.plist` entries:

```xml
<key>NSHealthShareUsageDescription</key>
<string>Apex OS uses your health data to personalize evidence-based protocols for sleep, recovery, and performance.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>Apex OS can write completed protocols and manual entries to Apple Health.</string>
```

3. **iOS 15+ requirement:** Enable "Background Delivery" capability

```
Entitlement: com.apple.developer.healthkit.background-delivery
```


**Authorization Flow (User Consent):**

```swift
import HealthKit

let healthStore = HKHealthStore()

// Define data types to read
let readTypes: Set<HKObjectType> = [
    HKQuantityType(.stepCount),
    HKQuantityType(.heartRate),
    HKQuantityType(.heartRateVariabilitySDNN),
    HKQuantityType(.restingHeartRate),
    HKQuantityType(.activeEnergyBurned),
    HKCategoryType(.sleepAnalysis),
    HKQuantityType(.oxygenSaturation)
]

// Define data types to write (optional)
let writeTypes: Set<HKSampleType> = [
    HKQuantityType(.stepCount)
]

// Request authorization
healthStore.requestAuthorization(toShare: writeTypes, read: readTypes) { success, error in
    if success {
        // User granted permission — start syncing
        setupBackgroundDelivery()
    } else {
        // Handle denial
        print("HealthKit authorization denied: \(error?.localizedDescription ?? "Unknown")")
    }
}
```

**Critical Authorization Notes:**

- iOS shows **per-data-type permission UI** — users can grant some, deny others
- You **cannot detect which specific permissions were denied** (privacy protection)
- Must request authorization **every time** app launches (iOS caches response)

***

### Data Availability \& Schemas

**Sleep Data (`HKCategoryType.sleepAnalysis`):**

```swift
// Sleep stages (Apple Watch Series 4+)
enum HKCategoryValueSleepAnalysis {
    case inBed        // iPhone can track
    case asleepUnspecified  // Basic sleep tracking
    case awake        // Wake periods
    case asleepCore   // Light + Deep combined (Apple Watch)
    case asleepDeep   // Deep sleep (Apple Watch)
    case asleepREM    // REM sleep (Apple Watch)
}

// Query sleep samples
let sleepType = HKCategoryType(.sleepAnalysis)
let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { query, samples, error in
    guard let samples = samples as? [HKCategorySample] else { return }
    
    for sample in samples {
        let value = HKCategoryValueSleepAnalysis(rawValue: sample.value)
        let start = sample.startDate
        let end = sample.endDate
        let duration = end.timeIntervalSince(start)
        
        print("\(value): \(duration) seconds from \(start) to \(end)")
    }
}

healthStore.execute(query)
```

**Sleep Calculation Logic:**

- **Total Time in Bed:** Sum all `inBed` samples
- **Total Sleep Time:** Sum `asleepCore`, `asleepDeep`, `asleepREM`, `asleepUnspecified`
- **Sleep Efficiency:** `(Total Sleep Time / Total Time in Bed) × 100`
- **Sleep Latency:** Time between first `inBed` and first `asleep*` sample

**HRV Data (`HKQuantityType.heartRateVariabilitySDNN`):**

```swift
let hrvType = HKQuantityType(.heartRateVariabilitySDNN)
let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate)

let query = HKStatisticsQuery(quantityType: hrvType, quantitySamplePredicate: predicate, options: .discreteAverage) { query, statistics, error in
    guard let statistics = statistics else { return }
    
    if let average = statistics.averageQuantity() {
        let hrvValue = average.doubleValue(for: HKUnit.secondUnit(with: .milli))
        print("Average HRV: \(hrvValue) ms")
    }
}

healthStore.execute(query)
```

**Important HRV Notes:**

- Apple uses **SDNN** (Standard Deviation of NN intervals), NOT RMSSD like Oura
- SDNN and RMSSD are correlated but NOT identical
- **Normalize to user's baseline** for cross-platform comparison
- HRV measured during sleep periods by Apple Watch

**Heart Rate (`HKQuantityType.heartRate`):**

```swift
let heartRateType = HKQuantityType(.heartRate)
// Query returns samples with timestamps
// Can aggregate to get resting heart rate, max, average
```

**Activity Data:**

- `HKQuantityType.stepCount` — Steps (integer)
- `HKQuantityType.activeEnergyBurned` — Active calories (kcal)
- `HKQuantityType.basalEnergyBurned` — Resting calories (kcal)
- `HKQuantityType.appleExerciseTime` — Exercise minutes

**Data Granularity:**

- **Sleep:** Sample-based (each sample = one sleep stage period)
- **Heart Rate:** Per-minute during activity, every 5-10 minutes at rest
- **HRV:** Multiple readings during sleep, typically 1-3 per night
- **Steps:** Can be minute-by-minute or aggregated

***

### Background Refresh (iOS)

**Background Delivery Setup:**

```swift
// In AppDelegate or health data manager
func setupBackgroundDelivery() {
    let types: [HKObjectType] = [
        HKQuantityType(.heartRateVariabilitySDNN),
        HKCategoryType(.sleepAnalysis),
        HKQuantityType(.stepCount)
    ]
    
    for type in types {
        // Enable background delivery
        healthStore.enableBackgroundDelivery(for: type, frequency: .immediate) { success, error in
            if success {
                print("Background delivery enabled for \(type)")
            }
        }
        
        // Create observer query
        let query = HKObserverQuery(sampleType: type, predicate: nil) { query, completionHandler, error in
            // Called when new data available
            print("New data available for \(type)")
            
            // CRITICAL: Call completion handler IMMEDIATELY
            completionHandler()
            
            // Fetch new data and sync to backend
            self.fetchAndSyncNewData(for: type)
        }
        
        healthStore.execute(query)
    }
}

// Store queries as instance variables to keep them alive
var observerQueries: [HKObserverQuery] = []
```

**Critical Background Delivery Rules:**

1. **Must call `completionHandler()` immediately** — Apple expects this within seconds, not after data processing
2. **Observer queries MUST be created in `application:didFinishLaunchingWithOptions:`** — Not in view controllers
3. **Use `.immediate` frequency** for real-time updates (works even when app terminated)
4. **Background time is limited** — iOS gives ~30 seconds. Use background tasks for longer processing:
```swift
var backgroundTaskID: UIBackgroundTaskIdentifier = .invalid

func fetchAndSyncNewData(for type: HKObjectType) {
    backgroundTaskID = UIApplication.shared.beginBackgroundTask {
        // Expiration handler
        UIApplication.shared.endBackgroundTask(self.backgroundTaskID)
        self.backgroundTaskID = .invalid
    }
    
    // Fetch data and sync to backend
    syncDataToBackend(for: type) {
        UIApplication.shared.endBackgroundTask(self.backgroundTaskID)
        self.backgroundTaskID = .invalid
    }
}
```

**Battery Impact:**

- Background delivery is **power-efficient** — iOS batches notifications
- Typical battery impact: **1-3% per day** for moderate querying
- Minimize query complexity — use anchored queries for incremental updates

**What Triggers Background Sync:**

- New data written to HealthKit (from Apple Watch, third-party apps)
- NOT time-based intervals (no polling)
- System decides optimal time (respects Low Power Mode)

***

### Error Handling

| Error Code | Meaning | Action |
| :-- | :-- | :-- |
| `.errorAuthorizationDenied` | User denied permission | Show settings prompt |
| `.errorAuthorizationNotDetermined` | Not yet authorized | Request authorization |
| `.errorDatabaseInaccessible` | HealthKit locked (device locked) | Retry when unlocked |
| `.errorNoData` | No data available for query | Normal — user may not have data |

**Detecting HealthKit Availability:**

```swift
if HKHealthStore.isHealthDataAvailable() {
    // HealthKit available on this device
} else {
    // Not available (iPad, older devices)
}
```


***

### Platform-Specific Quirks

1. **iPhone vs Apple Watch Sleep:**
    - iPhone: Only `inBed` tracking (motion + usage patterns)
    - Apple Watch: Full sleep stages (`asleepCore`, `asleepDeep`, `asleepREM`)
    - Your app must handle BOTH scenarios
2. **Third-Party Data Sources:**
    - HealthKit aggregates data from ALL sources (Oura, WHOOP, etc.)
    - **Risk of duplicate data** — check `sample.sourceRevision.source.bundleIdentifier`
    - Prioritize Apple Watch data over third-party when both exist
3. **Timezone Handling:**
    - HealthKit stores dates in **user's current timezone**
    - If user travels, historical data timestamps DON'T change
    - **You must normalize to UTC** on your backend for consistency
4. **Data Latency:**
    - Apple Watch syncs when iPhone in range (usually immediate)
    - If watch not paired overnight, data syncs when connected (can be hours)
    - Sleep data typically available within 30 minutes of waking
5. **Privacy Strings Required:**
    - MUST provide clear, specific `NSHealthShareUsageDescription`
    - App rejection if string is vague or generic
    - Example: ❌ "We use your health data" ✅ "Apex OS analyzes your HRV and sleep data to personalize recovery protocols"

***

## 3. HEALTH CONNECT (ANDROID — REPLACES GOOGLE FIT)

### Critical Migration Context

**Google Fit is DEAD (as of June 30, 2025).** Health Connect is now the ONLY way to access health data on Android.

**Health Connect Architecture:**

- **On-device data store** (similar to HealthKit model)
- **No cloud backend** — data stays local
- **Open-source framework** built into Android 14+
- **Backward compatible** via Play Store app (Android 9-13)

***

### Authentication \& Authorization

**Dependency Setup (Gradle):**

```kotlin
dependencies {
    implementation("androidx.health.connect:connect-client:1.1.0-alpha07")
}
```

**Manifest Permissions:**

```xml
<manifest>
    <!-- Declare Health Connect permissions -->
    <uses-permission android:name="android.permission.health.READ_STEPS"/>
    <uses-permission android:name="android.permission.health.READ_HEART_RATE"/>
    <uses-permission android:name="android.permission.health.READ_HEART_RATE_VARIABILITY"/>
    <uses-permission android:name="android.permission.health.READ_SLEEP"/>
    <uses-permission android:name="android.permission.health.READ_ACTIVE_CALORIES_BURNED"/>
    
    <!-- Optional write permissions -->
    <uses-permission android:name="android.permission.health.WRITE_STEPS"/>
    
    <!-- Health Connect feature -->
    <uses-feature android:name="android.software.health" android:required="false"/>
</manifest>
```

**Authorization Flow:**

```kotlin
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*

class HealthDataManager(private val context: Context) {
    
    private val healthConnectClient by lazy {
        HealthConnectClient.getOrCreate(context)
    }
    
    // Check if Health Connect is available
    suspend fun isAvailable(): Boolean {
        return HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE
    }
    
    // Request permissions
    val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class)
    )
    
    suspend fun requestPermissions(activity: ComponentActivity) {
        val granted = healthConnectClient.permissionController.getGrantedPermissions()
        if (!granted.containsAll(permissions)) {
            // Request permissions via contract
            val requestPermissions = registerForActivityResult(
                PermissionController.createRequestPermissionResultContract()
            ) { granted ->
                if (granted.containsAll(permissions)) {
                    // All permissions granted
                } else {
                    // Handle partial grant or denial
                }
            }
            requestPermissions.launch(permissions)
        }
    }
}
```

**Permission Model:**

- **Granular per-record-type** (similar to HealthKit)
- User can grant/deny individual data types
- No OAuth — native Android permission system

***

### Data Availability \& Schemas

**Sleep Data (`SleepSessionRecord`):**

```kotlin
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.SleepStageRecord
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant

suspend fun readSleepData(startTime: Instant, endTime: Instant) {
    val response = healthConnectClient.readRecords(
        ReadRecordsRequest(
            recordType = SleepSessionRecord::class,
            timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
        )
    )
    
    for (record in response.records) {
        println("Sleep session: ${record.startTime} to ${record.endTime}")
        println("Title: ${record.title}")
        println("Notes: ${record.notes}")
        
        // Sleep stages are nested records
        record.stages.forEach { stage ->
            when (stage.stage) {
                SleepStageRecord.STAGE_TYPE_AWAKE -> println("Awake")
                SleepStageRecord.STAGE_TYPE_SLEEPING -> println("Sleeping")
                SleepStageRecord.STAGE_TYPE_DEEP -> println("Deep Sleep")
                SleepStageRecord.STAGE_TYPE_LIGHT -> println("Light Sleep")
                SleepStageRecord.STAGE_TYPE_REM -> println("REM Sleep")
                SleepStageRecord.STAGE_TYPE_OUT_OF_BED -> println("Out of Bed")
            }
        }
    }
}
```

**Sleep Stage Types:**

- `STAGE_TYPE_AWAKE` — Awake in bed
- `STAGE_TYPE_SLEEPING` — Unspecified sleep
- `STAGE_TYPE_DEEP` — Deep sleep
- `STAGE_TYPE_LIGHT` — Light sleep
- `STAGE_TYPE_REM` — REM sleep
- `STAGE_TYPE_OUT_OF_BED` — Out of bed
- `STAGE_TYPE_UNKNOWN` — Unknown stage

**HRV Data (`HeartRateVariabilityRmssdRecord`):**

```kotlin
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord

suspend fun readHRVData(startTime: Instant, endTime: Instant) {
    val response = healthConnectClient.readRecords(
        ReadRecordsRequest(
            recordType = HeartRateVariabilityRmssdRecord::class,
            timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
        )
    )
    
    for (record in response.records) {
        val hrvMs = record.heartRateVariabilityMillis
        println("HRV: $hrvMs ms at ${record.time}")
    }
}
```

**Important:** Health Connect uses **RMSSD** (same as Oura), NOT SDNN like Apple.

**Heart Rate (`HeartRateRecord`):**

```kotlin
suspend fun readHeartRateData(startTime: Instant, endTime: Instant) {
    val response = healthConnectClient.readRecords(
        ReadRecordsRequest(
            recordType = HeartRateRecord::class,
            timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
        )
    )
    
    for (record in response.records) {
        record.samples.forEach { sample ->
            println("Heart rate: ${sample.beatsPerMinute} bpm at ${sample.time}")
        }
    }
}
```

**Activity Data:**

- `StepsRecord` — Steps with start/end time
- `ActiveCaloriesBurnedRecord` — Active energy
- `DistanceRecord` — Distance traveled
- `ExerciseSessionRecord` — Workouts with type and duration

**Data Granularity:**

- **Sleep:** Session-based with nested stage records
- **HRV:** Individual timestamp-based measurements
- **Heart Rate:** Series of samples with timestamps
- **Steps:** Interval-based (start time, end time, count)

***

### Sync Patterns \& Rate Limits

**Rate Limits (as of December 2025):**


| Operation | Foreground | Background | Daily |
| :-- | :-- | :-- | :-- |
| Read/Changelog | Higher | Stricter | Limited |
| Insert/Update/Delete | Higher | Much stricter | Limited |
| Memory (bulk insert) | Larger | Smaller | N/A |

**Specific limits vary by device** — Health Connect dynamically adjusts based on system health.

**Best Practices to Avoid Rate Limiting:**

1. **Use Changelog API for incremental sync:**
```kotlin
import androidx.health.connect.client.changes.Change

suspend fun syncChanges(token: String?) {
    try {
        val changesResponse = healthConnectClient.getChanges(token ?: "")
        
        for (change in changesResponse.changes) {
            when (change) {
                is Change.Upsert -> {
                    // Process new or updated record
                    handleUpsert(change.record)
                }
                is Change.Delete -> {
                    // Handle deleted record
                    handleDelete(change.uid)
                }
            }
        }
        
        // Store token for next sync
        val nextToken = changesResponse.nextChangesToken
        saveToken(nextToken)
        
    } catch (e: Exception) {
        // Handle rate limiting
    }
}
```

2. **Batch requests:**
    - Group multiple record types in single read when possible
    - Use `readRecords` with time ranges instead of individual queries
3. **Minimize background operations:**
    - Sync during foreground sessions when possible
    - Schedule background work carefully
4. **Handle rate limit exceptions:**
```kotlin
try {
    readHealthData()
} catch (e: IOException) {
    // Rate limit or network error
    // Implement exponential backoff
}
```

**Background Sync Strategy:**

```kotlin
// Use WorkManager for scheduled background sync
class HealthSyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        return try {
            // Sync changes using changelog API
            syncHealthData()
            Result.success()
        } catch (e: Exception) {
            if (shouldRetry(e)) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }
}

// Schedule periodic sync
val syncRequest = PeriodicWorkRequestBuilder<HealthSyncWorker>(
    repeatInterval = 4, TimeUnit.HOURS // Adjust based on needs
).setConstraints(
    Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .setRequiresBatteryNotLow(true)
        .build()
).build()

WorkManager.getInstance(context).enqueue(syncRequest)
```

**Data Latency:**

- **Immediate for foreground sync** when wearable connected
- **Background sync batched** by Android system (can be delayed hours)
- **Wearable data** syncs when device connects (Bluetooth range)

***

### Error Handling

| Error | Cause | Action |
| :-- | :-- | :-- |
| `SDK_UNAVAILABLE` | Health Connect not installed | Prompt user to install from Play Store |
| `PERMISSION_DENIED` | User denied permission | Show rationale, request again |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Exponential backoff (start 60s) |
| `NETWORK_ERROR` | Network issue | Retry with backoff |
| `INVALID_ARGUMENT` | Malformed request | Fix query parameters |

**Checking SDK Availability:**

```kotlin
when (HealthConnectClient.getSdkStatus(context)) {
    HealthConnectClient.SDK_AVAILABLE -> {
        // Health Connect available
    }
    HealthConnectClient.SDK_UNAVAILABLE -> {
        // Not installed — redirect to Play Store
    }
    HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> {
        // Update required
    }
}
```


***

### Platform-Specific Quirks

1. **Android 14+ vs Older Versions:**
    - Android 14: Built-in, no separate app needed
    - Android 9-13: Requires Health Connect app from Play Store
    - **Different behavior** — test on both
2. **Migration from Google Fit:**
    - Google Fit data does NOT automatically migrate to Health Connect
    - Users must manually enable in Health Connect settings
    - Your app should handle missing historical data gracefully
3. **Data Source Priority:**
    - Health Connect aggregates from multiple sources (Garmin, Fitbit, Samsung Health)
    - **Duplicate data possible** — check `metadata.dataOrigin`
    - Implement deduplication logic on your backend
4. **Battery Optimization:**
    - Android aggressively throttles background work
    - Users may need to disable battery optimization for your app
    - Show prompt: "For best results, disable battery optimization for Apex OS"
5. **Foreground vs Background Limits:**
    - **Foreground:** Much more generous rate limits
    - **Background:** Strict limits to preserve battery
    - **Strategy:** Sync heavily during foreground sessions, use changelog for background

***

## 4. WHOOP API V2 (ENTERPRISE/PARTNER ONLY)

### Access Requirements

**CRITICAL:** WHOOP API is NOT publicly available. Requires:

1. **Business partnership application** via [developer.whoop.com](https://developer.whoop.com)
2. **Use case review** by WHOOP team
3. **Commercial terms negotiation**

Not suitable for immediate launch — consider WHOOP integration for **Phase 2** after proving market fit.

***

### Authentication (If Approved)

**OAuth 2.0 Flow:**

```
Authorization URL: https://api.prod.whoop.com/oauth/oauth2/auth
Token URL: https://api.prod.whoop.com/oauth/oauth2/token
```

**Available Scopes:**

- `read:recovery` — Recovery scores
- `read:cycles` — Daily performance cycles
- `read:sleep` — Sleep data
- `read:workout` — Workouts
- `read:profile` — User profile
- `offline` — Refresh token for offline access

**Token Management:**

- Access tokens expire (duration not publicly documented)
- Refresh tokens supported
- Standard OAuth 2.0 flow

***

### Data Schemas (V2 API)

**Recovery Data (`/v2/cycle/{cycleId}/recovery`):**

```json
{
  "cycle_id": 12345,
  "sleep_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": 67890,
  "created_at": "2025-12-03T08:00:00.000Z",
  "updated_at": "2025-12-03T08:00:00.000Z",
  "score_state": "SCORED",
  "score": {
    "user_calibrating": false,
    "recovery_score": 78,
    "resting_heart_rate": 52,
    "hrv_rmssd_milli": 68.5,
    "spo2_percentage": 96.2,
    "skin_temp_celsius": 33.8
  }
}
```

**Key Recovery Fields:**

- `recovery_score` — 0-100 percentage
- `hrv_rmssd_milli` — HRV in milliseconds (RMSSD method)
- `resting_heart_rate` — RHR in bpm
- `spo2_percentage` — Blood oxygen (requires WHOOP 4.0)
- `skin_temp_celsius` — Skin temperature

**Sleep Data (`/v2/sleep/{sleepId}`):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": 67890,
  "created_at": "2025-12-03T07:30:00.000Z",
  "updated_at": "2025-12-03T07:30:00.000Z",
  "start": "2025-12-02T22:00:00.000Z",
  "end": "2025-12-03T07:00:00.000Z",
  "timezone_offset": "-08:00",
  "nap": false,
  "score_state": "SCORED",
  "score": {
    "stage_summary": {
      "total_in_bed_time_milli": 32400000,
      "total_awake_time_milli": 2400000,
      "total_no_data_time_milli": 0,
      "total_light_sleep_time_milli": 18000000,
      "total_slow_wave_sleep_time_milli": 7200000,
      "total_rem_sleep_time_milli": 4800000,
      "sleep_cycle_count": 5,
      "disturbance_count": 3
    },
    "sleep_needed": {
      "baseline_milli": 28800000,
      "need_from_sleep_debt_milli": 1800000,
      "need_from_recent_strain_milli": 900000,
      "need_from_recent_nap_milli": -600000
    },
    "respiratory_rate": 15.2,
    "sleep_performance_percentage": 88,
    "sleep_consistency_percentage": 75,
    "sleep_efficiency_percentage": 92
  }
}
```

**Workout Data (`/v2/workout/{workoutId}`):**

```json
{
  "id": 12345,
  "user_id": 67890,
  "created_at": "2025-12-03T10:00:00.000Z",
  "updated_at": "2025-12-03T10:00:00.000Z",
  "start": "2025-12-03T08:00:00.000Z",
  "end": "2025-12-03T09:00:00.000Z",
  "timezone_offset": "-08:00",
  "sport_id": 1,
  "score_state": "SCORED",
  "score": {
    "strain": 14.2,
    "average_heart_rate": 152,
    "max_heart_rate": 178,
    "kilojoule": 1200,
    "percent_recorded": 98,
    "distance_meter": 8000,
    "altitude_gain_meter": 50,
    "altitude_change_meter": 0,
    "zone_duration": {
      "zone_zero_milli": 60000,
      "zone_one_milli": 180000,
      "zone_two_milli": 1200000,
      "zone_three_milli": 1800000,
      "zone_four_milli": 360000,
      "zone_five_milli": 0
    }
  }
}
```


***

### Webhooks (V2)

**WHOOP supports webhooks** for real-time updates (unlike Oura).

**Webhook Event Types:**

- `recovery.updated` — New recovery score available
- `sleep.updated` — Sleep analysis complete
- `workout.updated` — Workout recorded
- `cycle.updated` — Daily cycle complete

**Webhook Setup:**

1. Register webhook URL in Developer Dashboard
2. WHOOP sends POST requests to your endpoint
3. Verify signature for security

**Webhook Payload Example:**

```json
{
  "id": 123456789,
  "type": "recovery.updated",
  "user_id": 67890,
  "occurred_at": "2025-12-03T08:00:00.000Z",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Webhook Best Practices:**

- Respond with `200 OK` within 5 seconds
- Queue processing asynchronously
- Store `occurred_at` to avoid duplicate processing
- Verify signature before processing

***

### Rate Limits \& Quirks

**Rate Limits:** Not publicly documented. Likely similar to other enterprise APIs (thousands of requests per day).

**Platform Quirks:**

1. **V1 to V2 Migration:**
    - V2 uses UUID identifiers instead of integer IDs
    - Must map old V1 activity IDs to new V2 UUIDs
    - Migration endpoint available: `/v2/activity/v1/{v1_id}`
2. **Score States:**
    - `SCORED` — Data complete and scored
    - `PENDING_SCORE` — Processing (usually within 1-2 hours)
    - `UNSCORABLE` — Insufficient data
3. **Strain Score:**
    - Proprietary metric (0-21 scale)
    - Based on cardiovascular load, not simple heart rate
    - Cannot reverse-engineer formula
4. **Data Latency:**
    - Recovery scores available 1-2 hours after waking
    - Sleep data processed after WHOOP detects sleep end
    - Workouts scored immediately after completion

***

## 5. GARMIN CONNECT API (HEALTH API)

### Access Requirements

**Garmin Health API requires:**

1. **Business account** with Garmin Connect Developer Program
2. **Commercial license fee** (amount varies by scale)
3. **Approval process** for Corporate Wellness, Population Health, or Patient Monitoring use cases

Apply at: [developer.garmin.com/gc-developer-program](https://developer.garmin.com/gc-developer-program)

**Timeline:** 2-4 weeks for approval.

***

### Authentication

**OAuth 1.0a** (legacy but required by Garmin):

```
Request Token URL: https://connectapi.garmin.com/oauth-service/oauth/request_token
Authorization URL: https://connect.garmin.com/oauthConfirm
Access Token URL: https://connectapi.garmin.com/oauth-service/oauth/access_token
```

**OAuth 1.0a Flow:**

1. Request temporary token
2. Redirect user to authorization URL
3. User grants permission
4. Exchange for access token and secret
5. Sign all API requests with HMAC-SHA1

**Library Recommendation:** Use OAuth 1.0a library (e.g., `signpost` for Java, `oauth` for Node.js) — manual implementation is complex.

***

### Data Availability

**Health API Endpoints:**


| Endpoint | Data Type | Description |
| :-- | :-- | :-- |
| `/wellness/dailySummary` | Daily Summary | Steps, calories, HR, sleep, stress |
| `/wellness/sleeps` | Sleep | Sleep stages, duration, quality |
| `/wellness/moveIQ` | Activities | Auto-detected activities |
| `/wellness/heartRates` | Heart Rate | Continuous HR data |
| `/wellness/stressDetails` | Stress | Stress levels throughout day |

**Daily Summary Schema (`/wellness/dailySummary`):**

```json
{
  "summaryId": "1234567890",
  "calendarDate": "2025-12-03",
  "startTimeInSeconds": 1701561600,
  "startTimeOffsetInSeconds": -28800,
  "activityType": "WELLNESS",
  "durationInSeconds": 86400,
  "steps": 8456,
  "distanceInMeters": 6782,
  "activeTimeInSeconds": 3600,
  "activeKilocalories": 450,
  "bmrKilocalories": 1650,
  "moderateIntensityDurationInSeconds": 1800,
  "vigorousIntensityDurationInSeconds": 600,
  "floorsClimbed": 12,
  "minHeartRateInBeatsPerMinute": 48,
  "maxHeartRateInBeatsPerMinute": 165,
  "restingHeartRateInBeatsPerMinute": 52,
  "averageStressLevel": 32,
  "maxStressLevel": 78,
  "stressDurationInSeconds": 7200,
  "restStressDurationInSeconds": 28800,
  "activityStressDurationInSeconds": 3600,
  "lowStressDurationInSeconds": 43200,
  "mediumStressDurationInSeconds": 10800,
  "highStressDurationInSeconds": 1800
}
```

**Sleep Data (`/wellness/sleeps`):**

```json
{
  "sleepId": 9876543210,
  "userAccessToken": "user_token",
  "calendarDate": "2025-12-03",
  "summaryId": "summary_id",
  "startTimeInSeconds": 1701558000,
  "startTimeOffsetInSeconds": -28800,
  "durationInSeconds": 28800,
  "unmeasurableSleepInSeconds": 0,
  "deepSleepDurationInSeconds": 7200,
  "lightSleepDurationInSeconds": 18000,
  "remSleepDurationInSeconds": 5400,
  "awakeDurationInSeconds": 2400,
  "sleepLevelsMap": {
    "1701558000": 1.0,
    "1701558300": 2.0
  },
  "validation": "MANUAL"
}
```

**Sleep Levels:**

- `0.0` — Deep sleep
- `1.0` — Light sleep
- `2.0` — REM sleep
- `3.0` — Awake

***

### Webhooks \& Sync

**Garmin supports webhooks** (called "push notifications" in their docs):

**Webhook Setup:**

1. Register webhook URL in Developer Dashboard
2. Subscribe to data types (daily, sleep, activities)
3. Receive POST when new data available

**Webhook Types:**

- `WELLNESS` — Daily summary available
- `SLEEP` — New sleep data
- `ACTIVITY` — Activity recorded
- `HEART_RATE` — Continuous HR data batch

**Data Latency:**

- **Daily summaries:** Available at midnight local time
- **Sleep data:** 1-2 hours after waking
- **Activities:** Immediately after sync
- **Heart rate:** Batched every 15-30 minutes

***

### Platform Quirks

1. **OAuth 1.0a Complexity:**
    - Requires HMAC-SHA1 signing of every request
    - Timestamp and nonce management
    - Use established libraries to avoid errors
2. **Sleep Level Encoding:**
    - Uses numeric codes, not enums
    - `sleepLevelsMap` is time-series (timestamp → level)
    - Calculate stage durations from map
3. **HRV Not Available:**
    - Garmin Health API does NOT expose HRV data
    - Must use Activity API for workout HRV (limited)
    - **Significant limitation** for Apex OS use case
4. **Commercial License:**
    - Free tier for development
    - Production requires license fee based on users
    - Budget \$500-\$2,000/month for 1,000-10,000 users

***

## 6. INTEGRATION PRIORITY \& STRATEGY

### Recommended Implementation Order

Based on Apex OS target audience and technical constraints:

**Phase 1: MVP Launch (Months 1-3)**

1. **Apple HealthKit** — 50% of target market, richest data, native iOS required
2. **Oura Ring API V2** — Primary wearable for biohackers, best HRV accuracy

**Phase 2: Android Expansion (Months 4-6)**
3. **Health Connect (Android)** — Mandatory for Android support, replaces Google Fit

**Phase 3: Ecosystem Growth (Months 7-12)**
4. **WHOOP API** — If partnership approved, adds elite athlete segment
5. **Garmin Health API** — Broad market reach, corporate wellness angle

***

### Authentication Flow Comparison

| Platform | Auth Method | Token Expiry | Refresh | Backend API | Webhooks |
| :-- | :-- | :-- | :-- | :-- | :-- |
| **Oura** | OAuth 2.0 | 24 hours | Yes | ✅ REST API | ❌ No |
| **Apple HealthKit** | Native Permissions | N/A | N/A | ❌ Local only | ❌ No |
| **Health Connect** | Android Permissions | N/A | N/A | ❌ Local only | ❌ No |
| **WHOOP** | OAuth 2.0 | Unknown | Yes | ✅ REST API | ✅ Yes |
| **Garmin** | OAuth 1.0a | Long-lived | Rare | ✅ REST API | ✅ Yes |


***

### Sync Strategy Recommendations

**Apple HealthKit:**

- **Background Delivery** with observer queries (`.immediate` frequency)
- Sync to backend via iOS app when new data available
- Battery impact: 1-3% per day

**Health Connect (Android):**

- **Changelog API** for incremental sync (not polling)
- WorkManager for scheduled background sync (4-6 hour intervals)
- Foreground sync prioritized (more generous rate limits)

**Oura Ring:**

- **Polling strategy** (no webhooks)
- Morning sync (7-9 AM): `/sleep` and `/daily_readiness`
- Evening sync (8-10 PM): `/daily_activity`
- Workout sync: Every 2-4 hours or on-demand

**WHOOP (if available):**

- **Webhook-based** (real-time)
- Subscribe to `recovery.updated`, `sleep.updated`, `workout.updated`
- Poll `/cycle` endpoint as fallback

**Garmin (if approved):**

- **Webhook-based** (recommended)
- Poll `/wellness/dailySummary` daily at midnight user timezone
- Backfill with date range queries for onboarding

***

### Data Schema Normalization

**Challenge:** Each platform uses different units, naming, and HRV methods.

**Normalization Strategy:**

```typescript
interface NormalizedSleepData {
  date: string;              // ISO 8601 date (YYYY-MM-DD)
  startTime: string;         // ISO 8601 timestamp (UTC)
  endTime: string;           // ISO 8601 timestamp (UTC)
  totalSleepMinutes: number; // Minutes
  efficiency: number;        // Percentage (0-100)
  stages: {
    deepMinutes: number;
    lightMinutes: number;
    remMinutes: number;
    awakeMinutes: number;
  };
  source: 'oura' | 'apple' | 'healthconnect' | 'whoop' | 'garmin';
  sourceTimezone: string;    // IANA timezone
}

interface NormalizedHRVData {
  timestamp: string;         // ISO 8601 timestamp (UTC)
  hrvMs: number;             // Milliseconds (RMSSD normalized)
  method: 'rmssd' | 'sdnn';  // Track method for baseline comparison
  source: 'oura' | 'apple' | 'healthconnect' | 'whoop';
  context: 'sleep' | 'daytime' | 'workout';
}

interface NormalizedRecoveryData {
  date: string;              // ISO 8601 date
  recoveryScore: number;     // Normalized 0-100
  rhr: number;               // Resting heart rate (bpm)
  avgHrv: number;            // Average HRV (ms, RMSSD)
  sleepQuality: number;      // 0-100
  source: 'oura' | 'whoop';  // Only platforms with recovery scores
}
```

**Normalization Rules:**

1. **HRV Method Conversion:**
    - Apple uses SDNN → store as-is with `method: 'sdnn'`
    - Oura, Health Connect, WHOOP use RMSSD → store as-is with `method: 'rmssd'`
    - **Do NOT convert** SDNN ↔ RMSSD (complex, error-prone)
    - **Compare to user's baseline** within same method
2. **Sleep Stage Mapping:**

```
Apple "Core" = Garmin "Light" + Health Connect "Light"
Apple "Deep" = Garmin "Deep" + Health Connect "Deep"
Oura, WHOOP, Health Connect have consistent 4-stage model
```

3. **Timezone Handling:**
    - Store all timestamps in **UTC**
    - Store `sourceTimezone` separately
    - Calculate local times on-demand for UI
4. **Source Priority (for deduplication):**

```
Sleep: Oura > WHOOP > Apple Watch > Health Connect > iPhone
HRV: Oura > WHOOP > Apple Watch > Health Connect
Activity: WHOOP > Garmin > Apple Watch > Health Connect
```


***

## 7. PRIVACY \& COMPLIANCE

### HIPAA Considerations

**Key Question:** Is Apex OS a "Covered Entity" or "Business Associate"?

- **If NO** (wellness app, not medical) → HIPAA does NOT apply
- **If YES** (healthcare provider integration) → HIPAA BAA required

**For wellness apps (likely your case):**

- HIPAA does NOT apply to consumer wellness apps
- Still follow **best practices** for health data security

**Security Best Practices:**

1. **Encryption at Rest:**
    - Encrypt all health data in database (AES-256)
    - Use encrypted columns for sensitive fields (HRV, sleep, biometrics)
2. **Encryption in Transit:**
    - TLS 1.3 for all API communication
    - Certificate pinning in mobile apps
3. **Access Controls:**
    - User data isolated by user ID
    - No cross-user queries
    - Row-level security in database
4. **Data Minimization:**
    - Only store data needed for protocol personalization
    - Delete raw wearable data after aggregation (keep daily summaries)
    - Implement data retention limits (e.g., 2 years)

***

### GDPR Compliance

**For EU users (required):**

1. **Consent Management:**
    - Explicit opt-in for each wearable integration
    - Granular consent per data type
    - Easy withdrawal of consent
2. **Right to Access:**
    - Provide data export endpoint (JSON format)
    - User can download all their data
3. **Right to Deletion:**
    - Implement account deletion endpoint
    - Complete data erasure within 30 days
    - Notify connected wearable platforms
4. **Data Processing Agreement:**
    - Document data flows in privacy policy
    - Specify data retention periods
    - List third-party processors (Firebase, Supabase, etc.)

**Privacy Policy Must Include:**

- What data collected from each wearable
- How data is used (protocol personalization)
- Who has access (only user and system)
- How long data retained
- Third-party services used
- User rights (access, deletion, portability)

***

### Platform-Specific Requirements

**Apple HealthKit:**

- **MUST** request permission for each data type separately
- **MUST** provide clear usage description in `Info.plist`
- **CANNOT** sell or disclose HealthKit data to third parties (App Store rejection)
- **CANNOT** use HealthKit data for advertising

**Health Connect (Android):**

- **MUST** declare permissions in manifest
- **MUST** show clear rationale before requesting permissions
- **SHOULD** request minimal necessary permissions

**Oura / WHOOP / Garmin:**

- **MUST** comply with each platform's developer terms
- **MUST** honor user's data deletion requests on platform
- **SHOULD** notify platforms when deleting user account

***

## 8. IMPLEMENTATION CHECKLIST

### Pre-Development

- [ ] Review Apex OS PRD and identify required metrics
- [ ] Prioritize wearable platforms (recommend: HealthKit → Oura → Health Connect)
- [ ] Apply for WHOOP and Garmin partnerships (2-4 week lead time)
- [ ] Set up developer accounts (Oura Cloud, Apple Developer, Google Play Console)
- [ ] Design data normalization schema (TypeScript interfaces)
- [ ] Plan database schema (Supabase tables for normalized data)


### Phase 1: Apple HealthKit (iOS)

- [ ] Enable HealthKit capability in Xcode
- [ ] Add `NSHealthShareUsageDescription` to `Info.plist`
- [ ] Implement authorization request flow
- [ ] Create observer queries for background delivery
- [ ] Build sync service to backend
- [ ] Implement sleep data aggregation (handle multiple sources)
- [ ] Normalize HRV (SDNN → stored with method tag)
- [ ] Test with iPhone-only users (no Apple Watch)
- [ ] Test with Apple Watch users (full sleep stages)
- [ ] Test background delivery when app terminated
- [ ] Optimize battery usage (30-second background task limit)


### Phase 2: Oura Ring API V2

- [ ] Register app in Oura Developer Portal
- [ ] Implement OAuth 2.0 flow (authorization code grant)
- [ ] Store access tokens securely (encrypted)
- [ ] Implement token refresh logic (before 24-hour expiry)
- [ ] Build polling service (morning sync, evening sync)
- [ ] Handle 426 errors (app version too old)
- [ ] Fetch sleep data (`/v2/usercollection/sleep`)
- [ ] Fetch readiness data (`/v2/usercollection/daily_readiness`)
- [ ] Fetch activity data (`/v2/usercollection/daily_activity`)
- [ ] Normalize Oura data to schema (RMSSD HRV)
- [ ] Implement rate limit handling (5,000 per 5 min)
- [ ] Test with real Oura Ring Gen 3 or 4


### Phase 3: Health Connect (Android)

- [ ] Add Health Connect dependency to Gradle
- [ ] Declare permissions in `AndroidManifest.xml`
- [ ] Check SDK availability (handle older Android versions)
- [ ] Implement permission request flow
- [ ] Build data readers for sleep, HRV, heart rate, steps
- [ ] Implement Changelog API for incremental sync
- [ ] Schedule background sync with WorkManager
- [ ] Handle rate limiting exceptions
- [ ] Normalize Health Connect data (RMSSD HRV)
- [ ] Test on Android 14 (built-in) and Android 11-13 (Play Store app)
- [ ] Handle data source deduplication (multiple apps writing to Health Connect)
- [ ] Prompt users to disable battery optimization


### Phase 4: WHOOP API (If Approved)

- [ ] Complete WHOOP partnership application
- [ ] Receive approval and API credentials
- [ ] Implement OAuth 2.0 flow
- [ ] Register webhook URL in WHOOP Developer Dashboard
- [ ] Build webhook receiver endpoint
- [ ] Verify webhook signatures
- [ ] Fetch recovery data (`/v2/cycle/{id}/recovery`)
- [ ] Fetch sleep data (`/v2/sleep/{id}`)
- [ ] Fetch workout data (`/v2/workout/{id}`)
- [ ] Normalize WHOOP data (RMSSD HRV, recovery score)
- [ ] Handle score states (SCORED, PENDING_SCORE, UNSCORABLE)
- [ ] Implement fallback polling for webhook failures


### Phase 5: Garmin Health API (If Approved)

- [ ] Apply for Garmin Connect Developer Program
- [ ] Receive approval and negotiate commercial license
- [ ] Implement OAuth 1.0a flow (use library)
- [ ] Register webhook URL
- [ ] Fetch daily summaries (`/wellness/dailySummary`)
- [ ] Fetch sleep data (`/wellness/sleeps`)
- [ ] Parse sleep levels map (time-series data)
- [ ] Normalize Garmin data (note: no HRV available)
- [ ] Handle webhook events
- [ ] Implement fallback polling


### Backend Infrastructure

- [ ] Design Supabase schema for normalized data
- [ ] Create tables: `sleep_data`, `hrv_data`, `activity_data`, `recovery_data`
- [ ] Implement API endpoints for mobile apps to sync data
- [ ] Build data normalization pipeline
- [ ] Implement deduplication logic (handle multiple sources)
- [ ] Create baseline calculation service (rolling 14-day average)
- [ ] Build anomaly detection (missing data, outliers)
- [ ] Implement data retention policy (2-year limit)
- [ ] Set up monitoring and alerting (sync failures, rate limits)
- [ ] Create admin dashboard for debugging user sync issues


### Privacy \& Compliance

- [ ] Draft privacy policy covering all wearable integrations
- [ ] Implement user consent management (per-platform toggles)
- [ ] Build data export endpoint (GDPR Article 15)
- [ ] Build account deletion endpoint (GDPR Article 17)
- [ ] Implement encryption at rest (database-level)
- [ ] Enforce TLS 1.3 for all API communication
- [ ] Document data flows and retention periods
- [ ] Test consent withdrawal (disconnect wearable)
- [ ] Test data deletion (complete erasure)


### Testing \& Quality Assurance

- [ ] Unit tests for data normalization functions
- [ ] Integration tests for each wearable API
- [ ] End-to-end tests for sync workflows
- [ ] Test with real devices (not just simulators)
- [ ] Test background sync on both iOS and Android
- [ ] Test rate limiting scenarios
- [ ] Test token refresh logic
- [ ] Test error handling (network failures, API errors)
- [ ] Test timezone edge cases (travel, daylight saving)
- [ ] Load test backend (simulate 10,000 users syncing)
- [ ] Monitor battery usage on real devices (aim for <3% per day)

***

## 9. KEY TAKEAWAYS

### Critical December 2025 Updates

1. **Google Fit is DEAD** — Use Health Connect (Android) instead
2. **Oura API V2** is current — V1 deprecated, Personal Access Tokens ending 2025
3. **WHOOP API V2** launched July 2025 — UUID-based, improved webhooks
4. **Apple HealthKit** still device-local — no backend API, native app required
5. **Garmin requires commercial license** — not free for production

### Technical Complexity Ranking

| Platform | Complexity | Reason |
| :-- | :-- | :-- |
| **Oura** | 🟢 Easy | Standard OAuth 2.0, REST API, clear docs |
| **WHOOP** | 🟡 Medium | OAuth 2.0, webhooks, but requires partnership |
| **Health Connect** | 🟡 Medium | Android-native, rate limits, changelog API |
| **Apple HealthKit** | 🔴 Hard | Native iOS required, background delivery, no backend API |
| **Garmin** | 🔴 Hard | OAuth 1.0a signing, commercial license, limited HRV |

### Data Quality Ranking

**HRV Accuracy (2025 Peer-Reviewed Study):**

1. **Oura Ring** — Most accurate, finger placement ideal
2. **WHOOP** — High accuracy, wrist-based
3. **Apple Watch** — Good accuracy (SDNN not RMSSD)
4. **Garmin** — Lower accuracy, limited HRV data

**Sleep Stage Tracking:**

1. **Oura Ring** — Best for sleep (primary use case)
2. **WHOOP** — Excellent sleep analysis
3. **Apple Watch** — Good (Series 4+), requires watch
4. **Garmin** — Good, but less biohacker focus

### Integration Priority for Apex OS

**Launch with (MVP):**

1. Apple HealthKit (iOS)
2. Oura Ring API V2

**Why:** Covers 50%+ of target market (Huberman listeners), provides best HRV data.

**Add next (Growth):**
3. Health Connect (Android support)
4. WHOOP (if partnership approved)
5. Garmin (broad market, corporate angle)

### Sync Strategy Summary

| Platform | Method | Frequency | Latency |
| :-- | :-- | :-- | :-- |
| **Oura** | Polling | Morning (sleep), Evening (activity) | 1-2 hours |
| **Apple HealthKit** | Background Delivery | Real-time (when data written) | Minutes |
| **Health Connect** | Changelog API | Foreground + WorkManager (4-6h) | Minutes to hours |
| **WHOOP** | Webhooks | Real-time | Minutes |
| **Garmin** | Webhooks | Daily midnight (summaries) | 1-2 hours |

### Common Pitfalls to Avoid

1. **Don't convert SDNN ↔ RMSSD** — Store with method tag, compare to user's baseline within method
2. **Don't ignore timezones** — Store UTC, track source timezone separately
3. **Don't skip deduplication** — HealthKit/Health Connect aggregate multiple sources
4. **Don't poll Apple Health** — Use background delivery, not timers
5. **Don't ignore rate limits** — Implement exponential backoff, respect limits
6. **Don't assume real-time sync** — Wearables batch data, latency expected
7. **Don't forget battery optimization** — Android throttles background work aggressively
8. **Don't neglect error handling** — Network failures, expired tokens, rate limits are common
9. **Don't expose HealthKit data** — Apple prohibits selling or sharing (App Store rejection)
10. **Don't assume webhooks are reliable** — Always implement polling fallback

***

## NEXT STEPS

### Immediate Actions (Week 1)

1. **Apply for partnerships:**
    - WHOOP Developer Platform (2-4 week approval)
    - Garmin Connect Developer Program (2-4 week approval)
2. **Set up developer accounts:**
    - Oura Developer Portal (immediate)
    - Apple Developer Program (\$99/year, immediate)
    - Google Play Console (\$25 one-time, immediate)
3. **Design data schema:**
    - Create TypeScript interfaces for normalized data
    - Design Supabase tables
    - Document data flow architecture

### Phase 1 Implementation (Months 1-2)

4. **Build iOS app with HealthKit:**
    - Enable HealthKit capability
    - Implement authorization and background delivery
    - Build sync service to Supabase
5. **Integrate Oura API V2:**
    - Implement OAuth 2.0 flow
    - Build polling service
    - Normalize data to schema
6. **Test with real users:**
    - Recruit 10-20 beta testers with iPhone + Oura Ring
    - Monitor sync reliability and battery usage
    - Iterate based on feedback

### Phase 2 Expansion (Months 3-6)

7. **Add Android support (Health Connect)**
8. **Add WHOOP (if approved)**
9. **Scale to 1,000 users**

***

**This comprehensive guide provides everything needed to implement wearable integrations for Apex OS. Focus on HealthKit + Oura for MVP, then expand based on user demand and partnership approvals.**

***

## REFERENCES

**Official Documentation:**

- [Oura API V2 Documentation](https://cloud.ouraring.com/v2/docs) (December 2025)
- [Apple HealthKit Documentation](https://developer.apple.com/documentation/healthkit) (December 2025)
- [Health Connect Documentation](https://developer.android.com/health-and-fitness/health-connect) (December 2025)
- [WHOOP Developer Platform](https://developer.whoop.com) (December 2025)
- [Garmin Connect Developer Program](https://developer.garmin.com/gc-developer-program) (December 2025)

**Peer-Reviewed Research:**

- 2025 independent study: Oura and WHOOP most accurate for HRV and RHR tracking

**Market Context:**

- Google Fit deprecated June 30, 2025 → Health Connect mandatory for Android
- Oura Personal Access Tokens deprecated end of 2025 → OAuth 2.0 required
- WHOOP API V2 launched July 2025 with improved data models
<span style="display:none">[^1][^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^2][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^3][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^4][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^5][^50][^51][^52][^53][^54][^55][^56][^57][^58][^59][^6][^60][^61][^62][^63][^64][^65][^66][^67][^68][^69][^7][^70][^71][^72][^73][^74][^75][^76][^77][^78][^8][^9]</span>

<div align="center">⁂</div>

[^1]: APEX_OS_PRD_FINAL_v6.md

[^2]: LANDING_PAGE_COPY.md

[^3]: COMPETITIVE_ANALYSIS.md

[^4]: BRAND_GUIDE.md

[^5]: APEX_OS_COMPETITIVE_ANALYSIS.md

[^6]: https://api.ouraring.com/docs/authentication

[^7]: https://stackoverflow.com/questions/26375767/healthkit-background-delivery-when-app-is-not-running

[^8]: https://developer.android.com/health-and-fitness/health-connect/rate-limiting

[^9]: https://support.ouraring.com/hc/en-us/articles/4415266939155-The-Oura-API

[^10]: https://articles.readytowork.jp/step-by-step-guide-to-health-kit-implementation-with-flutter-on-ios-2f4dcf798c8b

[^11]: https://stackoverflow.com/questions/54457720/google-fit-api-quotas-and-limitation

[^12]: https://cloud.ouraring.com/v2/docs

[^13]: https://developer.apple.com/documentation/HealthKit/HKHealthStore/enableBackgroundDelivery(for:frequency:withCompletion:)

[^14]: https://www.spikeapi.com/blog/google-fit-shutdown-what-developers-need-to-know-and-how-to-prepare

[^15]: https://api.ouraring.com/docs/

[^16]: https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.healthkit.background-delivery

[^17]: https://developer.android.com/health-and-fitness/health-connect/migration/fit/faq

[^18]: https://jsr.io/@pinta365/oura-api

[^19]: https://developer.apple.com/documentation/xcode/configuring-healthkit-access

[^20]: https://arstechnica.com/gadgets/2024/05/google-fit-apis-get-shut-down-in-2025-might-break-fitness-devices/

[^21]: https://skywork.ai/skypage/en/oura-mcp-server-ai-engineer/1981578321872392192

[^22]: https://developer.apple.com/documentation/FinanceKit/implementing-a-background-delivery-extension

[^23]: https://www.thryve.health/blog/google-fit-api-deprecation-and-the-new-health-connect-by-android-what-thryve-customers-need-to-know

[^24]: https://community.home-assistant.io/t/oura-ring-v2-custom-integration-track-your-sleep-readiness-activity-in-home-assistant/944424

[^25]: https://developer.apple.com/documentation/healthkit/hkhealthstore/enablebackgrounddelivery(for:frequency:withcompletion:)?language=objc

[^26]: https://engineering.whoop.com/dev-platform/

[^27]: https://mcpmarket.com/server/garmin-1

[^28]: https://the5krunner.com/2025/10/06/garmin-beaten-by-oura-whoop-in-hrv-accuracy-showdown/

[^29]: https://developer.whoop.com/api-terms-of-use/

[^30]: https://www.reddit.com/r/Garmin/comments/1k5u32x/building_a_health_analysis_workflow_with_chatgpt/

[^31]: https://www.reddit.com/r/whoop/comments/1kecl3w/over_a_year_using_whoop_alongside_garmin_heres/

[^32]: https://developer.whoop.com/docs/developing/getting-started/

[^33]: https://www.themomentum.ai/blog/why-mobile-health-apps-struggle-with-wearable-integrations

[^34]: https://vertu.com/ar/guides/oura-vs-whoop-2025-us-buyers-definitive-choice/

[^35]: https://developer.whoop.com/docs/api-changelog/

[^36]: https://developer.garmin.com/gc-developer-program/health-api/

[^37]: https://www.sportsmith.co/articles/whoop-vs-oura-ring-real-life-data-analysis-and-comparisons/

[^38]: https://developer.whoop.com/docs/introduction/

[^39]: https://developer.garmin.com

[^40]: https://www.garagegymreviews.com/whoop-vs-oura

[^41]: https://developer.whoop.com/api/

[^42]: https://developer.garmin.com/gc-developer-program/activity-api/

[^43]: https://www.cosmopolitan.com/health-fitness/a61975698/oura-ring-vs-whoop-tracker/

[^44]: https://developer.whoop.com

[^45]: https://developer.android.com/health-and-fitness/community/newsletters/2025/08

[^46]: https://partnersupport.ouraring.com/hc/en-us/articles/19907726838163-Oura-API-V2-Upgrade-Guide

[^47]: https://www.reddit.com/r/swift/comments/1csbcwx/how_do_you_query_for_sleep_data_deep_sleep_rem/

[^48]: https://www.elastic.io/integration-best-practices/sync-data-between-applications-apis-webhooks/

[^49]: https://www.reddit.com/r/ouraring/comments/1p578qk/oura_team_please_move_hrv_back_to_the_sleep_tab/

[^50]: https://www.strv.com/blog/the-developer-s-guide-to-building-with-apple-healthkit

[^51]: https://dev.to/momentumai/why-health-apps-struggle-with-wearable-integrations-and-how-to-fix-it-5l2

[^52]: https://support.mydatahelps.org/hc/en-us/articles/360062222433-Apple-Sleep-Device-Data-Types

[^53]: https://www.brickstech.io/blogs/a-comprehensive-guide-to-api-integration-in-2025

[^54]: https://airbyte.com/top-etl-tools-for-sources/oura

[^55]: https://sites.google.com/view/arlogarji

[^56]: https://7pillars.com.au/blog/best-practices-for-testing-wearable-applications-in-2025/

[^57]: https://developer.apple.com/documentation/healthkit/data-types

[^58]: https://www.mindbowser.com/wearable-app-development-guide/

[^59]: https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis

[^60]: https://calgaryappdeveloper.ca/blog/wearable-app-development/

[^61]: https://zackproser.com/blog/connect-oura-ring-to-claude-desktop-with-mcp

[^62]: https://mylens.ai/space/miladmoosavi77s-workspace-2zb58n/apple-healthkit-data-overview-m7vebk

[^63]: https://developer.whoop.com/docs/developing/user-data/recovery/

[^64]: https://tryterra.co/integrations/garmin

[^65]: https://thisisglance.com/learning-centre/how-do-i-reduce-my-apps-battery-drain-on-users-phones

[^66]: https://developer.whoop.com/docs/developing/v1-v2-migration/

[^67]: https://www.linkedin.com/pulse/best-practices-mobile-app-battery-life-optimization-2024-appsunify-lunvc

[^68]: https://ilumivu.freshdesk.com/support/solutions/articles/9000258793-garmin-health-api-data-daily-summary

[^69]: https://www.sidekickinteractive.com/uncategorized/best-practices-for-reducing-app-battery-drain/

[^70]: https://developer.whoop.com/docs/developing/user-data/sleep/

[^71]: https://www.thryve.health/blog/wearable-api-integration-guide-for-developers

[^72]: https://www.atharvasystem.com/best-tips-and-strategies-to-improve-android-app-performance/

[^73]: https://github.com/ald0405/whoop-data

[^74]: https://developer.android.com/training/wearables/apps/power

[^75]: https://skywork.ai/skypage/en/unlocking-health-data-whoop-mcp-server/1981559023663640576

[^76]: https://developer.garmin.com/gc-developer-program/

[^77]: https://www.samsung.com/us/support/galaxy-battery/optimization/

[^78]: https://tryterra.co/blog/whoop-integration-series-part-2-data-available-from-the-api-ec4337a9455b

