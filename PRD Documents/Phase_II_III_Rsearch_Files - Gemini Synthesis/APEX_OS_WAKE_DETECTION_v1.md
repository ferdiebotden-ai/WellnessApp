**Wake Detection & Morning Anchor Research Report**

**Project:** Wellness App with Morning Anchor Protocol  
**Date:** December 3, 2025  
**Research Focus:** Wake detection algorithms, wearable API integration, and optimal Morning Anchor triggering

---

**Executive Summary**

This report provides comprehensive research on wake detection methodologies for a wellness application featuring a "Morning Anchor" protocol. Based on December 2025 best practices, the research covers physiological wake signals, algorithm approaches, wearable API capabilities (Oura Ring and Apple Watch), optimal trigger timing, fallback strategies, and mobile OS background processing constraints.

**Key Findings:**

* **Oura Ring leads in wake detection accuracy** at 68.6% sensitivity vs. 52.4% for Apple Watch\[1\]

* **Optimal trigger window:** 5-15 minutes post-wake to maximize protocol compliance

* **Multi-signal approach recommended:** Combined HR, HRV, and movement data significantly improves accuracy

* **Battery-efficient implementation possible:** Using iOS Background Refresh and Android WorkManager with smart polling

---

**1\. Wake Detection Signals**

**1.1 Physiological Indicators of Wake vs. Sleep**

**Movement-Based Signals:**

* **Accelerometer patterns:** Wake characterized by sustained movement vs. stillness during sleep\[3\]

* **Threshold-based detection:** Movement acceleration \>40 m/s² typically indicates wake transitions\[64\]

* **Continuous monitoring:** Low-power accelerometer tracking provides primary wake signal

**Heart Rate (HR) Changes:**

* **Wake-associated HR increase:** Average HR rises 5-15 bpm upon waking

* **Transition pattern:** Gradual increase over 2-5 minutes post-wake

* **REM vs. Wake distinction:** REM sleep shows elevated HR but lacks sustained acceleration\[2\]

**Heart Rate Variability (HRV) Shifts:**

* **NREM → Wake transition:** Shift from high HF (parasympathetic) to increased LF/HF ratio (sympathetic activation)\[2\]

* **Frequency domain markers:** LF band (0.04-0.15 Hz) increases, HF band (0.15-0.4 Hz) decreases\[2\]

* **Time domain markers:** RMSSD and SDNN decrease during wake\[11\]

* **Reliability:** HRV shows better reproducibility during stable sleep (SWS) than during REM or wake transitions\[11\]

**1.2 Wearable Detection Accuracy**

**Oura Ring Performance (December 2025):**

* **Sleep/wake classification:** 95%+ sensitivity for sleep detection\[1\]\[4\]

* **Wake detection sensitivity:** 68.6% (highest among consumer devices)\[1\]\[4\]

* **Specificity for wake:** 48% (tendency to miss some wake periods)\[22\]

* **Overall accuracy:** Cohen's kappa 0.65 for four-stage sleep classification\[1\]

**Apple Watch Performance:**

* **Sleep/wake sensitivity:** 95%+ for sleep detection\[13\]

* **Wake detection sensitivity:** 52.4% (lower than Oura)\[1\]\[4\]

* **Tendency:** Overestimates light and deep sleep; underestimates wake by average 7 minutes\[10\]

* **Overall accuracy:** Cohen's kappa 0.60 for four-stage classification\[1\]

**False Positive Scenarios:**

* **Bathroom trips:** Brief movement periods (1-2 minutes) may trigger false wake detection

* **Restless sleep:** Extended periods of movement without actual wake (20+ minutes)

* **Partner disturbances:** Movement from bed partner can affect accelerometer readings

**Distinguishing "Awake in Bed" from "Out of Bed":**

* **Accelerometer magnitude:** Out-of-bed shows sustained high-magnitude acceleration (walking, standing)

* **Pattern duration:** True wake shows 5+ minutes of consistent activity

* **HR stabilization:** Out-of-bed typically shows sustained elevated HR vs. brief spikes

---

**2\. Algorithm Approaches**

**2.1 Detection Methodologies**

**Movement-Based Detection:**

* **Threshold approach:** Acceleration \>40 m/s² for 60+ seconds indicates wake\[64\]

* **Window analysis:** 5-minute sliding window to smooth noise and reduce false positives

* **Advantages:** Low power consumption, real-time capable

* **Limitations:** Cannot distinguish sleep from stillness while awake (reading, meditation)

**Heart Rate-Based Detection:**

* **Change detection:** HR increase \>10% sustained for 3+ minutes

* **Baseline calculation:** Compare to 30-minute rolling average during sleep

* **Advantages:** More reliable than movement alone for distinguishing wake

* **Limitations:** Higher power consumption, requires continuous PPG monitoring

**HRV-Based Detection:**

* **LF/HF ratio shift:** Transition from ratio \<1.0 (sleep) to \>1.5 (wake)\[2\]

* **Time domain features:** RMSSD decrease \>20% from sleep baseline

* **Advantages:** Strong physiological validity, less affected by brief movements

* **Limitations:** Requires high-quality signal processing, computationally intensive

**Combined Multi-Signal Approach (Recommended):**  
Wake Detection \= f(movement, ΔHR, ΔHRV, time\_of\_day)

Decision logic:

1. Primary signal: Sustained movement (60s+) with accel \>40 m/s²

2. Confirmation: HR increase \>8% from sleep average

3. Validation: HRV shift (LF/HF ratio \>1.2)

4. Context: Time within expected wake window (±2h from typical wake)

Confidence levels:

* High (95%+): All 4 signals align

* Medium (75-95%): 3 signals align

* Low (\<75%): 2 or fewer signals (suggest waiting for confirmation)

**2.2 Machine Learning vs. Rule-Based**

