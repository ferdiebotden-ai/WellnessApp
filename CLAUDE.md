# Apex OS — Development Guide

You are building **Apex OS**, an AI-powered wellness operating system that transforms peer-reviewed health research into personalized daily protocols.

**Core Promise:** Evidence-based protocols, tailored for you. "From knowing to doing."

---

## Creative Freedom & Quality Standards

This app should feel genuinely innovative. **You are encouraged to:**

- **Propose elegant solutions** that delight users—go beyond literal requirements
- **Suggest UX improvements** when you see opportunities to enhance the experience
- **Prioritize polish**—small details matter in premium products
- **Push quality boundaries** while staying on-brand
- **Iterate on designs**—if a better approach exists, surface it proactively
- **Anticipate edge cases** and design for them (empty states, loading, errors)

The difference between a generic app and a premium one:
- Unexpected thoughtfulness (anticipating user needs)
- Invisible polish (smooth transitions, proper loading states, error recovery)
- Consistency in details (spacing, color, typography following the system)
- Purposeful micro-interactions (nothing distracting, everything intentional)

**This guide provides direction, not constraint. Your judgment matters.**

---

## Design Vision

### The Aesthetic We're Creating

**Professional Healthcare Premium** — positioned between WHOOP (data-driven), Headspace (trustworthy), and Oura (sophisticated). NOT playful or gamified. This is a wellness coach for intelligent adults, not a fitness game.

**Emotional Journey:**
- Calm and reassuring (reduce health anxiety through design)
- Aspirational without elitism
- Trustworthy and transparent (citations visible, AI clearly labeled)
- Peak-focused optimization

**Design Benchmarks to Study:**
- **WHOOP** — Data dashboards, health metrics emphasis, dark mode sophistication
- **Oura** — Sophisticated dark UI, premium feel, elegant data visualization
- **Headspace** — Calming aesthetics, professional polish, trustworthy voice
- **Apple Health** — Clean information architecture, warm color accents
- **Linear** — Modern SaaS precision, attention to detail

When stuck on a design decision, audit how these apps solve similar problems.

### Dark Mode Native

Optimized for evening use (7pm-11pm primary use case). Dark mode isn't an afterthought—it's the primary experience.

**Why it matters:**
- Reduces blue light before sleep (aligns with sleep optimization mission)
- 60% higher retention in healthcare apps
- Premium, sophisticated aesthetic

