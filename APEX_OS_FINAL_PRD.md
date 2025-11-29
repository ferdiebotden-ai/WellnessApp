# APEX OS: Master Product Requirement Document

**Version:** 4.0 (Final)  
**Date:** November 28, 2025  
**Target Agent:** Anthropic Claude Opus 4.5 (CLI/Agentic Mode)  
**Status:** CANONICAL — This document supersedes all prior PRDs

---

## Part 1: The Vision

### 1.1 What We're Building

**Apex OS is the first AI-native wellness operating system.**

Not a tracker. Not a habit app. Not a chatbot with health tips.

Apex OS is an **ambient intelligence** that:
- Observes your biology (sleep, HRV, activity) without you doing anything
- Reasons about your specific situation (low recovery + big meeting + travel tomorrow)
- Acts with precision (adjusts your protocols, times your nudges, explains why)
- Learns what works for YOU (not what works "in general")

**The One-Liner:** "Evidence made effortless."

**The Elevator Pitch:** "You've consumed 100+ hours of Huberman. You know the science. Apex OS is the execution layer—it takes peer-reviewed protocols and implements them into your day, personalized to your biology, delivered at the right moment."

### 1.2 Why Now (November 2025)

Three things converged to make Apex OS possible:

1. **AI Reasoning Maturity:** LLMs can now chain context (user data + protocols + time + calendar) and generate genuinely personalized guidance. This wasn't reliable 18 months ago.

2. **Wearable Ubiquity:** 35%+ of our target demographic already wears an Oura, WHOOP, or Apple Watch. The biometric data exists—no one is turning it into action.

3. **The Huberman Effect:** Andrew Huberman created a massive, educated audience that *wants* protocols but lacks implementation support. They know what to do; they need help doing it.

**The Window:** Google (Fitbit AI Coach) and Apple (Project Mulberry) are entering this space but are locked to their hardware ecosystems. We have 12-18 months to establish category leadership with an ecosystem-agnostic, evidence-first approach.

### 1.3 The Core Philosophy

**Five Principles That Define Every Feature:**

| Principle | What It Means | How It Manifests |
|-----------|---------------|------------------|
| **Evidence Made Effortless** | Every recommendation traces to peer-reviewed research, but users never feel like they're reading a journal | Citations available on demand, not forced |
| **Respect Intelligence** | Our users are high-performers, not wellness beginners. They don't need cheerleading. | No "Great job! 🎉". Instead: "Morning light: 7/7 days. Sleep onset improved 12 min." |
| **Ambient, Not Annoying** | Every notification must earn attention through relevance. Silence is a feature. | Intelligent suppression, context-aware delivery |
| **Closed-Loop Coaching** | Data → Insight → Action → Outcome → Better Data | The AI learns what works for this specific user |
| **Operating System, Not App** | Foundational infrastructure that makes everything else work better | Integrates with real life (calendar, location, wearables) |

### 1.4 What Apex OS Is NOT

| We Are NOT | Because |
|------------|---------|
| A gamified habit tracker | Badges and points are shallow motivation. Our users want results. |
| A meditation app | NSDR is one protocol of many. We're comprehensive. |
| A chatbot for health questions | The AI proactively guides; it doesn't wait to be asked. |
| A social platform | No leaderboards, no sharing. Focus is personal optimization. |
| Generic wellness | Every recommendation is specific, timed, dosed, and cited. |

---

## Part 2: The User

### 2.1 Primary Persona: "The Optimized Founder"

**Demographics:**
- Age: 28-45
- Role: Founder, executive, senior professional, high-performer
- Income: $100K+ household
- Location: Urban/suburban, US/UK/Canada/Australia primary markets

**Psychographics:**
- Listens to: Huberman Lab, Peter Attia, Tim Ferriss, Lex Fridman
- Already uses: Oura Ring, WHOOP, Apple Watch, Eight Sleep
- Has tried: Multiple wellness apps—found them too generic or too gamified
- Values: Efficiency, specificity, measurable outcomes, scientific credibility
- Frustrated by: Information overload, conflicting advice, apps that track but don't guide

**Their Inner Monologue:**
> "I've listened to 200+ hours of health podcasts. I know about morning light, caffeine timing, NSDR, cold exposure. But I still don't have a system that actually reminds me at the right time, adjusts when I'm under-recovered, and tells me if it's working. I need something that bridges knowing and doing—without adding more cognitive load to my already full day."

### 2.2 The Jobs To Be Done

| Job | Current Solution | Why It Fails | Apex OS Solution |
|-----|------------------|--------------|------------------|
| "Help me wake up with clarity about my day" | Check Oura score, then manually decide | Requires interpretation + decision-making | One glance: Recovery score + adjusted protocol plan |
| "Tell me what to do, not what I already did" | WHOOP recovery score | Shows data, doesn't guide action | Specific protocol recommendations based on recovery |
| "Don't overwhelm me when I'm already struggling" | Turn off notifications entirely | Loses all value from the app | Intelligent suppression + Minimum Viable Day mode |
| "Help me understand if this is working" | Manual tracking in spreadsheet | Too much friction, gives up after 2 weeks | Automated tracking + weekly synthesis with insights |
| "Respect that I'm an intelligent adult" | Generic apps with cheerleader copy | Feels patronizing | Direct, data-driven communication with citations on demand |

---

## Part 3: The Five Core Experiences

