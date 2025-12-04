# APEX OS: Master Product Requirements Document v7.0

> **"Evidence Made Effortless"**

**Version:** 7.0
**Date:** December 3, 2025
**Status:** Canonical
**Author:** Human-AI Collaboration (Claude Opus 4.5)
**Phase Status:** Phase 1 ✅ | Phase 2 ✅ | Phase 3 🔄 IN PROGRESS

---

# PART 0: Document Metadata & Agent Instructions

## 0.1 Document Purpose

This is the **single source of truth** for Apex OS product requirements. This document is:
- **Standalone** — No external document references required
- **AI-Optimized** — Structured for Claude Opus 4.5 autonomous implementation
- **Comprehensive** — All requirements, constraints, and acceptance criteria included

**v7 Update:** Incorporates Phase III specifications (Wearable Sync, Recovery Engine, Calendar Integration, Reasoning UX).

## 0.2 Target Implementation Agent

**Model:** Claude Opus 4.5 (claude-opus-4-5-20251101)
**Operating Mode:** Autonomous coding with human checkpoint approval
**Session Length:** 20-30 minute focused implementation blocks

## 0.3 How to Use This Document

| Section | Purpose | When to Reference |
|---------|---------|-------------------|
| Part 0 | Agent instructions | Every session start |
| Part 1 | Strategic context | Understanding "why" |
| Part 2 | Product definition | User-facing decisions |
| Part 3 | Core Experiences | Feature implementation |
| Part 4 | Technical specs | Architecture decisions |
| Part 5 | Phase 3: Nervous System | Real data integration |
| Part 6 | Implementation roadmap | Sprint planning |
| Part 7 | Success metrics | Verification |
| Appendices | Reference data | As needed |

## 0.4 Critical Project Files

```
/home/ferdi/projects/WellnessApp/
├── CLAUDE.md                    # Agent operating instructions
├── STATUS.md                    # Session state (update after each session)
├── Master_Protocol_Library.md   # Evidence source (18 protocols)
├── PRD Documents/
│   ├── APEX_OS_PRD_v7.md        # THIS FILE (source of truth)
│   ├── PHASE_III_IMPLEMENTATION_PLAN.md  # Detailed implementation guide
│   └── Phase_II_III_Research_Files/      # Research synthesis
├── client/                      # React Native (Expo 54) frontend
│   └── src/
│       ├── screens/            # UI screens
│       ├── hooks/              # Data fetching hooks
│       └── services/           # Firebase, analytics, etc.
├── functions/                   # Cloud Functions Gen 2
│   └── src/
│       ├── nudgeEngine.ts      # Core nudge generation
│       ├── vertexAI.ts         # Gemini integration
│       ├── protocolSearch.ts   # RAG pipeline
│       ├── services/wearable/  # NEW: Wearable sync
│       └── services/recovery/  # NEW: Recovery engine
└── supabase/migrations/         # Database schema
```

## 0.5 Session Protocol

**On Session Start:**
1. Read STATUS.md for current project state
2. Announce: "Resuming session. Last work: [X]. Next priority: [Y]."
3. Confirm priority before starting

**On Session End:**
1. Update STATUS.md with accomplishments
2. Commit all changes with descriptive message
3. Announce: "Session complete. Next focus: [priority]."

## 0.6 Critical Rules (DO NOT VIOLATE)

| Rule | Why It Matters |
|------|----------------|
| NO placeholder comments (`// TODO`, `// implementation here`) | Breaks production builds, creates tech debt |
| NO polling APIs | Battery drain, unnecessary costs; use real-time listeners |
| NO deprecated packages | Security vulnerabilities, maintenance burden |
| NO Google Fit | Deprecated June 2025; use Health Connect for Android |
| ALWAYS cite evidence | Core differentiator; users trust evidence-backed recommendations |
| ALWAYS update STATUS.md | Continuity between sessions |
| ALWAYS commit after completing tasks | Prevent lost work, enable rollback |

## 0.7 Quality Gates

Before marking any task complete, verify:
- [ ] TypeScript compiles with no errors (`npx tsc --noEmit`)
- [ ] Feature works as specified in this PRD
- [ ] Error handling implemented (fail-safe patterns)
- [ ] No console errors or warnings
- [ ] STATUS.md updated

---

# PART 1: Strategic Context

## 1.1 The Vision

### One-Liner
**"The Bloomberg Terminal for the Body"** — An AI-native wellness operating system that transforms peer-reviewed protocols into personalized daily actions.

### Elevator Pitch
> "You've consumed 100+ hours of Huberman. You know the science. Apex OS is the execution layer—it takes peer-reviewed protocols and implements them into your day, personalized to your biology, delivered at the right moment. Without adding cognitive load to your already-full life."

### What Apex OS IS

- **Ambient Intelligence:** Observes, reasons, guides—proactively, not reactively
- **Execution Layer:** Bridges the gap between knowing and doing
- **Evidence Engine:** Every recommendation traces to peer-reviewed research
- **Operating System:** Foundational infrastructure, not just another app

### What Apex OS is NOT

| NOT This | Why Not |
|----------|---------|
| Gamified habit tracker | Progress Infrastructure replaces extrinsic manipulation (see 2.5) |
| Meditation app | NSDR is one protocol of 18, not the product |
| Health chatbot | Proactively guides; doesn't wait to be asked |
| Social platform | No leaderboards, no sharing—this is personal |
| Generic wellness | Everything is specific, timed, dosed, cited |

## 1.2 Market Opportunity

### December 2025 Competitive Landscape

| Competitor | Launch | Model | Strengths | Weaknesses |
|------------|--------|-------|-----------|------------|
| **Oura Advisor** | Mar 2025 | LLM + Memory | 60% weekly engagement, customizable tone | Hardware-locked ($299-549), no evidence citations |
| **WHOOP Coach** | 2023 | GPT-4 | 50+ languages, "search engine for body" | Hardware-locked ($399+$239/yr), notification spam (8-12/day) |
| **Apple Health+** | ~2026 | Clinical AI | Apple ecosystem, physician training | Not launched, Apple-locked, unknown pricing |

### Market Size

| Metric | Value | Source |
|--------|-------|--------|
| **Wellness Apps TAM (2024)** | $11.27B | Grand View Research |
| **Wellness Apps TAM (2032)** | $33.78B | Coherent Market Insights |
| **CAGR** | 14.9% | Industry average |
| **AI Coaching Segment** | $20.07B (2025) | Statista |
| **North America Share** | 39.8% | Market leaders |

### The 12-18 Month Window

**Why Now:**
1. **AI Maturity:** Gemini 2.5 Flash + Claude Opus 4.5 can chain complex wellness reasoning
2. **Wearable Ubiquity:** 35%+ of target demographic owns Oura/WHOOP/Apple Watch
3. **The Huberman Effect:** 5.8M+ educated users actively seeking implementation tools

**Risk:** Apple Health+ launching ~2026 with massive distribution. We must establish brand, data moat, and loyal user base before then.

## 1.3 Differentiation Framework

### The Five Moats

| # | Differentiator | Competitors | Apex OS |
|---|----------------|-------------|---------|
| 1 | **Ecosystem-Agnostic** | Oura = Oura only, WHOOP = WHOOP only | Works with ALL wearables (Oura, WHOOP, Apple Watch, Garmin, Fitbit) |
| 2 | **Evidence Citations** | No competitor shows DOI references | Every protocol includes peer-reviewed citation on demand |
| 3 | **Intelligent Suppression** | WHOOP sends 8-12 notifications/day | 9-rule engine limits to 3-5 nudges/day max |
| 4 | **Minimum Viable Day** | No competitor adapts when user struggles | Automatic protocol reduction when recovery low or calendar full |
| 5 | **Reasoning Transparency** | "Black box" AI recommendations | "Why?" layer shows exactly how AI reached this conclusion |

### Total Cost Comparison (Year 1)

| Product | Hardware | Subscription | Total |
|---------|----------|--------------|-------|
| **Oura + Advisor** | $299-549 | $72 | $371-621 |
| **WHOOP + Coach** | $399 | $239 | $638 |
| **Apex OS** | $0 (BYOD) | $348 ($29/mo) | **$348** |

**Apex OS is 45-83% cheaper** while delivering differentiated value.

## 1.4 Core Philosophy

### The Five Principles

| Principle | Meaning | Manifestation |
|-----------|---------|---------------|
| **Evidence Made Effortless** | Every recommendation traces to peer-reviewed research | DOI citations available on tap; no "trust me bro" |
| **Respect Intelligence** | Users are high-performers, not wellness beginners | Direct data-driven communication; no cheerleader tone |
| **Ambient, Not Annoying** | Max 3-5 nudges/day; intelligent suppression | 9-rule suppression engine prevents notification fatigue |
| **Closed-Loop Coaching** | Data → Insight → Action → Outcome → Better Data | System learns what works for THIS specific user |
| **Operating System, Not App** | Foundational infrastructure | Integrates wearables + calendar + location + protocols |

### Voice Attributes

| Do This | Not This |
|---------|----------|
| "Recovery: 34%. Consider delaying workout." | "Great job checking in! You've got this!" |
| "HRV down 15%. NSDR may help restore baseline." | "Feeling stressed? Try to relax!" |
| "Morning light: 6/7 days. Sleep onset improved 14 min." | "Amazing streak! Keep crushing it!" |
| "Protocol conflict: Cold within 4h of lifting reduces adaptation 10-20%." | "Maybe wait a bit before your cold plunge?" |

---

# PART 2: Product Definition

## 2.1 Primary Persona: "The Optimized Professional"

### Demographics

| Attribute | Value |
|-----------|-------|
| **Age** | 28-45 |
| **Role** | Founder, executive, senior IC, high-performer |
| **Income** | $100K+ household |
| **Location** | Urban/suburban (US, UK, Canada, Australia) |
| **Education** | Bachelor's degree or higher |

### Psychographics

| Attribute | Details |
|-----------|---------|
| **Listens to** | Huberman Lab, Peter Attia, Tim Ferriss, Lex Fridman |
| **Already uses** | Oura Ring, WHOOP, Apple Watch, Eight Sleep |
| **Tried & discarded** | Multiple wellness apps (too generic, too gamified, notification spam) |
| **Values** | Efficiency, specificity, measurable outcomes, scientific credibility |
| **Frustrated by** | Information overload, conflicting advice, apps that track but don't guide |

### The Inner Monologue

> "I've listened to 200+ hours of health podcasts. I know the science. I need something that bridges knowing and doing—reads my biology, understands my context, delivers interventions at the right time, and shows me if it's working. Without adding cognitive load to my already-full life."

