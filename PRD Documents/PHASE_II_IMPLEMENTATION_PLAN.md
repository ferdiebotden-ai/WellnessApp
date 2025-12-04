# Apex OS: Phase II Implementation Plan

> **Phase 2: Brain (AI & Reasoning)**
>
> Transform the working infrastructure into an intelligent wellness operating system.

**Version:** 1.0
**Date:** December 2, 2025
**Prerequisites:** Phase 1 Complete (verified December 1, 2025)
**Target Agent:** Claude Opus 4.5

---

## Executive Summary

Phase 2 implements the "brain" of Apex OS—the AI reasoning layer that transforms raw data into personalized, intelligent guidance. This phase adds 9 components across 3 priority tiers, with an estimated 13 implementation sessions.

**Current State:** Infrastructure complete, E2E nudge flow verified, 11+ protocols seeded
**End State:** Intelligent suppression, adaptive MVD, weekly synthesis, user memory, and reasoning transparency

---

## Component Overview

| # | Component | Priority | Est. Sessions | Dependencies |
|---|-----------|----------|---------------|--------------|
| 1 | Memory Layer | P0 | 1.5 | None |
| 2 | Confidence Scoring | P0 | 1 | Memory Layer |
| 3 | Suppression Engine | P0 | 1.5 | Confidence Scoring |
| 4 | Safety & Compliance | P0 | 1 | None |
| 5 | Weekly Synthesis | P1 | 2 | Memory Layer |
| 6 | MVD Detector | P1 | 1.5 | Confidence Scoring |
| 7 | Reasoning Transparency UI | P1 | 1.5 | Suppression Engine |
| 8 | "Why?" Expansion | P1 | 1 | Memory Layer, RAG |
| 9 | Outcome Correlation | P2 | 2 | Protocol Logs |

**Total Estimated Sessions:** 13

---

## P0 Components (Ship-Blocking)

### Component 1: Memory Layer

**What It Does:**
Stores and retrieves user-specific learnings that persist across sessions, enabling personalized recommendations that improve over time.

**Why It Matters:**
Without memory, every nudge is generic. Memory enables "Your best focus days follow morning movement" instead of "Try morning movement."

**File Locations:**
- Create: `/home/ferdi/projects/WellnessApp/functions/src/memory/userMemory.ts`
- Create: `/home/ferdi/projects/WellnessApp/functions/src/memory/types.ts`
- Modify: `/home/ferdi/projects/WellnessApp/functions/src/nudgeEngine.ts` (integrate memory retrieval)

**Data Model:**

```typescript
type MemoryType =
  | 'nudge_feedback'        // How user responds to nudges
  | 'protocol_effectiveness' // Which protocols work for this user
  | 'preferred_time'        // When user prefers certain activities
  | 'stated_preference'     // Explicit user preferences
  | 'pattern_detected'      // AI-detected patterns
  | 'preference_constraint'; // Things user said they can't do

interface Memory {
  id: string;
  user_id: string;
  type: MemoryType;
  content: string;           // The actual learning
  context?: string;          // What triggered this memory
  confidence: number;        // 0-1
  evidence_count: number;    // Supporting data points
  created_at: string;
  last_used_at: string;
  decay_rate: number;        // 0.01-0.1 (confidence decay per week)
  expires_at?: string;       // Optional hard expiration
}
```

**Core Functions:**

```typescript
// Create or update a memory
async function storeMemory(
  userId: string,
  type: MemoryType,
  content: string,
  context?: string,
  initialConfidence?: number
): Promise<Memory>

// Retrieve relevant memories for context
async function getRelevantMemories(
  userId: string,
  context: string,        // Current situation
  limit?: number          // Default 10
): Promise<Memory[]>

// Apply decay to all user memories (run daily)
async function applyMemoryDecay(userId: string): Promise<void>

// Prune expired/low-confidence memories (max 150 per user)
async function pruneMemories(userId: string): Promise<number>
```

**Decay Logic:**
```
new_confidence = confidence × (1 - decay_rate)^weeks_since_last_use

If new_confidence < 0.1, mark for pruning
If evidence_count > 5, reduce decay_rate by 50%
```

**Acceptance Criteria:**
- [ ] 6 memory types can be stored and retrieved
- [ ] Decay logic reduces confidence over time
- [ ] Max 150 memories enforced per user
- [ ] Memories retrieved and included in nudge generation context
- [ ] Memories can be queried by type and relevance

**Test Cases:**
1. Store memory → Retrieve memory → Verify content matches
2. Store memory → Wait (simulate time) → Apply decay → Verify confidence reduced
3. Store 160 memories → Prune → Verify count ≤ 150
4. Generate nudge → Verify relevant memories in context

---

### Component 2: Confidence Scoring