Apex OS delivers value through **five distinct experiences**. Each is a user journey, not a feature list. Opus 4.5 should implement these as end-to-end flows, not isolated components.

---

### Experience 1: The Morning Anchor

**The Moment:** User wakes up. Within 60 seconds of consciousness, they know exactly what kind of day to expect and what to do first.

**The Journey:**

```
TRIGGER: Wake detection (wearable data shows transition from sleep to wake)
    │
    ▼
BACKGROUND SYNC: App pulls overnight biometrics silently
    │
    ▼
INTELLIGENCE: AI calculates Readiness Score + adjusts daily protocol plan
    │
    ▼
SURFACE: Lock screen widget updates with glanceable status
    │
    ▼
NOTIFICATION: Single consolidated morning message (if valuable)
    │
    ▼
IN-APP: Dashboard ready with full context if user opens
```

**The Experience in Detail:**

**Scenario A: High Recovery (75%+)**
- Lock screen widget: `Recovery: 78% ●●●●○ | Full Protocol Day`
- Push notification (optional): "Morning. Recovery 78%. All protocols active. Morning light window: 47 min."
- In-app dashboard shows: Recovery trend (↑), Today's 6 protocols, Quick insight ("HRV up 11% this week")

**Scenario B: Low Recovery (<40%)**
- Lock screen widget: `Recovery: 34% ●○○○○ | Recovery Day`
- Push notification: "Recovery low (34%). Protocols adjusted. One message—check when ready."
- In-app shows: Adjusted day with only 3 Foundation protocols, Explanation of what triggered low recovery, "Minimum Viable Day" mode active

**Scenario C: Travel Detected**
- Lock screen widget: `Travel Day | Circadian Priority`
- Push notification: "NYC → SF detected (3hr shift). Circadian alignment protocols active."
- In-app shows: Simplified travel protocol (light timing for destination), Jet lag prevention guidance

**What Makes This Different from WHOOP/Oura:**

| They Show | We Show |
|-----------|---------|
| Recovery: 78% (green) | Recovery: 78% → Here's your adjusted protocol plan |
| Sleep score: 84 | Sleep was good → Morning light window closes at 7:45am |
| HRV: 62ms | HRV up 11% this week → Your recovery protocols are working |

**Technical Requirements:**
- Wake detection via HealthKit/Google Fit sleep transition
- Background sync within 30 seconds of wake
- Readiness calculation: `(Normalized_HRV × 0.4) + (Sleep_Efficiency × 0.3) + (Sleep_Duration_Score × 0.2) + (RHR_Delta × 0.1)`
- Lock screen widget via iOS WidgetKit / Android Glance
- Single notification, never multiple

---

### Experience 2: Ambient Intelligence

**The Moment:** Throughout the day, the AI observes and intervenes only when valuable—never annoying, always relevant.

**The Philosophy:** Most apps interrupt on a schedule. Apex OS interrupts based on **context + value + user state**.

**The Nudge Decision Engine:**

```
FOR each potential nudge:
    │
    ├── Is this protocol time-sensitive RIGHT NOW?
    │   └── If morning light window closing → HIGH priority
    │
    ├── What is user's current context?
    │   ├── Calendar: In meetings? → SUPPRESS unless critical
    │   ├── Location: At gym? → Surface relevant protocols
    │   └── Time since last nudge: <2 hours? → SUPPRESS unless critical
    │
    ├── What is user's capacity?
    │   ├── Recovery <30%? → Only consolidated morning message
    │   ├── Dismissed 3+ nudges today? → Stop until tomorrow
    │   └── On 7+ day streak? → Reduce frequency 50%
    │
    └── Is this the highest-value action right now?
        └── If NO → Don't send
```

**Suppression Rules (Mandatory):**

| Rule | Trigger | Action |
|------|---------|--------|
| Daily Cap | 5 notifications sent today | No more until tomorrow |
| Quiet Hours | 10pm-6am user timezone | No notifications (unless user opts in) |
| Cooldown | <2 hours since last nudge | Suppress non-critical |
| Fatigue Detection | 3+ dismissals today | Pause until tomorrow |
| Meeting Awareness | 2+ hours of meetings on calendar | Suppress STANDARD priority |
| Low Recovery | Readiness <30% | Only ONE morning message |
| Streak Respect | 7+ consecutive days at 80%+ adherence | Reduce frequency 50% |

**Nudge Categories & Priority:**

| Category | Priority | Can Override Cooldown | Examples |
|----------|----------|----------------------|----------|
| CRITICAL | Highest | Yes | Time-sensitive windows (morning light closing), safety |
| ADAPTIVE | High | No | Recovery-based adjustments, conflict detection |
| STANDARD | Medium | No | Scheduled protocol reminders |
| INSIGHT | Low | No | Weekly synthesis, pattern detection |
| ENGAGEMENT | Lowest | No | Re-engagement after absence (use very sparingly) |

**Nudge Copy Constraints:**

| Element | Max Length | Example |
|---------|------------|---------|
| Push notification | 80 chars | "Morning light: 32 min remaining. 10 min outside anchors your day." |
| In-app headline | 60 chars | "Time for morning light" |
| In-app body | 150 chars | "Your circadian rhythm is set in the first hour after waking. Even cloudy days provide 10,000+ lux outdoors." |
| "Why?" expansion | 300 chars | Full mechanism + citation + user data that triggered |

**What Makes This Different:**

