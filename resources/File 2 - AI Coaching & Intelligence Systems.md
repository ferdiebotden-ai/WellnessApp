# AI Coaching & Intelligence Systems
## Comprehensive AI-Powered Coaching & Protocol Delivery for Wellness OS

**Synthesis Date:** October 23, 2025
**Source Reports:** #06-#09, #11, #14 (Adaptive Coach, Protocol Engine, Voice/Chat Onboarding, Evidence UX, Continuous Learning, Custom Protocol Builder)
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Adaptive Coach System](#adaptive-coach-system)
3. [Protocol Engine](#protocol-engine)
4. [Voice & Chat Onboarding Coaching](#voice--chat-onboarding-coaching)
5. [Evidence UX System](#evidence-ux-system)
6. [Continuous Learning Engine](#continuous-learning-engine)
7. [Custom Protocol Builder](#custom-protocol-builder)
8. [AI System Integration](#ai-system-integration)

---

## Executive Summary

The AI Coaching & Intelligence Systems form the cognitive core of Wellness OS, transforming evidence-based protocols into personalized, contextual nudges delivered at optimal timing. The system combines:

- **Adaptive Coach:** GPT-4o-powered AI that generates 2-3 contextual nudges per day based on wearable biometrics, protocol history, and user preferences
- **Protocol Engine:** Rule-based + AI scheduling system that auto-sequences sleep, light, movement, and nutrition protocols across user's day
- **Voice/Chat Onboarding:** Whisper API (speech-to-text) + GPT-4o conversational onboarding capturing biometric baseline, goals, and constraints in <5 minutes
- **Evidence UX:** Progressive disclosure system presenting peer-reviewed citations (DOI links) with 2-bullet plain-English summaries to build user trust
- **Continuous Learning Engine:** Feedback loop capturing user responses ("helpful"/"not helpful") to refine nudge timing, copy, and protocol recommendations over time
- **Custom Protocol Builder:** User-facing tool for creating personalized protocols validated against evidence database; requires Pro tier

**Key Design Principles:**
1. **Autonomy-Respecting:** Users can disable AI Coach entirely; core app functionality remains intact
2. **Explainable AI:** Every nudge cites reasoning ("Your sleep was 6.2 hrs; research shows 7-9 optimal") + DOI sources
3. **Privacy-First:** All AI decisions logged in audit trail; users can export reasoning via Privacy Dashboard
4. **Graceful Degradation:** If OpenAI API fails, fall back to rule-based nudges; if Pinecone fails, serve pre-cached recommendations

**Success Metrics (MVP Month 1):**
- **North Star:** ≥10% of users achieve ≥6 days/week protocol adherence by Day 30
- **AI Coach Engagement:** ≥50% of nudges opened; ≥30% marked "helpful"
- **Evidence UX Trust:** ≥40% of users tap "View Research" DOI links at least once
- **Onboarding Speed:** ≥70% complete voice onboarding in <5 minutes

---

## Adaptive Coach System

### Overview

The Adaptive Coach is a **contextual AI system** that generates personalized protocol nudges by analyzing:
1. **Wearable biometrics** (sleep, HRV, readiness) from Oura, Whoop, Apple Health, Google Fit
2. **Protocol adherence history** (completed, skipped, partial) from last 7-30 days
3. **User preferences** (nudge frequency, tone, protocol categories)
4. **Temporal context** (time of day, day of week, proximity to last nudge)

Unlike rigid habit trackers (Duolingo, Streaks), the Adaptive Coach **adapts timing and content** based on real-time biometric signals. For example:
- If user's HRV drops below baseline → Recommend recovery protocol (NSDR, skip high-intensity movement)
- If user logs poor sleep (< 6 hours) → Morning light exposure nudge delivered within 30 min of wake time
- If user completes 7-day streak → Celebration + optional upgrade nudge ("Unlock advanced analytics in Pro")

### Architecture

**AI Coach Decision Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│ NIGHTLY BATCH JOB (Runs at user's optimal time, e.g., 8 PM) │
└─────────────────────────────────────────────────────────────┘
                         ↓
  1. Fetch active users (AI Coach enabled)
  2. For each user:
     a. Fetch biometric context (wearable data, last 7 days)
     b. Fetch protocol history (adherence, recent completions)
     c. Fetch user preferences (nudge frequency, tone, categories)
  3. Call OpenAI GPT-4o API:
     - Input: User context (JSON payload with biometrics, history, preferences)
     - Output: 2-3 nudge candidates (protocol_id, nudge_text, reasoning, citations, timing, confidence_score)
  4. Validate nudges (schema check via Zod; ensure citations valid DOIs)
  5. Store nudges in Firebase Realtime Database (/nudges/{user_id}/{timestamp})
  6. Log to AI Audit Log (PostgreSQL) for GDPR Article 22 compliance
  7. Schedule delivery (push notification or in-app modal at optimal time)
```

**OpenAI API Prompt Template:**

```typescript
const systemPrompt = `
You are an AI wellness coach for Wellness OS. Your role is to generate personalized protocol nudges based on user biometrics and evidence-based research.

RULES:
1. Always cite peer-reviewed sources (DOI or PubMed ID)
2. Keep nudge text concise (≤200 characters)
3. Explain reasoning (why this protocol, why now?)
4. Respect user constraints (e.g., if user disabled Movement protocols, don't recommend)
5. Tone: Motivational but not preachy; celebrate progress, don't shame lapses

OUTPUT FORMAT:
{
  "nudges": [
    {
      "protocol_id": "protocol_morning_light",
      "nudge_text": "Good morning! Get 10 min sunlight within 1 hour. It'll advance your circadian rhythm.",
      "reasoning": "User's sleep was 6.2 hrs (below optimal 7-9). Morning light improves sleep quality.",
      "evidence_citation": "DOI: 10.1016/j.smrv.2016.10.001",
      "timing": "morning",
      "confidence_score": 0.87
    }
  ]
}
`;

const userPrompt = `
User Profile:
- Name: ${user.display_name}
- Tier: ${user.tier}
- Goal: ${user.preferences.goal} // e.g., "Improve sleep quality"

Biometric Context (Last 7 Days):
- Average Sleep: ${wearableData.avg_sleep_hours} hours
- HRV: ${wearableData.hrv}
- Readiness Score: ${wearableData.readiness_score}

Protocol History (Last 7 Days):
- Completed: ${protocolHistory.completed.length} protocols
- Skipped: ${protocolHistory.skipped.length} protocols
- Most recent: ${protocolHistory.most_recent.protocol_id} (${protocolHistory.most_recent.date})

User Preferences:
- Nudge Frequency: ${user.preferences.nudge_frequency}/day (max)
- Tone: ${user.preferences.nudge_tone} // "motivational", "neutral", "minimal"
- Enabled Categories: ${user.preferences.protocol_categories.join(', ')} // ["sleep", "light"]

TASK: Generate ${user.preferences.nudge_frequency} nudges for today.
`;

const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  functions: [
    {
      name: 'generate_nudges',
      description: 'Generate personalized protocol nudges with citations',
      parameters: {
        type: 'object',
        properties: {
          nudges: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                protocol_id: { type: 'string' },
                nudge_text: { type: 'string', maxLength: 200 },
                reasoning: { type: 'string' },
                evidence_citation: { type: 'string' }, // DOI
                timing: { type: 'string', enum: ['morning', 'afternoon', 'evening'] },
                confidence_score: { type: 'number', minimum: 0, maximum: 1 }
              },
              required: ['protocol_id', 'nudge_text', 'reasoning', 'evidence_citation', 'timing', 'confidence_score']
            }
          }
        },
        required: ['nudges']
      }
    }
  ],
  function_call: { name: 'generate_nudges' }
});

const nudges = JSON.parse(completion.choices[0].message.function_call.arguments);
return nudges;
```

### Nudge Timing Optimization

**Timing Rules (Evidence-Based):**

```typescript
// Morning nudges (6 AM - 9 AM)
const morningNudges = [
  'protocol_morning_light',      // 10-30 min sunlight within 1 hr of wake
  'protocol_hydration',          // Drink 16 oz water upon waking
  'protocol_caffeine_delay'      // Wait 90-120 min post-wake before caffeine
];

// Afternoon nudges (12 PM - 3 PM)
const afternoonNudges = [
  'protocol_caffeine_cutoff',    // Last caffeine 10 hrs before bedtime
  'protocol_movement_snack',     // 5-10 min walk/stretch
  'protocol_nsdr_recovery'       // 10-20 min NSDR if HRV low
];

// Evening nudges (5 PM - 9 PM)
const eveningNudges = [
  'protocol_wind_down',          // Dim lights, avoid screens 90 min before bed
  'protocol_temperature_drop',   // Lower room temp to 65-68°F
  'protocol_gratitude_journaling' // 5 min reflection
];

// Dynamic timing based on user wake/sleep time
function calculateOptimalDeliveryTime(user, nudge) {
  const wakeTime = user.wearable_data.avg_wake_time; // e.g., 7:00 AM
  const bedtime = user.wearable_data.avg_bedtime;     // e.g., 11:00 PM

  if (nudge.timing === 'morning') {
    // Deliver within 30 min of wake time
    return new Date(wakeTime.getTime() + 30 * 60 * 1000);
  } else if (nudge.timing === 'afternoon') {
    // Deliver at 2 PM (fixed)
    return new Date(wakeTime.getTime() + 7 * 60 * 60 * 1000); // 7 hours after wake
  } else if (nudge.timing === 'evening') {
    // Deliver 90 min before bedtime
    return new Date(bedtime.getTime() - 90 * 60 * 1000);
  }
}
```

**Frequency Cap Rules:**

```typescript
// Prevent nudge fatigue
const RULES = {
  max_nudges_per_day: 3,
  min_hours_between_nudges: 4,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00'
};

async function shouldDeliverNudge(userId, nudge, proposedTime) {
  // Rule 1: Respect user's nudge frequency preference
  const userPrefs = await getUserPreferences(userId);
  const nudgesToday = await getNudgesDeliveredToday(userId);

  if (nudgesToday.length >= userPrefs.nudge_frequency) {
    return false; // Already sent max nudges today
  }

  // Rule 2: Respect quiet hours
  const hour = proposedTime.getHours();
  if (hour >= 22 || hour < 8) {
    return false; // Within quiet hours
  }

  // Rule 3: Minimum 4 hours between nudges
  const lastNudge = await getLastNudgeDelivered(userId);
  if (lastNudge && (proposedTime - lastNudge.delivered_at) < 4 * 60 * 60 * 1000) {
    return false; // Too soon since last nudge
  }

  // Rule 4: Don't send nudge if user is mid-protocol
  const activeSession = await getActiveProtocolSession(userId);
  if (activeSession) {
    return false; // User is doing a protocol right now
  }

  return true; // OK to deliver
}
```

### Fallback Logic (Graceful Degradation)

**OpenAI API Failure Scenarios:**

```typescript
async function generateAdaptiveNudge(context) {
  try {
    // Primary: OpenAI GPT-4o
    const aiNudges = await generateAINudges(context);
    return aiNudges;
  } catch (error) {
    if (error.code === 'rate_limit_exceeded') {
      logger.warn('OpenAI rate limit hit; falling back to rule-based');
      return generateRuleBasedNudges(context);
    } else if (error.code === 'service_unavailable') {
      logger.error('OpenAI service down; using cached nudges');
      return getCachedNudges(context.user.tier);
    } else {
      logger.error('Unknown OpenAI error; skipping nudge generation', error);
      return null; // No nudge today
    }
  }
}

// Fallback 1: Rule-based nudges (simple heuristics)
function generateRuleBasedNudges(context) {
  const { wearable_data, user } = context;
  const nudges = [];

  // Rule: If sleep < 7 hours → recommend sleep protocol
  if (wearable_data.avg_sleep_hours < 7) {
    nudges.push({
      protocol_id: 'protocol_wind_down',
      nudge_text: 'Your sleep was below 7 hours this week. Try the Wind-Down Routine tonight.',
      reasoning: 'Rule: avg_sleep < 7 hours → recommend sleep protocol',
      evidence_citation: 'DOI: 10.1016/j.smrv.2016.10.001',
      timing: 'evening',
      confidence_score: 0.6 // Lower confidence for rule-based
    });
  }

  // Rule: If HRV < 40 → recommend recovery protocol
  if (wearable_data.hrv < 40) {
    nudges.push({
      protocol_id: 'protocol_nsdr_recovery',
      nudge_text: 'Your HRV is low. Consider a 10-min NSDR session for recovery.',
      reasoning: 'Rule: HRV < 40 → recommend recovery protocol',
      evidence_citation: 'Huberman Lab Toolkit',
      timing: 'afternoon',
      confidence_score: 0.5
    });
  }

  // Rule: Morning light if no morning light logged in last 3 days
  const morningLightLogs = context.protocol_history.filter(
    log => log.protocol_id === 'protocol_morning_light' && isWithinLast3Days(log.date)
  );
  if (morningLightLogs.length === 0) {
    nudges.push({
      protocol_id: 'protocol_morning_light',
      nudge_text: 'Get 10 min of sunlight within 1 hour of waking to improve sleep.',
      reasoning: 'Rule: No morning light logged in last 3 days',
      evidence_citation: 'DOI: 10.1016/j.sleh.2023.07.018',
      timing: 'morning',
      confidence_score: 0.7
    });
  }

  return nudges.slice(0, user.preferences.nudge_frequency); // Cap at user's max
}

// Fallback 2: Pre-cached generic nudges (tier-specific)
function getCachedNudges(tier) {
  const CACHED_NUDGES = {
    free: [
      {
        protocol_id: 'protocol_morning_light',
        nudge_text: 'Start your day with 10 min of sunlight for better sleep.',
        reasoning: 'Cached generic nudge (Free tier)',
        evidence_citation: 'DOI: 10.1016/j.sleh.2023.07.018',
        timing: 'morning',
        confidence_score: 0.4
      }
    ],
    core: [
      {
        protocol_id: 'protocol_wind_down',
        nudge_text: 'Dim lights 90 min before bed to improve sleep onset.',
        reasoning: 'Cached generic nudge (Core tier)',
        evidence_citation: 'DOI: 10.1016/j.smrv.2016.10.001',
        timing: 'evening',
        confidence_score: 0.4
      }
    ]
  };

  return CACHED_NUDGES[tier] || CACHED_NUDGES.free;
}
```

---

## Protocol Engine

### Overview

The Protocol Engine **orchestrates protocol delivery** across the user's day, ensuring:
1. **Optimal sequencing:** Morning light → Caffeine delay → Movement → Wind-down (temporal ordering)
2. **Conflict avoidance:** Don't recommend conflicting protocols (e.g., "Take cold shower" + "Lower room temp" at same time)
3. **Auto-scheduling:** Pre-populate user's daily schedule with evidence-based protocols based on their goals
4. **Adaptive intensity:** Adjust protocol difficulty based on adherence (e.g., if user skips 3 days, reduce frequency to rebuild habit)

**Core Protocols (MVP):**

```
Sleep Domain (6 protocols):
  1. Morning Light Exposure (10-30 min within 1 hr of wake)
  2. Caffeine Delay (90-120 min post-wake before first caffeine)
  3. Caffeine Cutoff (10 hrs before bedtime)
  4. Wind-Down Routine (Dim lights, avoid screens 90 min before bed)
  5. Temperature Drop (Lower room temp to 65-68°F)
  6. Sleep Restriction Therapy (Limit time in bed to match actual sleep time)

Light Domain (2 protocols):
  7. Morning Light Exposure (same as Sleep #1; cross-domain)
  8. Evening Light Avoidance (Avoid bright lights 2-3 hrs before bed)

Movement Domain (4 protocols):
  9. Zone 2 Cardio (30-45 min at conversational pace, 3-4x/week)
  10. Resistance Training (2-3x/week, 45-60 min)
  11. Movement Snacks (5-10 min walk/stretch every 2 hrs)
  12. Cold Exposure (1-3 min cold shower, 2-3x/week)

Nutrition Domain (4 protocols):
  13. Hydration Upon Waking (16 oz water within 30 min of wake)
  14. Time-Restricted Eating (8-10 hr eating window)
  15. Protein Target (0.7-1g per lb body weight)
  16. Omega-3 Supplementation (1-2g EPA/DHA daily)

Recovery Domain (2 protocols):
  17. NSDR (Non-Sleep Deep Rest, 10-20 min)
  18. Gratitude Journaling (5 min reflection before bed)
```

### Protocol Sequencing Logic

**Daily Protocol Schedule (Auto-Generated):**

```typescript
// Generate user's daily protocol schedule
async function generateDailySchedule(userId) {
  const user = await getUser(userId);
  const wearableData = await getWearableData(userId, days: 7);
  const protocolHistory = await getProtocolHistory(userId, days: 7);

  // User's typical day structure
  const wakeTime = wearableData.avg_wake_time; // e.g., 7:00 AM
  const bedtime = wearableData.avg_bedtime;     // e.g., 11:00 PM

  // Build schedule
  const schedule = [];

  // Morning block (6 AM - 9 AM)
  schedule.push({
    time: addMinutes(wakeTime, 30), // 30 min after wake
    protocol_id: 'protocol_morning_light',
    duration_minutes: 15,
    priority: 'high'
  });

  schedule.push({
    time: addMinutes(wakeTime, 90), // 90 min after wake
    protocol_id: 'protocol_hydration',
    duration_minutes: 5,
    priority: 'high'
  });

  schedule.push({
    time: addMinutes(wakeTime, 120), // 2 hrs after wake
    protocol_id: 'protocol_caffeine_delay',
    duration_minutes: 0, // Informational nudge (not time-bound)
    priority: 'medium'
  });

  // Afternoon block (12 PM - 3 PM)
  const caffeineC_cutoff = addHours(bedtime, -10); // 10 hrs before bed (e.g., 1 PM if bed at 11 PM)
  schedule.push({
    time: caffeineC_cutoff,
    protocol_id: 'protocol_caffeine_cutoff',
    duration_minutes: 0,
    priority: 'high'
  });

  schedule.push({
    time: addHours(wakeTime, 6), // 6 hrs after wake (e.g., 1 PM)
    protocol_id: 'protocol_movement_snack',
    duration_minutes: 10,
    priority: 'medium'
  });

  // Evening block (5 PM - 9 PM)
  const windDownStart = addMinutes(bedtime, -90); // 90 min before bed
  schedule.push({
    time: windDownStart,
    protocol_id: 'protocol_wind_down',
    duration_minutes: 30,
    priority: 'high'
  });

  schedule.push({
    time: addMinutes(bedtime, -30), // 30 min before bed
    protocol_id: 'protocol_temperature_drop',
    duration_minutes: 5,
    priority: 'medium'
  });

  schedule.push({
    time: addMinutes(bedtime, -15), // 15 min before bed
    protocol_id: 'protocol_gratitude_journaling',
    duration_minutes: 5,
    priority: 'low'
  });

  // Store schedule in Firebase RTDB for real-time UI
  await writeToFirebase(`/schedules/${userId}/${formatDate(new Date())}`, schedule);

  return schedule;
}
```

**Conflict Detection & Resolution:**

```typescript
// Detect protocol conflicts (can't do two protocols at same time)
function detectConflicts(schedule) {
  const conflicts = [];

  for (let i = 0; i < schedule.length - 1; i++) {
    const current = schedule[i];
    const next = schedule[i + 1];

    const currentEnd = addMinutes(current.time, current.duration_minutes);

    if (next.time < currentEnd) {
      conflicts.push({
        protocol_a: current.protocol_id,
        protocol_b: next.protocol_id,
        reason: 'Time overlap'
      });
    }
  }

  return conflicts;
}

// Resolve conflicts: Adjust timing or merge compatible protocols
function resolveConflicts(schedule, conflicts) {
  for (const conflict of conflicts) {
    // Strategy 1: Merge if protocols compatible (e.g., "Morning Light" + "Hydration" can happen simultaneously)
    if (isCompatible(conflict.protocol_a, conflict.protocol_b)) {
      mergeProtocols(schedule, conflict.protocol_a, conflict.protocol_b);
    }
    // Strategy 2: Shift lower-priority protocol
    else {
      const protocolA = schedule.find(p => p.protocol_id === conflict.protocol_a);
      const protocolB = schedule.find(p => p.protocol_id === conflict.protocol_b);

      if (protocolA.priority > protocolB.priority) {
        // Shift protocolB 15 min later
        protocolB.time = addMinutes(protocolB.time, 15);
      } else {
        protocolA.time = addMinutes(protocolA.time, 15);
      }
    }
  }

  return schedule;
}
```

### Adaptive Intensity (Habit Formation)

**Progressive Overload for Protocol Adherence:**

```typescript
// Adjust protocol frequency based on user's adherence pattern
async function adjustProtocolIntensity(userId, protocolId) {
  const adherence = await calculateAdherence(userId, protocolId, days: 30);
  const protocol = await getProtocol(protocolId);

  // Rule: If adherence < 40% for 30 days → reduce frequency to rebuild habit
  if (adherence < 0.40) {
    return {
      frequency: '3-4 days per week', // Reduced from 6-7
      duration_minutes: protocol.duration_minutes.min, // Minimum duration
      message: "Let's start small: 3-4 days this week to rebuild your streak."
    };
  }
  // Rule: If adherence ≥ 80% for 30 days → increase challenge
  else if (adherence >= 0.80) {
    return {
      frequency: '6-7 days per week',
      duration_minutes: protocol.duration_minutes.max, // Maximum duration
      message: "You're crushing it! Try the advanced version this week."
    };
  }
  // Default: Maintain current frequency
  else {
    return {
      frequency: protocol.frequency,
      duration_minutes: protocol.duration_minutes.min,
      message: null
    };
  }
}
```

---

## Voice & Chat Onboarding Coaching

### Overview

Voice-first onboarding replaces traditional multi-screen forms with **conversational AI** (GPT-4o) that captures:
1. **Biometric baseline:** Current sleep hours, wake time, bedtime, existing habits
2. **Goals:** What user wants to improve (sleep quality, energy, focus, recovery)
3. **Constraints:** Injuries, medical conditions, dietary restrictions, schedule conflicts

**Target:** Complete onboarding in <5 minutes (70%+ of users achieve this).

**Technology Stack:**
- **Speech-to-Text:** OpenAI Whisper API (multilingual, <2 sec latency)
- **Conversational AI:** GPT-4o with function calling
- **Text-to-Speech (optional):** ElevenLabs API for voice responses (Phase 2)

### Conversational Flow

**Onboarding Script (7 Questions):**

```
1. "Hi! I'm your Wellness OS coach. What's your name?"
   → Capture: display_name

2. "What brings you here today? What do you want to improve?"
   → Capture: primary_goal (sleep, energy, focus, recovery, weight_loss, muscle_gain)
   → AI parses intent: "I can't fall asleep" → goal = "sleep quality"

3. "Got it! How many hours are you sleeping on average?"
   → Capture: current_sleep_hours
   → Validation: If < 4 or > 12, prompt: "That seems unusual. Can you confirm?"

4. "What time do you usually go to bed and wake up?"
   → Capture: bedtime, wake_time
   → AI parses: "I go to bed around 11 and wake up at 7" → bedtime = 23:00, wake_time = 07:00

5. "Do you track your health with any wearables like Oura, Whoop, or Apple Watch?"
   → Capture: has_wearable, wearable_type
   → If yes → Trigger wearable connection flow

6. "Any injuries, medical conditions, or dietary restrictions I should know about?"
   → Capture: constraints (optional)
   → AI parses: "I have a bad knee" → constraints = ["knee_injury"]

7. "Last question: How many times a day would you like me to send you nudges? (1-3 recommended)"
   → Capture: nudge_frequency
```

**Whisper API Integration (Speech-to-Text):**

```typescript
import OpenAI from 'openai';
import FormData from 'form-data';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(audioBuffer: Buffer) {
  const formData = new FormData();
  formData.append('file', audioBuffer, { filename: 'audio.m4a' });
  formData.append('model', 'whisper-1');
  formData.append('language', 'en'); // Auto-detect if multilingual

  const response = await openai.audio.transcriptions.create({
    file: audioBuffer,
    model: 'whisper-1',
    response_format: 'json'
  });

  return response.text; // "I usually sleep around 6 hours"
}
```

**GPT-4o Conversational AI:**

```typescript
const ONBOARDING_SYSTEM_PROMPT = `
You are an onboarding coach for Wellness OS. Your role is to capture the user's baseline health metrics, goals, and constraints through a friendly conversation.

RULES:
1. Ask 1 question at a time (don't overwhelm)
2. Parse user's natural language responses into structured data
3. Be encouraging and non-judgmental
4. If user gives incomplete answer, politely ask for clarification
5. Total conversation should take <5 minutes

STRUCTURED DATA TO CAPTURE:
{
  "display_name": string,
  "primary_goal": "sleep" | "energy" | "focus" | "recovery" | "weight_loss" | "muscle_gain",
  "current_sleep_hours": number,
  "bedtime": "HH:MM" (24-hour format),
  "wake_time": "HH:MM",
  "has_wearable": boolean,
  "wearable_type": "oura" | "whoop" | "apple_health" | "google_fit" | null,
  "constraints": string[] (injuries, conditions, dietary restrictions),
  "nudge_frequency": number (1-3)
}
`;

async function processOnboardingMessage(userId, userMessage, conversationHistory) {
  const messages = [
    { role: 'system', content: ONBOARDING_SYSTEM_PROMPT },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    functions: [
      {
        name: 'update_user_profile',
        description: 'Update user profile with captured onboarding data',
        parameters: {
          type: 'object',
          properties: {
            display_name: { type: 'string' },
            primary_goal: { type: 'string', enum: ['sleep', 'energy', 'focus', 'recovery', 'weight_loss', 'muscle_gain'] },
            current_sleep_hours: { type: 'number', minimum: 0, maximum: 24 },
            bedtime: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
            wake_time: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
            has_wearable: { type: 'boolean' },
            wearable_type: { type: 'string', enum: ['oura', 'whoop', 'apple_health', 'google_fit', null] },
            constraints: { type: 'array', items: { type: 'string' } },
            nudge_frequency: { type: 'number', minimum: 1, maximum: 3 }
          }
        }
      }
    ]
  });

  const response = completion.choices[0].message;

  // If AI called update_user_profile function, save data
  if (response.function_call?.name === 'update_user_profile') {
    const data = JSON.parse(response.function_call.arguments);
    await updateUserProfile(userId, data);

    return {
      message: "Got it! I've saved your info. Let's get started!",
      onboarding_complete: true
    };
  }
  // Otherwise, continue conversation
  else {
    return {
      message: response.content,
      onboarding_complete: false
    };
  }
}
```

---

## Evidence UX System

### Overview

The Evidence UX system **builds user trust** by transparently presenting peer-reviewed research citations for every protocol. Design follows **progressive disclosure** principles:
1. **Tier 1 (Always Visible):** 2-bullet plain-English summary
2. **Tier 2 (One Tap):** Full DOI citation + "Tap to view full study"
3. **Tier 3 (Optional):** In-app reader or external browser to full paper

**Target Metrics:**
- ≥40% of users tap "View Research" at least once in first 30 days
- ≥60% of users report citations increase trust (NPS survey)

### Citation Card Design

**UI Component (React Native):**

```tsx
// CitationCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';

interface CitationCardProps {
  citation: {
    doi: string;
    title: string;
    authors: string[];
    journal: string;
    year: number;
    plain_english_summary: string[];
  };
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation }) => {
  const handleOpenDOI = () => {
    Linking.openURL(`https://doi.org/${citation.doi}`);
  };

  return (
    <View style={styles.card}>
      {/* Tier 1: Plain-English Summary (Always Visible) */}
      <View style={styles.summary}>
        <Text style={styles.summaryHeader}>Key Findings:</Text>
        {citation.plain_english_summary.map((bullet, index) => (
          <Text key={index} style={styles.bullet}>• {bullet}</Text>
        ))}
      </View>

      {/* Tier 2: Citation Details (Tap to Expand) */}
      <TouchableOpacity onPress={handleOpenDOI} style={styles.citationButton}>
        <Text style={styles.citationText}>
          {citation.authors[0]} et al. ({citation.year}). {citation.journal}.
        </Text>
        <Text style={styles.doiLink}>View Full Study →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8
  },
  summary: {
    marginBottom: 12
  },
  summaryHeader: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
    color: '#333'
  },
  bullet: {
    fontSize: 13,
    lineHeight: 20,
    color: '#555',
    marginBottom: 4
  },
  citationButton: {
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    paddingTop: 12
  },
  citationText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  doiLink: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500'
  }
};
```

### Citation Data Model

**PostgreSQL Schema (Supabase):**

```sql
CREATE TABLE citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doi TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  authors TEXT[], -- Array of author names
  journal TEXT NOT NULL,
  publication_year INT NOT NULL,
  pubmed_id TEXT, -- Optional
  url TEXT NOT NULL, -- Full DOI URL
  plain_english_summary TEXT[], -- 2-bullet array
  key_findings TEXT[], -- Detailed findings
  added_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed_date DATE,
  review_status TEXT DEFAULT 'current', -- 'current', 'outdated', 'retracted'
  retraction_status TEXT DEFAULT 'not_retracted',
  last_retraction_check_date DATE
);