**Machine Learning Approaches:**

* **Self-supervised deep learning:** Neural networks achieve κ=0.39 on accelerometer data alone\[3\]

* **Feature extraction:** Automatic learning of patterns from raw accelerometer \+ PPG data\[3\]

* **Advantages:** Adapts to individual patterns, improves over time with user data

* **Disadvantages:** Requires training data, higher computational cost, battery impact

**Rule-Based Detection:**

* **Threshold systems:** Fixed cutoffs for movement, HR change, HRV shift

* **Heuristic logic:** If-then rules based on physiological research

* **Advantages:** Lightweight, deterministic, immediate deployment

* **Disadvantages:** Less personalized, may require manual tuning per user

**Recommendation for MVP:**  
Start with rule-based multi-signal approach (lower development complexity, faster time-to-market), then evolve to ML-based personalization in Phase 2 with accumulated user data.

---

**3\. API Data for Wake Detection**

**3.1 Oura Ring API (v2.0)**

**Available Fields:**\[46\]\[55\]

* **Sleep periods:** bedtime\_start, bedtime\_end, sleep\_phase\_5\_min (string encoding stages)

* **Wake time:** No direct wake\_up\_time field, must be derived from bedtime\_end

* **Movement data:** movement\_30\_sec (1=Low, 2=Medium, 3=High, 4=Very High)

* **Awake time:** awake\_time (total seconds awake during sleep period)

* **Sleep stages:** deep, light, rem, awake (durations in seconds)

**Data Latency:**

* **Synchronization:** Oura syncs data when ring is near phone (Bluetooth range)

* **Processing delay:** Sleep data typically available 5-30 minutes after wake

* **Real-time limitations:** No continuous streaming; data is batch-processed post-sleep

**Wake Detection Strategy:**  
// Derive wake time from Oura API  
const wakeTime \= sleepData.bedtime\_end; // ISO timestamp  
const awakeSegments \= parseAwakePhases(sleepData.sleep\_phase\_5\_min);  
const finalWake \= awakeSegments\[awakeSegments.length \- 1\].end;

**Challenges:**

* Dashboard shows more granular wake periods (6) vs. API (3)\[43\]

* No real-time accelerometer access—only post-processed summary data

* Must wait for sync after wake (cannot trigger immediately)

**3.2 Apple HealthKit API**

**HKCategoryTypeIdentifierSleepAnalysis:**\[42\]\[45\]\[54\]

* **Category values:** InBed, Asleep, Awake (no REM/Deep/Light in native HealthKit)

* **Sample structure:** HKCategorySample with startDate and endDate

* **Sleep end detection:** Query for most recent Asleep sample, use its endDate as wake time

**Data Availability:**

* **Real-time updates:** Apple Watch syncs to HealthKit within 1-5 minutes of wake

* **Background queries:** Can set up HKObserverQuery to detect new sleep data

* **Latency:** Typically 2-10 minutes from actual wake to data availability in HealthKit

**Code Pattern:**\[42\]  
// Query for most recent sleep sample  
let sleepType \= HKObjectType.categoryType(  
forIdentifier: .sleepAnalysis  
)\!

let sortDescriptor \= NSSortDescriptor(  
key: HKSampleSortIdentifierEndDate,  
ascending: false  
)

let query \= HKSampleQuery(  
sampleType: sleepType,  
predicate: nil,  
limit: 30,  
sortDescriptors: \[sortDescriptor\]  
) { query, results, error in  
// Parse wake time from most recent Asleep sample  
}

**Advanced Watch Sensors (watchOS):**

* **Direct accelerometer:** Can access via Core Motion for real-time wake detection

* **Heart rate streams:** HealthKit provides HR samples at 1-5 minute intervals

* **Limitations:** Background access restricted; requires active Watch app session

**3.3 Latency and Real-Time Constraints**

**Typical Data Flow Timeline:**  
Actual wake → 0:00  
↓  
Wearable detects (on-device) → 0:30 \- 2:00 min  
↓  
Bluetooth sync to phone → 2:00 \- 5:00 min  
↓  
API data available → 5:00 \- 15:00 min  
↓  
App polls/receives data → 5:00 \- 20:00 min  
↓  
Morning Anchor triggered → 5:00 \- 20:00 min

**Implication:** Minimum realistic trigger latency is 5-10 minutes post-wake for passive detection via wearable APIs.

---

**4\. Triggering Morning Anchor Protocol**

**4.1 Optimal Timing Window**

**Circadian Science:**\[62\]\[63\]

* **Light exposure effectiveness:** First 15 minutes post-wake are critical for circadian phase advancement\[66\]

* **Morning cortisol awakening response:** Peaks 30-45 minutes after wake

* **Sleep inertia period:** Lasts 5-30 minutes; gradual dissipation needed\[23\]

**Recommended Trigger Timing:**  
Target: 5-15 minutes post-wake

Rationale:

* Min (5 min): Allow sync latency \+ brief sleep inertia buffer

* Max (15 min): Capture peak circadian light sensitivity window

* Avoid immediate (\<5 min): Data may not be available yet

* Avoid late (\>15 min): User may have started other routines

**Protocol Components:**\[23\]\[63\]

1. **Light exposure reminder:** "Get 5-10 min outside light now" (or open window)

2. **Hydration prompt:** "Drink 16-20 oz water within 45 min of waking"

3. **Movement suggestion:** "5-15 min gentle movement or breathwork"

**4.2 Handling Uncertainty**

**"User Might Go Back to Sleep" Scenarios:**

**Detection heuristics:**

* **Movement cessation:** If no movement detected 10+ minutes after initial wake signal

* **HR drop:** Return to sleep-level HR within 15 minutes