| Generic App | Apex OS |
|-------------|---------|
| "Time to stand!" (every 2 hours) | (Suppressed—user is in meetings) |
| "Don't forget your workout!" | "Recovery is 34%. Workout paused. Focus on light + hydration." |
| 8 notifications per day | 2-3 max, only when valuable |
| Same message every day | "Focus dip predicted. NSDR now restores prefrontal function before your 3pm." |

---

### Experience 3: The Closed Loop

**The Moment:** User completes (or skips) a protocol. The system records, learns, and eventually shows what's working.

**The Feedback Cycle:**

```
USER ACTION: Completes "Morning Light" protocol
    │
    ▼
IMMEDIATE FEEDBACK: Subtle haptic + "Morning light ✓. Day 12."
    │
    ▼
BACKGROUND: Log written to Firebase (instant) → synced to Supabase (canonical)
    │
    ▼
CORRELATION ENGINE: Over time, tracks:
    - Protocol completion patterns
    - Biometric changes following protocol
    - Self-reported outcomes (focus, energy, mood)
    │
    ▼
INSIGHT GENERATION: "Since starting delayed caffeine, your average sleep onset is 14 min faster."
    │
    ▼
PROTOCOL ADJUSTMENT: If something isn't working after 2 weeks, suggest alternative
```

**The "Why?" Layer:**

Every nudge has an optional "Why?" tap that reveals:
1. **The Mechanism:** What's happening physiologically (1-2 sentences)
2. **The Evidence:** Study reference or citation
3. **Your Data:** What triggered this specific recommendation

**Example "Why?" Response:**
```
NUDGE: "Cold plunge moved to tomorrow."

WHY? (tapped):
"Cold exposure increases dopamine 2.5x for 2-3 hours (Søberg et al., 2021). 
However, you logged resistance training 45 min ago. Roberts et al. (2015) 
found cold within 4 hours of lifting may reduce muscle adaptation 10-20%. 
Since your primary goal is muscle gain, delaying optimizes for that."
```

**Protocol Conflict Detection:**

The AI monitors for conflicts between user actions and scheduled protocols:

| Detected Conflict | Response |
|-------------------|----------|
| Resistance training → Cold plunge within 4 hours | "This may reduce muscle adaptation. Delay cold to tomorrow?" |
| Alcohol logged → Next-day protocols | "Sleep quality typically drops 15-25%. Extra morning light tomorrow recommended." |
| Caffeine after cutoff | "This may delay sleep onset 30-45 min. Adjust tomorrow's wake time?" |
| Late meal → Sleep within 2 hours | "Eating close to sleep reduces sleep quality. Consider earlier dinner tomorrow." |

---

### Experience 4: The Minimum Viable Day

**The Moment:** User is overwhelmed, under-recovered, traveling, or just having a rough day. The app recognizes this and adapts.

**The Philosophy:** Most wellness apps create all-or-nothing thinking. Miss your habits? You've "failed." Apex OS meets users where they are.

**Trigger Conditions:**
- Recovery score <35%
- 6+ hours of meetings on calendar
- User manually selects "tough day"
- Travel detected (timezone change >2 hours)
- 3+ consecutive days of <50% protocol completion

**The MVD Protocol Set:**

When MVD activates, only THREE protocols remain active:

| Protocol | Why It's Essential | Duration |
|----------|-------------------|----------|
| Morning Light | Anchors circadian rhythm, non-negotiable for recovery | 10 min |
| Hydration | Immediate cognitive benefit, zero friction | 32 oz by noon |
| Early Sleep Cutoff | Protects tomorrow's recovery | No screens after 9pm |

**The MVD Experience:**

```
MORNING NOTIFICATION:
"Recovery: 31%. Minimum Viable Day activated.

Three things today:
□ Morning light (10 min)
□ Hydration (32oz by noon)  
□ Early sleep cutoff (9pm)

Everything else is paused. No judgment.
Full protocols resume when you're recovered."
```

**No further notifications for the day** (unless user opens app and requests).

**Why This Matters for Retention:**

Users don't quit apps because they're too hard. They quit because they feel like failures. MVD transforms "I didn't do my protocols" into "Apex helped me do what I could." This is the difference between 30-day churn and 12-month retention.

---

### Experience 5: The Weekly Synthesis

**The Moment:** Sunday morning. User receives a narrative summary of what worked, what didn't, and what to try next.

**The Philosophy:** Data dashboards are for analysts. High-performers want the insight extracted and served. "What does this mean for me?"

**Delivery:**
- Push notification: Sunday 9am user timezone
- In-app: Persistent card until dismissed

**The Sunday Brief Structure:**

```
┌─────────────────────────────────────────────────────────┐
│  WEEK OF NOVEMBER 24-30                                 │
├─────────────────────────────────────────────────────────┤
│  WIN OF THE WEEK                                        │
│  Morning light: 6/7 days. Your sleep onset is now       │
│  averaging 14 minutes—down from 23 when you started.    │
│  Circadian rhythm is well-anchored.                     │
├─────────────────────────────────────────────────────────┤
│  AREA TO WATCH                                          │
│  HRV trended down 11% this week (58ms → 52ms).          │
│  This often indicates accumulated stress. Consider      │
│  adding one NSDR session mid-week.                      │
├─────────────────────────────────────────────────────────┤
│  PATTERN INSIGHT                                        │
│  Your 3 highest-focus days had morning movement         │
│  before 8am. Days without: 2.1 points lower average.    │
├─────────────────────────────────────────────────────────┤
│  EXPERIMENT FOR NEXT WEEK                               │
│  Try a 10-min Zone 2 walk before your first meeting     │
│  on Mon/Wed/Fri. We'll compare focus scores.            │
│                                                         │
│  [Accept Experiment]  [Modify]  [Skip]                  │
└─────────────────────────────────────────────────────────┘
```

