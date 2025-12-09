# Apex OS Screen Archetypes

## Home (Morning Anchor)

### Goal

User knows recovery state + first action in **10 seconds**.

### Structure

```
┌─────────────────────────────────────┐
│ Status bar                          │
├─────────────────────────────────────┤
│                                     │
│ Good morning, Alex                  │
│ December 8, 2025                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ RECOVERY                        │ │
│ │ 78%          ↑ 12% vs baseline  │ │
│ │ ═══════════════════             │ │
│ │ Moderate — Ready for action     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ TODAY'S FOCUS                       │
│ ┌─────────────────────────────────┐ │
│ │ ☀️ Morning Light                │ │
│ │ Your cortisol window closes in  │ │
│ │ 45 min. 10 min outside now.     │ │
│ │              [Start Now]        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ TODAY'S PROTOCOLS                   │
│ ┌─────────────────────────────────┐ │
│ │ ☀️ Morning Light      5/7    → │ │
│ │ 🏃 Movement           3/7    → │ │
│ │ ☕ Caffeine OK      After 8am  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💬 Ask about today's plan       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Home] [Protocols] [Insights] [Chat]│
└─────────────────────────────────────┘
```

### Elements

| Element | Component | Notes |
|---------|-----------|-------|
| Header | Custom | Greeting + date + profile avatar |
| Recovery Card | RecoveryScoreCard | Hero, tappable for breakdown |
| Today's Focus | FocusCard | AI-curated "one big thing" |
| Protocols List | ProtocolCard × 3-5 | Prioritized for today |
| Chat Entry | Card | Quick access to AI coach |
| Navigation | BottomNav | 4 tabs |

### Interactions

- Recovery Card tap → Recovery breakdown modal/screen
- Focus Card CTA → Start protocol
- Protocol Card tap → Protocol detail
- Chat entry tap → Chat screen

### Morning vs Evening

| Time | Focus Card | Protocols Emphasis |
|------|------------|-------------------|
| Morning (5am-12pm) | Morning-focused (light, movement) | Foundation protocols |
| Afternoon (12pm-6pm) | Energy/focus | Walking breaks, caffeine cutoff |
| Evening (6pm-11pm) | Wind-down | Evening light, sleep prep |

### Animation

- Recovery score counts up on load (300-500ms)
- Protocol cards stagger in (50ms delay between cards)
- Focus card appears with subtle scale (0.95 → 1)

---

## Protocol Detail

### Goal

Understand what to do quickly, explore why on demand.

### Structure

```
┌─────────────────────────────────────┐
│ ←  Morning Light             ⋯     │
├─────────────────────────────────────┤
│                                     │
│        [Sun illustration]           │
│                                     │
│ FOUNDATION PROTOCOL                 │
│ Morning Light Exposure              │
│                                     │
│ ──────────────────────────────────  │
│                                     │
│ THE PROTOCOL                        │
│ ☀️ 10-30 min outdoor light          │
│ ⏰ Within 60 min of waking          │
│ 📅 6-7 days per week                │
│                                     │
│ ▼ WHY THIS WORKS                    │
│ ▼ YOUR DATA                         │
│ ▼ THE SCIENCE                       │
│                                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         Start Protocol          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Hero Visual — Protocol Iconography

Each protocol has a custom icon that reinforces the "Bloomberg meets Calm" aesthetic.

**Style Guidelines:**
- **Form:** Geometric line art, not filled shapes
- **Color:** Single teal accent (#63E6BE) on transparent background
- **Size:** 200×200pt design area, 48×48pt minimum render
- **Stroke:** 2px weight, rounded caps
- **Animation:** Subtle scale (0.95→1) on load, 200ms ease-out

**Protocol Icon Examples:**

| Protocol | Icon Description |
|----------|------------------|
| Morning Light | Sun with radiating lines (8 rays) |
| Cold Plunge | Snowflake with water droplet below |
| Sauna | Heat waves rising (3 curved lines) |
| NSDR | Concentric circles (breathing/calm) |
| Movement | Figure in motion, minimal strokes |
| Sleep Hygiene | Crescent moon with stars |
| Breathwork | Lungs outline with airflow |
| Hydration | Water droplet with ripples |

**Implementation:**

```typescript
// Store as React Native SVG components
// Location: /assets/protocols/

