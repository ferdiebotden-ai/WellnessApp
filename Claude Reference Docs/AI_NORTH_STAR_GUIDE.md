# Wellness OS - AI North Star Guide

> **Purpose:** This document provides comprehensive context for AI agents working on the Wellness OS codebase. Read this first to understand the vision, architecture, and current state of the project.

---

## Executive Summary

**Wellness OS** (also referred to as "Apex" in design documents) is an AI-powered wellness coaching application that transforms peer-reviewed health protocols into sustainable daily habits. The app serves as a personal wellness concierge, delivering evidence-based recommendations with scientific citations while maintaining a warm, actionable coaching voice.

**Core Philosophy:** "Evidence made effortless"

---

## Vision & Mission

### Vision
Create the world's first truly personalized wellness operating system that bridges the gap between complex scientific research and daily actionable habits. We believe optimal health shouldn't require a PhD to understand or a personal staff to implement.

### Mission
Empower high-performing professionals to achieve measurable health outcomes through:
1. AI-powered protocol recommendations grounded in peer-reviewed research
2. Seamless integration with existing wearables and health data
3. Adaptive coaching that learns individual patterns and preferences
4. Transparent scientific citations for every recommendation

### North Star Metric
**≥6 days/week protocol adherence by Day 30**

This metric captures:
- User engagement (they're opening the app)
- Protocol relevance (recommendations are achievable)
- Habit formation (behaviors are sticking)
- Health outcome correlation (adherence drives results)

---

## Target User Profile

### Primary Persona: "The Optimizer"
- **Demographics:** 25-45 years old, professional career, disposable income
- **Psychographics:**
  - Listens to Huberman Lab, Attia, or similar health podcasts
  - Has tried multiple wellness apps but found them too generic
  - Wants science-backed recommendations, not influencer opinions
  - Values efficiency - wants clear protocols, not endless content
  - Already tracks some health metrics (sleep, HRV, steps)

### User Pain Points We Solve
1. **Information Overload:** Too many conflicting health recommendations online
2. **Generic Advice:** Most apps don't personalize to individual biology
3. **No Accountability:** Easy to skip habits without consequence tracking
4. **Missing "Why":** Users want to understand the science, not just follow rules
5. **Fragmented Data:** Health metrics scattered across multiple apps/devices

---

## Product Architecture

### Technical Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (React Native + Expo)            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Auth Flow   │  │ Dashboard   │  │ AI Coach Chat       │  │
│  │ (Firebase)  │  │ (Metrics)   │  │ (Vertex AI Gemini)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Google Cloud Functions Gen2)           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ /api/chat   │  │ /api/users  │  │ /api/protocols      │  │
│  │ AI Coaching │  │ Profile/Auth│  │ Search (RAG)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Supabase    │  │ Firebase    │  │ Pinecone            │  │
│  │ (PostgreSQL)│  │ (Auth/Store)│  │ (Vector Search)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Services

| Service | Purpose | Technology |
|---------|---------|------------|
| **AI Chat** | Conversational wellness coaching | Vertex AI Gemini 2.0 Flash |
| **Protocol Search** | RAG-powered semantic search | Pinecone + text-embedding-005 |
| **User Auth** | Authentication & session management | Firebase Auth |
| **User Data** | Profile, preferences, health metrics | Supabase PostgreSQL |
| **Real-time Sync** | Offline-first data persistence | Firebase Firestore |
| **Analytics** | User behavior tracking | Mixpanel |
| **Subscriptions** | In-app purchases | RevenueCat |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | AI coaching conversation |
| `/api/protocols/search` | GET | Semantic protocol search |
| `/api/users/me` | GET/PATCH | User profile management |
| `/api/users/me/monetization` | GET | Subscription status |
| `/api/onboarding/complete` | POST | Complete user onboarding |
| `/api/wearables/sync` | POST | Sync wearable device data |

---

## Core Features

### 1. AI Coach (Implemented)
- Natural language wellness coaching powered by Gemini 2.0 Flash
- Context-aware responses based on user profile and health data
- Scientific citations for recommendations
- Conversation history persistence

### 2. Protocol Library (Implemented)
- Evidence-based wellness protocols (sleep, stress, focus, etc.)
- RAG-powered semantic search via Pinecone
- Tiered access (Core, Pro, Elite modules)
- Protocol completion tracking

### 3. Health Dashboard (Implemented)
- Health metrics visualization (Sleep Quality, HRV, etc.)
- Active module progress tracking
- Today's task schedule
- Streak and consistency tracking

### 4. Smart Nudges (Designed, Partial Implementation)
- Contextual reminders based on time, location, biometrics
- Adaptive scheduling that learns user patterns
- Non-intrusive notification strategy

### 5. Wearable Integration (Designed, Partial Implementation)
- Apple Health / HealthKit integration
- Oura, Whoop, Garmin connectors planned
- Unified health data aggregation

---

## Design System

### Brand Identity
- **App Name:** Apex (design) / Wellness OS (current)
- **Voice:** Warm expertise - like a knowledgeable friend who happens to be a health scientist
- **Tone:** Encouraging but not patronizing, scientific but accessible

### Color Palette
```
Background:     #0F1218 (Deep navy-black)
Surface:        #181C25 (Card backgrounds)
Elevated:       #1F2430 (Raised elements)
Primary:        #63E6BE (Teal/mint - CTAs, highlights)
Secondary:      #5B8DEF (Blue - secondary actions)
Accent:         #EFBF5B (Gold - achievements, premium)
Text Primary:   #F6F8FC (White-ish)
Text Secondary: #A7B4C7 (Muted descriptions)
Text Muted:     #6C7688 (Tertiary text)
```

