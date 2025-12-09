# APEX OS: Product Requirements Document v8.1

> **"Evidence Made Effortless"**

**Version:** 8.1 — Vision & Requirements
**Date:** December 7, 2025
**Status:** Canonical
**Target:** January 1, 2026 MVP Launch

---

# PART 1: Vision & Mission

## 1.1 What Apex OS Is

Apex OS is an **AI-native wellness operating system** that transforms peer-reviewed protocols into personalized daily actions. It's the "Bloomberg Terminal for the Body" — data-dense, evidence-based, and designed for professionals who already track their health but want something more than raw metrics.

**We are:**
- An ambient intelligence that observes, reasons, and guides
- A synthesis engine that connects protocols to outcomes
- A reasoning layer that explains WHY, not just WHAT

**We are NOT:**
- A gamified habit tracker (no streaks, badges, leaderboards)
- A replacement for medical advice
- A hardware company (we work with YOUR wearables)

## 1.2 The Problem We Solve

**The Optimized Professional** (founders, executives, knowledge workers, athletes):
- Already tracks health with Oura, WHOOP, Apple Watch, Garmin
- Listens to Huberman, reads the research, knows the protocols
- Frustrated by apps that track but don't guide
- Overwhelmed by conflicting advice and protocol overload
- Wants to know: "What should I do TODAY, given MY data?"

**Current solutions fail because:**
- Hardware-locked (Oura only works with Oura, WHOOP only with WHOOP)
- Black-box recommendations (no explanation of reasoning)
- Notification fatigue (8-12 push notifications/day)
- Gamification that insults intelligence (streaks, points, leaderboards)
- No adaptation to bad days (all-or-nothing abandonment)

## 1.3 Our Unique Approach

| Competitor Approach | Apex OS Approach |
|---------------------|------------------|
| Hardware lock-in | Multi-wearable (Oura, WHOOP, Apple, Garmin, Fitbit, none) |
| Black-box AI | "Why?" layer on every recommendation |
| 8-12 notifications/day | 3-5 max with 9-rule suppression engine |
| Streaks and badges | Consistency indicators (5/7, factual not pressuring) |
| All-or-nothing | MVD (Minimum Viable Day) adapts to struggle |
| Gated protocols | All 18 protocols free; monetize features |

## 1.4 Target User: The Optimized Professional

**Demographics:**
- Age: 28-45
- Income: $100K+
- Already uses wearables (2+ years experience)
- Listens to Huberman Lab, reads research papers
- Time-starved but health-conscious