**What It Does:**
Scores each AI recommendation with a confidence level based on 5 factors, enabling intelligent filtering of low-confidence suggestions.

**Why It Matters:**
Prevents "hallucinated" recommendations. Only confident suggestions reach the user.

**File Locations:**
- Create: `/home/ferdi/projects/WellnessApp/functions/src/reasoning/confidenceScorer.ts`
- Modify: `/home/ferdi/projects/WellnessApp/functions/src/nudgeEngine.ts` (add scoring call)

**Scoring Factors:**

| Factor | Weight | Description |
|--------|--------|-------------|
| `protocol_fit` | 0.25 | How well protocol matches user's primary goal |
| `memory_support` | 0.25 | Number of supporting memories for this recommendation |
| `timing_fit` | 0.20 | How appropriate is the timing (time of day, recovery level) |
| `conflict_risk` | 0.15 | Inverse of protocol conflict probability |
| `evidence_strength` | 0.15 | Protocol's evidence level (Very High=1, High=0.8, etc.) |

**Interface:**

```typescript
interface ConfidenceScore {
  overall: number;           // 0-1, weighted sum
  factors: {
    protocol_fit: number;
    memory_support: number;
    timing_fit: number;
    conflict_risk: number;
    evidence_strength: number;
  };
  should_suppress: boolean;  // true if overall < 0.4
  reasoning: string;         // Human-readable explanation
}

async function calculateConfidence(
  userId: string,
  protocolId: string,
  context: NudgeContext
): Promise<ConfidenceScore>
```

**Acceptance Criteria:**
- [ ] All 5 scoring factors implemented
- [ ] Weighted sum calculated correctly
- [ ] Recommendations with score <0.4 marked for suppression
- [ ] Score included in Nudge object
- [ ] Reasoning string generated for transparency UI

**Test Cases:**
1. High-fit protocol + supporting memories → Score >0.7
2. Poor-fit protocol + no memories → Score <0.4
3. High evidence protocol + good timing → Score >0.6
4. Protocol with conflict risk → Reduced score

---

### Component 3: Suppression Engine

**What It Does:**
Applies 9 rules to filter, throttle, and prioritize nudges to prevent notification fatigue.

**Why It Matters:**
WHOOP sends 8-12 notifications/day. Our differentiator is intelligent suppression (max 5/day).

**File Locations:**
- Create: `/home/ferdi/projects/WellnessApp/functions/src/suppression/suppressionEngine.ts`
- Create: `/home/ferdi/projects/WellnessApp/functions/src/suppression/rules.ts`
- Modify: `/home/ferdi/projects/WellnessApp/functions/src/nudgeEngine.ts` (add suppression call)

**The 9 Rules:**

```typescript
interface SuppressionRule {
  id: string;
  name: string;
  priority: number;              // Lower = checked first
  canBeOverridden: boolean;
  overrideBy: NudgePriority[];   // Which priorities can override
  check: (context: SuppressionContext) => SuppressionResult;
}

const SUPPRESSION_RULES: SuppressionRule[] = [
  {
    id: 'daily_cap',
    name: 'Daily Cap',
    priority: 1,
    canBeOverridden: true,
    overrideBy: ['CRITICAL'],
    check: (ctx) => {
      const today = ctx.nudgesDeliveredToday;
      if (today >= 5) {
        return { suppress: true, reason: 'Daily cap (5) reached' };
      }
      return { suppress: false };
    }
  },
  {
    id: 'quiet_hours',
    name: 'Quiet Hours',
    priority: 2,
    canBeOverridden: false,
    overrideBy: [],
    check: (ctx) => {
      const hour = ctx.userLocalHour;
      const start = ctx.user.quiet_hours_start; // e.g., 22
      const end = ctx.user.quiet_hours_end;     // e.g., 6
      if (hour >= start || hour < end) {
        return { suppress: true, reason: `Quiet hours (${start}:00-${end}:00)` };
      }
      return { suppress: false };
    }
  },
  {
    id: 'cooldown',
    name: 'Cooldown Period',
    priority: 3,
    canBeOverridden: true,
    overrideBy: ['CRITICAL'],
    check: (ctx) => {
      const lastNudge = ctx.lastNudgeDeliveredAt;
      if (lastNudge && Date.now() - lastNudge.getTime() < 2 * 60 * 60 * 1000) {
        return { suppress: true, reason: '2-hour cooldown not elapsed' };
      }
      return { suppress: false };
    }
  },
  {
    id: 'fatigue_detection',
    name: 'Fatigue Detection',
    priority: 4,
    canBeOverridden: false,
    overrideBy: [],
    check: (ctx) => {
      if (ctx.dismissalsToday >= 3) {
        return { suppress: true, reason: '3+ dismissals today - pausing until tomorrow' };
      }
      return { suppress: false };
    }
  },
  {
    id: 'meeting_awareness',
    name: 'Meeting Awareness',
    priority: 5,
    canBeOverridden: true,
    overrideBy: ['CRITICAL', 'ADAPTIVE'],
    check: (ctx) => {
      if (ctx.meetingHoursToday >= 2 && ctx.nudgePriority === 'STANDARD') {
        return { suppress: true, reason: '2+ meeting hours - suppressing STANDARD' };
      }
      return { suppress: false };
    }
  },
  {
    id: 'low_recovery',
    name: 'Low Recovery Mode',
    priority: 6,
    canBeOverridden: false,
    overrideBy: [],
    check: (ctx) => {
      if (ctx.recoveryScore < 30 && !ctx.isMorningAnchor) {
        return { suppress: true, reason: 'Recovery <30% - morning-only mode' };
      }
      return { suppress: false };
    }
  },
  {
    id: 'streak_respect',
    name: 'Streak Respect',
    priority: 7,
    canBeOverridden: false,
    overrideBy: [],
    check: (ctx) => {
      // After 7-day streak, reduce frequency by 50%
      if (ctx.currentStreak >= 7) {
        const shouldSuppress = Math.random() > 0.5;
        if (shouldSuppress) {
          return { suppress: true, reason: '7+ day streak - reducing frequency' };
        }
      }
      return { suppress: false };
    }
  },
  {
    id: 'low_confidence',
    name: 'Low Confidence Filter',
    priority: 8,
    canBeOverridden: false,
    overrideBy: [],
    check: (ctx) => {
      if (ctx.confidenceScore < 0.4) {
        return { suppress: true, reason: `Confidence too low (${ctx.confidenceScore})` };
      }
      return { suppress: false };
    }
  },
  {
    id: 'mvd_active',
    name: 'MVD Active',
    priority: 9,
    canBeOverridden: false,
    overrideBy: [],
    check: (ctx) => {
      if (ctx.mvdActive && !ctx.isMvdApprovedNudge) {
        return { suppress: true, reason: 'MVD active - only MVD nudges allowed' };
      }
      return { suppress: false };
    }
  }
];
```