-- Link protocols to citations (many-to-many)
CREATE TABLE protocol_citations (
  protocol_id TEXT NOT NULL REFERENCES protocols(id),
  citation_id UUID NOT NULL REFERENCES citations(id),
  PRIMARY KEY (protocol_id, citation_id)
);
```

**Example Citation Record:**

```json
{
  "doi": "10.1016/j.smrv.2016.10.001",
  "title": "Why We Sleep: The New Science of Sleep and Dreams",
  "authors": ["Walker, Matthew P."],
  "journal": "Sleep Medicine Reviews",
  "publication_year": 2017,
  "pubmed_id": "27742078",
  "url": "https://doi.org/10.1016/j.smrv.2016.10.001",
  "plain_english_summary": [
    "Getting 7-9 hours of sleep per night improves memory consolidation and cognitive performance.",
    "Sleep deprivation (<6 hours) increases risk of metabolic disease, immune dysfunction, and mood disorders."
  ],
  "key_findings": [
    "REM sleep critical for emotional regulation",
    "Deep sleep (N3) critical for memory consolidation",
    "Circadian rhythm disruption (e.g., shift work) increases disease risk"
  ],
  "review_status": "current",
  "retraction_status": "not_retracted"
}
```

---

## Continuous Learning Engine

### Overview

The Continuous Learning Engine **refines AI Coach recommendations** based on user feedback signals:
1. **Explicit Feedback:** "Helpful" / "Not Helpful" buttons on every nudge
2. **Implicit Feedback:** User opened nudge? Completed protocol? Dismissed?
3. **Outcome Data:** Did adherence improve after nudge? Did HRV improve after recovery protocol?

**Learning Loop:**

```
1. Generate nudge (Adaptive Coach)
2. Deliver nudge (Notification System)
3. Capture user action (opened, dismissed, completed, marked helpful/not helpful)
4. Store feedback in AI Audit Log (PostgreSQL)
5. Weekly batch job: Analyze feedback patterns
6. Update nudge model weights (e.g., reduce frequency of "not helpful" nudge types)
7. Retrain GPT-4o fine-tuned model (optional, Phase 2)
```

### Feedback Capture

**UI Component (Nudge Card with Feedback Buttons):**

```tsx
// NudgeCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface NudgeCardProps {
  nudge: {
    id: string;
    protocol_id: string;
    nudge_text: string;
    reasoning: string;
    evidence_citation: string;
  };
  onFeedback: (nudgeId: string, feedback: 'helpful' | 'not_helpful') => void;
}