import MorningLightIcon from '@/assets/protocols/morning-light.svg';
import ColdPlungeIcon from '@/assets/protocols/cold-plunge.svg';
// etc.

// Usage with animation
function ProtocolHeroIcon({ protocol }) {
  const scale = useSharedValue(0.95);
  
  useEffect(() => {
    scale.value = withTiming(1, { 
      duration: 200, 
      easing: Easing.out(Easing.ease) 
    });
  }, []);

  const Icon = protocolIcons[protocol.id];
  
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Icon width={120} height={120} color="#63E6BE" />
    </Animated.View>
  );
}
```

**Fallback (if custom icons unavailable):**

Use SF Symbols (iOS) or Material Icons with teal glow effect:

```typescript
function ProtocolIconFallback({ emoji }) {
  return (
    <View style={{
      width: 120,
      height: 120,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#63E6BE',
      shadowOpacity: 0.2,
      shadowRadius: 16,
    }}>
      <Text style={{ fontSize: 64 }}>{emoji}</Text>
    </View>
  );
}
```

### Expandable Sections

**Why This Works:**
- Mechanism explanation in plain language
- "Melanopsin receptors in your eyes signal your master clock..."

**Your Data:**
- Adherence: "5/7 days this week"
- Impact: "Sleep efficiency +12% on days with morning light"
- Confidence: "High (14 data points)"

**The Science:**
- Study citation with DOI
- Brief summary
- "View full study →" link

### CTA Behavior

| State | CTA Text | Action |
|-------|----------|--------|
| Not started | "Start Protocol" | Start timer/tracking |
| In progress | "In Progress (8:32)" | Show timer |
| Completed today | "Completed ✓" | Disabled, success state |

### Animation

- Hero illustration: subtle parallax on scroll
- Expandable sections: spring animation (250ms)
- CTA: sticky at bottom with blur background on scroll

---

## AI Chat

### Goal

Personalized, data-informed guidance that feels like expert consultation.

### Structure

```
┌─────────────────────────────────────┐
│ ←  AI Coach                         │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Good morning. Your recovery is  │ │
│ │ at 78% — solid for a push day.  │ │
│ │                                 │ │
│ │ Your HRV improved 8% this week. │ │
│ │ The morning light protocol is   │ │
│ │ working—you've completed it     │ │
│ │ 6/7 days.                       │ │
│ └─────────────────────────────────┘ │
│                                     │
│         ┌─────────────────────────┐ │
│         │ Why is my HRV higher   │ │
│         │ than last week?        │ │
│         └─────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ●●●                             │ │
│ └─────────────────────────────────┘ │
│                                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Ask me anything...         ➤   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Message Styles

**AI Messages:**
```typescript
const aiMessage = {
  backgroundColor: '#181C25',
  borderRadius: 16,
  borderTopLeftRadius: 4,
  padding: 16,
  maxWidth: '85%',
  alignSelf: 'flex-start',
};
```

**User Messages:**
```typescript
const userMessage = {
  backgroundColor: '#63E6BE',
  borderRadius: 16,
  borderTopRightRadius: 4,
  padding: 16,
  maxWidth: '85%',
  alignSelf: 'flex-end',
};

const userMessageText = {
  color: '#0F1218',
};
```

### Thinking State

Show after 500ms delay:
- 3 pulsing dots
- Surface background card
- Left-aligned like AI message

### Input Bar

```typescript
const inputBar = {
  backgroundColor: '#181C25',
  borderTopWidth: 1,
  borderTopColor: '#2A303D',
  padding: 12,
  paddingBottom: 34, // Safe area
};

const inputField = {
  backgroundColor: '#1F2430',
  borderRadius: 24,
  padding: 12,
  paddingRight: 48, // Space for send button
};
```

### Suggested Prompts (Optional)

Horizontal scroll of quick prompts above input:
- "What should I focus on today?"
- "Why is my HRV low?"
- "Explain my recovery score"

---

## Minimum Viable Day (MVD)

### Goal

Support users on hard days without guilt or abandonment.

### Trigger Conditions

- Recovery score < 60%
- Calendar shows > 4 hours of meetings
- User manually marks "Struggling today"

### Structure