**Main Interface:**

```typescript
interface SuppressionResult {
  shouldDeliver: boolean;
  suppressedBy?: string;      // Rule ID that suppressed
  reason?: string;            // Human-readable reason
  rulesChecked: string[];     // All rules that were evaluated
}

async function evaluateSuppression(
  nudge: Nudge,
  context: SuppressionContext
): Promise<SuppressionResult>
```

**Acceptance Criteria:**
- [ ] All 9 rules implemented and tested
- [ ] Priority override logic working (CRITICAL can override cooldown)
- [ ] Suppressed nudges logged with reason
- [ ] Audit trail in Firestore
- [ ] Max 5 nudges/day enforced (except +1 for CRITICAL)

**Test Cases:**
1. Send 6 nudges → 6th suppressed by daily_cap
2. Send nudge at 11pm → Suppressed by quiet_hours
3. Send 2 nudges within 1 hour → 2nd suppressed by cooldown
4. Send CRITICAL nudge within 1 hour → Delivered (overrides cooldown)
5. User dismisses 3 nudges → Next nudge suppressed until tomorrow
6. User in 3 hours of meetings → STANDARD suppressed, ADAPTIVE delivered

---

### Component 4: Safety & Compliance

**What It Does:**
Detects crisis keywords, surfaces mental health resources, and provides GDPR/CCPA compliance endpoints.

**Why It Matters:**
Legal requirement. Also protects users and builds trust.

**File Locations:**
- Create: `/home/ferdi/projects/WellnessApp/functions/src/safety/crisisDetection.ts`
- Create: `/home/ferdi/projects/WellnessApp/functions/src/compliance/dataPrivacy.ts`
- Modify: `/home/ferdi/projects/WellnessApp/functions/src/chat.ts` (add crisis screening)

**Crisis Detection:**

```typescript
const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life',
  'self-harm', 'cutting', 'hurt myself',
  'eating disorder', 'anorexia', 'bulimia', 'purging',
  'overdose', 'pills', 'don\'t want to live'
];

interface CrisisDetectionResult {
  detected: boolean;
  severity: 'low' | 'medium' | 'high';
  keywords: string[];
  resources: CrisisResource[];
}

interface CrisisResource {
  name: string;
  description: string;
  contact: string;
  type: 'hotline' | 'text' | 'website';
}

const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: '988 Suicide & Crisis Lifeline',
    description: '24/7 support for mental health crises',
    contact: 'Call or text 988',
    type: 'hotline'
  },
  {
    name: 'Crisis Text Line',
    description: 'Text-based crisis support',
    contact: 'Text HOME to 741741',
    type: 'text'
  },
  {
    name: 'NEDA Helpline',
    description: 'National Eating Disorders Association',
    contact: 'Call 1-800-931-2237',
    type: 'hotline'
  },
  {
    name: 'SAMHSA National Helpline',
    description: 'Substance Abuse and Mental Health Services',
    contact: 'Call 1-800-662-4357',
    type: 'hotline'
  }
];

function detectCrisis(text: string): CrisisDetectionResult
```