export const NudgeCard: React.FC<NudgeCardProps> = ({ nudge, onFeedback }) => {
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const handleFeedback = (feedback: 'helpful' | 'not_helpful') => {
    setFeedbackGiven(true);
    onFeedback(nudge.id, feedback);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.nudgeText}>{nudge.nudge_text}</Text>

      <TouchableOpacity onPress={() => showReasoning(nudge.reasoning)}>
        <Text style={styles.whyLink}>Why this recommendation? →</Text>
      </TouchableOpacity>

      {!feedbackGiven && (
        <View style={styles.feedbackButtons}>
          <TouchableOpacity
            onPress={() => handleFeedback('helpful')}
            style={styles.helpfulButton}
          >
            <Text>👍 Helpful</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleFeedback('not_helpful')}
            style={styles.notHelpfulButton}
          >
            <Text>👎 Not Helpful</Text>
          </TouchableOpacity>
        </View>
      )}

      {feedbackGiven && (
        <Text style={styles.thankYou}>Thanks for your feedback!</Text>
      )}
    </View>
  );
};
```

**Feedback Logging (API):**

```typescript
// POST /api/ai-coach/nudges/:id/feedback
app.post('/api/ai-coach/nudges/:id/feedback', authenticate, async (req, res) => {
  const { id } = req.params;
  const { feedback } = req.body; // 'helpful' | 'not_helpful'

  // Update AI Audit Log
  await supabase
    .from('ai_audit_log')
    .update({
      user_action: feedback === 'helpful' ? 'marked_helpful' : 'marked_not_helpful',
      user_action_timestamp: new Date()
    })
    .eq('id', id);

  // Emit event for analytics
  await emitEvent({
    event_type: EventType.NUDGE_FEEDBACK_RECEIVED,
    user_id: req.userId,
    metadata: {
      nudge_id: id,
      feedback
    }
  });

  res.json({ success: true });
});
```

### Learning Algorithm (Batch Job)

**Weekly Feedback Analysis:**

```typescript
// Cloud Function: Runs every Sunday at midnight
export const analyzeNudgeFeedback = functions.pubsub
  .schedule('0 0 * * 0') // Cron: Every Sunday 00:00
  .onRun(async (context) => {
    // Fetch all nudges from last 7 days
    const { data: nudges } = await supabase
      .from('ai_audit_log')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 7 * 86400000))
      .not('user_action', 'is', null);

    // Group by protocol_id
    const feedbackByProtocol = groupBy(nudges, 'protocol_id');

    for (const [protocolId, nudgeList] of Object.entries(feedbackByProtocol)) {
      const helpful = nudgeList.filter(n => n.user_action === 'marked_helpful').length;
      const notHelpful = nudgeList.filter(n => n.user_action === 'marked_not_helpful').length;
      const total = nudgeList.length;

      const helpfulRate = helpful / total;

      // Learning Rule 1: If helpfulRate < 30% → reduce frequency of this protocol
      if (helpfulRate < 0.30) {
        logger.warn(`Protocol ${protocolId} has low helpful rate (${helpfulRate}). Reducing frequency.`);

        // Update protocol recommendation weight (stored in Redis or PostgreSQL)
        await updateProtocolWeight(protocolId, -0.2); // Reduce weight by 20%
      }

      // Learning Rule 2: If helpfulRate > 70% → increase frequency
      if (helpfulRate > 0.70) {
        logger.info(`Protocol ${protocolId} has high helpful rate (${helpfulRate}). Increasing frequency.`);
        await updateProtocolWeight(protocolId, +0.2);
      }

      // Store insights for product team
      await storeInsight({
        protocol_id: protocolId,
        week: formatDate(new Date()),
        helpful_rate: helpfulRate,
        total_nudges: total,
        recommendation: helpfulRate < 0.30 ? 'reduce_frequency' : helpfulRate > 0.70 ? 'increase_frequency' : 'maintain'
      });
    }
  });