**Generation Requirements:**
- Input: 7 days of protocol logs, biometric data, self-reported scores
- Output: ~200 words, narrative prose (not bullet points)
- Tone: Analytical but warm, like a coach reviewing tape
- Must include: One specific data point as evidence for each section
- Experiment: Should be achievable and measurable

---

## Part 4: The AI Brain

This section specifies how the intelligence layer thinks, reasons, and communicates.

### 4.1 The Reasoning Architecture

**Not Just RAG:** Simple retrieval isn't enough. The AI must **reason** across:
- User's current biometric state
- User's historical patterns
- Protocol library evidence
- Current context (time, calendar, location)
- User's stated goals and preferences

**The Reasoning Chain:**

```
INPUT CONTEXT:
├── User State: Recovery 34%, HRV down 15% from baseline
├── Calendar: Board presentation at 2pm
├── History: Cold plunge adherence 2/7 this week
├── Goal: Cognitive performance (primary)
└── Time: 11:30am

REASONING STEPS:
1. User is under-recovered → Adjust protocol intensity
2. High-stakes meeting in 2.5 hours → Prioritize pre-meeting interventions
3. Cold plunge could spike cortisol → Counterproductive before presentation
4. NSDR has fastest ROI for prefrontal restoration → Recommend at 12:30

OUTPUT:
"Your HRV suggests incomplete recovery. Before your 2pm, do a 10-min NSDR 
at 12:30—research shows it restores prefrontal function within 20 minutes. 
Skip cold plunge today; it'll spike cortisol you don't need pre-presentation."
```

### 4.2 The RAG Pipeline

**Pinecone Index Structure:**

```
Index: wellness-protocols
├── Namespace: protocols (18 core protocols, chunked)
├── Namespace: research (100+ paper summaries)
└── Namespace: user-patterns (computed weekly per user)

Metadata per chunk:
├── protocol_id: string
├── category: "foundation" | "performance" | "recovery" | "meta"
├── tags: string[] (e.g., ["sleep", "circadian", "light"])
├── citation: string (DOI or reference)
└── applicable_goals: string[]
```

**Query Strategy:**
1. Embed user query/context
2. Retrieve top 5 chunks (hybrid: semantic + keyword)
3. Re-rank based on user's primary goal
4. Feed to reasoning LLM with user context

### 4.3 The AI Voice

**Persona:** A high-performance coach with deep scientific literacy. Confident, specific, supportive—never sycophantic.

**Voice Attributes:**

| Attribute | Do This | Not This |
|-----------|---------|----------|
| Confident | "Morning light anchors your circadian rhythm" | "You might want to try getting some light" |
| Specific | "10-15 min outside, within 60 min of waking" | "Get some sunlight when you can" |
| Supportive | "Recovery day. Protocols adjusted." | "You look tired, take it easy!" |
| Direct | "Caffeine cutoff: 2pm today" | "Maybe consider limiting caffeine later" |
| Scientific | "HRV up 11%—recovery protocols working" | "Your body is healing!" |

**Forbidden Phrases:**
- "Great job! 🎉" / "You're crushing it!" / "Way to go!"
- "Don't forget to..." / "Remember to..."
- "You should..." / "You need to..."
- "Studies show..." without being able to cite which studies
- Any emoji except in explicit celebration contexts (rare)

**Tone Calibration by Context:**

| Context | Tone | Example |
|---------|------|---------|
| High recovery, protocol reminder | Efficient, brief | "Morning light: 32 min remaining." |
| Low recovery, adjusting plan | Supportive, explanatory | "Recovery low. Protocols adjusted—focus on light + hydration." |
| Streak milestone | Understated pride | "14-day streak. Consistency is compounding." |
| Pattern insight | Curious, analytical | "Your best focus days share morning movement. Correlation?" |
| Conflict detection | Informative, offering choice | "Cold plunge 30 min after lifting may reduce adaptation. Delay?" |

### 4.4 Fallback Behavior

**When AI API fails:**

The system must never leave users without guidance. Fallback cascade:

1. **Try secondary AI provider** (if Vertex fails, try OpenAI)
2. **Use cached response** (if similar context was generated in last 7 days)
3. **Rule-based fallback** (hardcoded nudges based on time/protocol schedule)
4. **Graceful degradation message** ("Personalized insights unavailable. Here's your scheduled protocol: Morning Light")

**Latency Requirements:**
- Nudge generation: <2 seconds end-to-end
- Fallback activation: <500ms after primary failure
- User should never see loading spinner for nudges

---

## Part 5: Technical Architecture

### 5.1 The Hybrid Database Model