**GDPR/CCPA Compliance:**

```typescript
// GET /api/user/data-audit
// Returns all data we have on user
async function getDataAudit(userId: string): Promise<DataAuditResponse>

interface DataAuditResponse {
  user_profile: User;
  daily_metrics: DailyMetrics[];
  protocol_logs: ProtocolLog[];
  nudges: Nudge[];
  memories: Memory[];
  generated_at: string;
  format: 'json';
}

// POST /api/user/data-deletion
// Queues full data deletion
async function requestDataDeletion(userId: string): Promise<DeletionResponse>

interface DeletionResponse {
  request_id: string;
  status: 'queued';
  estimated_completion: string; // Within 48 hours
  email_confirmation_sent: boolean;
}

// Actual deletion job (runs async)
async function executeDataDeletion(requestId: string): Promise<void>
// Deletes from: Supabase, Firebase, Pinecone (user vectors if any)
```

**Acceptance Criteria:**
- [ ] Crisis keywords detected with >95% accuracy
- [ ] Resources displayed immediately when crisis detected
- [ ] AI response deferred to resources (no medical advice)
- [ ] Data audit endpoint returns complete user data
- [ ] Data deletion completes within 48 hours
- [ ] Email confirmation sent on deletion request

**Test Cases:**
1. Input "I don't want to live" → Crisis detected, resources shown
2. Input "I want to kill my workout" → NOT detected (contextual)
3. Request data audit → All data types returned
4. Request deletion → Data removed from all stores within 48h

---

## P1 Components (Core Functionality)

### Component 5: Weekly Synthesis

**What It Does:**
Generates an AI-written narrative summarizing the user's week, delivered Sunday 9am.

**Why It Matters:**
The "magic moment" that creates long-term retention. Users screenshot and share these.

**File Locations:**
- Create: `/home/ferdi/projects/WellnessApp/functions/src/synthesis/weeklySynthesis.ts`
- Create: `/home/ferdi/projects/WellnessApp/functions/src/synthesis/narrativeGenerator.ts`
- Modify: Cloud Scheduler (add weekly job)

**Data Aggregation:**

```typescript
interface WeeklyMetrics {
  protocol_adherence: number;        // 0-100
  days_with_completion: number;      // 0-7
  avg_recovery_score: number;
  hrv_trend_percent: number;         // % change from prior week
  sleep_quality_trend_percent: number;
  total_protocols_completed: number;

  // Per-protocol breakdown
  protocol_breakdown: {
    protocol_id: string;
    name: string;
    completed_days: number;
    avg_duration: number;
  }[];

  // Patterns detected
  correlations: {
    protocol: string;
    outcome: string;
    correlation: number;             // Pearson r
    p_value: number;
  }[];
}

async function aggregateWeeklyMetrics(
  userId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<WeeklyMetrics>
```

**Narrative Generation Prompt:**

```
You are writing a weekly wellness synthesis for a high-performing professional.

USER CONTEXT:
- Name: {user.display_name}
- Primary Goal: {user.primary_goal}
- Week: {weekStart} to {weekEnd}

METRICS:
{JSON.stringify(weeklyMetrics, null, 2)}

MEMORIES (patterns we've learned about this user):
{memories.map(m => `- ${m.content}`).join('\n')}

TASK: Write a ~200 word narrative with these sections:
1. WIN OF THE WEEK: What improved, with specific numbers
2. AREA TO WATCH: What declined or needs attention
3. PATTERN INSIGHT: A correlation from their data
4. TRAJECTORY PREDICTION: If trends continue, what happens
5. EXPERIMENT: One achievable action for next week

TONE: Analytical but warm. Like a coach reviewing game tape.
- Use their name once
- Include at least 2 specific numbers from their data
- No bullet points - narrative prose only
- Experiment must not require new equipment or major time

Output the narrative only, no JSON wrapper.
```

**Scheduling:**

```typescript
// Cloud Scheduler: Every Sunday at 8:45am UTC
// (Allows 15 min buffer for timezone-specific delivery)

async function generateWeeklySyntheses(): Promise<void> {
  // Get all users
  // For each user:
  //   1. Calculate their local Sunday 9am
  //   2. If within 15 min window, generate synthesis
  //   3. Store in Firestore
  //   4. Queue push notification
}
```

**Acceptance Criteria:**
- [ ] ~200 word narrative generated
- [ ] All 5 sections present (Win, Watch, Pattern, Trajectory, Experiment)
- [ ] At least 2 specific numbers from user data included
- [ ] Delivered Sunday 9am user timezone
- [ ] Narrative stored in `weekly_synthesis` collection
- [ ] Push notification delivered