### Anti-Personas (Who We Are NOT Building For)

| Anti-Persona | Why Not |
|--------------|---------|
| **Wellness Beginner** | Needs hand-holding we won't provide; better served by Noom/MyFitnessPal |
| **Gamification Seeker** | Wants badges, streaks, leaderboards; Duolingo for Health isn't us |
| **Cheap/Free User** | Won't pay $29/mo; will churn immediately; costs more than revenue |
| **Medical Patient** | Needs clinical oversight; we're wellness, not medicine |

## 2.2 Jobs To Be Done

| Job | Current Solution | Why It Fails | Apex OS Solution |
|-----|------------------|--------------|------------------|
| **Wake with clarity about the day** | Check Oura app, then calendar, then weather | Fragmented; requires cognitive assembly | Morning Anchor: single view of recovery + plan + weather in 30 seconds |
| **Get prescriptive guidance, not just data** | Read HRV number, guess what to do | "HRV 45" means nothing actionable | "Recovery 34%. Foundation protocols only. Delay workout to tomorrow." |
| **Avoid overwhelm when struggling** | Push through or abandon entirely | All-or-nothing leads to burnout or quitting | MVD: Automatic reduction to 3 essential protocols on tough days |
| **See proof it's working** | Manual correlation in spreadsheet | Too much effort; abandoned after 2 weeks | Closed Loop: "Since starting delayed caffeine, sleep onset 14 min faster" |
| **Be respected as intelligent adult** | Most apps treat me like a child | Patronizing tone, generic advice | Direct evidence-based communication, specific to MY data |

## 2.3 User Journey States

### State 1: New User (Day 0-7)

**Goal:** Establish trust, create first "magic moment"

| Day | Experience | Success Indicator |
|-----|------------|-------------------|
| 0 | Onboarding: Connect wearable, select primary goal, set notification preferences | Completes onboarding in <3 min |
| 1 | Morning Anchor: First recovery-based recommendation | Opens app within 30 min of wake |
| 3 | First insight: "Based on 3 days, your optimal caffeine cutoff is X" | Engages with insight (tap to expand) |
| 7 | Weekly Synthesis: First Win/Watch/Experiment narrative | Reads full synthesis, tries experiment |

### State 2: Active User (Day 8-30)

**Goal:** Build habits, demonstrate value through correlations

| Milestone | Experience | Success Indicator |
|-----------|------------|-------------------|
| Day 14 | Correlation: "Morning light → 14 min faster sleep onset" | Protocol adherence >50% |
| Day 21 | Pattern: "Best focus days follow morning movement" | Opens app daily |
| Day 30 | Trajectory: "HRV trending up 8% over 30 days" | Converts to paid subscription |

### State 3: Power User (Day 30+)

**Goal:** Expansion, personalization, advocacy

| Behavior | Experience | Success Indicator |
|----------|------------|-------------------|
| Expands protocols | Unlocks Performance tier (from Foundation) | Pays for Pro subscription |
| Customizes | Adjusts notification timing, tone preferences | Retention >90% at Day 60 |
| Advocates | Shares Weekly Synthesis with friend | Organic referral |

### State 4: Struggling User

**Goal:** Retain through adaptation, not abandonment

| Signal | Response | Success Indicator |
|--------|----------|-------------------|
| 3+ dismissals in one day | Pause nudges until tomorrow | Doesn't uninstall |
| <30% protocol completion (Week 3) | Activate MVD, reduce to 3 protocols | Completes at least 1 protocol |
| Recovery <35% | Consolidate to morning-only message | Engages with MVD card |
| 7+ days inactive | Re-engagement: "Ready when you are. Here's what we've learned about you." | Returns within 14 days |

## 2.4 Protocol System Overview

### 18 Core Protocols Across 5 Categories

| Category | Protocols | When Unlocked |
|----------|-----------|---------------|
| **Foundation** (5) | Morning Light, Evening Light, Sleep Optimization, Hydration, Caffeine Timing | Free tier (all users) |
| **Performance** (4) | Morning Movement, Walking Breaks, Nutrition Timing, Fitness for Focus | Pro tier ($29/mo) |
| **Recovery** (3) | NSDR, Breathwork, Cold Exposure | Pro tier |
| **Optimization** (3) | Alcohol Management, Dopamine Management, Supplements | Elite tier ($49/mo) |
| **Meta** (3) | HRV Management, Weekly Reflection, Social Accountability | Elite tier |

### Protocol Selection Logic

1. **Primary Goal Alignment:** User selects goal (Better Sleep, More Energy, Sharper Focus, Faster Recovery)
2. **Foundation First:** Always start with Foundation protocols before Performance
3. **Recovery Gating:** Must have 50%+ Foundation adherence before unlocking Recovery
4. **Adaptive Progression:** System suggests next protocol based on correlation data

### Evidence Standard

Every protocol includes:
- **Mechanism:** 1-2 sentence physiological explanation
- **Evidence:** Peer-reviewed citation with DOI
- **Dosing:** Specific parameters (duration, timing, intensity)
- **Contraindications:** Safety warnings and exclusions

## 2.5 Progress Infrastructure

### Philosophy: Intrinsic Motivation Enhancement

Apex OS uses **Progress Infrastructure**—subtle retention mechanics that enhance intrinsic motivation without extrinsic manipulation. This replaces simplistic "no gamification" with a nuanced approach.

**Core Principle:** The Optimized Professional doesn't need badges to feel accomplished. They need visibility into their own progress and evidence that their effort produces outcomes.

### What We EMBRACE (Intrinsic)

| Mechanic | Implementation | Example |
|----------|----------------|---------|
| **Consistency Indicators** | Factual counts, not pressure | "Morning Light: 5 of 7 mornings this week" |
| **Personal Progress Markers** | HRV/sleep trends over time | "Your HRV baseline has improved 8% since starting" |
| **Protocol Unlocking** | Earn access through consistency | "Complete Foundation 14 days → unlock Performance tier" |
| **Subtle Milestones** | Acknowledged in profile, not pop-ups | "Day 30" badge visible in user profile |
| **Trend Summaries** | Week/month progress narratives | Weekly Synthesis with specific data |

### What We AVOID (Extrinsic)

| Mechanic | Why It's Wrong for Apex | Alternative |
|----------|-------------------------|-------------|
| **Loss Aversion** ("Don't break your streak!") | Creates anxiety, not wellness | "Day 12 of Morning Light" (factual) |
| **Points/XP Systems** | Trivializes evidence-based protocols | Progress = outcome improvement, not points |
| **Leaderboards** | Comparison breaks "your journey" philosophy | Personal bests only |
| **Pop-up Celebrations** | Patronizing to high-performers | Subtle acknowledgment in profile |
| **Daily Rewards/Gifts** | Extrinsic manipulation | Value = protocol outcomes, not gifts |

### Implementation Guidelines

1. **Factual, not emotional:** "Day 12" not "Amazing streak!"
2. **Outcome-focused:** "Sleep onset improved 14 min" matters more than "12-day streak"
3. **No loss framing:** Never warn about "breaking" or "losing" progress
4. **Subtle visibility:** Milestones visible on tap, not pushed
5. **Evidence-linked:** Connect consistency to measured outcomes

### Progress Unlock System

| Tier | Unlock Criteria | Rationale |
|------|-----------------|-----------|
| **Foundation** | Immediately available | Core protocols for all users |
| **Performance** | 14+ days with 70%+ Foundation adherence | Proves baseline habits established |
| **Elite** | 30+ days with 60%+ Performance adherence | Demonstrates sustained commitment |

## 2.6 Onboarding Experience

### Flow Overview

A 3-screen conversational flow that feels like meeting a coach, not configuring an app.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  AI Coach   │ ─► │    Goal     │ ─► │  Wearable   │ ─► │    Your     │
│   Intro     │    │  Selection  │    │ Connection  │    │  Schedule   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
   Typographic        4 goal            5 devices        Wake time +
   reveal + glow      cards             + "Skip"         Notification
                                                         style
```

### Screen 1: AI Coach Intro

**Purpose:** Establish premium aesthetic and product identity.

| Element | Specification |
|---------|---------------|
| **Headline** | "Apex OS" (48pt, staggered reveal) |
| **Subheadline** | "Your AI wellness operating system." |
| **Tagline** | "Evidence-based. Personalized. Ambient." |
| **Animation** | 800ms easing.out(cubic) per line, 1200ms stagger |
| **Background** | Ambient teal glow at 0.05 opacity |

### Screen 2: Goal Selection

**Purpose:** Personalize the protocol journey.

| Element | Specification |
|---------|---------------|
| **Header** | "What matters most right now?" |
| **Options** | 4 animated goal cards |
| **Animation** | Spring animation on press (scale 0.97), staggered FadeInDown |
| **Auto-advance** | 600ms after selection |

**Goal → Module Mapping:**

| Goal | Primary Module | Icon |
|------|----------------|------|
| Better Sleep | `sleep_foundations` | Moon |
| More Energy | `metabolic_reset` | Lightning |
| Sharper Focus | `metabolic_reset` | Target |
| Faster Recovery | `stress_resilience` | Flex |

### Screen 3: Wearable Connection

**Purpose:** Enable recovery scoring (optional).

| Element | Specification |
|---------|---------------|
| **Header** | "Do you track with a wearable?" |
| **Options** | 5 device cards in 2-column grid |
| **Skip Button** | Prominent, dashed border: "Skip for now" |
| **Subtext** | "You can add this later in Settings" |

**Supported Wearables (v7 Update):**

| Device | Identifier | Status | Integration |
|--------|------------|--------|-------------|
| Oura Ring | `oura` | Supported | Cloud API + Webhooks |
| Apple Watch | `apple_health` | Supported | HealthKit (on-device) |
| Google Fit | `google_fit` | **DEPRECATED** | Use Health Connect |
| Health Connect | `health_connect` | Supported | Android (on-device) |
| Garmin | `garmin` | Planned | Commercial license req. |
| WHOOP | `whoop` | Planned | Enterprise partnership req. |
| Fitbit | `fitbit` | Supported | Cloud API |

### Screen 4: Your Schedule

**Purpose:** Enable personalized nudge timing from Day 1.

| Element | Specification |
|---------|---------------|
| **Wake Time Picker** | Default 6:30 AM, scrollable picker |
| **Notification Style** | "Direct" vs "Supportive" toggle |
| **Direct Description** | "Do this now" |
| **Supportive Description** | "Consider trying" |

**Database Fields:**

```typescript
{
  primary_goal: 'better_sleep' | 'more_energy' | 'sharper_focus' | 'faster_recovery';
  wearable_source: WearableSource | null;
  typical_wake_time: string;    // "06:30"
  notification_style: 'direct' | 'supportive';
}
```

### Design Principles

1. **No trial language during onboarding** — Trial banner appears post-onboarding only
2. **No model selection** — Users don't need to choose AI models
3. **Optional wearables** — Works without wearable (Lite Mode, uses phone unlock + manual input)
4. **Premium animations** — Spring animations (damping: 15, stiffness: 300)
5. **Complete in <3 minutes** — Respect user's time

---

# PART 3: The Five Core Experiences

## 3.1 Morning Anchor

### The Moment

User wakes up. Within 30 seconds of first phone interaction, they see their day—not raw data, but a plan.

### The Journey (v7 Update: Real Data Flow)

```
[Wake Detection] ────► [Recovery Calculation] ────► [Protocol Selection] ────► [Surface]
     │                        │                           │                      │
  Wearable               Phase 3                    AI Reasoning           Lock Screen
  sleep_end            Recovery Engine              (context-aware)         Widget/Push
  OR phone unlock      (see Part 5.2)