```
┌─────────────────────────────────────┐
│ Status bar                          │
├─────────────────────────────────────┤
│                                     │
│ Take it easy today                  │
│ December 8, 2025                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ RECOVERY                        │ │
│ │ 52%          ↓ 15% vs baseline  │ │
│ │ ═══════                         │ │
│ │ Low — Recovery day              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🛡️ MINIMUM VIABLE DAY           │ │
│ │                                 │ │
│ │ Your body needs rest. Here are │ │
│ │ the 3 essentials for today:    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ESSENTIALS ONLY                     │
│ ┌─────────────────────────────────┐ │
│ │ ☀️ Morning Light      10 min → │ │
│ │ 💧 Hydration Check            → │ │
│ │ 🌙 Earlier Bedtime    -30 min → │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Tomorrow will be better.        │ │
│ │ [Switch to Full Day]            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Home] [Protocols] [Insights] [Chat]│
└─────────────────────────────────────┘
```

### Key Differences from Standard Home

| Element | Standard | MVD |
|---------|----------|-----|
| Greeting | "Good morning" | "Take it easy today" |
| Focus Card | Protocol-focused | Reassurance message |
| Protocols | 5-7 full list | 3 essentials only |
| Tone | Encouraging action | Supportive rest |
| Footer | None | Option to switch to full day |

### Visual Cues

- Recovery card uses `recoveryLow` zone color
- Shield emoji (🛡️) indicates protected/gentle mode
- Muted protocol list, fewer items
- No adherence pressure ("5/7" hidden)

### Copy Tone

**Do:** "Your body needs rest", "Tomorrow will be better"
**Don't:** "You're falling behind", "Get back on track"

---

## Weekly Synthesis

### Goal

Narrative summary of the week with actionable insights.

### Structure

```
┌─────────────────────────────────────┐
│ ←  Weekly Synthesis                 │
├─────────────────────────────────────┤
│                                     │
│ WEEK OF DEC 1-7                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏆 WIN                          │ │
│ │                                 │ │
│ │ Your HRV improved 8% after     │ │
│ │ consistent Morning Light (6/7   │ │
│ │ days).                          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👀 WATCH                        │ │
│ │                                 │ │
│ │ Sleep duration dropped 22 min   │ │
│ │ avg. Consider earlier bedtime.  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔍 PATTERN                      │ │
│ │                                 │ │
│ │ Cold plunge on recovery days    │ │
│ │ correlates with next-day        │ │
│ │ productivity.                   │ │
│ │ (Medium confidence)             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📈 TRAJECTORY                   │ │
│ │                                 │ │
│ │ At this rate, you'll hit 7.5hr │ │
│ │ sleep average by end of month.  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🧪 EXPERIMENT                   │ │
│ │                                 │ │
│ │ Try caffeine cutoff at 1pm     │ │
│ │ instead of 2pm this week.       │ │
│ │ Track sleep quality.            │ │
│ │                                 │ │
│ │ [Accept Experiment]             │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Section Cards

| Section | Icon | Purpose | Tone |
|---------|------|---------|------|
| WIN | 🏆 | Celebrate a specific improvement | Factual, positive |
| WATCH | 👀 | Flag a concerning trend | Advisory, not alarming |
| PATTERN | 🔍 | Share correlation insight | Scientific, curious |
| TRAJECTORY | 📈 | Project future outcome | Motivating |
| EXPERIMENT | 🧪 | Suggest testable change | Actionable |

### Visual Hierarchy

- Each section is a card
- Section label: Caption, uppercase, textMuted
- Content: Body text
- Metrics: Monospace, highlighted
- Experiment CTA: Secondary button

### Timing

Generated every Sunday. Push notification: "Your Weekly Synthesis is ready."

---

## Wearable Connection

### Goal

Connect wearable without friction or abandonment.

### Structure (Selection)

```
┌─────────────────────────────────────┐
│ ←  Connect Wearable                 │
├─────────────────────────────────────┤
│                                     │
│ SYNC YOUR DATA                      │
│                                     │
│ Connect a wearable for personalized │
│ protocols based on your biology.    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⌚ Apple Health                → │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 💍 Oura Ring                   → │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 📱 Health Connect (Android)    → │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ⌚ Fitbit                      → │ │
│ └─────────────────────────────────┘ │
│                                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Skip for now                    │ │
│ │ Use Lite Mode with manual input │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Connection Flow

1. **Selection** → User taps wearable
2. **Authorization** → OAuth/HealthKit permission prompt
3. **Syncing** → Progress indicator
4. **Success** → Confirmation with first data preview