**Test Cases:**
1. User with 7 days data → Full synthesis generated
2. User with <4 days data → Synthesis deferred with message
3. Check narrative length → 150-250 words
4. Verify 5 sections extractable from narrative
5. Delivery time → Within 15 min of 9am user timezone

---

### Component 6: MVD Detector

**What It Does:**
Detects when user is struggling and automatically activates Minimum Viable Day mode.

**Why It Matters:**
Prevents all-or-nothing dropout. Users don't quit feeling like failures.

**File Locations:**
- Create: `/home/ferdi/projects/WellnessApp/functions/src/mvd/mvdDetector.ts`
- Create: `/home/ferdi/projects/WellnessApp/functions/src/mvd/mvdProtocols.ts`
- Modify: `/home/ferdi/projects/WellnessApp/functions/src/dailyScheduler.ts`

**Trigger Conditions:**

> **Note (Session 10):** The `heavy_calendar` trigger (6+ meeting hours) has been deferred to Phase 3 as it requires Google/Apple Calendar OAuth integration. The remaining 4 triggers are implemented and functional.

```typescript
type MVDTrigger =
  | 'low_recovery'       // Recovery <35%
  | 'heavy_calendar'     // 6+ meeting hours [DEFERRED TO PHASE 3]
  | 'manual_activation'  // User tapped "Tough Day"
  | 'travel_detected'    // Timezone change >2h
  | 'consistency_drop';  // <50% completion for 3+ days

interface MVDDetectionResult {
  shouldActivate: boolean;
  trigger?: MVDTrigger;
  mvdType: 'full' | 'semi_active' | 'travel';
  protocols: string[];   // Protocol IDs for this MVD type
  exitCondition: string; // When to auto-deactivate
}

async function detectMVD(
  userId: string,
  todayContext: DayContext
): Promise<MVDDetectionResult>
```

**MVD Protocol Sets:**

```typescript
const MVD_PROTOCOLS = {
  full: [
    'morning_light_exposure',
    'hydration_electrolytes',
    'sleep_optimization'  // Early cutoff variant
  ],
  semi_active: [
    'morning_light_exposure',
    'hydration_electrolytes',
    'walking_breaks',
    'evening_light_management',
    'sleep_optimization'
  ],
  travel: [
    'morning_light_exposure',  // Extended 30 min
    'hydration_electrolytes',  // Increased
    'caffeine_timing',         // Adjusted for timezone
    'evening_light_management'
  ]
};
```

**Acceptance Criteria:**
- [x] 4 of 5 trigger conditions implemented (heavy_calendar deferred)
- [x] Correct MVD type selected (full/semi_active/travel)
- [x] Only MVD-approved protocols shown in schedule
- [x] Auto-deactivation when recovery >50%
- [x] User can manually activate via "Tough Day" button
- [x] MVD state persists in Firebase for real-time UI

**Implementation Notes (Session 10 - December 3, 2025):**
- Created `functions/src/mvd/` module with 7 files (~650 lines)
- 50 unit tests passing in `functions/tests/mvdDetector.test.ts`
- API endpoints: `POST /api/mvd/activate`, `GET /api/mvd/status`, `POST /api/mvd/deactivate`
- Travel detection uses user profile timezone vs device timezone from request

**Test Cases:**
1. Recovery 30% → Full MVD activated ✅
2. 7 hours meetings → Full MVD activated [DEFERRED - needs Calendar API]
3. Timezone +4h → Travel MVD activated ✅
4. <40% completion 3 days → Semi-active MVD ✅
5. MVD active + recovery 55% → MVD deactivated ✅

---

### Component 7: Reasoning Transparency UI

**What It Does:**
Shows the user exactly how the AI reached its recommendation.

**Why It Matters:**
Differentiator. Builds trust. "I know WHY it's telling me this."

**File Locations:**
- Modify: `/home/ferdi/projects/WellnessApp/client/src/components/NudgeCard.tsx`
- Create: `/home/ferdi/projects/WellnessApp/client/src/components/ReasoningExpansion.tsx`

**UI Behavior:**

1. User sees nudge card (headline + body)
2. User taps "Why?" link
3. Card expands to show reasoning panel
4. Panel shows: Mechanism → Evidence → Your Data → Confidence

**Reasoning Panel Structure:**

```typescript
interface ReasoningPanel {
  mechanism: string;      // 1-2 sentences, physiological
  evidence: {
    citation: string;     // "Wright et al. (2013). Title..."
    doi: string;          // "10.1016/j.cub.2013.06.039"
    strength: 'Very High' | 'High' | 'Moderate';
  };
  your_data: string;      // "Your sleep onset averages 45 min..."
  confidence: {
    level: 'High' | 'Medium' | 'Low';
    explanation: string;  // "Based on 30+ days of your data"
  };
}
```