```

### Scenarios

**Scenario A: High Recovery (75%+)**

| Element | Content |
|---------|---------|
| **Headline** | "Recovery: 78% | Full Protocol Day" |
| **Subhead** | "HRV +12% vs. baseline. Green light for intensity." |
| **Protocols** | Morning Light (10 min) • Morning Movement (Zone 2, 20 min) • Caffeine OK after 8am |
| **Action** | [Start Morning Light] button |

**Scenario B: Low Recovery (<40%)**

| Element | Content |
|---------|---------|
| **Headline** | "Recovery: 34% | MVD Active" |
| **Subhead** | "HRV down 18%. Foundation only today." |
| **Protocols** | Morning Light (10 min) • Hydration (32 oz) • Sleep cutoff 9pm |
| **Action** | [Start MVD] button |

**Scenario C: Travel Detected**

| Element | Content |
|---------|---------|
| **Headline** | "Travel Mode: Circadian Alignment" |
| **Subhead** | "New timezone detected. Adjusting protocols for +3h shift." |
| **Protocols** | Morning Light (extended, 30 min) • Caffeine delayed • Evening light critical |
| **Action** | [See Travel Protocol] |

**Scenario D: Lite Mode (No Wearable) — v7 NEW**

| Element | Content |
|---------|---------|
| **Headline** | "Good morning. Ready to check in?" |
| **Subhead** | "Tap to log sleep hours and morning energy." |
| **Protocols** | Morning Light • Hydration • Today's Focus |
| **Action** | [Quick Check-in] button |

### Technical Requirements (v7 Update)

| Requirement | Specification |
|-------------|---------------|
| **Wake Detection** | Trigger within 5 min of wearable sleep_end timestamp OR phone unlock |
| **Latency** | Recovery score + protocols displayed <2 seconds |
| **Widget** | iOS: WidgetKit (Lock Screen), Android: App Widget |
| **Fallback** | Lite Mode: phone unlock time + manual input prompt |

### Recovery Score Formula (v7 Update: Phase 3 Specification)

```
Recovery = (HRV_Score × 0.40) +
           (RHR_Score × 0.25) +
           (Sleep_Quality × 0.20) +
           (Sleep_Duration × 0.10) +
           (Respiratory_Rate × 0.05) -
           Temperature_Penalty

Where:
- All component scores are 0-100, normalized to user baseline
- Temperature_Penalty is 0 to -15 (negative only, triggered >+0.5°C from baseline)
- Final score clamped to 0-100
- Confidence interval calculated based on data completeness
```

**Recovery Zones:**

| Zone | Score | Visual | Implication |
|------|-------|--------|-------------|
| **Green** | 75-100 | Green badge | Full protocol day, green light for intensity |
| **Yellow** | 40-74 | Yellow badge | Normal day, moderate intensity OK |
| **Red** | 0-39 | Red badge | MVD activation, foundation only |

### Anti-Patterns (Do NOT)

- Do NOT show raw HRV number without context (meaningless to most users)
- Do NOT recommend high-intensity on recovery <50%
- Do NOT suppress Morning Anchor even if other nudges suppressed
- Do NOT delay widget update—must feel instant
- Do NOT use recovery score without confidence indicator

---

## 3.2 Ambient Intelligence (Nudge Decision Engine)

### The Moment

Throughout the day, contextually relevant guidance appears at the right time—not too often, not too sparse.

### The Journey (v7 Update: Calendar-Aware)

```
[Context Aggregation] ────► [Candidate Generation] ────► [Suppression Filter] ────► [Delivery]
        │                          │                            │                      │
   User state               Protocol library              9-rule engine         Push/In-app
   + Calendar               + RAG search                  (see below)
   + Recovery
   + Meeting Load (v7)
```

### The 9 Suppression Rules

| # | Rule | Threshold | Override |
|---|------|-----------|----------|
| 1 | **Daily Cap** | Max 5 nudges/day | CRITICAL priority can add 1 |
| 2 | **Quiet Hours** | 10pm-6am user timezone | None |
| 3 | **Cooldown** | Min 2 hours between nudges | CRITICAL priority |
| 4 | **Fatigue Detection** | 3+ dismissals today = pause until tomorrow | None |
| 5 | **Meeting Awareness** | 2+ hours meetings today = suppress STANDARD | CRITICAL, ADAPTIVE |
| 6 | **Low Recovery** | Recovery <30% = morning-only message | None |
| 7 | **Streak Respect** | 7+ consecutive days = reduce frequency 50% | None |
| 8 | **Low Confidence** | AI confidence <0.4 = suppress | None |
| 9 | **MVD Active** | Only MVD-approved nudges allowed | None |

### Meeting Load Integration (v7 NEW)

**Data Source:** Google Calendar (freebusy scope) or Apple EventKit

| Meeting Load | Hours | Effect |
|--------------|-------|--------|
| **Light** | 0-2h | Normal nudges |
| **Moderate** | 2-4h | Reduce to 3 nudges max |
| **Heavy** | 4-6h | Semi-Active MVD, 2 nudges max |
| **Extreme** | 6h+ | Full MVD activation |

### Nudge Priority Levels

| Priority | Use Case | Can Override |
|----------|----------|--------------|
| **CRITICAL** | Time-sensitive windows (morning light, caffeine cutoff) | Cooldown, Daily Cap (+1) |
| **ADAPTIVE** | Recovery-based adjustments, conflict detection | Meeting Awareness |
| **STANDARD** | Scheduled protocol reminders | Nothing |
| **INSIGHT** | Weekly synthesis, pattern detection | Nothing |
| **ENGAGEMENT** | Re-engagement after absence | Nothing |

### Nudge Copy Constraints

| Element | Max Length | Example |
|---------|------------|---------|
| **Push Headline** | 50 chars | "Caffeine cutoff in 30 min" |
| **Push Body** | 80 chars | "Last call before your 2pm cutoff. After this, sleep may be affected." |
| **In-App Headline** | 60 chars | "Afternoon Energy Dip Detected" |
| **In-App Body** | 150 chars | "Based on your calendar and HRV pattern, a 10-min walking break now could prevent the 3pm crash. Zone 2 pace recommended." |
| **"Why?" Expansion** | 300 chars | Full mechanism + citation + user data |

### Anti-Patterns (Do NOT)

- Do NOT exceed 5 nudges/day under any circumstance
- Do NOT use gamification language ("Great job!", "Keep your streak!")
- Do NOT send nudges during detected meetings
- Do NOT send the same nudge twice in 24 hours

---

## 3.3 Closed Loop (v7: 4-Panel Reasoning)

### The Moment

User completes a protocol. They see immediate confirmation, and over time, correlations between actions and outcomes.

### The Journey

```
[Protocol Complete] ────► [Immediate Feedback] ────► [Log Storage] ────► [Correlation Engine]
        │                         │                        │                      │
   User action              Haptic + toast           Firebase → Supabase      Weekly insight
```

### Immediate Feedback

| Completion | Feedback |
|------------|----------|
| **Morning Light** | Subtle haptic + "Morning light ✓. Day 12." |
| **NSDR** | "NSDR complete. Dopamine restoration underway." |
| **Walking Break** | "Movement logged. 3/5 breaks today." |

### The "Why?" Layer (v7 Update: 4-Panel System)

When user taps any recommendation, they see a 4-panel expandable card:

**Panel 1: Mechanism**
| Element | Content |
|---------|---------|
| **Header** | "How This Works" |
| **Content** | 1-2 sentences of physiological explanation |
| **Animation** | FadeIn 300ms, panel height 80px |

**Panel 2: Evidence**
| Element | Content |
|---------|---------|
| **Header** | "The Science" |
| **Content** | Study citation with DOI link (tappable) |
| **Format** | "Author et al. (Year). Title. DOI: [clickable]" |

**Panel 3: Your Data**
| Element | Content |
|---------|---------|
| **Header** | "Your Data" |
| **Content** | What triggered this specific recommendation |
| **Example** | "Your HRV (42ms) is 15% below your baseline (49ms)." |

**Panel 4: Confidence**
| Element | Content |
|---------|---------|
| **Header** | "Confidence" |
| **Content** | AI confidence level with visual indicator |
| **Levels** | High (>0.8), Medium (0.5-0.8), Low (<0.5) |
| **Caveat** | "Based on population averages; individual results vary" (always shown) |

**Example Expansion:**

> **Why morning light?**
>
> **[Panel 1: Mechanism]**
> Bright light in the first hour after waking advances your circadian phase and triggers cortisol release, improving alertness and sleep timing.
>
> **[Panel 2: Evidence]**
> Wright et al. (2013). Entrainment of the human circadian clock. DOI: 10.1016/j.cub.2013.06.039
>
> **[Panel 3: Your Data]**
> Your average sleep onset is 45 min (vs. 20 min target). Morning light adherence correlated with 14 min improvement in users with similar patterns.
>
> **[Panel 4: Confidence]**
> High (based on 30+ days of your data)
> *Note: Based on population averages; individual results vary.*

### Protocol Conflict Detection

| Conflict | Warning | Severity |
|----------|---------|----------|
| Resistance training → Cold plunge within 4h | "May reduce muscle adaptation 10-20%. Consider delaying cold to evening." | Medium |
| Alcohol logged → Next-day protocols | "Sleep quality typically drops 15-25%. Extra morning light recommended." | Medium |
| Caffeine after cutoff | "May delay sleep onset 30-45 min. Consider skipping or switching to decaf." | Low |
| Late meal → Sleep within 2h | "Eating close to sleep reduces quality. Consider earlier dinner tomorrow." | Low |

### Anti-Patterns (Do NOT)

- Do NOT show "Why?" as popup—use expandable inline card
- Do NOT cite evidence without DOI
- Do NOT ignore logged conflicts (always surface warning)
- Do NOT make feedback feel like work (immediate, passive logging preferred)
- Do NOT hide confidence levels—always show transparency

---

## 3.4 Minimum Viable Day (MVD)

### The Moment

User is struggling—low recovery, packed calendar, travel, or just a tough week. Instead of all-or-nothing, the system adapts.

### The Journey (v7 Update: Calendar-Aware Triggers)

```
[Trigger Detection] ────► [MVD Activation] ────► [Protocol Reduction] ────► [Re-Engagement]
        │                        │                       │                       │
   6 conditions              Auto or manual          3-5 essentials         Gradual return