* **Time of day:** Wake detection before 5:00 AM (user's typical wake \-2h) suggests false positive

**Response strategy:**  
If (high\_confidence\_wake):  
Trigger Morning Anchor immediately  
Elif (medium\_confidence\_wake AND within\_expected\_window):  
Wait 5 min, re-check signals, then trigger  
Elif (low\_confidence\_wake OR very\_early\_wake):  
Suppress trigger, wait for next detection cycle

**4.3 Notification Delivery**

**Push Notification vs. In-App:**

* **Push recommended:** User may not open app immediately post-wake

* **Rich notifications:** Include actionable buttons ("Start Morning Anchor," "Snooze 5 min")

* **Sound/haptic:** Gentle, progressive alert (not jarring alarm)

**Respecting Quiet Hours / Do Not Disturb:**

**iOS:**

* **Interruption Level:** Use timeSensitive notification level (iOS 15+) to bypass Focus modes for health-critical reminders

* **User control:** Allow user to set "earliest notification time" (default: 5:00 AM)

**Android:**

* **Notification channels:** Set high priority for Morning Anchor channel

* **DND override:** Request ACCESS\_NOTIFICATION\_POLICY permission for DND override (use sparingly)

**4.4 No Wearable Data Scenarios**

**Fallback hierarchy:**

1. **Phone unlock as wake proxy** (see Section 5.1)

2. **Alarm time \+ buffer** (see Section 5.2)

3. **Historical wake time \+ variance** (see Section 5.3)

4. **Manual trigger:** User initiates Morning Anchor via app

---

**5\. Fallback Strategies**

**5.1 Phone Unlock Time as Wake Proxy**

**Methodology:**

* **iOS:** Monitor UIApplication.willEnterForegroundNotification for first unlock of day

* **Android:** Detect ACTION\_USER\_PRESENT broadcast (phone unlocked by user)\[73\]

**Accuracy considerations:**

* **Pros:** Typically within 2-10 minutes of actual wake; no wearable dependency

* **Cons:** User may wake, stay in bed 10-30 min before checking phone; doesn't capture true wake

**Implementation:**  
// Detect first phone unlock after 4:00 AM  
let firstUnlockDetected \= false;

function onAppForeground() {  
const now \= new Date();  
const hourOfDay \= now.getHours();

if (\!firstUnlockDetected && hourOfDay \>= 4 && hourOfDay \<= 11\) {  
    firstUnlockDetected \= true;  
    triggerMorningAnchor(now);  
}

}

**5.2 Alarm Time as Expected Wake**

**Data sources:**

* **iOS:** No direct alarm access (privacy limitation)

* **Android:** Can query AlarmManager for next scheduled alarm (requires permission)

**Strategy:**  
If (alarm\_set):  
Expected\_wake \= alarm\_time \+ 5 min buffer  
Poll for wearable data starting at expected\_wake  
Else:  
Use fallback method (historical pattern)

**Limitations:**

* User may wake before alarm (natural circadian wake)

* User may snooze alarm multiple times

* Not all users set consistent alarms

**5.3 Machine Learning on Historical Wake Times**

**Training data:**

* Collect 14-30 days of wake times from wearable data

* Store: wake\_time, day\_of\_week, previous\_night\_bedtime, total\_sleep\_duration

**Prediction model:**  
// Simple statistical approach (non-ML baseline)  
function predictWakeTime(dayOfWeek: number): Date {  
const historicalWakes \= getWakeTimeHistory(dayOfWeek, last30Days);  
const meanWake \= calculateMean(historicalWakes);  
const stdDev \= calculateStdDev(historicalWakes);

// Predict wake within 1 std dev window  
return {  
    earliest: meanWake \- stdDev,  
    expected: meanWake,  
    latest: meanWake \+ stdDev  
};

}

// Poll for wake detection starting at (expected \- stdDev)

**ML enhancement (Phase 2):**

* Use regression model (e.g., Random Forest) with features: day\_of\_week, prev\_bedtime, avg\_sleep\_duration, workday\_vs\_weekend

* Achieve ±15-30 min prediction accuracy after sufficient training data

**5.4 User-Configured Typical Wake Time**

**User input:**

* "What time do you typically wake up on weekdays?" → 6:30 AM ± 30 min

* "What time on weekends?" → 8:00 AM ± 45 min

**Usage:**  
Wake\_window \= \[user\_typical\_wake \- variance, user\_typical\_wake \+ variance\]

Begin polling for wearable data at start of window  
Trigger Morning Anchor when wake detected OR at (typical\_wake \+ 15 min)

**Pros:** Always available, respects user expectations  
**Cons:** Least accurate, doesn't adapt to natural variations

---

**6\. Battery & Performance Optimization**

**6.1 iOS Background Processing**

**Background Fetch API (Legacy):**\[21\]

* **Mechanism:** UIApplication.setMinimumBackgroundFetchInterval()

* **Limitations:** System decides when to execute; no guaranteed timing

* **Typical frequency:** 1-3 times per hour based on usage patterns

**BackgroundTasks Framework (iOS 13+):**\[21\]\[33\]

* **BGAppRefreshTask:** Short execution window (30 seconds) for quick data fetch

* **BGProcessingTask:** Longer execution (several minutes) for intensive work

* **Scheduling:** BGTaskScheduler with identifier in Info.plist

**Best Practice for Morning Wake Detection:**  
// Schedule background refresh at predicted wake window  
func scheduleWakeDetection() {  
let request \= BGAppRefreshTaskRequest(  
identifier: "com.app.morning-wake-check"  
)  
request.earliestBeginDate \= Date().addingTimeInterval(  
predictedWakeTime \- currentTime  
)

try? BGTaskScheduler.shared.submit(request)

}

// Handle background task  
BGTaskScheduler.shared.register(  
forTaskWithIdentifier: "com.app.morning-wake-check"  
) { task in  
checkForWakeData()  
task.setTaskCompleted(success: true)  
}

**Key Constraints:**\[21\]

* **No exact timing:** System batches background tasks around predicted app usage

* **Battery budget:** Limited to \~5% battery per day for background processing

* **Low Power Mode:** Background tasks suspended when enabled

* **User patterns:** More background time allocated to frequently-used apps

**Workaround for Time-Sensitive Wake Detection:**

* **High-priority silent push:** Use APNs with content-available: 1 to wake app

* **Server-side intelligence:** Backend predicts wake time, sends push at optimal moment

* **Trade-off:** Requires server infrastructure \+ network dependency

**6.2 Android Background Processing**

**WorkManager (Recommended):**\[87\]\[90\]

* **Mechanism:** Schedule periodic work that respects Doze and App Standby

* **Typical execution:** Every 15+ minutes (minimum interval)

* **Advantages:** Survives app restart, handles Doze gracefully

**Implementation:**\[90\]  
// Schedule periodic wake detection check  
val workRequest \= PeriodicWorkRequestBuilder\<WakeDetectionWorker\>(  
15, TimeUnit.MINUTES  
).setConstraints(  
Constraints.Builder()  
.setRequiredNetworkType(NetworkType.CONNECTED)  
.build()  
).build()

WorkManager.getInstance(context).enqueue(workRequest)

// Worker class  
class WakeDetectionWorker(context: Context, params: WorkerParameters)  
: Worker(context, params) {  
override fun doWork(): Result {  
val wakeDetected \= checkWearableDataForWake()  
if (wakeDetected) {  
triggerMorningAnchor()  
}  
return Result.success()  
}  
}

**Doze Mode Handling:**\[81\]\[84\]\[93\]

* **Doze restrictions:** Network suspended, wake locks ignored, jobs deferred

* **Maintenance windows:** Brief periods (5-10 min) where WorkManager can execute

* **Frequency in Doze:** Maintenance windows become less frequent over time (1-2x per hour → 1x per few hours)

**Exact Alarm for Critical Timing:**\[87\]\[93\]  
// Use only if precise timing required (15-minute WorkManager may miss window)  
val alarmManager \= getSystemService(Context.ALARM\_SERVICE) as AlarmManager

alarmManager.setExactAndAllowWhileIdle(  
AlarmManager.RTC\_WAKEUP,  
predictedWakeTime,  
pendingIntent  
)

**Note:** Exact alarms wake device from Doze but drain battery—use sparingly.

**6.3 Balancing Detection Speed vs. Battery Drain**

**Polling Frequency Trade-offs:**

| Strategy | Polling Interval | Detection Latency | Battery Impact |
| :---- | :---- | :---- | :---- |
| **Aggressive** | Every 5 min | 5-10 min | High (5-8%/day) |
| **Moderate** | Every 15 min | 15-20 min | Medium (2-4%/day) |
| **Conservative** | Every 30 min | 30-40 min | Low (\<2%/day) |

**Recommended Approach: Dynamic Polling**  
// Adjust polling based on predicted wake window  
function scheduleDynamicPolling() {  
const now \= new Date();  
const predictedWake \= getPredictedWakeTime();  
const timeUntilWake \= predictedWake \- now;

if (timeUntilWake \> 2 \* 60 \* 60 \* 1000\) {  
    // \>2 hours until wake: Poll every 30 min  
    scheduleNextPoll(30 \* 60 \* 1000);  
} else if (timeUntilWake \> 30 \* 60 \* 1000\) {  
    // 30 min \- 2 hours: Poll every 15 min  
    scheduleNextPoll(15 \* 60 \* 1000);  
} else {  
    // Within 30 min window: Poll every 5 min  
    scheduleNextPoll(5 \* 60 \* 1000);  
}

}

**Battery Optimization Best Practices:**\[85\]\[91\]

* **Batch operations:** Combine wearable sync with other network requests

* **WiFi opportunism:** Prefer syncing when device on WiFi vs. cellular

* **Accelerometer efficiency:** Use low-power motion coprocessor (Apple M-series, Android sensor hub)

* **Avoid persistent connections:** No long-lived Bluetooth connections; sync on-demand

---

**7\. Implementation Recommendations**

**7.1 Wake Detection Algorithm Flowchart**

START  
↓  
\[1\] Predict wake window (historical data \+ user config)  
↓  
\[2\] Begin dynamic polling at (predicted\_wake \- 30 min)  
↓  
\[3\] Query wearable API for latest sleep data  
↓  
\[4\] Check: Sleep period ended?  
├─ NO → Wait (next poll cycle) → \[3\]  
└─ YES ↓  
\[5\] Extract candidate wake time  
↓  
\[6\] Validate with multi-signal check:  
\- Movement: Sustained accel \>40 m/s² for 60s+?  
\- HR: Increased \>8% from sleep avg?  
\- HRV: LF/HF ratio shifted \>1.2?  
\- Time: Within expected window (±2h)?  
↓  
\[7\] Calculate confidence score  
├─ High (4/4 signals) → TRIGGER MORNING ANCHOR  
├─ Medium (3/4 signals) → Wait 5 min, re-check → \[3\]  
└─ Low (≤2/4 signals) → Fallback strategy → \[8\]  
↓  
\[8\] Fallback hierarchy:  
a) Phone unlock detection  
b) Alarm time \+ buffer  
c) Historical ML prediction  
d) User-configured wake time  
↓  
\[9\] TRIGGER MORNING ANCHOR  
↓  
\[10\] Send notification:  
\- Light exposure reminder  
\- Hydration prompt  
\- Movement suggestion  
↓  
\[11\] Log event for ML model improvement  
↓  
END