**Animation:**
- Expand duration: 200ms ease-out
- Collapse on tap outside or tap "Why?" again
- Content fades in 100ms after expand starts

**Acceptance Criteria:**
- [ ] "Why?" tap expands reasoning panel
- [ ] All 4 sections displayed (Mechanism, Evidence, Your Data, Confidence)
- [ ] DOI links open in external browser
- [ ] Confidence level displayed with color (High=green, Medium=yellow, Low=gray)
- [ ] Smooth expand/collapse animation
- [ ] Panel collapses on outside tap

---

### Component 8: "Why?" Expansion Content

**What It Does:**
Generates the actual content for the reasoning panel.

**Why It Matters:**
The content must be accurate, personalized, and properly cited.

**File Locations:**
- Create: `/home/ferdi/projects/WellnessApp/functions/src/reasoning/whyExpansion.ts`
- Modify: `/home/ferdi/projects/WellnessApp/functions/src/nudgeEngine.ts`

**Generation Logic:**

```typescript
async function generateWhyExpansion(
  nudge: Nudge,
  user: User,
  protocol: Protocol,
  memories: Memory[]
): Promise<ReasoningPanel> {
  // 1. Get mechanism from protocol.description (first 2 sentences)
  // 2. Get citation from protocol.citations[0]
  // 3. Generate "Your Data" from user metrics + memories
  // 4. Calculate confidence from ConfidenceScore

  return {
    mechanism: extractMechanism(protocol.description),
    evidence: {
      citation: protocol.citations[0],
      doi: extractDOI(protocol.citations[0]),
      strength: protocol.evidence_level
    },
    your_data: await generateYourData(user, protocol, memories),
    confidence: {
      level: mapConfidenceLevel(nudge.confidence_score),
      explanation: generateConfidenceExplanation(nudge.confidence_score, memories)
    }
  };
}

async function generateYourData(
  user: User,
  protocol: Protocol,
  memories: Memory[]
): Promise<string> {
  // Use Gemini to generate personalized explanation
  // Max 150 characters
  // Must reference at least one specific number from user's data
}
```

**Acceptance Criteria:**
- [ ] Mechanism extracted accurately from protocol
- [ ] DOI parsed and linked correctly
- [ ] "Your Data" includes specific user numbers
- [ ] "Your Data" under 150 characters
- [ ] Confidence explanation matches score

**Test Cases:**
1. Morning Light protocol → Correct mechanism about circadian rhythm
2. DOI link → Opens correct paper
3. User with 45 min sleep onset → Referenced in "Your Data"
4. High confidence → "Based on 30+ days"
5. Low confidence → "Limited data available"

---

## P2 Components (Quality/Polish)

### Component 9: Outcome Correlation

**What It Does:**
Calculates statistical correlations between protocol completion and health outcomes.

**Why It Matters:**
Proves the product works. "Since starting delayed caffeine, sleep onset 14 min faster."

**File Locations:**
- Create: `/home/ferdi/projects/WellnessApp/functions/src/analytics/outcomeCorrelation.ts`
- Modify: `/home/ferdi/projects/WellnessApp/functions/src/synthesis/weeklySynthesis.ts`

**Correlation Calculation:**

```typescript
interface CorrelationResult {
  protocol_id: string;
  outcome_metric: string;       // e.g., "sleep_onset_minutes"
  correlation: number;          // Pearson r (-1 to 1)
  p_value: number;              // Statistical significance
  is_significant: boolean;      // p < 0.05
  sample_size: number;          // Days of data
  direction: 'positive' | 'negative';
  interpretation: string;       // Human-readable
}

async function calculateCorrelation(
  userId: string,
  protocolId: string,
  outcomeMetric: string,
  lookbackDays: number = 30
): Promise<CorrelationResult>

// Pearson correlation implementation
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  return denominator === 0 ? 0 : numerator / denominator;
}
```

**Key Correlations to Track:**

| Protocol | Outcome Metric | Expected Direction |
|----------|---------------|-------------------|
| Morning Light | sleep_onset_minutes | Negative (faster) |
| Morning Light | recovery_score | Positive |
| Caffeine Timing | sleep_onset_minutes | Negative |
| NSDR | hrv_avg | Positive |
| Walking Breaks | afternoon_energy (self-report) | Positive |

**Acceptance Criteria:**
- [ ] Pearson correlation calculated correctly
- [ ] p-value calculated for significance testing
- [ ] Only significant correlations (p<0.05) surfaced
- [ ] Correlations included in Weekly Synthesis
- [ ] Minimum 14 days data required for correlation
- [ ] Human-readable interpretation generated