```

### Trigger Conditions (v7 Update)

| Condition | Threshold | MVD Type | Data Source |
|-----------|-----------|----------|-------------|
| **Recovery Score** | <35% | Full MVD | Wearable via Recovery Engine |
| **Meeting Load** | 6+ hours on calendar | Full MVD | Google Calendar / EventKit |
| **Manual Selection** | User taps "Tough Day" | Full MVD | User input |
| **Travel Detected** | Timezone change >2 hours | Travel MVD | Device timezone |
| **Consistency Drop** | <50% completion for 3+ consecutive days | Semi-Active MVD | Protocol logs |
| **Illness Indicator** | Respiratory rate +3 bpm OR temp +0.5°C | Recovery MVD | Wearable |

### MVD Protocol Sets

**Full MVD (3 protocols only):**

| Protocol | Why Non-Negotiable |
|----------|-------------------|
| Morning Light (10 min) | Anchors circadian rhythm—foundation for everything |
| Hydration (32 oz by noon) | Immediate cognitive benefit, zero effort |
| Early Sleep Cutoff (no screens 9pm) | Protects tomorrow's recovery |

**Semi-Active MVD (5 protocols):**

Full MVD + Walking Break (1) + Evening Light Management

### MVD UX

| Element | Content |
|---------|---------|
| **Activation Card** | "MVD Active: Recovery 34%"<br>"On tough days, we focus on what matters most. 3 protocols today." |
| **Progress Display** | Simple 0/3 counter, not intimidating checklist |
| **Exit Condition** | "Ready to expand? Tomorrow's forecast: Recovery 52%—Normal protocols available." |

### Anti-Patterns (Do NOT)

- Do NOT make MVD feel like failure ("You can do better!")
- Do NOT show full protocol list during MVD (overwhelming)
- Do NOT auto-exit MVD without user confirmation
- Do NOT reduce Foundation protocols below 3

---

## 3.5 Weekly Synthesis

### The Moment

Sunday morning, 9am. User receives a narrative summary of their week—not a data dump, but a story with meaning.

### The Journey

```
[Data Aggregation] ────► [Pattern Detection] ────► [Narrative Generation] ────► [Delivery]
        │                        │                         │                        │
   7-day metrics          Correlation engine         Gemini 2.5 Flash         Push + Card
```

### The Sunday Brief Structure

**Target Length:** ~200 words, narrative prose (not bullet points)

| Section | Content | Example |
|---------|---------|---------|
| **Win of the Week** | What improved, with specific data | "Morning light: 6/7 days. Sleep onset down 14 min from 45 to 31." |
| **Area to Watch** | What declined, with actionable insight | "HRV down 11% vs. last week. Often indicates cumulative stress. Consider adding NSDR." |
| **Pattern Insight** | Correlation detected in YOUR data | "Your best focus days (Tue, Thu) had morning movement. Correlation: strong (r=0.72)." |
| **Trajectory Prediction** | Linear regression with confidence | "If current trend continues, HRV down another 8% by next Wednesday." |
| **Experiment** | Achievable, measurable next step | "Try: 10-min Zone 2 walk before first meeting Mon/Wed/Fri. We'll measure impact on afternoon focus." |

### Example Weekly Synthesis

> **Your Week in Review**
>
> This week told a clear story: consistency wins. You hit morning light 6 of 7 days, and it showed—sleep onset dropped from 45 minutes to 31. That's real progress.
>
> But there's a signal worth watching. Your HRV dropped 11% compared to last week, settling around 42ms. This often indicates cumulative stress catching up. Your body's asking for recovery support.
>
> Here's what the data reveals: your best focus days (Tuesday, Thursday) both followed morning movement before your first meeting. The correlation is strong—this pattern has held for 3 weeks now.
>
> Looking ahead: if your HRV trend continues, you'll likely hit 38ms by Wednesday. That's below your recovery baseline.
>
> **This week's experiment:** Add a 10-minute Zone 2 walk before your first meeting on Monday, Wednesday, and Friday. We'll track whether it maintains focus without tanking recovery. Small input, measurable output.

### Tone Calibration

| Attribute | Guideline |
|-----------|-----------|
| **Analytical but warm** | Like a coach reviewing game tape, not a cold dashboard |
| **Specific** | Always include at least one number from their data |
| **Forward-looking** | End with actionable next step, not just retrospective |
| **Honest** | If data is insufficient, say so ("Not enough data yet for pattern detection") |

### Anti-Patterns (Do NOT)

- Do NOT use bullet points—narrative prose only
- Do NOT exceed 250 words (respect their time)
- Do NOT include experiments that require new equipment or major time commitment
- Do NOT generate synthesis if <4 days of data available

---

# PART 4: Technical Specifications

## 4.1 Architecture Overview (v7 Update)

### Hybrid Database Pattern with Wearable Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        APEX OS ARCHITECTURE v7                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                      WEARABLE DATA SOURCES                            │  │
│   │  Oura Ring  │  Apple Watch  │  Health Connect  │  Garmin  │  Fitbit  │  │
│   └──────┬──────────────┬────────────────┬──────────────┬────────────────┘  │
│          │              │                │              │                    │
│          │ Webhook      │ HealthKit      │ Background   │ Webhook            │
│          ▼              │ Observer       │ Sync         ▼                    │
│   ┌──────────────┐      │                │      ┌──────────────┐            │
│   │ Webhook      │      │                │      │ Cloud API    │            │
│   │ Receiver     │      │                │      │ Polling      │            │
│   └──────┬───────┘      │                │      └──────┬───────┘            │
│          │              ▼                ▼             │                     │
│          │      ┌───────────────────────────────┐      │                     │
│          └─────►│  Normalization Pipeline       │◄─────┘                     │
│                 │  → DailyMetrics format        │                            │
│                 └──────────────┬────────────────┘                            │
│                                │                                             │
│                                ▼                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                    CLOUD RUN (Gen 2 Functions)                         │ │
│   │                                                                         │ │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│   │  │ Recovery    │  │ Wake        │  │ Calendar    │  │ Nudge       │   │ │
│   │  │ Engine      │  │ Detector    │  │ Service     │  │ Engine      │   │ │
│   │  │ (Phase 3)   │  │ (Phase 3)   │  │ (Phase 3)   │  │ (Phase 2)   │   │ │
│   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │ │
│   │         │                │                │                │          │ │
│   │         └────────────────┴────────────────┴────────────────┘          │ │
│   │                                    │                                   │ │
│   │         ┌──────────────────────────┼──────────────────────────┐       │ │
│   │         ▼                          ▼                          ▼       │ │
│   │  ┌─────────────┐            ┌─────────────┐            ┌──────────┐  │ │
│   │  │ Supabase    │            │ Vertex AI   │            │ Pinecone │  │ │
│   │  │ (Postgres)  │            │ Gemini 2.5  │            │ (RAG)    │  │ │
│   │  │             │            │             │            │          │  │ │
│   │  │ • users     │            │ • Reasoning │            │ • Proto  │  │ │
│   │  │ • metrics   │            │ • Synthesis │            │   Search │  │ │
│   │  │ • baselines │            │ • Embeddings│            │          │  │ │
│   │  └──────┬──────┘            └─────────────┘            └──────────┘  │ │
│   │         │                                                             │ │
│   └─────────┼─────────────────────────────────────────────────────────────┘ │
│             │ Sync                                                          │
│             ▼                                                               │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                    FIRESTORE (Real-time Client Layer)                  │ │
│   │   • todayMetrics    • activeNudges    • mvdState    • recoveryScore   │ │
│   └──────────────────────────────────┬────────────────────────────────────┘ │
│                                      │                                      │
│                                      ▼                                      │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                    REACT NATIVE CLIENT (Expo 54)                       │ │
│   │                                                                         │ │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│   │  │ Morning     │  │ Nudge Cards │  │ 4-Panel     │  │ Weekly      │   │ │
│   │  │ Anchor      │  │ + "Why?"    │  │ Reasoning   │  │ Synthesis   │   │ │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│   │                                                                         │ │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │ │
│   │  │ HealthKit   │  │ Health      │  │ Lite Mode   │                    │ │
│   │  │ Observer    │  │ Connect     │  │ (Manual)    │                    │ │
│   │  │ (iOS)       │  │ (Android)   │  │             │                    │ │
│   │  └─────────────┘  └─────────────┘  └─────────────┘                    │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Rules

| Operation | Database | Why |
|-----------|----------|-----|
| **READ history** | Supabase | Relational queries, analytics, canonical truth |
| **WRITE real-time** | Firebase | Instant UI updates, no polling |
| **Sync to canonical** | Firestore → Supabase | Triggered by Firestore writes |
| **Wearable webhooks** | Cloud Run → Supabase | Normalize then store |
| **Never** | Poll any API from client | Battery drain, unnecessary costs |

### API Endpoints (Cloud Run)

| Endpoint | Method | Purpose | Phase |
|----------|--------|---------|-------|
| `/` | GET | Health check | 1 |
| `/api/modules` | GET | List wellness modules | 1 |
| `/api/protocols/search?q=` | GET | RAG-powered protocol search | 2 |
| `/api/users` | GET/PUT | User profile management | 1 |
| `/api/wearables/sync` | POST | Ingest wearable data | 3 |
| `/api/wearables/oauth/callback` | GET | OAuth callback handler | 3 |
| `/api/webhooks/oura` | POST | Oura webhook receiver | 3 |
| `/api/webhooks/fitbit` | POST | Fitbit webhook receiver | 3 |
| `/api/calendar/sync` | POST | Calendar freebusy fetch | 3 |
| `/api/insights/weekly` | GET | Fetch weekly synthesis | 2 |
| `/api/feedback` | POST | User feedback submission | 1 |

**Base URL:** `https://api-26324650924.us-central1.run.app`