**7.2 Signal Thresholds Summary**

| Signal Type | Threshold | Duration | Rationale |
| :---- | :---- | :---- | :---- |
| **Accelerometer** | \>40 m/s² | 60s+ continuous | Sustained movement indicates out-of-bed |
| **Heart Rate** | \+8% from sleep avg | 3 min sustained | Gradual increase characteristic of wake |
| **HRV (LF/HF)** | Ratio \>1.2 | 5 min window | Sympathetic activation marker |
| **RMSSD** | \-20% from sleep baseline | 5 min window | Parasympathetic withdrawal |
| **Time Context** | ±2h from typical wake | \- | Circadian prior probability |

**7.3 API Query Pattern**

**Oura Ring:**  
// Poll Oura API for sleep data  
async function checkOuraForWake(): Promise\<WakeEvent | null\> {  
const response \= await fetch(  
'[https://api.ouraring.com/v2/usercollection/sleep](https://api.ouraring.com/v2/usercollection/sleep)',  
{ headers: { Authorization: Bearer ${ouraToken} } }  
);  
const sleepData \= await response.json();

// Get most recent sleep period  
const latestSleep \= sleepData.data\[0\];  
const wakeTime \= new Date(latestSleep.bedtime\_end);  
const now \= new Date();

// Check if wake occurred in last 30 minutes  
if ((now \- wakeTime) \< 30 \* 60 \* 1000\) {  
    return {  
        wakeTime,  
        confidence: calculateConfidence(latestSleep),  
        source: 'oura'  
    };  
}

return null;

}