**Test Cases:**
1. 30 days Morning Light data → Correlation calculated
2. r=0.6, p=0.01 → Marked significant
3. r=0.2, p=0.15 → NOT surfaced (not significant)
4. <14 days data → "Not enough data yet"

---

## Implementation Sessions Roadmap

| Session | Components | Focus | Deliverable | Status |
|---------|------------|-------|-------------|--------|
| **1-3** | Memory Layer | Data model, decay, retrieval | Complete memory system | ✅ Complete |
| **4** | Confidence Scoring | All 5 factors | Scoring function | ✅ Complete |
| **5-6** | Suppression Engine | 9 rules, override logic | Complete engine | ✅ Complete |
| **7** | Safety & Compliance | Crisis detection, GDPR | Safety features | ✅ Complete |
| **8** | Weekly Synthesis (Part 1) | Data aggregation | Metrics + correlations | ✅ Complete |
| **9** | Weekly Synthesis (Part 2) | Narrative generation | Push notifications | ✅ Complete |
| **10** | MVD Detector | 4 triggers, protocol sets | MVD activation | ✅ Complete |
| **11** | Outcome Correlation + Dashboard | Verify engine, add UI | Insights screen | ⏳ Pending |
| **12** | AI Processing Animation + Why Engine | Shimmer UX, backend reasoning | Complete reasoning | ⏳ Pending |
| **13** | Reasoning Transparency UI | NudgeCard, 4-panel expansion | Complete UI | ⏳ Pending |

---

## Session 11: Outcome Correlation Verification + Dashboard

**Goal:** Verify existing correlation implementation and add user-facing dashboard

### 11A: Verify Existing Implementation

The correlation engine was implemented as part of Weekly Synthesis (Session 8). Verification required:

**Files to Review:**
- `functions/src/synthesis/correlations.ts` — Pearson correlation + p-value
- `functions/src/synthesis/weeklySynthesis.ts` — `calculateCorrelations()` function
- `functions/src/synthesis/types.ts` — SYNTHESIS_CONFIG constants

**Verification Steps:**
1. Run existing synthesis tests: `cd functions && npm test -- --grep correlation`
2. Review correlation calculation logic (minimum 14 days, p<0.05 threshold)
3. Verify integration with narrative generator
4. Check metrics_summary.correlations JSON storage

### 11B: Correlation Dashboard (New Feature)

**Rationale:** Industry best practice (Dec 2025) shows users engage more when they can see personal health correlations visualized, not just in weekly narrative text.

**Files to Create:**
```
client/src/components/CorrelationCard.tsx
client/src/screens/InsightsScreen.tsx
functions/src/endpoints/correlations.ts
```