## 4.2 Data Models

### User

```typescript
interface User {
  id: string;                    // UUID, primary key
  firebase_uid: string;          // Firebase Auth UID
  email: string;
  display_name: string;
  timezone: string;              // IANA format (e.g., "America/New_York")
  created_at: string;            // ISO 8601

  // Preferences
  primary_goal: 'better_sleep' | 'more_energy' | 'sharper_focus' | 'faster_recovery';
  notification_style: 'direct' | 'supportive';
  quiet_hours_start: string;     // "22:00"
  quiet_hours_end: string;       // "06:00"

  // Wearable Integration (v7)
  wearable_source: WearableSource | null;
  lite_mode_enabled: boolean;    // True if no wearable connected

  // Computed
  protocol_level: 'foundation' | 'performance' | 'elite';
  current_streak: number;        // Consecutive days with ≥1 protocol completion
  baseline_hrv: number;          // Rolling 14-day average
  baseline_rhr: number;
}
```

### WearableSource (v7 NEW)

```typescript
type WearableSource =
  | 'oura'           // Oura Ring Gen 3/4 (cloud API)
  | 'apple_health'   // Apple HealthKit (on-device)
  | 'health_connect' // Android Health Connect (replaces Google Fit)
  | 'garmin'         // Garmin Connect (commercial license)
  | 'fitbit'         // Fitbit (cloud API)
  | 'whoop'          // WHOOP (enterprise partnership)
  | 'manual';        // Lite Mode: user-entered data
```

### WearableIntegration (v7 NEW)

```typescript
interface WearableIntegration {
  id: string;
  userId: string;
  provider: WearableSource;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  expiresAt: Date | null;
  scopes: string[];
  webhookChannelId: string | null;
  webhookResourceId: string | null;
  webhookExpiresAt: Date | null;
  lastSyncAt: Date | null;
  lastSyncStatus: 'success' | 'failed' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}
```

### DailyMetrics (v7 EXPANDED)

```typescript
interface DailyMetrics {
  id: string;
  user_id: string;
  date: string;                  // "YYYY-MM-DD"

  // Sleep
  sleep_duration_hours: number | null;
  sleep_efficiency: number | null;      // 0-100
  sleep_onset_minutes: number | null;
  bedtime_start: string | null;         // ISO 8601
  bedtime_end: string | null;           // ISO 8601
  rem_percentage: number | null;
  deep_percentage: number | null;
  light_percentage: number | null;
  awake_percentage: number | null;

  // Recovery
  hrv_avg: number | null;               // RMSSD in ms
  hrv_method: 'rmssd' | 'sdnn' | null;  // Track measurement method
  rhr_avg: number | null;               // bpm
  respiratory_rate_avg: number | null;  // breaths per minute
  temperature_deviation: number | null; // Celsius from baseline
  recovery_score: number | null;        // Calculated, 0-100
  recovery_confidence: number | null;   // 0.0-1.0
  recovery_zone: 'red' | 'yellow' | 'green' | null;

  // Activity
  steps: number | null;
  active_minutes: number | null;
  active_calories: number | null;
  strain_score: number | null;          // If available from wearable

  // Source
  wearable_source: WearableSource;
  raw_payload: object | null;           // Store original for debugging
  synced_at: string;
}
```

### UserBaseline (v7 NEW)

```typescript
interface UserBaseline {
  userId: string;

  // HRV baseline (log-transformed for accuracy)
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

  // Metadata
  confidenceLevel: 'low' | 'medium' | 'high';
  lastUpdated: Date;
  createdAt: Date;
}
```

### RecoveryResult (v7 NEW)

```typescript
interface RecoveryResult {
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
      vsBaseline: string;
      score: number;
      weight: 0.05;
    };
  };

  // Edge case detection
  edgeCases: {
    alcoholDetected: boolean;
    illnessRisk: 'none' | 'possible' | 'likely';
    travelJetlag: boolean;
    menstrualCycleAdjustment: boolean;
    firstWeekCalibration: boolean;
  };

  // Transparency
  dataCompleteness: number;       // 0.0-1.0 (what % of inputs available)
  caveat: string;                 // Always: "Based on population averages; individual results vary"
  generatedAt: Date;
}
```

### CalendarContext (v7 NEW)

```typescript
interface CalendarContext {
  userId: string;
  date: string;                   // YYYY-MM-DD

  // Meeting load
  meetingMinutes: number;         // Total for day
  meetingCount: number;
  meetingLoad: 'light' | 'moderate' | 'heavy' | 'extreme';

  // Time blocks (for nudge timing)
  busyPeriods: Array<{
    start: string;                // ISO 8601
    end: string;
    isAllDay: boolean;
  }>;

  // Derived
  longestFreeBlock: number;       // Minutes
  morningFreeUntil: string | null; // When first meeting starts

  // Privacy
  titlesSynced: false;            // Never store meeting titles
  source: 'google' | 'apple' | 'manual';
  lastSyncAt: Date;
}
```

### Protocol

```typescript
interface Protocol {
  id: string;                    // e.g., "morning_light_exposure"
  name: string;                  // "Morning Light Exposure"
  short_name: string;            // "Morning Light"
  category: 'Foundation' | 'Performance' | 'Recovery' | 'Optimization' | 'Meta';
  tier_required: 'core' | 'pro' | 'elite';

  // Content
  description: string;           // Full protocol description
  benefits: string;              // Expected outcomes
  constraints: string;           // Contraindications, warnings

  // Evidence
  citations: string[];           // Array of "Author (Year). Title. DOI: xxx"
  evidence_level: 'Very High' | 'High' | 'Moderate' | 'Emerging';

  // Timing
  optimal_window_start: string;  // Relative to wake: "+00:00"
  optimal_window_end: string;    // Relative to wake: "+01:00"
  duration_minutes: number;

  is_active: boolean;
}
```

### ProtocolLog

```typescript
interface ProtocolLog {
  id: string;
  user_id: string;
  protocol_id: string;

  // Completion
  completed_at: string;          // ISO 8601
  duration_minutes: number;      // Actual duration

  // Context
  source: 'schedule' | 'manual' | 'nudge';
  nudge_id?: string;             // If triggered by nudge

  // Feedback (optional)
  difficulty_rating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}
```

### Nudge

```typescript
interface Nudge {
  id: string;
  user_id: string;

  // Content
  headline: string;              // Max 60 chars
  body: string;                  // Max 150 chars
  protocol_id?: string;          // Associated protocol

  // Classification
  type: 'proactive_coach' | 'reminder' | 'insight' | 'mvd' | 're_engagement';
  priority: 'CRITICAL' | 'ADAPTIVE' | 'STANDARD' | 'INSIGHT' | 'ENGAGEMENT';

  // AI Metadata
  confidence_score: number;      // 0-1
  reasoning_trace?: string;      // AI's reasoning (for transparency UI)

  // Reasoning Panels (v7)
  reasoning?: {
    mechanism: string;           // Panel 1
    evidence: string;            // Panel 2 with DOI
    userData: string;            // Panel 3
    confidenceLevel: 'high' | 'medium' | 'low';
    caveat: string;              // Always present
  };

  // Lifecycle
  generated_at: string;
  scheduled_for?: string;        // If scheduled delivery
  delivered_at?: string;
  read_at?: string;
  action_taken?: 'completed' | 'dismissed' | 'snoozed';

  // Suppression
  was_suppressed: boolean;
  suppression_rule?: string;     // Which rule blocked it
}
```

### Memory (User Learnings)

```typescript
interface Memory {
  id: string;
  user_id: string;

  // Classification
  type: 'nudge_feedback' | 'protocol_effectiveness' | 'preferred_time' |
        'stated_preference' | 'pattern_detected' | 'preference_constraint';

  // Content
  content: string;               // The actual learning
  context?: string;              // What triggered this memory

  // Confidence
  confidence: number;            // 0-1
  evidence_count: number;        // How many data points support this

  // Lifecycle
  created_at: string;
  last_used_at: string;
  decay_rate: number;            // How fast confidence decays (0.01-0.1)
  expires_at?: string;           // Optional expiration
}
```

### WeeklySynthesis

```typescript
interface WeeklySynthesis {
  id: string;
  user_id: string;
  week_start: string;            // Monday of the week
  week_end: string;              // Sunday of the week

  // Content
  narrative: string;             // Full 200-word synthesis
  win_of_week: string;
  area_to_watch: string;
  pattern_insight: string;
  trajectory_prediction: string;
  experiment: string;

  // Supporting Data
  metrics_summary: {
    protocol_adherence: number;  // 0-100
    avg_recovery: number;
    hrv_trend: number;           // % change from prior week
    sleep_quality_trend: number;
  };

  // Metadata
  generated_at: string;
  delivered_at?: string;
  read_at?: string;
}
```

## 4.3 AI Brain Specifications

### Model Configuration

| Parameter | Value |
|-----------|-------|
| **Primary Model** | `gemini-2.5-flash` (Vertex AI) |
| **Embedding Model** | `text-embedding-005` (768 dimensions) |
| **Vector DB** | Pinecone (serverless, `wellness-protocols` index) |
| **Max Latency** | 2.5 seconds for nudge generation |
| **Fallback Chain** | Gemini → Cached response → Rule-based default |

### RAG Pipeline

```
User Context + Query
        │
        ▼
┌─────────────────┐
│  Embed Query    │  text-embedding-005
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Pinecone Search │  top_k=5, threshold=0.7
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Fetch from      │  Supabase protocols table
│ Supabase        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Context Window  │  User profile + Metrics + Protocols
│ Assembly        │  + Memories + Time context + Recovery
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Gemini 2.5 Flash│  Generate nudge/insight
└────────┬────────┘
         │
         ▼
     Response
```

### System Prompt Template (Nudge Generation)