**Apple HealthKit:**  
// Query HealthKit for sleep end  
func checkHealthKitForWake(completion: @escaping (WakeEvent?) \-\> Void) {  
let sleepType \= HKObjectType.categoryType(  
forIdentifier: .sleepAnalysis  
)\!

let sortDescriptor \= NSSortDescriptor(  
    key: HKSampleSortIdentifierEndDate,  
    ascending: false  
)

let query \= HKSampleQuery(  
    sampleType: sleepType,  
    predicate: nil,  
    limit: 10,  
    sortDescriptors: \[sortDescriptor\]  
) { \_, results, \_ in  
    guard let samples \= results as? \[HKCategorySample\] else {  
        completion(nil)  
        return  
    }  
      
    // Find most recent "Asleep" sample  
    let asleepSamples \= samples.filter {   
        $0.value \== HKCategoryValueSleepAnalysis.asleep.rawValue   
    }  
      
    if let latestSleep \= asleepSamples.first {  
        let wakeTime \= latestSleep.endDate  
        let now \= Date()  
          
        if now.timeIntervalSince(wakeTime) \< 30 \* 60 {  
            completion(WakeEvent(  
                wakeTime: wakeTime,  
                confidence: 0.8,  
                source: "healthkit"  
            ))  
            return  
        }  
    }  
      
    completion(nil)  
}

healthStore.execute(query)

}

**7.4 Fallback Hierarchy Logic**

async function detectWake(): Promise\<WakeEvent\> {  
// 1\. Primary: Wearable API  
let wakeEvent \= await checkWearableAPIs(); // Oura or HealthKit  
if (wakeEvent && wakeEvent.confidence \> 0.7) {  
return wakeEvent;  
}

// 2\. Secondary: Phone unlock proxy  
wakeEvent \= await checkPhoneUnlock();  
if (wakeEvent) {  
    return wakeEvent;  
}

// 3\. Tertiary: Alarm time \+ buffer  
wakeEvent \= await checkAlarmTime();  
if (wakeEvent) {  
    return wakeEvent;  
}

// 4\. Quaternary: ML prediction from history  
wakeEvent \= await predictFromHistory();  
if (wakeEvent) {  
    return wakeEvent;  
}

// 5\. Final fallback: User-configured wake time  
return getUserConfiguredWake();

}

**7.5 Trigger Timing Decision**

function decideTriggerTiming(wakeEvent: WakeEvent): Date {  
const now \= new Date();  
const timeSinceWake \= now \- wakeEvent.wakeTime; // milliseconds

// Ideal window: 5-15 minutes post-wake  
const minDelay \= 5 \* 60 \* 1000;  // 5 minutes  
const maxDelay \= 15 \* 60 \* 1000; // 15 minutes

if (timeSinceWake \< minDelay) {  
    // Too soon, schedule for 5 min post-wake  
    return new Date(wakeEvent.wakeTime.getTime() \+ minDelay);  
} else if (timeSinceWake \<= maxDelay) {  
    // Perfect window, trigger now  
    return now;  
} else {  
    // Beyond ideal window, trigger immediately (better late than never)  
    return now;  
}

}

**7.6 iOS Background Processing Approach**

// Register background task on app launch  
func application(  
\_ application: UIApplication,  
didFinishLaunchingWithOptions launchOptions: \[UIApplication.LaunchOptionsKey: Any\]?  
) \-\> Bool {  
BGTaskScheduler.shared.register(  
forTaskWithIdentifier: "com.app.wake-detection",  
using: nil  
) { task in  
self.handleWakeDetectionTask(task: task as\! BGAppRefreshTask)  
}

scheduleWakeDetectionTask()  
return true

}

// Schedule background refresh  
func scheduleWakeDetectionTask() {  
let request \= BGAppRefreshTaskRequest(  
identifier: "com.app.wake-detection"  
)

// Schedule for predicted wake window start  
let predictedWake \= predictWakeTime()  
request.earliestBeginDate \= Date(  
    timeInterval: \-30 \* 60, // 30 min before predicted wake  
    since: predictedWake  
)

do {  
    try BGTaskScheduler.shared.submit(request)  
} catch {  
    print("Could not schedule wake detection: \\(error)")  
}

}

// Handle background task  
func handleWakeDetectionTask(task: BGAppRefreshTask) {  
// Schedule next task  
scheduleWakeDetectionTask()

// Check for wake  
checkHealthKitForWake { wakeEvent in  
    if let wake \= wakeEvent {  
        self.triggerMorningAnchor(wake)  
    }  
    task.setTaskCompleted(success: true)  
}

// Set expiration handler  
task.expirationHandler \= {  
    task.setTaskCompleted(success: false)  
}

}