**Why Hybrid:** Real-time UX requires Firebase. Analytics and compliance require PostgreSQL.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React Native)                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Listens to Firebase RTDB for:                          │    │
│  │  - /nudges/{userId} (live nudges)                       │    │
│  │  - /sessions/{userId} (current state)                   │    │
│  │  - /protocols/{userId}/today (today's schedule)         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUD FUNCTIONS (Gen 2)                       │
│  ┌─────────────┐  ┌─────────────────┐  ┌───────────────────┐   │
│  │ api         │  │ generateNudges  │  │ onProtocolLog     │   │
│  │ (HTTP)      │  │ (Scheduled)     │  │ (RTDB Trigger)    │   │
│  └─────────────┘  └─────────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Firebase RTDB   │  │ Vertex AI +     │  │ Supabase        │
│ (Real-time)     │  │ Pinecone (RAG)  │  │ (PostgreSQL)    │
│                 │  │                 │  │                 │
│ - Live nudges   │  │ - Reasoning     │  │ - User profiles │
│ - Session state │  │ - Embeddings    │  │ - Protocol logs │
│ - Today's plan  │  │ - Citations     │  │ - Analytics     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 5.2 Data Models

**User (Supabase: `users` table):**
```typescript
interface User {
  id: string;                    // UUID, matches Firebase Auth UID
  email: string;
  created_at: Date;
  
  // Profile
  display_name: string | null;
  timezone: string;              // e.g., "America/New_York"
  primary_goal: 'sleep' | 'cognitive' | 'fitness' | 'overall';
  
  // Schedule
  typical_wake_time: string;     // "06:30"
  typical_bed_time: string;      // "22:30"
  
  // Preferences
  caffeine_consumer: boolean;
  alcohol_consumer: boolean;
  notification_preferences: NotificationPrefs;
  
  // State
  onboarding_complete: boolean;
  protocol_level: 'foundation' | 'intermediate' | 'advanced';
  current_streak: number;
  mvd_active: boolean;
}
```

**Protocol (Supabase: `protocols` table):**
```typescript
interface Protocol {
  id: string;
  name: string;
  category: 'foundation' | 'performance' | 'recovery' | 'meta';
  
  // Content
  description: string;
  mechanism: string;             // Scientific explanation
  implementation: string[];      // Step-by-step instructions
  
  // Timing
  time_window: {
    start: string;               // "06:00" or "+00:00" (relative to wake)
    end: string;                 // "08:00" or "+01:00"
    relative_to: 'wake' | 'sleep' | 'absolute';
  } | null;
  
  // Evidence
  citations: Citation[];
  evidence_strength: 'strong' | 'moderate' | 'emerging';
  
  // Constraints
  frequency_per_week: number;
  conflicts_with: string[];      // Protocol IDs
  requires_recovery_above: number | null;
  
  // Personalization
  applicable_goals: string[];
  difficulty: 'easy' | 'moderate' | 'challenging';
}
```

**Daily Health Metrics (Supabase: `daily_metrics` table):**
```typescript
interface DailyMetrics {
  id: string;
  user_id: string;
  date: string;                  // "2025-11-28"
  
  // Sleep
  sleep_duration_min: number;
  sleep_efficiency: number;      // 0-100
  sleep_onset_min: number;       // Minutes to fall asleep
  rem_min: number;
  deep_min: number;
  
  // Recovery
  hrv_ms: number;                // RMSSD in milliseconds
  resting_hr: number;
  
  // Activity
  steps: number;
  active_minutes: number;
  
  // Calculated
  recovery_score: number;        // 0-100
  readiness_category: 'low' | 'moderate' | 'high';
  
  // Source
  data_source: 'apple_health' | 'google_fit' | 'oura' | 'whoop' | 'manual';
  synced_at: Date;
}
```

**Protocol Log (Supabase: `protocol_logs` table):**
```typescript
interface ProtocolLog {
  id: string;
  user_id: string;
  protocol_id: string;
  date: string;
  
  // Completion
  status: 'completed' | 'skipped' | 'partial';
  completed_at: Date | null;
  
  // Context
  triggered_by: 'nudge' | 'manual' | 'auto_detected';
  duration_min: number | null;
  
  // Feedback
  difficulty_rating: 1 | 2 | 3 | 4 | 5 | null;
  notes: string | null;
}
```

**Nudge (Firebase RTDB: `/nudges/{userId}/{nudgeId}`):**
```typescript
interface Nudge {
  id: string;
  protocol_id: string | null;    // null for insight nudges
  type: 'reminder' | 'adaptive' | 'insight' | 'conflict' | 'mvd';
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // Content
  headline: string;              // 60 chars max
  body: string;                  // 150 chars max
  why_explanation: string;       // 300 chars max (shown on tap)
  citation: string | null;
  
  // State
  created_at: number;            // Firebase timestamp
  delivered_at: number | null;
  read_at: number | null;
  action_taken: 'completed' | 'dismissed' | 'snoozed' | null;
  
  // Context (what triggered this nudge)
  trigger_context: {
    recovery_score: number;
    relevant_metric: string;
    reasoning_summary: string;
  };
}
```

### 5.3 API Endpoints

**Cloud Function: `api` (HTTP)**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/user/profile` | Get current user profile |
| PUT | `/user/profile` | Update user profile |
| GET | `/user/metrics` | Get recent health metrics |
| POST | `/wearables/sync` | Receive wearable data sync |
| GET | `/protocols` | Get all protocols |
| GET | `/protocols/today` | Get today's protocol schedule |
| POST | `/protocols/{id}/log` | Log protocol completion |
| GET | `/insights/weekly` | Get weekly synthesis |
| POST | `/feedback` | Submit user feedback |

**Cloud Function: `generateAdaptiveNudges` (Scheduled)**
- Trigger: Every 15 minutes
- Logic: For each active user, evaluate nudge decision engine, generate if appropriate
- Output: Write to Firebase RTDB `/nudges/{userId}`

**Cloud Function: `onProtocolLogWritten` (RTDB Trigger)**
- Trigger: New write to `/protocol_logs/{userId}/{logId}`
- Logic: Sync to Supabase canonical record, update streak, trigger insights if milestone

**Cloud Function: `generateWeeklySynthesis` (Scheduled)**
- Trigger: Sunday 8am (before user notification at 9am)
- Logic: For each user, generate Sunday Brief, write to Firebase RTDB
- Output: Push notification + in-app card

---

## Part 6: Implementation Phases

Opus 4.5 should execute these phases sequentially. Do not proceed to the next phase until the current phase is verified.

### Phase 1: Foundation (Infrastructure & Data)

**Duration:** 1-2 days

**Objectives:**

1.1 **Clean Deployment Issues**
- Analyze `functions/src` to identify why `postUsers` failed
- Remove or fix conflicting function definitions
- Ensure all functions use Gen 2 configuration correctly
- Redeploy: `firebase deploy --only functions`
- Verify all functions show "Active" in console

1.2 **Database Schema**
- Execute Supabase migrations in `supabase/migrations`
- Verify tables exist: `users`, `protocols`, `protocol_logs`, `daily_metrics`, `ai_audit_log`
- Apply RLS policies (users can only access their own data)
- Create indexes: `daily_metrics(user_id, date)`, `protocol_logs(user_id, date)`

1.3 **Seed Protocol Library**
- Parse `Master_Protocol_Library.md` into structured JSON
- Create seed script: `scripts/seed_protocols.ts`
- Insert all 18 protocols with complete metadata
- Verify: `SELECT COUNT(*) FROM protocols` returns 18

1.4 **Initialize Firebase RTDB Structure**
- Create base paths: `/nudges`, `/sessions`, `/protocol_logs`
- Set security rules: Users can only read/write their own paths
- Verify real-time sync works from test client

**Verification Criteria:**
- [ ] All Cloud Functions show "Active" status
- [ ] Supabase tables exist with correct schema
- [ ] 18 protocols in database
- [ ] Firebase RTDB accessible with correct permissions

---

### Phase 2: Intelligence (AI & Reasoning)

**Duration:** 2-3 days

**Objectives:**

2.1 **RAG Pipeline Setup**
- Create Pinecone index: `wellness-protocols` (dimension 768 for text-embedding-004)
- Write ingestion script: `scripts/ingest_protocols.ts`
- Chunk protocols: ~200 tokens per chunk with overlap
- Include metadata: `protocol_id`, `category`, `tags`, `citation`
- Verify: Query "morning light circadian" returns relevant chunks

2.2 **Nudge Decision Engine**
- Implement `src/nudge-engine/decision.ts` with full suppression logic
- Rules must match Part 3, Experience 2 exactly
- Include: daily cap, cooldown, fatigue detection, meeting awareness, recovery threshold
- Unit tests for each suppression rule

2.3 **Nudge Generation**
- Implement `src/nudge-engine/generator.ts`
- Input: User context + retrieved RAG chunks
- Output: Nudge object with headline, body, why_explanation, citation
- Enforce character limits
- Implement fallback cascade (secondary AI → cached → rule-based)

2.4 **MVD Logic**
- Implement `src/nudge-engine/mvd.ts`
- Trigger detection based on Part 3, Experience 4 conditions
- When MVD active: Override protocol schedule, generate MVD nudge
- Store MVD state in user profile

2.5 **Weekly Synthesis Generation**
- Implement `src/insights/weekly-synthesis.ts`
- Input: 7 days of logs, metrics, self-reports
- Output: Structured Sunday Brief (win, watch, pattern, experiment)
- Schedule: `generateWeeklySynthesis` runs Sunday 8am

**Verification Criteria:**
- [ ] RAG query returns relevant protocol chunks
- [ ] Nudge suppression correctly blocks in test scenarios
- [ ] Generated nudges meet character limits and tone
- [ ] MVD triggers correctly and overrides schedule
- [ ] Weekly synthesis generates coherent narrative

---

### Phase 3: Biometrics (Real Data Flow)

**Duration:** 1-2 days

**Objectives:**

3.1 **Wearable Sync Endpoint**
- Implement `POST /wearables/sync`
- Accept data from Apple HealthKit and Google Fit
- Normalize different HRV formats (SDNN vs RMSSD)
- Store in `daily_metrics` table

3.2 **Recovery Score Calculation**
- Implement `src/biometrics/recovery.ts`
- Formula: `(Normalized_HRV × 0.4) + (Sleep_Efficiency × 0.3) + (Sleep_Duration_Score × 0.2) + (RHR_Delta × 0.1)`
- Handle missing data gracefully (use available metrics)
- Store calculated score with raw metrics

3.3 **Wake Detection**
- Implement logic to detect wake from sleep data
- Trigger morning nudge flow within 5 minutes of detected wake
- Handle edge cases: Naps, irregular schedules

3.4 **Calendar Integration (Optional)**
- If user has connected Google/Apple Calendar
- Read meeting blocks (no content, just time slots)
- Feed into nudge suppression logic
- Never surface calendar content in UI

**Verification Criteria:**
- [ ] Wearable data syncs and stores correctly
- [ ] Recovery score calculates and updates
- [ ] Wake detection triggers morning flow
- [ ] Meeting blocks inform suppression (if calendar connected)

---

### Phase 4: Client Integration (Final Wiring)

**Duration:** 1-2 days

**Objectives:**

4.1 **Environment Configuration**
- Update `client/.env` with production endpoints
- Disable `DEV_MODE_FULL_ACCESS`
- Enable feature flags: `AI_COACH_ENABLED=true`, `REAL_DATA_MODE=true`

4.2 **Real-Time Listeners**
- Client listens to Firebase RTDB `/nudges/{userId}`
- Nudges appear in real-time without pull-to-refresh
- Handle offline gracefully (queue actions, sync when online)

4.3 **Protocol Logging Flow**
- User taps "Complete" → Write to Firebase RTDB
- Trigger function syncs to Supabase
- UI updates optimistically, confirms on sync

4.4 **Widget Implementation**
- iOS: WidgetKit extension showing Recovery + Today's status
- Android: Glance widget equivalent
- Update on wake detection + every 2 hours

4.5 **"Why?" Expansion**
- Tapping any nudge reveals full explanation
- Smooth animation, doesn't feel like leaving context
- Include citation as tappable link (opens research summary)

**Verification Criteria:**
- [ ] App connects to production backend
- [ ] Nudges appear in real-time
- [ ] Protocol completion syncs correctly
- [ ] Widgets display current data
- [ ] "Why?" expansion works on all nudges

---

## Part 7: Acceptance Criteria (User Scenarios)

Before declaring implementation complete, verify these end-to-end scenarios work correctly:

### Scenario 1: High Recovery Morning
- **Setup:** User has Recovery 78%, slept 7.5 hours
- **Expected:**
  - Lock screen widget shows "Recovery: 78% | Full Protocol Day"
  - Morning notification: "Morning. Recovery 78%. Morning light window: 47 min."
  - In-app shows 6 active protocols for the day
  - All standard nudges delivered at appropriate times

### Scenario 2: Low Recovery Morning
- **Setup:** User has Recovery 34%, HRV down 20% from baseline
- **Expected:**
  - Lock screen widget shows "Recovery: 34% | Recovery Day"
  - Morning notification: ONE consolidated message
  - In-app shows MVD mode: Only 3 Foundation protocols
  - No further nudges throughout the day (unless user opens app)

### Scenario 3: Afternoon Focus Dip
- **Setup:** User has been sedentary 3 hours, meeting at 3pm, Recovery 65%
- **Expected:**
  - At 2:15pm: "Focus dip predicted. NSDR now restores prefrontal function before your 3pm."
  - "Why?" shows: Mechanism + citation + user's sedentary data

### Scenario 4: Protocol Conflict
- **Setup:** User logs resistance training, cold plunge scheduled in 30 min
- **Expected:**
  - Conflict nudge: "Cold plunge 30 min after lifting may reduce adaptation. Delay?"
  - Options: [Delay to Tomorrow] [Do Anyway] [Learn More]
  - User choice is respected and schedule updates accordingly

### Scenario 5: Travel Day
- **Setup:** Calendar shows NYC→SF flight, 3-hour timezone shift
- **Expected:**
  - Morning: Travel day protocol activated
  - Simplified guidance for circadian alignment
  - No non-essential nudges during travel
  - On arrival: Light timing guidance for destination

### Scenario 6: 7-Day Streak
- **Setup:** User has completed 80%+ protocols for 7 consecutive days
- **Expected:**
  - Nudge frequency reduced 50%
  - Acknowledgment: "7-day streak. Consistency is compounding."
  - User doesn't feel overwhelmed despite success

### Scenario 7: User Struggling (Week 3 Drop)
- **Setup:** User went from 85% adherence Week 1 to 40% Week 3
- **Expected:**
  - Detection: System notices engagement drop
  - Intervention: In-app message (not push) offering [Simplify] [Pause] [Feedback]
  - If Simplify: Switch to Foundation-only
  - If Pause: All nudges stop, weekly check-in only

### Scenario 8: Weekly Synthesis
- **Setup:** Sunday 9am, user has 7 days of data
- **Expected:**
  - Push notification: "Your weekly synthesis is ready."
  - In-app card shows: Win, Watch, Pattern, Experiment
  - Experiment is achievable and measurable
  - Tone is analytical, not cheerleader

---

## Part 8: Success Metrics

### North Star
**Protocol Adherence at Day 30: 60%+ of users completing 6+/7 days of Foundation protocols**

### Leading Indicators (Track Weekly)

| Metric | Target | Red Flag |
|--------|--------|----------|
| Day 1 Retention | 80%+ | <70% |
| Day 7 Retention | 70%+ | <55% |
| Day 30 Retention | 45%+ | <30% |
| Nudge Engagement | 40%+ tapped/completed | <25% |
| "Why?" Tap Rate | 15%+ | <5% |
| MVD Activation | <10% of user-days | >25% |

### Lagging Indicators (Track Monthly)

| Metric | Target | Red Flag |
|--------|--------|----------|
| Trial → Paid | 12%+ | <8% |
| Monthly Churn | <6% | >10% |
| NPS | 50+ | <30 |

---

## Part 9: Appendices

### Appendix A: Protocol Library Summary

**Source Document:** `Master_Protocol_Library.md` (193,000 characters, 3,277 lines)

**Document Quality:** This is a production-ready, evidence-based protocol library with:
- DOI citations for all major claims
- Pseudocode implementation rules (AI Coach ready)
- Dosing tables, timing windows, personalization variables
- Comprehensive contraindications and safety flags
- Natural chunking boundaries for RAG ingestion

**Ingestion Instructions for Opus:**

1. **Parse Structure:** The document has two parts:
   - Part 1: Foundation & Performance (Protocols 1-9)
   - Part 2: Recovery, Optimization & Meta (Protocols 10-18)

2. **Extract Per Protocol:**
   - `id`: Protocol number (1-18)
   - `name`: Protocol title
   - `category`: foundation | performance | recovery | optimization | meta
   - `evidence_summary`: The 250-char summary at start of each protocol
   - `mechanism`: Full mechanistic explanation
   - `implementation`: The pseudocode rules and parameters
   - `citations`: Array of DOI references
   - `contraindications`: Safety flags and warnings
   - `ai_coach_rules`: The IF/THEN feedback rules already in the document

3. **Chunking for Pinecone:**
   - Chunk at natural section breaks (~200-400 tokens per chunk)
   - Preserve context: Each chunk should be understandable standalone
   - Metadata per chunk: `protocol_id`, `section` (mechanism/implementation/safety), `tags`

4. **Do NOT:**
   - Paraphrase or summarize the evidence (use verbatim)
   - Add citations that aren't in the document
   - Modify the AI Coach rules (they're already correct)

**Protocol Summary Table:

| # | Protocol | Category | Key Outcome |
|---|----------|----------|-------------|
| 1 | Morning Light | Foundation | Circadian anchor, 15-20 min faster sleep onset |
| 2 | Evening Light Management | Foundation | Preserves melatonin, prevents circadian delay |
| 3 | Sleep Optimization | Foundation | Temperature, timing, environment |
| 4 | Hydration & Electrolytes | Foundation | Immediate cognitive benefit |
| 5 | Caffeine Timing | Performance | Prevents sleep disruption |
| 6 | Morning Movement | Performance | Cortisol awakening response +50-75% |
| 7 | Walking Breaks | Performance | Prevents afternoon crash |
| 8 | Nutrition Timing | Performance | Stable glucose, 34-44% lower cognitive decline |
| 9 | Fitness for Focus | Performance | BDNF, hippocampal volume |
| 10 | NSDR | Recovery | 65% dopamine increase |
| 11 | Breathwork | Recovery | Parasympathetic activation |
| 12 | Cold Exposure | Recovery | 2.5x dopamine for 2-3 hours |
| 13 | Alcohol Management | Optimization | Preserve REM sleep |
| 14 | Dopamine Management | Optimization | Maintain sensitivity |
| 15 | Supplements | Optimization | Evidence-based stacks |
| 16 | HRV Management | Optimization | Recovery optimization |
| 17 | Weekly Reflection | Meta | Adherence tracking |
| 18 | Social Accountability | Meta | Commitment devices |

### Appendix B: Environment Variables

```
# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
VERTEX_AI_PROJECT=
VERTEX_AI_LOCATION=us-central1
OPENAI_API_KEY=  # Fallback

# Pinecone
PINECONE_API_KEY=
PINECONE_INDEX=wellness-protocols
PINECONE_ENVIRONMENT=

# Feature Flags
AI_COACH_ENABLED=true
REAL_DATA_MODE=true
DEV_MODE_FULL_ACCESS=false
```

### Appendix C: Nudge Copy Examples

**Good Examples:**

| Context | Headline | Body |
|---------|----------|------|
| Morning light reminder | "Morning light: 32 min" | "Your circadian rhythm is set in the first hour. Even cloudy: 10,000+ lux outside." |
| Low recovery | "Recovery: 34%" | "Protocols adjusted. Foundation only today. Focus: light, hydration, early sleep." |
| Streak milestone | "14-day streak" | "Consistency is compounding. Sleep onset down 12 min since Day 1." |
| Conflict detected | "Cold plunge timing" | "30 min after lifting may reduce adaptation. Delay to tomorrow?" |

**Bad Examples (Never Do This):**

| Context | Bad Copy | Why It's Bad |
|---------|----------|--------------|
| Morning | "Good morning! Ready to crush it? 💪" | Cheerleader tone, emoji, vague |
| Protocol complete | "Amazing job! You're a wellness warrior! 🎉" | Patronizing, excessive praise |
| Missed protocol | "You forgot your morning light! Try harder tomorrow!" | Guilt-inducing, preachy |
| Streak | "OMG 7 days! You're incredible!!!" | Excessive, not credible |

---

## Execution Command

**Opus 4.5: Begin Phase 1 immediately.**

1. Run diagnostics on current deployment state
2. Fix `postUsers` failure (delete if redundant)
3. Verify Supabase migrations, apply if needed
4. Seed protocol library from `Master_Protocol_Library.md`
5. Report Phase 1 completion before proceeding

**Environment:** PowerShell 7 on Windows. Use `gcloud`, `firebase`, `supabase` CLIs.

**Source of Truth:** This document. If code conflicts with this PRD, update the code.

**The Goal:** Ship an AI-native wellness operating system that makes users say "This app actually gets my day."

---

*End of Document*