**API Endpoint:** `GET /api/user/correlations`
- Returns top correlations for user
- Cached daily (correlations don't change intra-day)
- 14+ days data required

**UI Design (Apex OS aesthetic):**
```
┌─────────────────────────────────────┐
│  YOUR PATTERNS                      │
├─────────────────────────────────────┤
│  ↑ Morning Light → Sleep Quality    │
│    +23% improvement (p=0.02)        │
│    [████████░░] 30 days tracked     │
├─────────────────────────────────────┤
│  ↑ NSDR → HRV Score                 │
│    +18% improvement (p=0.04)        │
│    [██████░░░░] 21 days tracked     │
└─────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Pearson correlation verified (unit tests pass)
- [ ] Dashboard displays top 3 correlations with trend indicators
- [ ] Color-coded: green (positive), amber (negative correlation)
- [ ] "Not enough data" state for users with < 14 days

---

## Session 12: AI Processing Animation + Why Engine

### 12A: AI Processing Animation ("Thinking State")

**Goal:** Elegant shimmer animation while AI processes nudges/chat

**Industry Best Practices Applied (Dec 2025):**
1. Progressive text updates every ~3 seconds (Claude-style)
2. Shimmer gradient effect on skeleton loader
3. Human-like messaging ("Analyzing your day..." not "Processing request...")

**Files to Create:**
```
client/src/components/AIThinkingState.tsx
client/src/components/ShimmerText.tsx
```

**Animation Sequence:**
```
0-3s:  "Analyzing your data..."          [shimmer]
3-6s:  "Researching protocols..."        [shimmer]
6-9s:  "Tailoring to your needs..."      [shimmer]
9s+:   "Almost there..."                 [shimmer]
```

**Technical Implementation:**
- React Native Reanimated 3 for shimmer gradient
- `withRepeat()` + `withTiming()` for continuous shimmer
- Shared value for text opacity transitions
- NativeWind styling (dark theme: #0F1218, shimmer: teal gradient)

### 12B: "Why?" Engine (Backend)

**Goal:** Generate structured reasoning content for nudges

**File to Create:**
```
functions/src/reasoning/whyEngine.ts
```

**Interface:**
```typescript
interface WhyExpansion {
  mechanism: string;        // 1-2 sentences, physiological
  evidence: {
    citation: string;       // Full citation text
    doi?: string;           // Parsed DOI link
    strength: EvidenceLevel;
  };
  your_data: string;        // Max 150 chars, personalized
  confidence: {
    level: 'High' | 'Medium' | 'Low';
    explanation: string;
  };
}
```

**Generation Logic:**
1. `mechanism` — Extract first 2 sentences from `protocol.description`
2. `evidence.citation` — Use `protocol.citations[0]`
3. `evidence.doi` — Parse DOI regex from citation string
4. `your_data` — Use Gemini to generate personalized insight from memories (max 150 chars)
5. `confidence.level` — Map score: >0.7 = High, 0.4-0.7 = Medium, <0.4 = Low

**Integration Point:** Modify `nudgeEngine.ts` line ~363 (after nudge generation)

**Acceptance Criteria:**
- [ ] WhyExpansion generated for all nudges
- [ ] DOI links parsed correctly
- [ ] "Your Data" under 150 characters
- [ ] Confidence explanation matches score

---

## Session 13: Reasoning Transparency UI

### 13A: NudgeCard Component (New)

**Goal:** Dedicated nudge display with "Why?" expansion capability

**Current State:** Nudges render through generic `TaskList.tsx` with no special treatment

**File to Create:**
```
client/src/components/NudgeCard.tsx
```

**Features:**
1. Collapsed state: Headline + body + "Why?" link
2. Expanded state: 4-panel reasoning system
3. Smooth height animation (200ms ease-out)
4. Tap outside to collapse

### 13B: 4-Panel Reasoning Expansion (Perplexity-inspired)

**Design:**
```
┌──────────────────────────────────────────┐
│  Take a 10-minute walk before lunch.     │
│                                          │
│  [Why?]                                  │
├──────────────────────────────────────────┤
│  MECHANISM                               │
│  Brief movement breaks reduce cortisol   │
│  and improve afternoon focus...          │
├──────────────────────────────────────────┤
│  EVIDENCE                                │
│  Oppezzo & Schwartz (2014) [1]           │
│  Evidence: High ████████░░               │
├──────────────────────────────────────────┤
│  YOUR DATA                               │
│  Your afternoon focus improved 32%       │
│  on days you walked vs. skipped.         │
├──────────────────────────────────────────┤
│  CONFIDENCE                              │
│  High — Based on 45 days of your data    │
└──────────────────────────────────────────┘
```

**Files to Create:**
```
client/src/components/ReasoningExpansion.tsx
client/src/components/ReasoningPanel.tsx
```

**Animation Sequence:**
1. Card height animates from collapsed → expanded (200ms)
2. Each panel fades in sequentially (100ms delay between panels)
3. DOI link underlined, opens external browser on tap
4. Confidence bar color: High=teal, Medium=amber, Low=gray

### 13C: Type Extensions

**Modify:** `client/src/types/dashboard.ts`

```typescript
export interface WhyExpansion {
  mechanism: string;
  evidence: {
    citation: string;
    doi?: string;
    strength: 'Very High' | 'High' | 'Moderate' | 'Emerging';
  };
  your_data: string;
  confidence: {
    level: 'High' | 'Medium' | 'Low';
    explanation: string;
  };
}
```

**Acceptance Criteria:**
- [ ] "Why?" tap expands reasoning panel
- [ ] All 4 sections displayed
- [ ] DOI links open in external browser
- [ ] Smooth expand/collapse animation (60fps)
- [ ] Panel collapses on outside tap

---

## Verification Checklist

After completing Phase 2, verify:

- [ ] Memory Layer: User learnings persist and influence nudges
- [ ] Confidence Scoring: Low-confidence nudges suppressed
- [ ] Suppression Engine: All 9 rules working, max 5 nudges/day
- [ ] Safety: Crisis keywords trigger resources
- [ ] Weekly Synthesis: ~200 word narrative delivered Sunday 9am
- [ ] MVD: Auto-activates on low recovery or heavy calendar
- [ ] Reasoning UI: "Why?" expands with all 4 sections
- [ ] "Why?" Content: Personalized, accurate, under limits
- [ ] Outcome Correlation: Significant correlations in synthesis

---

## Post-Phase 2 Priorities

After Phase 2 completion, Phase 3 (Nervous System) focuses on:

1. **Wearable Data Sync** - Real Oura/WHOOP/Apple Health data
2. **Calendar Integration** - Google/Apple Calendar for meeting awareness
3. **Wake Detection** - Trigger morning anchor from wearable sleep_end
4. **Real-time Recovery** - Update recovery score throughout day

---

*This implementation plan is designed for Claude Opus 4.5 autonomous execution with human checkpoint approval after each component.*