**7.7 Android WorkManager Implementation**

// Schedule periodic wake detection  
class WakeDetectionScheduler(private val context: Context) {  
fun scheduleDynamicPolling() {  
val predictedWake \= predictWakeTime()  
val now \= System.currentTimeMillis()  
val timeUntilWake \= predictedWake \- now

    val interval \= when {  
        timeUntilWake \> 2 \* 60 \* 60 \* 1000 \-\> 30L // 30 min  
        timeUntilWake \> 30 \* 60 \* 1000 \-\> 15L      // 15 min  
        else \-\> 5L                                   // 5 min  
    }  
      
    val workRequest \= PeriodicWorkRequestBuilder\<WakeDetectionWorker\>(  
        interval, TimeUnit.MINUTES  
    ).setConstraints(  
        Constraints.Builder()  
            .setRequiredNetworkType(NetworkType.CONNECTED)  
            .build()  
    ).build()  
      
    WorkManager.getInstance(context)  
        .enqueueUniquePeriodicWork(  
            "wake\_detection",  
            ExistingPeriodicWorkPolicy.REPLACE,  
            workRequest  
        )  
}

}

// Worker implementation  
class WakeDetectionWorker(  
context: Context,  
params: WorkerParameters  
) : CoroutineWorker(context, params) {

override suspend fun doWork(): Result {  
    val wakeEvent \= detectWake()  
      
    if (wakeEvent \!= null) {  
        val timeSinceWake \= System.currentTimeMillis() \- wakeEvent.wakeTime  
          
        if (timeSinceWake in 5\*60\*1000..15\*60\*1000) {  
            // Within ideal window  
            triggerMorningAnchor(wakeEvent)  
            return Result.success()  
        }  
    }  
      
    // Re-schedule with updated interval  
    WakeDetectionScheduler(applicationContext).scheduleDynamicPolling()  
    return Result.success()  
}

private suspend fun detectWake(): WakeEvent? {  
    // Check Oura API, HealthKit, or phone unlock  
    // ... (implementation)  
}

}

---

**8\. Key Recommendations Summary**

**8.1 Optimal Architecture**

**For MVP (Phase 1):**

1. **Detection method:** Rule-based multi-signal (movement \+ HR \+ HRV \+ time context)

2. **Primary data source:** Oura Ring API (higher wake detection accuracy)

3. **Fallback chain:** Oura → Apple HealthKit → Phone unlock → User config

4. **Polling strategy:** Dynamic frequency (30 min → 15 min → 5 min as predicted wake approaches)

5. **Trigger window:** 5-15 minutes post-wake detection

6. **Battery target:** \<3% additional drain per day

**For Phase 2 (ML Enhancement):**

1. Collect 30+ days user data (wake times, sleep quality, Morning Anchor completion)

2. Train personalized wake prediction model (Random Forest or LSTM)

3. Adaptive thresholds per user (some users have higher resting HR, different movement patterns)

4. Improve fallback accuracy with user-specific patterns

**8.2 Expected Performance Metrics**

| Metric | Target | Rationale |
| :---- | :---- | :---- |
| **Wake detection accuracy** | 75-85% | Combined Oura \+ Apple Watch with fallbacks |
| **Detection latency** | 5-15 min | Balance between sync delay and optimal trigger window |
| **False positive rate** | \<5% | Occasional bathroom trip misclassification acceptable |
| **Battery impact** | \<3%/day | Using smart polling \+ background task optimization |
| **Morning Anchor engagement** | \>60% | Timely trigger within circadian window increases compliance |

**8.3 User Experience Considerations**

**Onboarding:**

1. Request wearable connection (Oura or Apple Watch)

2. Collect typical wake times (weekday/weekend)

3. Set earliest notification time (default 5:00 AM)

4. Explain Morning Anchor protocol (light, water, movement)

**Daily Flow:**

1. App monitors for wake detection starting at (predicted\_wake \- 30 min)

2. Wake detected → 5-15 min buffer → Notification sent

3. User opens notification → Morning Anchor checklist displayed

4. User completes protocol → Log completion for ML training

**Edge Cases:**

* **Very early wake (3-4 AM):** Suppress notification until user-configured earliest time

* **Weekend vs. weekday:** Different wake time predictions based on day of week

* **Travel/jet lag:** Allow manual override: "I'm traveling" → Pause auto-detection for 3 days

* **Sick day:** User can snooze Morning Anchor entirely

---

**9\. References**