```
You are an evidence-based wellness coach for high-performing professionals.

PERSONA:
- Direct and data-driven (not cheerleader)
- Cite evidence when relevant (include DOI)
- Respect user's intelligence
- Never use gamification language

USER CONTEXT:
- Name: {user.display_name}
- Primary Goal: {user.primary_goal}
- Recovery Today: {recovery.score}% ({recovery.zone})
- Recovery Confidence: {recovery.confidence}
- Current Streak: {user.current_streak} days
- Notification Style: {user.notification_style}
- Wearable: {user.wearable_source}
- Meeting Load: {calendar.meetingLoad}

MEMORIES (what we've learned about this user):
{memories.map(m => `- ${m.content} (confidence: ${m.confidence})`).join('\n')}

RELEVANT PROTOCOLS:
{protocols.map(p => `- ${p.name}: ${p.benefits}`).join('\n')}

CURRENT TIME: {current_time} ({user.timezone})

TASK: Generate a nudge with 4-panel reasoning that is:
1. Contextually relevant to the moment
2. Evidence-backed with DOI citation
3. Under 150 characters for body
4. Includes confidence level and standard caveat

Output JSON:
{
  "headline": "...",
  "body": "...",
  "protocol_id": "...",
  "confidence": 0.0-1.0,
  "reasoning": {
    "mechanism": "...",
    "evidence": "Author (Year). Title. DOI: ...",
    "userData": "...",
    "confidenceLevel": "high|medium|low",
    "caveat": "Based on population averages; individual results vary"
  }
}
```

## 4.4 Voice & Tone Guide

### AI Persona