**Psychographics:**
- Values evidence over anecdote
- Skeptical of "wellness woo"
- Prefers data-dense interfaces (doesn't need hand-holding)
- Respects their time (no fluff, no cheerleader energy)
- Travels frequently (needs flexibility, not guilt)

**Their voice:**
> "I have all this data but no idea what to do with it. I've tried every protocol from Huberman but I don't know what's working. I need something that connects the dots for me."

## 1.5 Competitive Positioning (Why We Win)

### Apex OS vs. Competitors

| Factor | Oura Advisor | WHOOP Coach | Apple Health+ | **Apex OS** |
|--------|-------------|-------------|---------------|-------------|
| Multi-wearable | ❌ | ❌ | ❌ | ✅ |
| Evidence citations (DOI) | ❌ | ❌ | ❌ | ✅ |
| Notification suppression | ❌ | ❌ 8-12/day | ? | ✅ 3-5/day |
| "Why?" transparency | △ | △ | ? | ✅ Every recommendation |
| Ecosystem agnostic | ❌ | ❌ | ❌ | ✅ |
| Year 1 cost | $371-621 | $638 | Unknown | **$348** |

**Our moat:** Multi-wearable support + evidence transparency + notification discipline. No competitor offers all three.

---

# PART 2: Core Philosophy

## 2.1 Evidence Transparency

Every recommendation includes a "Why?" layer:

```
Panel 1: Mechanism — How it works biologically
Panel 2: Evidence — DOI citation, study summary
Panel 3: Your Data — How this applies to you specifically
Panel 4: Confidence — How certain we are (Low/Medium/High)
```

**Confidence Levels:**
- **High (>0.8):** 14+ days of data, strong correlation
- **Medium (0.6-0.8):** 7-14 days, emerging pattern
- **Low (<0.6):** Insufficient data, general guidance

**Confidence is calculated from 5 factors:** data days available, correlation strength (Pearson r), baseline stability, user data volatility, and extrapolation risk. See `APEX_OS_TECHNICAL_SPEC_v1.md` Section 3.2 for implementation details.

**We say "I don't know" when we don't know.** Honesty > overconfidence.

## 2.2 Subtle Engagement (Not Gamification)

**We don't use:**
- Streaks ("Don't break your streak!" creates anxiety)
- Badges (patronizing to professionals)
- Leaderboards (demotivates 99% of users)
- Points/XP (overjustification effect)

**We do use:**
- Consistency indicators ("Morning Light: 5/7 this week" — factual, not pressuring)
- Outcome attribution ("Cold plunge correlated with +12% HRV this week")
- Personal progress markers (baseline improvements over time)
- Subtle milestones (Day 30 badge visible in profile, no pop-up)

**The test:** "Would a busy founder, traveling for business, feel guilty or supported by this?"

## 2.3 Notification Discipline

**The 9-Rule Suppression Engine:**

| Rule | Condition | Action |
|------|-----------|--------|
| Recovery Threshold | Recovery >75% | Max 2 nudges/day |
| Calendar Load | >4 hours meetings | Quiet mode + MVD |
| App Active | Used in last 30 min | No nudges |
| Quiet Hours | 10pm-7am default | No nudges |
| Meeting Detection | In meeting | Defer 30 min |
| Fatigue Detection | 3+ dismissed | Back off 4 hours |
| Recent Completion | Done in last 2 hours | No repeat nudge |
| Daily Cap | 5 sent today | No more today |
| User Preference | Category disabled | Never nudge |

**Result:** 3-5 high-value nudges/day vs. competitor's 8-12.

## 2.4 Multi-Wearable Freedom

Users shouldn't be locked into hardware. We support:
- **Oura Ring** — Cloud API + Webhooks
- **Apple HealthKit** — On-device integration
- **Google Health Connect** — Android on-device
- **Fitbit** — Cloud API
- **WHOOP** — Planned (enterprise partnership)
- **Garmin** — Planned (commercial license)
- **None (Lite Mode)** — Manual check-ins

**Lite Mode:** Users without wearables can still use Apex OS through daily self-reported check-ins. Recovery score calculates from subjective inputs.

## 2.5 Professional Respect

**Tone: Direct, data-focused, no cheerleader energy.**

| Don't | Do |
|-------|-----|
| "Great job! You're doing amazing!" | "HRV up 8%. Protocol working." |
| "Don't forget your morning routine!" | "Morning Light. 10 min. Now." |
| "You're on a 12-day streak!" | "Morning Light: 12 consecutive days." |

**Two tone options (user-selected):**
- **Direct:** Terse, data-first ("Your HRV dropped 15%.")
- **Supportive:** Warm, encouraging ("I noticed your HRV is a bit lower today.")

Default: Direct (matches target user profile).

---

# PART 3: User Journey

## 3.1 Day 0: Discovery & Download

**How they find us:**
- Huberman mentions, podcast appearances
- "Oura alternative" / "WHOOP alternative" searches
- Word of mouth from optimized peers
- "Best wellness app for busy professionals" searches

**First impression:** App Store listing emphasizes:
- Multi-wearable support
- Evidence-based protocols
- "Bloomberg Terminal meets Calm" design aesthetic
- No streaks or gamification

## 3.2 Day 1: Onboarding (3-4 Minutes, Magic Moment in 30 Seconds)

**3-Screen Flow:**

**Screen 1: Welcome + Goals (1 min)**
- AI Coach introduces itself briefly
- "What brings you here?" (open-ended)
- Multi-goal selection: Better Sleep, More Energy, Sharper Focus, Faster Recovery, Stress Resilience, Peak Performance
- Tone preference: Direct vs Supportive

**Screen 2: Quick Assessment (1 min)**
- Current tracking tools (Oura, WHOOP, Apple Watch, None)
- Experience level (Beginner, Intermediate, Advanced)
- "Based on your goals, here's your first protocol..."

**Screen 3: Setup + Magic Moment (1-2 min)**
- Show recovery score immediately (even estimated)
- Present first protocol with science snippet
- Wearable connection (optional, can skip)
- "Ready to start?"

**Critical:** User sees personalized recovery score + first protocol within 30 seconds of completing onboarding. This is the #1 predictor of Day 7 retention.

## 3.3 Days 1-7: First Week Experience

| Day | User Expectation | Apex Delivers |
|-----|------------------|---------------|
| 1 | Immediate value | Recovery score + Morning Anchor + first protocol completion |
| 2-3 | Something personal | "Based on 2 days, your sleep quality is tracking at X" |
| 4-5 | First insight | "Based on 4 days, your optimal caffeine cutoff appears to be 2pm" |
| 6-7 | Pattern recognition | "You recovered 15% faster on days with morning light exposure" |

**77% of users abandon within the first week.** These touchpoints prevent that.

## 3.4 Days 8-30: Personalization Deepens

- Full correlation engine activates (14+ days of data)
- Weekly Synthesis arrives (Day 7, 14, 21, 28)
- Protocol recommendations become highly personalized
- Confidence levels increase from Low → Medium → High
- "Why?" panels show user-specific data

## 3.5 Day 30+: Mastery & Outcomes

- User can articulate: "This protocol works for me because..."
- Baseline improvements are visible (HRV up X%, sleep duration +Y min)
- Protocol library feels personalized (favorites, dismissed, in-progress)
- Weekly Synthesis is anticipated, not ignored
- User becomes advocate (shares Evidence Cards, recommends to peers)

---

# PART 4: Core Experiences (What Success Looks Like)

## 4.1 Morning Anchor

**The first 30 seconds of the day set the tone.**

User wakes up. Opens Apex OS. Sees:

1. **Recovery Score** (72, Moderate) — Animates on load
2. **Why This Score** — One-tap to see breakdown (HRV, RHR, Sleep)
3. **Today's Protocols** — Prioritized list, adapted to recovery level
4. **Quick Chat** — "Ask me anything about today's plan"

**Recovery Score Algorithm:**
```
Recovery = (HRV × 0.40) + (RHR × 0.25) + (SleepQuality × 0.20) + (SleepDuration × 0.10) + (RespiratoryRate × 0.05) - TempPenalty
```
- **Green (75-100):** Full protocol day, high intensity OK
- **Yellow (40-74):** Normal day, moderate intensity
- **Red (0-39):** MVD activation, foundation protocols only

See `APEX_OS_TECHNICAL_SPEC_v1.md` Section 3.1 for full algorithm details including baseline calculations and edge case handling.

**What success looks like:**
- User knows within 10 seconds: "Today is a [push/moderate/recovery] day"
- First protocol completion happens within 30 minutes of waking
- No decision fatigue — Apex decided for them

## 4.2 Ambient Intelligence (Nudges)

**3-5 nudges per day, perfectly timed, contextually relevant.**

Examples:
- 7:15am: "Morning Light. 10 min on balcony. Your HRV will thank you."
- 1:45pm: "Caffeine cutoff in 15 min. Last chance for coffee."
- 6:30pm: "Evening Light. 15 min walk. Primes melatonin for tonight."
- 9:30pm: "Screen dim time. Blue light affects your sleep 2+ hours."

**What success looks like:**
- User doesn't disable notifications (unlike WHOOP)
- Nudges feel helpful, not nagging
- Protocol adherence increases week-over-week

## 4.3 Closed Loop (Protocol → Feedback → Correlation)

**Every protocol has a measurable outcome.**

1. User completes Cold Plunge (3 min)
2. Next morning: "Your HRV was 8% higher than your 7-day baseline after yesterday's cold plunge."
3. Over 14 days: "Cold plunge correlates with +12% HRV improvement (High confidence, 14 data points)"

**What success looks like:**
- User can explain which protocols work FOR THEM
- Correlation cards become shareable proof
- Protocol adherence is driven by visible outcomes, not guilt

## 4.4 Minimum Viable Day (MVD)

**When life gets hard, Apex adapts.**

**Triggers (6 conditions):**
1. **Recovery score <35%** — Red zone activation
2. **Calendar load 6+ hours** — Heavy meeting day
3. **User manually activates** — "Struggling today" button
4. **Travel >2h timezone change** — Jetlag detection
5. **Consistency drop** — 3+ consecutive missed days
6. **Illness indicators** — Respiratory rate +3bpm OR temp +0.5°C from baseline

MVD reduces protocols to 3 essentials:
1. Morning Light (10 min) — Non-negotiable circadian anchor
2. Hydration Check — Simple, no effort
3. Earlier Bedtime — Protect sleep, recover tomorrow

See `APEX_OS_TECHNICAL_SPEC_v1.md` Section 3.3 for MVD detection logic and protocol sets (Full MVD, Semi-Active MVD, Travel MVD).

**What success looks like:**
- User doesn't quit on hard days
- Adherence on MVD days is 70%+ (vs. 0% abandonment)
- User feels supported, not judged

## 4.5 Weekly Synthesis

**Every Sunday: A narrative of your week.**

Structure (5 sections):
1. **WIN:** "Your HRV improved 8% after consistent Morning Light (6/7 days)."
2. **WATCH:** "Sleep duration dropped 22 min avg. Consider earlier bedtime."
3. **PATTERN:** "Cold plunge on recovery days correlates with next-day productivity. (Medium confidence)"
4. **TRAJECTORY:** "At this rate, you'll hit 7.5 hour sleep average by end of month."
5. **EXPERIMENT:** "Try caffeine cutoff at 1pm instead of 2pm this week. Track sleep quality."

**What success looks like:**
- 70%+ of users open Weekly Synthesis
- Users reference insights in conversation ("Apex told me...")
- Experiments drive engagement (curiosity > obligation)

---

# PART 5: Design System

## 5.1 Visual Identity: "Bloomberg Terminal meets Calm"

**Core tension:** Data-dense but serene. Information-rich but not overwhelming.

**Inspiration:**
- Bloomberg Terminal: Professional, data-forward, trusts user intelligence
- Calm/Headspace: Dark mode, breathing space, intentional simplicity
- Linear: Clean, fast, no wasted pixels

## 5.2 Color Palette & Typography

**Backgrounds:**
| Surface | Hex | Use |
|---------|-----|-----|
| Canvas | #0F1218 | App background |
| Surface | #181C25 | Cards, modals |
| Elevated | #1F2430 | Raised elements |
| Subtle | #2A303D | Borders, dividers |

**Text:**
| Type | Hex | Use |
|------|-----|-----|
| Primary | #F6F8FC | Headlines, important text |
| Secondary | #A7B4C7 | Body text |
| Muted | #6C7688 | Captions, labels |
| Disabled | #4A5568 | Inactive states |

**Accents:**
| Color | Hex | Use |
|-------|-----|-----|
| Primary (Teal) | #63E6BE | CTAs, active states, progress |
| Secondary (Blue) | #5B8DEF | Links, secondary actions |
| Success | #4ADE80 | Positive states |
| Warning | #FBBF24 | Caution states |
| Error | #F87171 | Error states |

**Typography:**
- Display: 48/36, 700 weight (hero headlines)
- H1: 32/28, 700 weight (screen titles)
- H2: 24/22, 600 weight (section headers)
- Body: 16, 400 weight (standard content)
- Caption: 12, 500 weight (labels, hints)
- Metric: 56/44, 700 weight (large data displays)

## 5.3 Animation Philosophy

**Purposeful motion, not decoration.**

| Interaction | Duration | Easing | Effect |
|-------------|----------|--------|--------|
| Button press | 100ms | linear | scale(0.97) |
| Card press | 100ms | linear | scale(0.98) |
| Screen entry | 250ms | ease-out | fadeIn + translateY |
| Modal appear | 250ms | spring | scale(0.95→1) + fadeIn |
| Data count-up | 300ms | ease-out | number animation |
| Card stagger | 50ms between | ease-out | sequential reveal |

**Rules:**
- Never exceed 350ms for any animation
- Use spring easing for natural feel
- Stagger reveals create visual hierarchy
- Loading states always have subtle motion

## 5.4 Component Patterns

**Cards:**
- Surface background (#181C25)
- 1px subtle border (#2A303D)
- 16px internal padding
- 12px border radius
- Press state: scale(0.98)

**Buttons:**
- Primary: Teal background, dark text
- Secondary: Surface background, teal text
- Minimum height: 44px (touch target)
- Press state: scale(0.97), 100ms

**Inputs:**
- Surface background
- 1px border (subtle → teal on focus)
- 16px padding
- Clear error states (red border + message)

## 5.5 Screen-by-Screen Experience Goals

| Screen | Primary Goal | Key Metrics |
|--------|--------------|-------------|
| Home | Know today's plan in 10 seconds | Recovery score visible, first protocol prominent |
| Protocols | Discover and understand protocols | All 18 visible, evidence on tap |
| Insights | See patterns and progress | Weekly Synthesis, correlations |
| Chat | Get personalized guidance | Response <2s, answers are actionable |
| Profile | Control preferences | Settings accessible, wearables manageable |

---

# PART 6: AI Personality & Behavior

## 6.1 Tone: Professional, Direct, Data-Driven

**The AI Coach is not a cheerleader.** It's a trusted advisor who respects the user's intelligence and time.

**Voice characteristics:**
- Concise (150-200 words max per response)
- Data-first (leads with metrics, not feelings)
- Evidence-based (cites studies when relevant)
- Honest (admits uncertainty, says "I don't know")

## 6.2 Response Characteristics

**Every response should be:**

1. **DATA-DRIVEN:** Reference specific metrics when available
   - ✅ "Your HRV improved 12% this week"
   - ❌ "You're doing great!"

2. **ACTIONABLE:** End with 1-2 concrete steps
   - ✅ "Try moving caffeine cutoff to 1pm tomorrow"
   - ❌ "Consider your caffeine timing"

3. **CONCISE:** Maximum 150-200 words
   - ✅ Direct answer + one supporting detail + action
   - ❌ Long explanations, multiple tangents

4. **EVIDENCE-BASED:** Cite studies when relevant
   - ✅ "Balban et al. 2023 showed cyclic sighing reduces stress in 5 minutes"
   - ❌ "Studies show breathing helps with stress"

5. **HONEST:** Say when uncertain
   - ✅ "I don't have enough data to answer that confidently yet"
   - ❌ Making up an answer to sound helpful

## 6.3 What AI Should Never Do

**FORBIDDEN:**
- Medical diagnosis ("You might have sleep apnea")
- Prescription advice ("You should take X medication")
- Therapy or mental health treatment ("Let's talk about your anxiety")
- Claims of certainty without data ("This will definitely work")
- Cheerleader energy ("Amazing! You're crushing it!")

**ALLOWED:**
- Wellness protocols and habit optimization
- Performance metrics interpretation
- Evidence-based recommendations
- Acknowledgment of limitations
- Referrals to professionals when appropriate

## 6.4 Tone Customization (Direct vs Supportive)

**Direct Tone (Default):**
| Context | Example |
|---------|---------|
| Greeting | "Good morning. Recovery at 68%." |
| Nudge | "Cold plunge. 3 min. Now." |
| Feedback | "Skipped Morning Light. Pattern emerging." |
| Celebration | "HRV up 8%. Protocol working." |

**Supportive Tone:**
| Context | Example |
|---------|---------|
| Greeting | "Good morning! Your recovery is looking good at 68%." |
| Nudge | "Ready for a cold plunge? 3 minutes when you're ready." |
| Feedback | "I noticed you missed Morning Light today. Busy morning?" |
| Celebration | "Great progress! Your HRV improved 8% this week." |

User selects during onboarding, can change anytime in Settings.

## 6.5 Safety Constraints

**Crisis Detection:** All user inputs are scanned for 18+ crisis keywords (suicide, self-harm, etc.). If detected, Gemini 2.5 Flash analyzes context. Confirmed crisis triggers:
- AI response blocked
- Crisis resources displayed (988 Lifeline, Crisis Text Line)
- Incident logged for safety review

**AI Output Scanning:** All Gemini responses are scanned before display for medical advice, harmful content, and overconfident claims.

**Absolute Prohibitions:**
- Medical diagnosis
- Prescription advice
- Therapy or mental health treatment
- Claims of certainty without supporting data

See `APEX_OS_TECHNICAL_SPEC_v1.md` Section 7 for full safety implementation details.

---

# PART 7: MVP Scope (January 1, 2026)

## 7.1 What Ships

**Core Experiences:**
- ✅ Morning Anchor (recovery score + protocols at wake)
- ✅ Ambient Intelligence (3-5 nudges/day with 9-rule suppression)
- ✅ Closed Loop (protocol → feedback → correlation)
- ✅ Minimum Viable Day (automatic adaptation to struggle)
- ✅ Weekly Synthesis (5-section narrative insights)

**Enhanced Features:**
- ✅ Conversational Onboarding (3-4 min, multi-goal)
- ✅ Full Protocol Library (all 18 protocols accessible)
- ✅ Optimized AI Chat (concise, data-driven, context-rich)
- ✅ Chat History Persistence
- ✅ Tone Customization (Direct vs Supportive)

**Technical:**
- ✅ Wearable Sync (Oura, Apple, Health Connect, Fitbit)
- ✅ Recovery Score Calculation (wearable + Lite Mode)
- ✅ Calendar Integration (meeting detection for MVD)
- ✅ Push Notifications (with suppression engine)
- ✅ RevenueCat Subscription (3-tier)

**Implementation Reference:** For detailed algorithm specifications, API endpoints, component architecture, and test coverage, see `APEX_OS_TECHNICAL_SPEC_v1.md`.

## 7.2 What Defers

**Phase 1.1 (January 15-31):**
- Conversation memory in AI chat (last 3 messages as context)
- Enhanced feedback collection (micro-feedback on responses)
- Component refactoring (RecoveryScoreCard split)
- Animation polish standardization audit

**Phase 2 (February+):**
- Voice Interaction (Pro tier)
- Evidence Cards (shareable visual assets)
- Conversational Customization (settings via natural language)
- Advanced Analytics (data export, multi-protocol insights)
- Social Features (clubs, kudos, peer learning)

## 7.3 Success Criteria

**Launch is successful if:**
- [ ] All 21 screens functional and polished
- [ ] AI Chat responses are 150-200 words, data-driven
- [ ] Onboarding completes in 3-4 minutes
- [ ] All 18 protocols accessible (not tier-gated)
- [ ] Recovery scoring works for all wearables + Lite Mode
- [ ] Weekly Synthesis generates and is well-received
- [ ] Nudge suppression limits to 3-5/day
- [ ] TypeScript compiles with no errors
- [ ] E2E tests passing

## 7.4 Retention Targets

| Metric | Target | Good | Red Flag |
|--------|--------|------|----------|
| Day 1 Retention | **90%** | 80% | <70% |
| Day 7 Retention | **75%** | 60% | <50% |
| Day 30 Retention | **50%** | 40% | <25% |
| Onboarding Completion | **90%** | 85% | <70% |
| Day 1 Protocol Completion | **70%** | 50% | <30% |

---

# PART 8: Protocol Library & Science

## 8.1 Protocol Categories

| Category | Protocols | Focus |
|----------|-----------|-------|
| **Foundation** | Morning Light, Evening Light, Sleep Hygiene, Hydration, Movement | Circadian, basics |
| **Performance** | Cold Exposure, Breathing, Focus Protocols, Caffeine Timing | Optimization |
| **Recovery** | Sauna, Contrast Therapy, Sleep Extension, Rest Days | Restoration |
| **Stress** | NSDR, Box Breathing, Nature Exposure, Social Connection | Resilience |
| **Advanced** | Supplement Stacks, Fasting Windows, Heat Adaptation | Power users |

**All 18 protocols accessible in free tier.** Monetization is on features (voice, Evidence Cards), not content.

## 8.2 Synergies & Stacking

| Stack | Protocols | Effect | Evidence |
|-------|-----------|--------|----------|
| Sleep Optimization | Morning Light + Evening Light | 60% greater circadian shift | Khalsa et al. 2003 |
| Morning Energy | Light → Movement → Hydration → Caffeine | Sequential activation | Huberman 2023 |
| Recovery Enhancement | Sauna + Contrast (post-workout) | Superior to cold alone | Laukkanen et al. 2015 |
| Focus Stack | Light → Lion's Mane → 90-min work | Stacked cognitive benefit | Multiple studies |

## 8.3 Dangerous Combinations

| Combination | Risk | Separation |
|-------------|------|------------|
| Cold + Resistance Training | Blunts hypertrophy 10-15% | 4+ hours |
| High-Intensity + Sleep | Suppresses REM | 4+ hours before bed |
| Multiple Dopamine Spikes | Tolerance, baseline drop | 1-2 per day max |
| Cold + Immediately Post-Sauna | Blunts heat shock proteins | 20+ min |

**The app prevents dangerous combinations.** If user completes resistance training, cold exposure is hidden for 4 hours.

## 8.4 Evidence Standards

Every protocol includes:
- **Mechanism:** How it works biologically
- **Evidence:** DOI citation, study summary
- **Dosage:** Duration, intensity, frequency
- **Constraints:** When NOT to do it
- **Confidence:** Our certainty level (Low/Medium/High)

---

# PART 9: Future Vision (Phase 1.1, Phase 2)

## 9.1 Voice Interaction (Pro Tier)

**Phase 2: February+**

- Button-activated (not wake-word) for privacy
- Speech-to-text (Deepgram for latency)
- Text-to-speech (ElevenLabs for quality)
- <800ms round-trip target
- Same personality, just spoken

**Use cases:**
- "What should I do today?" (hands-free Morning Anchor)
- "Log my cold plunge" (quick capture)
- "Why is my HRV low?" (contextual inquiry)

## 9.2 Evidence Cards (Pro Tier)

**Phase 2: February+**

Shareable visual assets that prove progress:

**Card Types:**
- **Correlation Flex:** "Cold plunge → +12% HRV" with chart
- **Bio-Receipt:** "This week: 7.2hr avg sleep, 65 HRV baseline"
- **Mechanism Reveal:** "How Morning Light affects your circadian rhythm"

**Platform-specific copy:**
- LinkedIn: Professional framing ("How I improved focus by 15%")
- Instagram: Visual-first, lifestyle aesthetic
- Twitter: Contrarian data ("Everyone says 8 hours, my data says 7.2 is optimal")

**Privacy controls:** Hide absolute values, show only percentages.

## 9.3 Social Features (Phase 2+)

- **Clubs:** Small groups (5-15) with shared goals
- **Kudos:** Non-competitive encouragement
- **Peer Patterns:** "12% of users like you also do X"
- **Anonymous Insights:** Population-level learnings

**No leaderboards.** Relatedness without competition.

## 9.4 Advanced Analytics (Phase 2+)

- **Data Export:** CSV, JSON for power users
- **Multi-Protocol Insights:** Which stacks work best for YOU
- **Prediction Models:** "If you continue X, expect Y by Z"
- **Custom Correlations:** User-defined tracking

## 9.5 Widgets & Ambient Surfaces (Phase 2+)

**Detailed specifications:** See `APEX_OS_WIDGET_PRD_v1.md` for complete widget design system, platform-specific implementations, interaction patterns, and analytics requirements.

Widgets extend the Morning Anchor experience to native OS surfaces — lock screen, home screen, StandBy mode, and Live Activities. They are **ambient retention infrastructure**: users check their phone 50-150× daily, and widgets create passive awareness without app open.

**Widget Philosophy:**
- Operating System, Not App — Widgets feel like native health infrastructure
- Evidence Made Effortless — Tap any metric → see WHY with citation
- Ambient, Not Annoying — Refresh ≤5×/day; no animations

**iOS Surfaces (Phase 2):**
| Surface | Content | Priority |
|---------|---------|----------|
| Lock Screen (Rectangular) | Recovery % + next protocol | High |
| Lock Screen (Circular) | Recovery score only | Medium |
| Home Screen (Small) | Recovery + action button | High |
| Home Screen (Medium) | Full protocol list | Medium |
| StandBy Mode | Full Morning Anchor | Low |
| Live Activities | Protocol timer (Dynamic Island) | Low |

**Android Surfaces (Phase 2):**
| Surface | Content | Priority |
|---------|---------|----------|
| Home Screen (2×1) | Recovery score only | High |
| Home Screen (3×2) | Recovery + next protocol | High |
| Home Screen (4×3) | Full Morning Anchor | Medium |
| Lock Screen (Android 14+) | Recovery + protocol | Medium |

**Widget Copy Rules:**
- Direct, not cheerful: "Recovery 72%" not "Great recovery today!"
- Data-specific: "HRV +8% vs baseline" not "Your HRV is looking good"
- Concise: ≤6 words per line
- No emojis, use SF Symbols

**Implementation Phases:**
- Phase 2A: iOS Lock Screen + Home Screen Small
- Phase 2B: iOS Medium + Interactive + Android Glance
- Phase 2C: StandBy + Live Activities

---

# APPENDIX A: Technical Architecture (Reference)

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native + Expo 54, TypeScript |
| State | Zustand |
| Navigation | React Navigation 6.x |
| Animation | React Native Reanimated |
| Backend | Google Cloud Functions Gen 2 |
| AI | Vertex AI (Gemini 2.5 Flash) |
| Database | Supabase (PostgreSQL 15) + Firebase |
| Vector DB | Pinecone |
| Payments | RevenueCat |

## Database Pattern

- **READ** from Supabase (PostgreSQL) — History, profiles, analytics
- **WRITE** to Firebase (Firestore) — Real-time UI updates, nudges, logs

---

# APPENDIX B: Research Synthesis (Key Insights)

**From 16 Perplexity Research Documents:**

1. **Retention:** Day 30 industry average is 5-7%. Target 50%.
2. **First Week:** 77% of users abandon in Week 1. Magic moment in 30 sec prevents this.
3. **Notifications:** WHOOP sends 8-12/day. Users disable all. 3-5/day max.
4. **Gamification:** Streaks cause anxiety. Consistency indicators (5/7) work better.
5. **Evidence:** No competitor shows DOI citations. This is our moat.
6. **Multi-Wearable:** Every competitor is hardware-locked. Major opportunity.
7. **Onboarding:** 3-4 min optimal. 5+ min = 25%+ drop-off.
8. **Pricing:** $14.99/mo Pro tier is sweet spot. Annual at 17% discount.

Full synthesis: `STRATEGIC_SYNTHESIS.md`

---

# APPENDIX C: Competitive Analysis Matrix

| Factor | Oura | WHOOP | Apple Health+ | **Apex OS** |
|--------|------|-------|---------------|-------------|
| Multi-wearable | ❌ | ❌ | ❌ | ✅ |
| DOI citations | ❌ | ❌ | ❌ | ✅ |
| Notification suppression | ❌ | ❌ | ? | ✅ 9-rule engine |
| "Why?" on recommendations | △ | △ | ? | ✅ 4-panel |
| No gamification | ❌ Streaks | ❌ Streaks | ? | ✅ Consistency |
| Adapts to struggle (MVD) | ❌ | ❌ | ❌ | ✅ |
| Year 1 cost | $371-621 | $638 | ? | **$348** |

---

# APPENDIX D: Document References

| Document | Purpose | Location |
|----------|---------|----------|
| `APEX_OS_TECHNICAL_SPEC_v1.md` | Implementation details: algorithms, APIs, components, test coverage | PRD Documents/ |
| `APEX_OS_WIDGET_PRD_v1.md` | Widget specifications for iOS/Android | PRD Documents/ |
| `Master_Protocol_Library.md` | 18 protocols with evidence citations (DOI) | Project root |
| `CLAUDE.md` | Development guidelines for AI architect | Project root |
| `STATUS.md` | Session state and progress tracking | Project root |
| `STRATEGIC_SYNTHESIS.md` | Research synthesis from Perplexity papers | PRD Documents/Perplexity Research Papers/ |

---

# APPENDIX E: Biometric Profile Collection

## Purpose

Biometric data enables personalized protocol recommendations and accurate HRV baseline calibration. Collected during onboarding and editable from Profile settings.

## Data Collected

| Field | Purpose | Storage | Validation |
|-------|---------|---------|------------|
| `birth_date` | Age-based HRV baseline adjustment | DATE | 16-120 years old |
| `biological_sex` | HRV baseline calibration (male/female differ by ~10ms) | TEXT | male, female, prefer_not_to_say |
| `height_cm` | BMI context for protocol dosing | SMALLINT | 50-300 cm |
| `weight_kg` | Protocol dosing, supplement recommendations | DECIMAL(5,2) | 20-500 kg |
| `timezone` | Nudge scheduling at appropriate local times | TEXT | IANA timezone string |

## Privacy Considerations

- All biometric fields are **optional** (nullable in database)
- User can skip during onboarding without blocking progress
- Editable anytime from Profile → Biometric Profile
- Weight tracking includes `weight_updated_at` for longitudinal analysis
- Data never shared externally; used only for personalization

## Age-Based HRV Adjustments

| Age Range | Typical Baseline HRV | Adjustment Factor |
|-----------|---------------------|-------------------|
| 18-29 | 55-105 ms | 1.0 |
| 30-39 | 45-90 ms | 0.95 |
| 40-49 | 35-80 ms | 0.90 |
| 50-59 | 25-70 ms | 0.85 |
| 60+ | 20-60 ms | 0.80 |

*Note: Factors applied to recovery score calculations when HRV data available.*

## Biological Sex HRV Calibration

Research indicates average HRV differs by sex:
- **Male baseline:** 50-80 ms typical
- **Female baseline:** 40-70 ms typical

Protocol recommendations account for these baseline differences when calculating recovery zones.

## Implementation

- **Onboarding:** BiometricProfileScreen (optional step after Goal Selection)
- **Settings:** ProfileScreen → BiometricSettingsScreen
- **Backend:** POST /api/onboarding/complete, PATCH /api/users/me
- **Database:** users table columns with trigger for weight_updated_at

---

# Document History

| Version | Date | Changes |
|---------|------|---------|
| 7.0 | Dec 3, 2025 | Original PRD with Phase 3 specifications |
| 7.1 Appendix | Dec 5, 2025 | Enhanced user journey, onboarding, voice, Evidence Cards |
| 8.0 | Dec 7, 2025 | Implementation-focused format (deprecated) |
| 8.1 | Dec 7, 2025 | Vision-first structure optimized for Opus 4.5 reasoning |
| **8.1.1** | **Dec 9, 2025** | **Added Technical Spec reference, confidence factors, recovery formula, 6 MVD triggers, safety constraints, Appendix D** |
| **8.1.2** | **Dec 9, 2025** | **Added Appendix E: Biometric Profile Collection (age, sex, height, weight, timezone for HRV personalization)** |

---

*This document defines WHAT Apex OS is and WHY it matters. Implementation details are discovered through exploration. Session continuity is maintained via STATUS.md. Project conventions are defined in CLAUDE.md.*

**The goal is clear. The vision is set. Trust the reasoning to figure out the how.**

---

*Last Updated: December 9, 2025*