### Typography
- **Headings:** SF Pro Display (iOS) / System bold
- **Body:** SF Pro Text / System regular
- **Hierarchy:** Display → Heading → Subheading → Body → Caption

### UI Patterns
- Dark mode primary (matches design mockups)
- Bottom tab navigation (Home, Protocols, Insights, Profile)
- Card-based content containers
- Floating AI coach button (top-right sparkle icon)
- Modal-based chat interface

---

## Current Implementation State

### Fully Implemented
- [x] Firebase Authentication (email/password)
- [x] User onboarding flow (module selection)
- [x] Home dashboard with health metrics
- [x] AI Coach chat modal (Vertex AI backend)
- [x] Bottom tab navigation
- [x] Protocol detail screens
- [x] Privacy dashboard (data export/deletion)
- [x] Biometric lock screen (Face ID/Touch ID)
- [x] Monetization system (paywalls, trials) - **Currently disabled for testing**
- [x] Feature flags system

### Placeholder/Partial Implementation
- [ ] Insights screen (hardcoded single card)
- [ ] Protocols screen (hardcoded single card)
- [ ] Week in Review screen (designed, not built)
- [ ] Progress rings on modules (designed, not built)
- [ ] Citation cards in chat (designed, partial)

### Not Yet Implemented
- [ ] Wearable device sync (Apple Health, Oura, etc.)
- [ ] Push notifications
- [ ] Smart nudge scheduling
- [ ] Social/community features
- [ ] Clinician portal

---

## Monetization Model

### Tier Structure (Designed)
| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Limited protocols, 10 AI chats/week |
| **Core** | $29/mo | Unlimited AI chat, all core modules |
| **Pro** | $79/mo | Advanced analytics, pro modules |
| **Elite** | $299/mo | 1:1 coaching, lab integrations |

### Current State
**DEV_MODE_FULL_ACCESS = true** in `MonetizationProvider.tsx`

This grants all users:
- Pro tier subscription status
- Unlimited AI chat (9999 limit)
- Access to all modules
- No paywall triggers

**Important:** This must be set to `false` before production launch.

---

## File Structure Overview

```
WellnessApp/
├── client/                    # React Native Expo app
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── screens/           # Screen components
│   │   ├── navigation/        # React Navigation setup
│   │   ├── providers/         # Context providers (Auth, Monetization, etc.)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API, Firebase, Analytics services
│   │   ├── theme/             # Palette, typography
│   │   └── types/             # TypeScript type definitions
│   ├── assets/                # App icons, splash screens
│   ├── app.json               # Expo configuration
│   └── .env                   # Environment variables (gitignored)
│
├── functions/                 # Google Cloud Functions (Gen2)
│   ├── src/
│   │   ├── api.ts             # Main API routes
│   │   ├── chat.ts            # AI chat with Vertex AI
│   │   ├── protocolSearch.ts  # RAG search with Pinecone
│   │   └── nudgeEngine.ts     # Smart notification logic
│   └── package.json
│
├── supabase/                  # Database migrations & types
│   └── migrations/
│
└── Claude Reference Docs/     # Project documentation
    ├── Design Files/          # UI mockups
    └── AI_NORTH_STAR_GUIDE.md # This file
```

---

## Key Environment Variables

### Client (.env)
```
EXPO_PUBLIC_API_BASE_URL=https://api-26324650924.us-central1.run.app
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=wellness-os-app
```

### Functions (Google Cloud)
```
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
PINECONE_API_KEY=...
PINECONE_INDEX=wellness-protocols
GCP_PROJECT_ID=wellness-os-app
```

---

## Development Commands

### Client (Expo)
```bash
cd client
npm install
npx expo start           # Start dev server
npx expo start --ios     # iOS simulator
npx expo-doctor          # Check configuration
```

### Functions (Cloud Functions)
```bash
cd functions
npm install
npm run build            # Compile TypeScript
firebase deploy --only functions
```

---

## Guiding Principles for AI Agents

### When Making Code Changes:
1. **Preserve the dark theme aesthetic** - Use colors from the palette
2. **Maintain scientific credibility** - Include citations where possible
3. **Keep it actionable** - Every feature should drive behavior change
4. **Respect user privacy** - Minimize data collection, be transparent
5. **Stay modular** - Features should be toggleable via feature flags

### When Writing Copy:
1. **Be warm, not clinical** - "Let's optimize your sleep" not "Sleep optimization protocol"
2. **Lead with benefits** - "Wake up refreshed" not "Increase sleep efficiency"
3. **Cite sources** - "Research shows..." with actual references
4. **Avoid jargon** - Explain HRV, circadian rhythm, etc. when first mentioned

### When Designing Features:
1. **Default to evidence-based** - If there's no research, don't recommend it
2. **Personalize when possible** - Use user data to tailor recommendations
3. **Gamify thoughtfully** - Streaks and progress, not manipulative mechanics
4. **Fail gracefully** - Offline mode should still be useful

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Day 1 Retention | >60% | TBD |
| Day 7 Retention | >40% | TBD |
| Day 30 Retention | >25% | TBD |
| Protocol Adherence | ≥6 days/week | TBD |
| AI Chat Sessions/User/Week | >3 | TBD |
| Trial → Paid Conversion | >8% | TBD |
| NPS Score | >50 | TBD |

---

## Contact & Resources

- **GitHub Repository:** ferdiebotden-ai/WellnessApp
- **Firebase Console:** wellness-os-app
- **Google Cloud Project:** wellness-os-app
- **Supabase Project:** (see environment variables)

---

*Last Updated: November 2024*
*Document Version: 1.0*