**Dark Mode Best Practices:**
- Never use pure black (#000000)—use deep navy (#0F1218, #1A1F2E)
- Use off-white (#E8E8E8, #F6F8FC), not pure white, for text
- Elevate with subtle gray layers for depth
- Increase color saturation 10-15% vs light mode

### Visual Language

**Generous Whitespace** — Target 40-50% of screen. Let content breathe. Professional health app = generous breathing room.

**Subtle Depth** — Cards float above backgrounds with soft shadows. Modals rise above cards. Create hierarchy through elevation, not borders.

**Data as Hero** — Charts and metrics displayed prominently, not buried. Beautiful data visualization conveys scientific credibility.

**Selective Color** — 3-4 colors max per screen. Intentional, not decorative. Teal for actions, gold for achievements, blue for secondary.

**Smooth Motion** — Every state change should feel smooth. Fast (100-300ms), natural (ease-out curves), purposeful (never distracting).

---

## Color System

Import from `client/src/theme/palette.ts`:

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | #0F1218 | Page backgrounds (deep navy-black) |
| `surface` | #181C25 | Card backgrounds |
| `elevated` | #1F2430 | Modals, hover states, raised elements |
| `primary` | #63E6BE | CTAs, interactive elements, progress (teal/mint) |
| `secondary` | #5B8DEF | Secondary actions (blue) |
| `accent` | #EFBF5B | Achievements, premium features (gold) |
| `textPrimary` | #F6F8FC | Headings, body text |
| `textSecondary` | #A7B4C7 | Descriptions, labels |
| `textMuted` | #6C7688 | Placeholders, disabled text |
| `success` | #4CE1A5 | Confirmations, positive trends |
| `error` | #FF5A5F | Errors (use sparingly—amber for warnings) |

**Color Psychology:**
- **Blue** — Lowers perceived anxiety, promotes trust (78% patient preference in healthcare)
- **Teal/Green** — Healing, balance, progress, growth
- **Amber (not red)** — Gentle warnings without anxiety trigger
- **Avoid bright reds** — Anxiety-inducing, clinical alarm associations

---

## Typography System

Import from `client/src/theme/typography.ts`:

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| `heading` | 22px | 700 | Screen titles |
| `subheading` | 16px | 600 | Section headers, card titles |
| `body` | 14px | 400 | Body text |
| `caption` | 12px | 400 | Labels, timestamps, metadata |

**Typography Principles:**
- Left-align text (never center paragraphs)
- 1.5x line height for body text (optimal readability)
- Maximum 60-80 characters per line
- Support Dynamic Type (iOS) and Font Scaling (Android)

---

## Animation Philosophy

**Subtle, not showy. Fast, not slow. Natural, not mechanical.**

Every interactive element should have micro-feedback. Haptic feedback on important actions. Smooth transitions between states.

**Guiding principles:**
- Button press: Immediate (100ms), slight scale, haptic
- Modal appearance: Quick slide-up (250ms), ease-out
- Data updates: Graceful fade + slide (200ms)
- Screen transitions: Natural flow (300ms)
- Celebratory moments: Minimal and professional (no confetti, no explosions)

**Loading States:**
- Skeleton screens preferred (gray placeholder blocks)
- Progress bars for defined processes
- Spinners only for indefinite waits
- Never leave users wondering if something is happening

---

## UI Quality Gut Check

Every screen should pass this:

- **Visual hierarchy** — Can a user scan in 3 seconds and understand priority?
- **Breathing room** — Does whitespace feel intentional, not cramped?
- **Interactive feedback** — Does every touchable element respond?
- **Dark mode credibility** — Does it feel premium, not harsh or amateurish?
- **Mobile-first** — Does it look good at 375px?
- **Type hierarchy** — Are headings, body, and secondary text clearly distinct?
- **Color balance** — Do accents feel intentional, not oversaturated?
- **Touch targets** — Are interactive elements at least 44x44px?

These aren't rules—they're aspirations for judgment calls.

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| **Client** | React Native 0.81 + Expo 54 (TypeScript strict) |
| **Navigation** | React Navigation 6 (native stack + bottom tabs) |
| **State** | Context API + Firestore listeners |
| **Backend** | Google Cloud Functions Gen2 (Node.js 20, Express 5) |
| **Auth** | Firebase Auth |
| **Database** | Supabase PostgreSQL (source of truth) |
| **Real-time** | Firebase Firestore (schedules, nudges, chat) |
| **Vector DB** | Pinecone (768-dim embeddings for RAG) |
| **AI** | Vertex AI Gemini 2.0 Flash |
| **Payments** | RevenueCat |

---

## Project Structure

```
client/src/
├── screens/          # Page-level components
├── components/       # Reusable UI
├── navigation/       # RootNavigator, stacks, tabs
├── providers/        # AuthProvider, MonetizationProvider, etc.
├── hooks/            # Custom hooks (useDashboardData, useTaskFeed)
├── services/         # API, Firebase, analytics
├── theme/            # palette.ts, typography.ts (DESIGN SYSTEM)
└── types/            # TypeScript definitions

functions/src/
├── api.ts            # Express REST API
├── chat.ts           # AI coach with RAG
├── vertexAI.ts       # Gemini wrapper
└── nudgeEngine.ts    # Adaptive nudge generation
```

---

## Code Quality

**Non-negotiables:**
- TypeScript strict mode (no `any`, no `@ts-ignore`)
- Functional components with hooks only
- Import colors from `palette.ts`, typography from `typography.ts`
- Every async operation has loading + error states
- SafeAreaProvider at app root

**Best practices:**
- Extract reusable logic into custom hooks
- Use FlatList for lists (not ScrollView)
- Memoize expensive computations
- Clean up Firestore listeners in useEffect return
- Test on physical devices, not just simulator

---

## Known Gotchas

- **Firebase "Component auth not registered"** — Firebase must initialize before Auth usage
- **SafeAreaProvider** — Must wrap entire app, not individual screens
- **Keyboard overlay** — Use KeyboardAvoidingView with `behavior="padding"` on iOS
- **DEV_MODE_FULL_ACCESS** — Currently `true` in MonetizationProvider (disable before production)
- **No Tailwind** — Use StyleSheet.create() with palette/typography imports

---

## Brand Voice

**Character:** Warm expertise — knowledgeable friend who happens to be a health scientist.

**Do:**
- Lead with benefits, then explain mechanisms
- Use specific numbers (percentages, timeframes, doses)
- Cite research naturally ("Research shows...", "A 2023 study found...")
- Speak directly ("You'll notice..." not "Users may experience...")
- Be encouraging but not patronizing

**Don't:**
- Vague wellness language ("transform your life", "holistic journey")
- Preachy about health choices
- ALL CAPS or excessive exclamation points
- Promise miracles or unverifiable claims

---

## Module Architecture

6 wellness modules, each containing multiple protocols:

| Module | Tier | Description |
|--------|------|-------------|
| Sleep Optimization | Core | Morning light, evening light management, NSDR |
| Morning Routine | Core | Light exposure, hydration, movement |
| Focus & Productivity | Core | Caffeine timing, breathwork, deep work |
| Stress & Emotional Regulation | Pro | NSDR, breathwork, gratitude |
| Energy & Recovery | Pro | Cold exposure, movement snacks |
| Dopamine Hygiene | Pro | Digital sunset, screen blocks |

Each protocol includes: name, mechanism, implementation steps, expected outcomes, and research citations (DOIs).

---

## Before Building

1. **Read existing files** — Understand current patterns before creating new ones
2. **Check the theme** — Always import from palette.ts and typography.ts
3. **Design mobile-first** — Start at 375px, scale up
4. **Consider all states** — Loading, error, empty, success

## After Building

1. **Run typecheck** — Must pass before committing
2. **Test on device** — Simulators miss real-world issues
3. **Verify dark theme** — No white backgrounds, proper contrast
4. **Check responsiveness** — Test at multiple viewport sizes

---

## The Quality Bar

This app competes with WHOOP and Oura on design quality. Every screen should:
- Feel premium and sophisticated
- Convey scientific credibility and trust
- Have smooth, purposeful interactions
- Work flawlessly on mobile

**North Star Metric:** User achieves 6+ days/week protocol adherence by Day 30.

**Build something you'd be proud to show off.**