\[1\] Oura Ring, Apple Watch, and Fitbit Tested Against PSG (2024). *Sleep Review Magazine*. [https://sleepreviewmag.com/sleep-diagnostics/consumer-sleep-tracking/wearable-sleep-trackers/oura-ring-apple-watch-fitbit-face-o](https://sleepreviewmag.com/sleep-diagnostics/consumer-sleep-tracking/wearable-sleep-trackers/oura-ring-apple-watch-fitbit-face-o)

\[2\] Heart rate variability in normal and pathological sleep (2013). *PMC*. [https://pmc.ncbi.nlm.nih.gov/articles/PMC3797399/](https://pmc.ncbi.nlm.nih.gov/articles/PMC3797399/)

\[3\] Self-supervised learning of accelerometer data provides new insights for sleep (2024). *Nature Digital Medicine*. [https://www.nature.com/articles/s41746-024-01065-0](https://www.nature.com/articles/s41746-024-01065-0)

\[4\] Oura Ring: Most Accurate Consumer Sleep Tracker Tested (2024). *Oura Blog*. [https://ouraring.com/blog/2024-sensors-oura-ring-validation-study/](https://ouraring.com/blog/2024-sensors-oura-ring-validation-study/)

\[10\] Sleep Tracking Accuracy: A Comparison of Oura Ring Gen 3, Fitbit Sense 2 and Apple Watch Series 8 (2024). *The5krunner*. [https://the5krunner.com/2024/10/12/sleep-tracking-accuracy-a-comparison-of-oura-ring-gen-3-fitbit-sense-2-and-apple-watch-series](https://the5krunner.com/2024/10/12/sleep-tracking-accuracy-a-comparison-of-oura-ring-gen-3-fitbit-sense-2-and-apple-watch-series)

\[11\] Reproducibility of Heart Rate Variability Is Parameter and Sleep Stage Dependent (2018). *Frontiers in Physiology*. [https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2017.01100/full](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2017.01100/full)

\[21\] iOS background processing \- Background App Refresh Task (2020). [https://uynguyen.github.io/2020/09/26/Best-practice-iOS-background-processing-Background-App-Refresh-Task/](https://uynguyen.github.io/2020/09/26/Best-practice-iOS-background-processing-Background-App-Refresh-Task/)

\[22\] Detecting sleep using heart rate and motion data from multisensor consumer-grade wearables (2020). *Sleep Journal*. [https://academic.oup.com/sleep/article/43/7/zsaa045/5811697](https://academic.oup.com/sleep/article/43/7/zsaa045/5811697)

\[23\] My 15-Minute Wake-Up Routine To Feel 99% Less Tired (2025). *YouTube*. [https://www.youtube.com/watch?v=BLRKUEILkVY](https://www.youtube.com/watch?v=BLRKUEILkVY)

\[42\] Using Sleep Analysis in HealthKit with Swift (2024). *AppCoda*. [https://www.appcoda.com/sleep-analysis-healthkit/](https://www.appcoda.com/sleep-analysis-healthkit/)

\[43\] How to get detailed wake-up periods and sleep phase intervals from Oura API? *Reddit r/ouraring*. [https://www.reddit.com/r/ouraring/comments/1m8t4k7/how\_to\_get\_detailed\_wakeup\_periods\_and\_sleep/](https://www.reddit.com/r/ouraring/comments/1m8t4k7/how_to_get_detailed_wakeup_periods_and_sleep/)

\[45\] HKUnit for Sleep Analysis? *Stack Overflow*. [https://stackoverflow.com/questions/31976780/hkunit-for-sleep-analysis](https://stackoverflow.com/questions/31976780/hkunit-for-sleep-analysis)

\[46\] Oura Ring Gen 3 API Tutorial (2022). *Wearipedia*. [https://wearipedia.readthedocs.io/en/latest/notebooks/oura\_ring\_gen\_3.html](https://wearipedia.readthedocs.io/en/latest/notebooks/oura_ring_gen_3.html)

\[54\] HKCategoryValueSleepAnalysis. *Apple Developer Documentation*. [https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis](https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis)

\[55\] Oura API Documentation (2.0). [https://cloud.ouraring.com/v2/docs](https://cloud.ouraring.com/v2/docs)

\[62\] Development of the circadian system in early life (2022). *PMC*. [https://pmc.ncbi.nlm.nih.gov/articles/PMC9109407/](https://pmc.ncbi.nlm.nih.gov/articles/PMC9109407/)

\[63\] Morning Routine Checklist: The Guide to the Perfect Morning (2025). *SlumberCBN*. [https://slumbercbn.com/blogs/wellness-blog/morning-routine-checklist-the-guide-to-the-perfect-morning](https://slumbercbn.com/blogs/wellness-blog/morning-routine-checklist-the-guide-to-the-perfect-morning)

\[64\] Detecting Phone Theft Using Machine Learning (2018). *University of Iowa*. [https://jasonxyliu.github.io/paper/phone-theft\_iciss18.pdf](https://jasonxyliu.github.io/paper/phone-theft_iciss18.pdf)

\[66\] Phase advancing human circadian rhythms with morning bright light (2014). *PMC*. [https://pmc.ncbi.nlm.nih.gov/articles/PMC4344919/](https://pmc.ncbi.nlm.nih.gov/articles/PMC4344919/)

\[73\] Android \- detect phone unlock event. *Stack Overflow*. [https://stackoverflow.com/questions/3446202/android-detect-phone-unlock-event-not-screen-on](https://stackoverflow.com/questions/3446202/android-detect-phone-unlock-event-not-screen-on)

\[81\] Background Limitations in Android (2024). *Notificare*. [https://notificare.com/blog/2024/12/13/android-background-limitations/](https://notificare.com/blog/2024/12/13/android-background-limitations/)

\[84\] What is Doze Mode Service in Android Development? (2025). *TheLastTech*. [https://www.thelasttech.com/android/what-is-doze-mode-service-in-android-development](https://www.thelasttech.com/android/what-is-doze-mode-service-in-android-development)

\[85\] What's The Battery Impact Of My App On Wearable Devices? (2025). *Glance*. [https://thisisglance.com/learning-centre/whats-the-battery-impact-of-my-app-on-wearable-devices](https://thisisglance.com/learning-centre/whats-the-battery-impact-of-my-app-on-wearable-devices)

\[86\] Real-time location tracking with near-zero battery impact (2025). *HyperTrack*. [https://hypertrack.com/blog/2017/06/10/zero-battery-location-tracking/](https://hypertrack.com/blog/2017/06/10/zero-battery-location-tracking/)

\[87\] Task scheduling | Background work \- Android Developers (2025). [https://developer.android.com/develop/background-work/background-tasks/persistent](https://developer.android.com/develop/background-work/background-tasks/persistent)

\[90\] Android periodic work friendly to doze mode and app standby. *Stack Overflow*. [https://stackoverflow.com/questions/51122514/android-periodic-work-friendly-to-doze-mode-and-app-standby](https://stackoverflow.com/questions/51122514/android-periodic-work-friendly-to-doze-mode-and-app-standby)

\[93\] Optimize for Doze and App Standby \- Android Developers (2024). [https://developer.android.com/training/monitoring-device-state/doze-standby](https://developer.android.com/training/monitoring-device-state/doze-standby)

---

**Appendices**

**Appendix A: Wake Detection Pseudocode**

interface WakeEvent {  
wakeTime: Date;  
confidence: number; // 0.0 \- 1.0  
source: 'oura' | 'healthkit' | 'phone\_unlock' | 'alarm' | 'prediction' | 'user\_config';  
signals: {  
movement: boolean;  
heartRate: boolean;  
hrv: boolean;  
timeContext: boolean;  
};  
}

async function detectWakeWithMultiSignal(): Promise\<WakeEvent | null\> {  
// 1\. Query wearable API  
const sleepData \= await queryWearableAPI();  
if (\!sleepData || \!sleepData.sleepEnded) {  
return null;  
}

const candidateWake \= sleepData.endTime;  
const now \= new Date();  
const timeSinceWake \= now.getTime() \- candidateWake.getTime();

// 2\. Check if within detection window (0-30 minutes post-wake)  
if (timeSinceWake \< 0 || timeSinceWake \> 30 \* 60 \* 1000\) {  
    return null;  
}

// 3\. Multi-signal validation  
const signals \= {  
    movement: checkMovementSignal(sleepData),  
    heartRate: checkHeartRateSignal(sleepData),  
    hrv: checkHRVSignal(sleepData),  
    timeContext: checkTimeContext(candidateWake)  
};

const signalCount \= Object.values(signals).filter(Boolean).length;

// 4\. Calculate confidence  
let confidence \= 0.0;  
if (signalCount \=== 4\) confidence \= 0.95;  
else if (signalCount \=== 3\) confidence \= 0.80;  
else if (signalCount \=== 2\) confidence \= 0.65;  
else confidence \= 0.50;

// 5\. Apply source-specific adjustment  
if (sleepData.source \=== 'oura') {  
    confidence \*= 1.0; // Oura baseline  
} else if (sleepData.source \=== 'apple\_watch') {  
    confidence \*= 0.92; // Apple Watch \~8% less accurate for wake  
}

return {  
    wakeTime: candidateWake,  
    confidence,  
    source: sleepData.source,  
    signals  
};

}

function checkMovementSignal(sleepData: SleepData): boolean {  
// Check for sustained high movement at sleep end  
const lastMinuteMovement \= sleepData.movement\_30\_sec.slice(-2); // Last 60s  
return lastMinuteMovement.every(val \=\> val \>= 3); // Medium-High or Very High  
}

function checkHeartRateSignal(sleepData: SleepData): boolean {  
// Compare end-of-sleep HR to sleep average  
const sleepAvgHR \= calculateAverage(sleepData.heartRatesDuringSleep);  
const wakeHR \= sleepData.heartRateAtEnd;  
const increase \= (wakeHR \- sleepAvgHR) / sleepAvgHR;  
return increase \> 0.08; // \>8% increase  
}

function checkHRVSignal(sleepData: SleepData): boolean {  
// Check LF/HF ratio shift  
const sleepLFHF \= sleepData.hrvLFHFDuringSleep;  
const wakeLFHF \= sleepData.hrvLFHFAtEnd;  
return wakeLFHF \> 1.2 && wakeLFHF \> sleepLFHF \* 1.2;  
}

function checkTimeContext(wakeTime: Date): boolean {  
const hour \= wakeTime.getHours();  
const userTypicalWake \= getUserTypicalWakeHour();  
const variance \= 2; // ±2 hours  
return Math.abs(hour \- userTypicalWake) \<= variance;  
}

**Appendix B: Battery Impact Estimation**

**Calculation for Dynamic Polling Strategy:**

Assume:

* Polling window: 3 hours (6:00 AM \- 9:00 AM)

* Dynamic intervals: 30 min → 15 min → 5 min

Breakdown:

* Phase 1 (2h): Poll every 30 min \= 4 polls

* Phase 2 (0.75h): Poll every 15 min \= 3 polls

* Phase 3 (0.25h): Poll every 5 min \= 3 polls

Total polls per morning: 10

Per poll energy cost:

* Network request: \~5 mAh

* Data processing: \~2 mAh

* HealthKit/Bluetooth query: \~3 mAh

* Total per poll: \~10 mAh

Daily cost: 10 polls × 10 mAh \= 100 mAh  
Typical phone battery: 3000-4000 mAh  
Percentage impact: 100/3500 ≈ 2.9% per day

Conclusion: Dynamic polling keeps battery impact under 3% target.

**Appendix C: Example API Response Structures**

**Oura API Sleep Endpoint:**  
{  
"data": \[  
{  
"id": "abc123",  
"bedtime\_start": "2025-12-02T23:30:00Z",  
"bedtime\_end": "2025-12-03T07:15:00Z",  
"deep": 4320,  
"light": 15480,  
"rem": 6120,  
"awake": 900,  
"movement\_30\_sec": "111222333...",  
"sleep\_phase\_5\_min": "111222333444...",  
"average\_heart\_rate": 58,  
"lowest\_heart\_rate": 52,  
"average\_hrv": 45  
}  
\]  
}

**Apple HealthKit Sleep Sample:**  
// HKCategorySample structure  
let sample \= HKCategorySample(  
type: sleepType,  
value: HKCategoryValueSleepAnalysis.asleep.rawValue,  
start: Date("2025-12-02T23:30:00Z"),  
end: Date("2025-12-03T07:15:00Z"),  
metadata: \[  
HKMetadataKeyTimeZone: "America/New\_York"  
\]  
)

---

**End of Report**