| Attribute | Description |
|-----------|-------------|
| **Name** | No name (it's infrastructure, not a character) |
| **Role** | Evidence-based wellness advisor |
| **Tone** | Coach reviewing game tape, not cheerleader |
| **Authority** | Confident but not dogmatic; acknowledges uncertainty |

### Voice Attributes

| Attribute | Do This | Not This |
|-----------|---------|----------|
| **Directness** | "HRV down 15%. Consider NSDR." | "You might want to think about maybe trying..." |
| **Evidence** | "Per Walker (2017), sleep before midnight..." | "Everyone knows sleep is important..." |
| **Personalization** | "Your caffeine cutoff is 2pm based on your data." | "Most people should stop caffeine by 2pm." |
| **Honesty** | "Not enough data yet. Need 7 more days." | "Great progress! Keep going!" |

### Forbidden Phrases

| Never Say | Why |
|-----------|-----|
| "Great job!" | Patronizing |
| "Keep up the streak!" | Gamification |
| "You've got this!" | Cheerleader, not coach |
| "Studies show..." | Too vague; cite specific study |
| "Most people..." | Not personalized |
| "Try to..." | Weak; be direct |

### Tone by Context

| Context | Tone | Example |
|---------|------|---------|
| **High Recovery** | Confident, expansive | "Green light for intensity. Your HRV supports a challenging workout." |
| **Low Recovery** | Supportive, protective | "Recovery 34%. Foundation only. Tomorrow's a better day for intensity." |
| **Streak** | Acknowledging, not celebrating | "Morning light: Day 12. Sleep onset trending down." |
| **Struggle** | Compassionate, adaptive | "Tough week. MVD active. Three protocols. That's enough." |

---

# PART 5: Phase 3 — The Nervous System

## 5.1 Wearable Sync Service

### Scope

Build the backend service that connects to wearable cloud APIs (Oura, Garmin, Fitbit) and on-device APIs (HealthKit, Health Connect), normalizing data into `DailyMetrics` format.

### Supported Wearables

| Device | Integration | Status | Notes |
|--------|-------------|--------|-------|
| Oura Ring | Cloud API + Webhooks | Supported | OAuth 2.0, 5000 req/5min |
| Apple Watch | HealthKit (on-device) | Supported | Background delivery |
| Health Connect | On-device (Android) | Supported | Replaces deprecated Google Fit |
| Garmin | Cloud API | Planned | Commercial license required |
| Fitbit | Cloud API | Supported | OAuth 2.0 |
| WHOOP | Cloud API | Planned | Enterprise partnership required |

### Data Flow

1. **Cloud wearables (Oura, Fitbit, Garmin):**
   - User authenticates via OAuth 2.0
   - Webhook registered for real-time updates
   - Cloud Run receives webhook → normalizes → stores in Supabase → syncs to Firestore

2. **On-device wearables (HealthKit, Health Connect):**
   - User grants permissions in app
   - Background observer triggers on new data
   - Client normalizes → sends to Cloud Run → stores in Supabase → syncs to Firestore

### Normalization Rules

| Source Field | DailyMetrics Field | Transformation |
|--------------|-------------------|----------------|
| Oura `total_sleep_duration` | `sleep_duration_hours` | Seconds → Hours (÷3600) |
| Oura `average_hrv` | `hrv_avg` | Already in ms |
| Oura `efficiency` | `sleep_efficiency` | Already 0-100 |
| HealthKit `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` | `hrv_avg` | Convert SDNN to RMSSD estimate |
| Health Connect `HeartRateVariabilityRmssd` | `hrv_avg` | Already in ms |

### Backfill Logic

- On wearable connection, fetch 30 days of historical data
- Respect rate limits (queue with exponential backoff)
- Report progress to user: "Syncing 15 of 30 days..."

## 5.2 Recovery Score Engine

### Formula

```
Recovery = (HRV_Score × 0.40) +
           (RHR_Score × 0.25) +
           (Sleep_Quality × 0.20) +
           (Sleep_Duration × 0.10) +
           (Respiratory_Rate × 0.05) -
           Temperature_Penalty
```

### Component Calculations

**HRV Score (Weight: 0.40)**
```
If HRV is null: Use fallback (50 if <7 days, baseline average otherwise)

ln_hrv = ln(hrvAvg)
z_score = (ln_hrv - baseline.hrvLnMean) / baseline.hrvLnStdDev
normalized = 50 + (z_score × 15)  // Center at 50, ±15 per SD
HRV_Score = clamp(normalized, 0, 100)
```

**RHR Score (Weight: 0.25)**
```
deviation = rhrAvg - baseline.rhrMean
deviation_penalty = deviation × 5  // -5 points per bpm above baseline
RHR_Score = clamp(100 - deviation_penalty, 0, 100)
```

**Sleep Quality Score (Weight: 0.20)**
```
efficiency_score = sleepEfficiency  // Already 0-100
deep_score = (deepPercentage >= 15) ? 100 : (deepPercentage / 15) × 100
rem_score = (remPercentage >= 20) ? 100 : (remPercentage / 20) × 100
Sleep_Quality = (efficiency_score × 0.5) + (deep_score × 0.25) + (rem_score × 0.25)
```

**Sleep Duration Score (Weight: 0.10)**
```
hours = sleepDurationHours
if hours >= 7 && hours <= 9: score = 100
else if hours < 7: score = 100 - ((7 - hours) × 20)  // -20 per hour short
else: score = 100 - ((hours - 9) × 10)  // -10 per hour over
Sleep_Duration = clamp(score, 0, 100)
```

**Respiratory Rate Score (Weight: 0.05)**
```
deviation = respiratoryRateAvg - baseline.respiratoryRateMean
if deviation <= 1: score = 100
else if deviation <= 2: score = 80
else if deviation <= 3: score = 50
else: score = 20
Respiratory_Rate = score
```

**Temperature Penalty (0 to -15)**
```
if temperatureDeviation > 0.5°C: penalty = -15
else if temperatureDeviation > 0.3°C: penalty = -8
else: penalty = 0
```

### Edge Case Handling

| Edge Case | Detection | Adjustment |
|-----------|-----------|------------|
| **Alcohol** | RHR elevated >10bpm + HRV dropped >25% | Flag in result, suggest extra recovery |
| **Illness** | Resp rate +3 bpm OR temp +0.5°C | Flag "illness_risk: likely", suppress intensity recs |
| **Travel** | Timezone change >2h | Flag "travelJetlag: true", activate Travel MVD |
| **First Week** | <7 days of data | Flag "firstWeekCalibration: true", lower confidence, use population defaults |
| **Menstrual Cycle** | User tracking enabled, luteal phase | Adjust HRV baseline expectations |

### Confidence Calculation

```
base_confidence = 0.3

if hrvAvg present: base_confidence += 0.25
if rhrAvg present: base_confidence += 0.15
if sleepEfficiency present: base_confidence += 0.10
if sleepDurationHours present: base_confidence += 0.10
if baseline.hrvSampleCount >= 14: base_confidence += 0.10

confidence = clamp(base_confidence, 0, 1)
```

## 5.3 Wake Detection System

### Multi-Signal Algorithm

Wake is detected when probability exceeds 0.7:

```
P(wake) = (Movement × 0.30) + (HR × 0.25) + (HRV × 0.25) + (Time × 0.20)

Where:
- Movement: Acceleration >0.2g sustained for 2+ min
- HR: >10 bpm increase from sleep average
- HRV: 15%+ change from night average
- Time: Gaussian centered on user's typical wake time (σ = 1h)
```

### Platform Implementation

**iOS (HealthKit):**
- Register for `HKCategoryTypeIdentifierSleepAnalysis` updates
- Use Background Delivery for near-real-time (within 15 min)
- Trigger Cloud Function on `asleep` → `awake` transition

**Android (Health Connect):**
- Use WorkManager with `SleepSessionRecord` change observer
- Poll every 15 minutes during typical wake window
- Trigger Cloud Function on session end detection

### Latency Target

| Platform | Max Latency | Notes |
|----------|-------------|-------|
| iOS | 15 minutes | Background Delivery limitation |
| Android | 15 minutes | WorkManager minimum |
| Oura | 5 minutes | Webhook typically fast |

## 5.4 Calendar Integration

### Privacy-First Approach

**Google Calendar:** Use `freebusy` scope only
- Never access meeting titles or descriptions
- Only retrieve busy/free time blocks
- User can revoke anytime

**Apple EventKit:**
- Request "events" permission
- Extract only start/end times
- Never store event content

### Meeting Load Calculation

```typescript
function calculateMeetingLoad(busyPeriods: BusyPeriod[]): MeetingLoad {
  const totalMinutes = busyPeriods.reduce((sum, p) =>
    sum + differenceInMinutes(p.end, p.start), 0
  );
  const hours = totalMinutes / 60;

  if (hours >= 6) return 'extreme';
  if (hours >= 4) return 'heavy';
  if (hours >= 2) return 'moderate';
  return 'light';
}
```

### MVD Integration

| Meeting Load | MVD Effect |
|--------------|------------|
| Light (0-2h) | None |
| Moderate (2-4h) | Reduce nudges to 3/day |
| Heavy (4-6h) | Semi-Active MVD |
| Extreme (6h+) | Full MVD |

### Threshold Configuration

Default: 4 hours = heavy day

**User Override:** Settings → Calendar → "Heavy day threshold"
- Options: 3h, 4h, 5h, 6h
- Tracks correlation: Does MVD activation improve next-day recovery?

## 5.5 Real-Time Sync Architecture

### Sync Strategy by Data Type

| Data Type | Sync Method | Latency SLA |
|-----------|-------------|-------------|
| Wearable (Oura, Fitbit) | Webhooks | <5 minutes |
| Wearable (HealthKit) | Background Delivery | <15 minutes |
| Wearable (Health Connect) | WorkManager polling | <15 minutes |
| Calendar | OAuth + refresh | <30 minutes |
| Recovery Score | Computed on data arrival | <2 seconds |

### Client Never Polls

**Architecture Principle:** Clients subscribe to Firestore, never poll APIs

```typescript
// CORRECT: Subscribe to Firestore
const unsubscribe = onSnapshot(
  doc(db, 'users', userId, 'todayMetrics', todayDate),
  (doc) => setRecoveryScore(doc.data())
);

// WRONG: Poll backend
setInterval(() => fetchRecoveryScore(), 60000); // NEVER DO THIS
```

### Firestore Structure

```
/users/{userId}/
  ├── profile              # User settings
  ├── todayMetrics/        # Real-time metrics (single doc per day)
  │   └── {YYYY-MM-DD}
  ├── activeNudges/        # Current nudges
  │   └── {nudgeId}
  ├── mvdState/            # MVD activation status
  │   └── current
  └── weeklySynthesis/     # Latest synthesis
      └── latest
```

## 5.6 Reasoning UX System

### 4-Panel "Why?" Component

When user taps any recommendation:

**Panel 1: Mechanism**
```
Header: "How This Works"
Content: 1-2 sentences explaining physiological mechanism
Animation: FadeIn 300ms
Height: 80px
```

**Panel 2: Evidence**
```
Header: "The Science"
Content: "Author et al. (Year). Title. DOI: [tappable link]"
Tap: Opens DOI in browser
Animation: FadeIn 300ms, 100ms delay
```

**Panel 3: Your Data**
```
Header: "Your Data"
Content: Personalized trigger explanation
Example: "Your HRV (42ms) is 15% below baseline (49ms)"
Animation: FadeIn 300ms, 200ms delay
```

**Panel 4: Confidence**
```
Header: "Confidence"
Content: Visual indicator (High/Medium/Low)
Caveat: "Based on population averages; individual results vary" (always shown)
Animation: FadeIn 300ms, 300ms delay
```

### Animation Specifications

```typescript
const panelAnimation = {
  entering: FadeIn.duration(300).easing(Easing.out(Easing.cubic)),
  stagger: 100,  // ms between panels
  totalDuration: 600  // All panels visible by 600ms
};
```

### Accessibility

- All panels keyboard navigable
- DOI links have descriptive aria-label
- Confidence colors have text fallbacks
- Minimum touch target: 44×44 points

### AI Processing Animation ("Thinking State")

When AI is processing a request (nudge generation, chat response, synthesis), display an elegant shimmer animation with progressive status text.

**Animation Sequence:**
```
0-3s:  "Analyzing your data..."          [shimmer]
3-6s:  "Researching protocols..."        [shimmer]
6-9s:  "Tailoring to your needs..."      [shimmer]
9s+:   "Almost there..."                 [shimmer]
```

**Technical Specification:**
```typescript
interface AIThinkingStateProps {
  isVisible: boolean;
  context?: 'nudge' | 'chat' | 'synthesis';
  onComplete?: () => void;
}

const shimmerAnimation = {
  gradient: ['#0F1218', '#1A2027', '#63E6BE20', '#1A2027', '#0F1218'],
  duration: 1500,  // ms per sweep
  repeat: -1       // infinite
};
```

**Design Rationale (Dec 2025 Best Practices):**
- Progressive text updates reduce perceived wait time
- Human-like messaging ("Analyzing..." not "Processing...")
- Shimmer effect draws attention away from delay
- Text changes every ~3 seconds maintain engagement

## 5.8 Correlation Dashboard

### Purpose

Visualize personal health correlations between protocol adherence and outcomes. Transforms Weekly Synthesis insights into an always-available, interactive display.

### UI Design (Apex OS Aesthetic)

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
├─────────────────────────────────────┤
│  ↓ Late Caffeine → Sleep Onset      │
│    -31% improvement (p=0.03)        │
│    [████████░░] 28 days tracked     │
└─────────────────────────────────────┘
```

### Data Requirements

- Minimum 14 days of tracked data for correlations
- p-value threshold: < 0.05 for significance
- Maximum 5 correlations displayed (sorted by significance)

### Empty State

For users with < 14 days data:
```
┌─────────────────────────────────────┐
│  YOUR PATTERNS                      │
├─────────────────────────────────────┤
│                                     │
│  🔬 Building your patterns...       │
│                                     │
│  We need 14 days of data to find    │
│  meaningful correlations.           │
│                                     │
│  [████░░░░░░] 6 of 14 days          │
│                                     │
└─────────────────────────────────────┘
```

### API Endpoint

```
GET /api/user/correlations

Response:
{
  "correlations": [
    {
      "protocol": "morning_light_exposure",
      "protocol_name": "Morning Light Exposure",
      "outcome": "sleep_quality",
      "outcome_name": "Sleep Quality",
      "r": 0.62,
      "p_value": 0.02,
      "is_significant": true,
      "sample_size": 30,
      "direction": "positive",
      "interpretation": "On days you got morning light, sleep quality improved 23%"
    }
  ],
  "days_tracked": 30,
  "min_days_required": 14
}
```

## 5.9 Lite Mode (No-Wearable Fallback)

### Purpose

Provide a meaningful experience for users without wearables, preventing a two-tier user experience.

### Activation

- User skips wearable during onboarding
- User disconnects wearable in settings
- Wearable sync fails for 7+ consecutive days

### Wake Detection

**Signal:** Phone unlock time as wake proxy
- First unlock between 4am-11am considered wake
- Confirm with optional morning check-in prompt

### Energy Score (Lite Mode Recovery Alternative)

```typescript
interface LiteModeCheckIn {
  sleepHoursLogged: number;        // 1-12 scale
  sleepQualitySubjective: 1 | 2 | 3 | 4 | 5;  // 1=poor, 5=excellent
  morningEnergySubjective: 1 | 2 | 3 | 4 | 5;
  loggedAt: Date;
}

function calculateEnergyScore(checkIn: LiteModeCheckIn): number {
  const sleepScore = Math.min(checkIn.sleepHoursLogged / 8, 1) * 40;
  const qualityScore = (checkIn.sleepQualitySubjective / 5) * 30;
  const energyScore = (checkIn.morningEnergySubjective / 5) * 30;
  return Math.round(sleepScore + qualityScore + energyScore);
}
```

### Lite Mode Features

| Feature | Wearable Mode | Lite Mode |
|---------|---------------|-----------|
| Recovery Score | HRV-based formula | Energy Score (subjective) |
| Wake Detection | Wearable sleep_end | Phone unlock |
| Morning Anchor | Full recovery display | Check-in prompt + Energy Score |
| Nudges | Personalized timing | Default schedule |
| Weekly Synthesis | Data-rich | Check-in based patterns |

### Upgrade Path

When Lite Mode user connects wearable:
1. Backfill 30 days of historical data
2. Calculate proper baseline (7-14 days)
3. Transition to full recovery scoring
4. Notification: "Welcome to full recovery insights. Your baseline is being calculated."

---

# PART 6: Implementation Roadmap

## 6.1 Phase Summary

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| **1** | Spinal Cord | ✅ COMPLETE | Infrastructure, data layer, E2E nudge flow verified |
| **2** | Brain | ✅ COMPLETE | AI & Reasoning enhancements, MVD, Weekly Synthesis |
| **3** | Nervous System | 🔄 IN PROGRESS | Real data flow (wearables, calendar, reasoning UX) |
| **4** | Polish | ⏳ PLANNED | Client integration, widgets, UX refinement |

## 6.2 Phase 3 Component Checklist

### P0 Components (Ship-Blocking)

| # | Component | Description | Sessions |
|---|-----------|-------------|----------|
| 1 | **Wearable Sync** | OAuth, webhooks, normalization | 2 |
| 2 | **Recovery Engine** | Formula, baselines, edge cases | 1.5 |
| 3 | **Wake Detection** | Multi-signal algorithm | 1 |
| 4 | **Calendar Integration** | Freebusy scope, meeting load | 1.5 |

### P1 Components (Core Functionality)

| # | Component | Description | Sessions |
|---|-----------|-------------|----------|
| 5 | **Real-time Sync** | Webhook architecture, Firestore | 1.5 |
| 6 | **Reasoning UX** | 4-panel "Why?" component | 1.5 |
| 7 | **Lite Mode** | No-wearable fallback | 1 |

### Total: 10 Sessions

## 6.3 Implementation Session Plan

| Session | Focus | Deliverables |
|---------|-------|--------------|
| 1 | Wearable Types + OAuth | TypeScript interfaces, Oura OAuth flow |
| 2 | Webhook Receivers | Cloud Run endpoints, idempotency |
| 3 | Recovery Engine | Formula implementation, baseline service |
| 4 | Edge Cases | Alcohol, illness, travel detection |
| 5 | Wake Detection | Multi-signal algorithm, platform hooks |
| 6 | Calendar Service | Google freebusy, Apple EventKit |
| 7 | Real-time Sync | Firestore triggers, client subscription |
| 8 | Reasoning UX | 4-panel component, animations |
| 9 | Lite Mode | Energy Score, manual check-in |
| 10 | Integration Testing | E2E scenarios, bug fixes |

## 6.4 Agent Handoff Checkpoints

### After Each Component

1. **Verify:** Run `npx tsc --noEmit` (must pass)
2. **Test:** Execute relevant test commands
3. **Commit:** Create commit with message format: `feat(phase3): implement [component]`
4. **Update:** Add accomplishment to STATUS.md
5. **Push:** `git push origin main`

### Human Review Points

| After | Verify |
|-------|--------|
| Wearable Sync | Test OAuth flow end-to-end |
| Recovery Engine | Review formula accuracy |
| Calendar Integration | Test with real calendar |
| Reasoning UX | Review animation feel |
| Full Phase 3 | End-to-end scenario testing |

---

# PART 7: Success Metrics & Acceptance Criteria

## 7.1 North Star Metric

**Protocol Adherence at Day 30:** 60%+ of users completing 6+/7 days of Foundation protocols.

**Why This Metric:**
- Measures actual behavior change (not just engagement)
- Foundation protocols are free tier (no paywall bias)
- 6/7 allows for reality (travel, sick days)
- Day 30 filters for retained users

## 7.2 Leading Indicators

| Metric | Target | Red Flag | Timeline |
|--------|--------|----------|----------|
| **Day 1 Retention** | 85% | <70% | Measure at Day 2 |
| **Day 7 Retention** | 75% | <60% | Measure at Day 8 |
| **Day 30 Retention** | 50% | <35% | Measure at Day 31 |
| **Nudge Read Rate** | 65% | <50% | Daily |
| **"Why?" Tap Rate** | 25% | <15% | Daily |
| **MVD Activation Rate** | 15% of eligible | <10% | Weekly |
| **Weekly Synthesis Read Rate** | 70% | <50% | Weekly |
| **Protocol Completion Rate** | 65% | <50% | Daily |
| **Wearable Connection Rate** | 70% | <50% | At onboarding |
| **Recovery Score Engagement** | 80% | <60% | Daily |

## 7.3 Verification Scenarios

### Scenario 1: High Recovery Morning

**Setup:** User wakes with 78% recovery, no meetings until 10am
**Expected:**
- Morning Anchor shows "Full Protocol Day" within 30 seconds of wake
- Morning Light + Morning Movement protocols recommended
- Caffeine cutoff displayed based on user's sleep time
- 4-panel "Why?" available on tap

**Verify:** Widget updates, protocols display correctly, no errors in logs

### Scenario 2: Low Recovery Morning

**Setup:** User wakes with 34% recovery, HRV down 18%
**Expected:**
- MVD auto-activates
- Morning Anchor shows "MVD Active" with 3 protocols only
- Standard nudges suppressed
- Recovery zone shows RED

**Verify:** MVD state persists, only MVD nudges delivered

### Scenario 3: Heavy Calendar Day

**Setup:** User has 6 hours of meetings on calendar
**Expected:**
- MVD auto-activates based on meeting load
- Nudges limited to 2/day
- Morning Anchor shows meeting load context

**Verify:** Calendar integration working, MVD triggers correctly

### Scenario 4: Lite Mode User

**Setup:** User skipped wearable during onboarding
**Expected:**
- Morning check-in prompt appears on wake
- Energy Score calculated from manual input
- Nudges use default timing (not personalized)
- Weekly Synthesis based on check-in data

**Verify:** Lite Mode provides meaningful experience

### Scenario 5: Wearable Webhook

**Setup:** User completes sleep, Oura sends webhook
**Expected:**
- Webhook received and processed within 5 minutes
- DailyMetrics updated in Supabase
- Recovery score calculated
- Firestore synced for client
- Morning Anchor ready when user wakes

**Verify:** End-to-end webhook → client flow

### Scenario 6: Reasoning Transparency

**Setup:** User receives recovery-based nudge
**Expected:**
- Tap opens 4-panel "Why?" card
- Panel 1: Mechanism explanation
- Panel 2: DOI citation (tappable)
- Panel 3: User's specific data
- Panel 4: Confidence + caveat

**Verify:** All panels render, DOI link works

### Scenario 7: Edge Case Detection

**Setup:** User's RHR elevated +12 bpm, HRV down 30%
**Expected:**
- Recovery result flags `alcoholDetected: true`
- Nudge copy mentions extra recovery
- No high-intensity recommendations

**Verify:** Edge case properly detected and handled

### Scenario 8: Weekly Synthesis Generation

**Setup:** Sunday 9am, user has 7 days of data
**Expected:**
- ~200 word narrative generated
- Win, Watch, Pattern, Trajectory, Experiment all present
- Specific numbers from user's data included
- Experiment is achievable (not requiring new equipment)

**Verify:** All 5 sections present, personalized, under 250 words

---

# APPENDICES

## Appendix A: Protocol Library Summary

| # | Protocol | Category | Tier | Key Outcome |
|---|----------|----------|------|-------------|
| 1 | Morning Light Exposure | Foundation | Core | Sleep onset -15-20 min |
| 2 | Evening Light Management | Foundation | Core | Preserves melatonin |
| 3 | Sleep Optimization | Foundation | Core | Sleep efficiency +10% |
| 4 | Hydration & Electrolytes | Foundation | Core | Cognitive clarity |
| 5 | Caffeine Timing | Foundation | Core | Prevents sleep disruption |
| 6 | Morning Movement | Performance | Pro | Cortisol +50-75% |
| 7 | Walking Breaks | Performance | Pro | Glucose regulation |
| 8 | Nutrition Timing | Performance | Pro | Cognitive stability |
| 9 | Fitness for Focus | Performance | Pro | BDNF upregulation |
| 10 | NSDR | Recovery | Pro | Dopamine +65% |
| 11 | Breathwork | Recovery | Pro | Anxiety -22% |
| 12 | Cold Exposure | Recovery | Pro | Dopamine +250% |
| 13 | Alcohol Management | Optimization | Elite | REM preservation |
| 14 | Dopamine Management | Optimization | Elite | Sensitivity maintenance |
| 15 | Supplements | Optimization | Elite | Selective enhancement |
| 16 | HRV Management | Meta | Elite | Recovery optimization |
| 17 | Weekly Reflection | Meta | Elite | Consistency metrics |
| 18 | Social Accountability | Meta | Elite | Adherence enhancement |

## Appendix B: Environment Variables

```bash
# Firebase
FIREBASE_PROJECT_ID=wellness-os-app
FIREBASE_CLIENT_EMAIL=<service-account-email>
FIREBASE_PRIVATE_KEY=<private-key>

# Supabase
SUPABASE_URL=https://vcrdogdyjljtwgoxpkew.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_JWT_SECRET=<jwt-secret>

# Vertex AI
GOOGLE_CLOUD_PROJECT=wellness-os-app
GOOGLE_APPLICATION_CREDENTIALS=<path-to-service-account-json>

# Pinecone
PINECONE_API_KEY=<api-key>
PINECONE_INDEX=wellness-protocols
PINECONE_HOST=<index-host-url>

# Wearables (v7)
OURA_CLIENT_ID=<client-id>
OURA_CLIENT_SECRET=<client-secret>
OURA_WEBHOOK_SECRET=<webhook-secret>
FITBIT_CLIENT_ID=<client-id>
FITBIT_CLIENT_SECRET=<client-secret>

# Encryption
TOKEN_ENCRYPTION_KEY=<aes-256-key>

# RevenueCat
REVENUECAT_API_KEY=<api-key>
REVENUECAT_WEBHOOK_SECRET=<webhook-secret>
```

## Appendix C: Nudge Copy Examples

### Good Examples

| Context | Headline | Body |
|---------|----------|------|
| Morning, high recovery | "Full Protocol Day" | "Recovery 78%. Green light for intensity. Start with morning light." |
| Afternoon, meeting ending | "Post-Meeting Movement" | "Meeting over. 10-min walk now prevents afternoon crash. Zone 2 pace." |
| Evening, late | "Caffeine Cutoff Passed" | "It's 3pm. Based on your 11pm target, caffeine now delays sleep ~45 min." |
| Low recovery | "MVD Active" | "Recovery 34%. Three protocols today. That's enough." |
| Heavy calendar | "Big Meeting Day" | "6 hours of meetings. Foundation focus today. One walking break if possible." |

### Bad Examples (Do NOT Use)

| Bad | Why |
|-----|-----|
| "Great job on your streak!" | Gamification language |
| "You might want to consider trying morning light" | Weak, indirect |
| "Studies show morning light helps" | No specific citation |
| "Keep crushing it!" | Cheerleader, not coach |
| "Most people benefit from hydration" | Not personalized |

## Appendix D: Database Migrations (Phase 3)

```sql
-- v7: Wearable Integrations
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('oura', 'apple_health', 'health_connect', 'garmin', 'fitbit', 'whoop', 'manual')),
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT[],
  webhook_channel_id TEXT,
  webhook_resource_id TEXT,
  webhook_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- v7: User Baselines