```

---

## Custom Protocol Builder

### Overview

The Custom Protocol Builder enables **Pro tier users** to create personalized protocols validated against the evidence database. Features:
- **Template Library:** Start from pre-built templates (Morning Routine, Evening Wind-Down, Recovery Day)
- **Guided Builder:** Step-by-step wizard capturing protocol name, duration, frequency, timing, instructions
- **Evidence Validation:** AI checks if protocol aligns with research (e.g., "2-hour cold plunge" flagged as unsafe)
- **Sharing:** Users can share custom protocols with friends or publish to community library (Phase 2)

**Target Metrics:**
- ≥15% of Pro users create ≥1 custom protocol in first 30 days
- ≥60% of custom protocols validated as evidence-aligned

### Builder Workflow

**Step 1: Choose Template or Start from Scratch**

```tsx
// CustomProtocolBuilder.tsx (Step 1)
export const Step1_ChooseTemplate = () => {
  const templates = [
    { id: 'morning_routine', name: 'Morning Routine', description: 'Light, hydration, movement' },
    { id: 'evening_wind_down', name: 'Evening Wind-Down', description: 'Dim lights, no screens, gratitude' },
    { id: 'recovery_day', name: 'Recovery Day', description: 'NSDR, low-intensity movement, sleep focus' },
    { id: 'custom', name: 'Start from Scratch', description: 'Build your own protocol' }
  ];

  return (
    <View>
      <Text>Choose a template to get started:</Text>
      {templates.map(template => (
        <TouchableOpacity key={template.id} onPress={() => selectTemplate(template.id)}>
          <Text>{template.name}</Text>
          <Text>{template.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
```

**Step 2: Define Protocol Details**

```tsx
// Step 2: Capture protocol metadata
export const Step2_DefineProtocol = ({ initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || 'custom');
  const [duration, setDuration] = useState({ min: 10, max: 30 });
  const [frequency, setFrequency] = useState('5-7 days per week');
  const [timing, setTiming] = useState('morning');

  return (
    <ScrollView>
      <TextInput
        placeholder="Protocol Name (e.g., My Morning Routine)"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Description (what does this protocol achieve?)"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Picker selectedValue={category} onValueChange={setCategory}>
        <Picker.Item label="Sleep" value="sleep" />
        <Picker.Item label="Movement" value="movement" />
        <Picker.Item label="Recovery" value="recovery" />
        <Picker.Item label="Custom" value="custom" />
      </Picker>

      <Text>Duration (minutes):</Text>
      <Slider
        minimumValue={5}
        maximumValue={120}
        value={duration.min}
        onValueChange={(val) => setDuration({ ...duration, min: val })}
      />
      <Text>{duration.min} - {duration.max} minutes</Text>

      <Text>Frequency:</Text>
      <Picker selectedValue={frequency} onValueChange={setFrequency}>
        <Picker.Item label="1-2 days per week" value="1-2 days per week" />
        <Picker.Item label="3-4 days per week" value="3-4 days per week" />
        <Picker.Item label="5-7 days per week" value="5-7 days per week" />
        <Picker.Item label="Daily" value="daily" />
      </Picker>

      <Text>Optimal Timing:</Text>
      <Picker selectedValue={timing} onValueChange={setTiming}>
        <Picker.Item label="Morning" value="morning" />
        <Picker.Item label="Afternoon" value="afternoon" />
        <Picker.Item label="Evening" value="evening" />
        <Picker.Item label="Anytime" value="anytime" />
      </Picker>

      <Button title="Next Step" onPress={() => submitStep2({ name, description, category, duration, frequency, timing })} />
    </ScrollView>
  );
};
```

**Step 3: Add Instructions (Step-by-Step)**

```tsx
// Step 3: Add protocol instructions
export const Step3_AddInstructions = () => {
  const [steps, setSteps] = useState([
    { order: 1, instruction: '' },
  ]);

  const addStep = () => {
    setSteps([...steps, { order: steps.length + 1, instruction: '' }]);
  };

  const updateStep = (index, instruction) => {
    const updated = [...steps];
    updated[index].instruction = instruction;
    setSteps(updated);
  };

  return (
    <ScrollView>
      <Text>Add step-by-step instructions:</Text>

      {steps.map((step, index) => (
        <View key={index}>
          <Text>Step {step.order}:</Text>
          <TextInput
            placeholder="Enter instruction (e.g., 'Drink 16 oz water')"
            value={step.instruction}
            onChangeText={(text) => updateStep(index, text)}
            multiline
          />
        </View>
      ))}

      <Button title="+ Add Another Step" onPress={addStep} />
      <Button title="Next: Validate" onPress={() => submitStep3(steps)} />
    </ScrollView>
  );
};
```

**Step 4: Evidence Validation (AI Check)**

```typescript
// Backend: Validate custom protocol against evidence database
async function validateCustomProtocol(protocol) {
  const prompt = `
    User created a custom wellness protocol. Validate if it aligns with evidence-based research.

    Protocol:
    - Name: ${protocol.name}
    - Description: ${protocol.description}
    - Category: ${protocol.category}
    - Duration: ${protocol.duration.min}-${protocol.duration.max} minutes
    - Frequency: ${protocol.frequency}
    - Instructions: ${protocol.steps.map(s => s.instruction).join('; ')}

    TASK:
    1. Check for safety concerns (e.g., extreme duration, unsafe practices)
    2. Check for alignment with evidence (does this match research-backed protocols?)
    3. Provide feedback

    OUTPUT:
    {
      "is_safe": boolean,
      "is_evidence_aligned": boolean,
      "safety_concerns": string[] (if any),
      "evidence_alignment_score": number (0-1),
      "recommendations": string[] (suggestions to improve alignment)
    }
  `;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a wellness protocol validator. Check user-created protocols for safety and evidence alignment.' },
      { role: 'user', content: prompt }
    ],
    functions: [
      {
        name: 'validate_protocol',
        description: 'Validate protocol for safety and evidence alignment',
        parameters: {
          type: 'object',
          properties: {
            is_safe: { type: 'boolean' },
            is_evidence_aligned: { type: 'boolean' },
            safety_concerns: { type: 'array', items: { type: 'string' } },
            evidence_alignment_score: { type: 'number', minimum: 0, maximum: 1 },
            recommendations: { type: 'array', items: { type: 'string' } }
          },
          required: ['is_safe', 'is_evidence_aligned', 'evidence_alignment_score']
        }
      }
    ],
    function_call: { name: 'validate_protocol' }
  });

  const validation = JSON.parse(completion.choices[0].message.function_call.arguments);
  return validation;
}
```

---

## AI System Integration

### End-to-End User Journey

**Day 1 (Onboarding):**
1. User downloads app → Voice onboarding (5 min) → Baseline captured
2. User connects Apple Health → Wearable data synced
3. AI Coach generates first nudge batch (2 nudges scheduled for Day 2)
4. Protocol Engine auto-populates daily schedule

**Day 2 (First Nudge Delivery):**
1. 7:30 AM: Push notification "Good morning! Get 10 min sunlight within 1 hour to improve sleep."
2. User opens app → Nudge card displayed with Evidence UX citation
3. User taps "Why this?" → Reasoning modal shown: "Your sleep was 6.2 hrs (below optimal 7-9)"
4. User completes protocol → Logs in app
5. Event emitted → Streak counter increments (Day 2 streak)

**Day 7 (First Milestone):**
1. User achieves 7-day streak → Celebration animation (confetti)
2. Push notification: "7-day streak! You're building a habit 🔥"
3. App prompts: "How helpful have these nudges been?" → User marks "Helpful"
4. Feedback logged → Continuous Learning Engine adjusts future nudges

**Day 30 (North Star Achievement):**
1. User achieves ≥6 days/week adherence → NPS survey triggered
2. "How likely are you to recommend Wellness OS? (0-10)"
3. User scores 9 → Promoter (NPS = 80)
4. Follow-up: "What's your favorite aspect?" → "The citations build trust"
5. Insight stored for roadmap prioritization

---

**Document Version:** 1.0
**Last Updated:** October 23, 2025
**Maintained By:** Product & Engineering Teams
**Review Cadence:** Monthly (after each major release)