### Success State

```
┌─────────────────────────────────────┐
│                                     │
│           ✓ Connected               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💍 Oura Ring                    │ │
│ │ Last synced: Just now           │ │
│ │                                 │ │
│ │ Sleep: 7h 23m last night        │ │
│ │ HRV: 62ms                       │ │
│ │ Readiness: 78%                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │          Continue               │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Lite Mode Explanation

If user skips:
- Show brief explanation of manual check-ins
- No guilt language
- Easy path to connect later from Settings

---

## Onboarding

### Goal

Magic moment (personalized value) within 60 seconds.

### Flow: 3 Screens

**Screen 1: Welcome (15 sec)**

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│          [Apex OS Logo]             │
│                                     │
│   Evidence-based protocols,         │
│   tailored for you.                 │
│                                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │          Get Started            │ │
│ └─────────────────────────────────┘ │
│                                     │
│      Already have an account?       │
│            Sign in →                │
│                                     │
└─────────────────────────────────────┘
```

**Screen 2: Goals (30 sec)**

```
┌─────────────────────────────────────┐
│                                     │
│ WHAT BRINGS YOU HERE?               │
│ Select all that apply               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 😴 Better Sleep                 │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ⚡ More Energy                  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🧠 Sharper Focus                │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 💪 Faster Recovery              │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🧘 Stress Resilience            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │          Continue               │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Screen 3: Quick Setup (15 sec)**

```
┌─────────────────────────────────────┐
│                                     │
│ ALMOST THERE                        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎙️ Communication Style          │ │
│ │                                 │ │
│ │ ○ Direct                        │ │
│ │   Data-first, concise           │ │
│ │                                 │ │
│ │ ● Supportive                    │ │
│ │   Warm, encouraging             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⌚ Connect Wearable (Optional)  │ │
│ │ Get personalized insights    → │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │        Start My Journey         │ │
│ └─────────────────────────────────┘ │
│                                     │
│       Skip wearable for now →       │
│                                     │
└─────────────────────────────────────┘
```

### Post-Onboarding

Route directly to Home with:
- Estimated recovery score (or prompt for manual input)
- First recommended protocol based on goals
- AI welcome message

**Never show an empty state after onboarding.**

---

## Settings / Profile

### Structure

```
┌─────────────────────────────────────┐
│ ←  Settings                         │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👤 Alex Chen                    │ │
│ │ alex@example.com                │ │
│ │ Pro Member                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ CONNECTED DEVICES                   │
│ ┌─────────────────────────────────┐ │
│ │ 💍 Oura Ring          Connected │ │
│ │ ⌚ Apple Health       Connected │ │
│ │ + Add Device                  → │ │
│ └─────────────────────────────────┘ │
│                                     │
│ PREFERENCES                         │
│ ┌─────────────────────────────────┐ │
│ │ Communication Style           → │ │
│ │ Notifications                 → │ │
│ │ Haptic Feedback               → │ │
│ │ Appearance                    → │ │
│ └─────────────────────────────────┘ │
│                                     │
│ SUBSCRIPTION                        │
│ ┌─────────────────────────────────┐ │
│ │ Manage Subscription           → │ │
│ └─────────────────────────────────┘ │
│                                     │
│ SUPPORT                             │
│ ┌─────────────────────────────────┐ │
│ │ Help Center                   → │ │
│ │ Send Feedback                 → │ │
│ │ Privacy Policy                → │ │
│ └─────────────────────────────────┘ │
│                                     │
│          Sign Out                   │
│                                     │
└─────────────────────────────────────┘
```

### Navigation

Settings accessible from:
- Profile avatar on Home header
- Tab if using 5-tab navigation

---

## Screen Transitions

### Standard Transitions

| From → To | Animation |
|-----------|-----------|
| Tab → Tab | Crossfade (200ms) |
| List → Detail | Slide from right (250ms) |
| Button → Modal | Scale + fade (250ms) |
| Back | Reverse of forward |

### Implementation

```typescript
const screenOptions = {
  animation: 'slide_from_right',
  animationDuration: 250,
};

const modalOptions = {
  presentation: 'modal',
  animation: 'fade_from_bottom',
  animationDuration: 250,
};

const tabOptions = {
  animation: 'fade',
  animationDuration: 200,
};
```