CREATE TABLE user_baselines (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  hrv_ln_mean REAL,
  hrv_ln_std_dev REAL,
  hrv_coefficient_of_variation REAL,
  hrv_method TEXT DEFAULT 'rmssd',
  hrv_sample_count INTEGER DEFAULT 0,
  rhr_mean REAL,
  rhr_std_dev REAL,
  rhr_sample_count INTEGER DEFAULT 0,
  respiratory_rate_mean REAL,
  respiratory_rate_std_dev REAL,
  sleep_duration_target INTEGER,
  temperature_baseline_celsius REAL,
  confidence_level TEXT DEFAULT 'low',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- v7: Daily Metrics Expansion
ALTER TABLE daily_metrics
ADD COLUMN IF NOT EXISTS hrv_method TEXT,
ADD COLUMN IF NOT EXISTS bedtime_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bedtime_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rem_percentage REAL,
ADD COLUMN IF NOT EXISTS deep_percentage REAL,
ADD COLUMN IF NOT EXISTS light_percentage REAL,
ADD COLUMN IF NOT EXISTS awake_percentage REAL,
ADD COLUMN IF NOT EXISTS respiratory_rate_avg REAL,
ADD COLUMN IF NOT EXISTS temperature_deviation REAL,
ADD COLUMN IF NOT EXISTS recovery_confidence REAL,
ADD COLUMN IF NOT EXISTS recovery_zone TEXT,
ADD COLUMN IF NOT EXISTS active_calories INTEGER,
ADD COLUMN IF NOT EXISTS raw_payload JSONB;

-- v7: Calendar Context
CREATE TABLE calendar_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meeting_minutes INTEGER DEFAULT 0,
  meeting_count INTEGER DEFAULT 0,
  meeting_load TEXT DEFAULT 'light',
  busy_periods JSONB DEFAULT '[]',
  longest_free_block INTEGER,
  morning_free_until TIMESTAMPTZ,
  source TEXT DEFAULT 'manual',
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- v7: Webhook Events (Idempotency)
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  user_external_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  raw_payload JSONB,
  processed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_integrations_user ON user_integrations(user_id);
CREATE INDEX idx_calendar_context_user_date ON calendar_context(user_id, date);
CREATE INDEX idx_webhook_events_status ON webhook_events(status) WHERE status = 'pending';
```

---

## Document Changelog

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 6.0 | 2025-12-02 | Complete standalone rewrite incorporating Dec 2025 competitive landscape, AI-optimized structure, market data updates | Human-AI Collaboration |
| 7.0 | 2025-12-03 | Phase III integration: Wearable Sync, Recovery Engine, Calendar Integration, Reasoning UX, Lite Mode | Human-AI Collaboration |

---

*This document is the single source of truth for Apex OS. All implementation should reference this PRD. When in doubt, check the PRD.*
