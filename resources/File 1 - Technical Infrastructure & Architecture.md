# Technical Infrastructure & Architecture
## Comprehensive System Design for Wellness OS

**Synthesis Date:** October 23, 2025
**Source Reports:** #01-#05 (System Architecture, AI/ML Systems, Data Model, Wearables, Security)
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Infrastructure Stack](#infrastructure-stack)
4. [AI/ML Systems & RAG Architecture](#aiml-systems--rag-architecture)
5. [Core Data Model & Event Schema](#core-data-model--event-schema)
6. [Wearable Integration Architecture](#wearable-integration-architecture)
7. [Security, Privacy & Compliance](#security-privacy--compliance)
8. [Deployment & Operations](#deployment--operations)
9. [Architecture Decision Records](#architecture-decision-records)

---

## Executive Summary

Wellness OS requires a **hybrid cloud architecture** combining Firebase (real-time UX), Supabase PostgreSQL (analytical persistence), OpenAI GPT-4o (AI coaching), and Pinecone/Weaviate (RAG for protocol recommendations). The system must handle:

- **Real-time sync** for protocol nudges, wearable data ingestion, social challenges
- **Event-driven architecture** for adaptive coaching, notification triggers, analytics
- **Multi-wearable BYOD** integration (Apple Health, Google Fit, Oura, Whoop, Garmin)
- **HIPAA/GDPR compliance** for biometric data storage, encryption at rest/transit, audit logging
- **Scalability** to 100K users (Month 6), 1M users (Year 2) without infrastructure rewrites

**Key Technology Decisions:**
- **Backend:** Node.js (TypeScript) + Express for APIs; Firebase Cloud Functions for serverless event handlers
- **Database:** Firebase Realtime Database (UX state) + Supabase PostgreSQL (analytics, user profiles, protocol history)
- **AI/ML:** OpenAI GPT-4o API (coaching), Pinecone (vector search for RAG), LangChain (orchestration)
- **Mobile:** React Native (cross-platform iOS/Android)
- **Infrastructure:** Google Cloud Platform (GCP) for Firebase + Supabase; CloudFlare CDN for global latency

**Critical Path Dependencies:**
1. Data model finalization → Dictates API contracts, event schema
2. Wearable SDK integration → Determines biometric data refresh rates, normalization logic
3. RAG architecture → Enables Evidence UX citation system, protocol recommendations
4. Security & compliance → Blocks MVP launch if HIPAA/GDPR requirements unmet

---

## System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  React Native App (iOS/Android)                                     │
│  ├─ Voice/Chat Onboarding UI                                        │
│  ├─ Protocol Engine UI (nudges, logs, Evidence UX)                  │
│  ├─ Social Layer UI (streaks, challenges, leaderboards)             │
│  └─ Wearable Sync UI (connection status, biometric cards)           │
└─────────────────────────────────────────────────────────────────────┘
                            ↕ HTTPS (REST + WebSocket)
┌─────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│  Express.js API Server (Node.js/TypeScript)                         │
│  ├─ /api/users         → User CRUD, profile management              │
│  ├─ /api/protocols     → Protocol CRUD, recommendations (RAG)       │
│  ├─ /api/wearables     → Wearable auth (OAuth), data ingestion      │
│  ├─ /api/social        → Challenges, streaks, leaderboards          │
│  ├─ /api/ai-coach      → Nudge generation, reasoning, audit log     │
│  └─ /api/analytics     → Usage tracking, cohort analysis            │
└─────────────────────────────────────────────────────────────────────┘
                            ↕
┌──────────────────────┬──────────────────────┬──────────────────────┐
│   FIREBASE RTDB      │  SUPABASE POSTGRES   │   CLOUD FUNCTIONS    │
│   (Real-time State)  │  (Analytics Storage) │   (Event Handlers)   │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ • User session       │ • User profiles      │ • Protocol nudges    │
│ • Active challenges  │ • Protocol history   │ • Wearable webhooks  │
│ • Live leaderboards  │ • Wearable data      │ • Nightly jobs       │
│ • Nudge delivery     │ • Challenge records  │ • Analytics ETL      │
└──────────────────────┴──────────────────────┴──────────────────────┘
                            ↕
┌──────────────────────┬──────────────────────┬──────────────────────┐
│   OPENAI API         │   PINECONE (RAG)     │   NOTIFICATION SVC   │
│   (AI Coach)         │   (Protocol Search)  │   (Push/Email/SMS)   │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ • GPT-4o prompts     │ • Protocol embeddings│ • FCM (Firebase)     │
│ • Nudge copy gen     │ • Citation retrieval │ • SendGrid (email)   │
│ • Chat onboarding    │ • Similarity search  │ • Twilio (SMS)       │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

### Architecture Principles

1. **Event-Driven Core:** All state changes emit events (e.g., `ProtocolCompleted`, `WearableDataSynced`, `StreakAchieved`) consumed by Cloud Functions for asynchronous processing
2. **Database Segregation:** Real-time UX data (Firebase RTDB) vs. analytical/historical data (Supabase PostgreSQL) to optimize for latency vs. complex queries
3. **API-First Design:** Mobile app is thin client; all business logic in backend APIs for consistency, testability, and future web client support
4. **Fail-Safe Graceful Degradation:** If OpenAI API fails, fall back to rule-based nudges; if Pinecone fails, serve pre-cached protocol recommendations

---

## Infrastructure Stack

### Technology Stack Matrix

| Layer | Technology | Purpose | Rationale |
|-------|-----------|---------|-----------|
| **Mobile Client** | React Native 0.72+ | Cross-platform iOS/Android app | Single codebase; mature ecosystem; Expo SDK for rapid iteration |
| **Backend API** | Node.js 20 + Express.js + TypeScript | RESTful API server | Non-blocking I/O ideal for real-time; TypeScript for type safety |
| **Real-time Database** | Firebase Realtime Database | Live state (nudges, challenges, sessions) | WebSocket-based; <100ms latency; auto-scales to 100K concurrent users |
| **Analytical Database** | Supabase PostgreSQL 15 | User profiles, protocol logs, analytics | SQL for complex queries; built-in Auth, Row-Level Security (RLS) |
| **AI/ML** | OpenAI GPT-4o API | Adaptive Coach nudge generation | Best-in-class language model; function calling for structured outputs |
| **Vector Database** | Pinecone (Serverless) | Protocol RAG, citation search | Purpose-built for embeddings; 50ms p99 latency; auto-scaling |
| **Orchestration** | LangChain (TypeScript) | RAG pipeline, prompt management | Abstracts OpenAI + Pinecone integration; versioned prompt templates |
| **Authentication** | Firebase Auth + Supabase Auth | User identity, OAuth, JWT sessions | Firebase for mobile SDKs; Supabase for RLS policies |
| **File Storage** | Firebase Storage (GCS) | User avatars, protocol PDFs, share cards | Auto-CDN; integrated with Firebase Auth for access control |
| **Notifications** | Firebase Cloud Messaging (FCM) + SendGrid + Twilio | Push (mobile), email, SMS | FCM for iOS/Android push; SendGrid for transactional email; Twilio for SMS |
| **Analytics** | Mixpanel / Amplitude | User behavior tracking, cohort analysis | Product analytics; funnel tracking; retention dashboards |
| **Error Tracking** | Sentry | Crash reporting, performance monitoring | Real-time error alerts; source map support for React Native |
| **CI/CD** | GitHub Actions + Fastlane | Automated builds, tests, app store deployment | Fastlane for iOS/Android automation; GitHub Actions for orchestration |
| **Monitoring** | Datadog / Google Cloud Monitoring | Infrastructure metrics, uptime alerts | APM for API latency; alert escalation via PagerDuty |

### Database Selection Rationale

**Why Firebase Realtime Database (RTDB)?**
- ✅ Sub-100ms latency for nudge delivery (critical for "just-in-time" coaching)
- ✅ WebSocket-based real-time sync (live challenge leaderboards, social features)
- ✅ Offline-first mobile SDKs (React Native works offline, syncs when online)
- ❌ Limited query capabilities (no JOINs, aggregations)
- ❌ Expensive at scale (pay per GB downloaded; not ideal for analytics)

**Why Supabase PostgreSQL?**
- ✅ Full SQL for complex analytics queries (user cohort analysis, protocol adherence trends)
- ✅ Row-Level Security (RLS) for multi-tenant data isolation (HIPAA compliance)
- ✅ Built-in RESTful API (auto-generated from schema; reduces boilerplate)
- ✅ Real-time subscriptions (PostgreSQL LISTEN/NOTIFY for live updates if needed)
- ❌ Higher latency than Firebase RTDB (~50-200ms for complex queries)

**Hybrid Strategy:**
```
Real-time UX (Firebase RTDB):
  - Active user sessions
  - Live nudge queue
  - Challenge leaderboards (last 30 days)
  - Notification delivery status

Analytical Storage (Supabase PostgreSQL):
  - User profiles (email, tier, preferences)
  - Protocol history (all-time logs)
  - Wearable data archive (>90 days)
  - Challenge results (completed challenges)
  - AI audit log (all nudges + reasoning)
```

### AI/ML Stack Architecture

**OpenAI GPT-4o Integration:**
```typescript
// Adaptive Coach nudge generation
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const NudgeSchema = z.object({
  protocol_id: z.string(),
  nudge_text: z.string().max(200),
  reasoning: z.string(),
  evidence_citation: z.string(), // DOI or PubMed ID
  confidence_score: z.number().min(0).max(1),
  timing: z.enum(['morning', 'afternoon', 'evening'])
});

async function generateAdaptiveNudge(userProfile, wearableData) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an AI wellness coach. Generate personalized protocol nudges based on user biometrics and evidence-based research. Always cite sources (DOI).`
      },
      {
        role: 'user',
        content: `User: ${userProfile.name}
                  Sleep (last 7 days): ${wearableData.avg_sleep_hours} hours
                  HRV: ${wearableData.hrv}
                  Goal: Improve sleep quality

                  Generate 1 nudge for today.`
      }
    ],
    functions: [
      {
        name: 'generate_nudge',
        description: 'Generate a protocol nudge with citation',
        parameters: NudgeSchema
      }
    ],
    function_call: { name: 'generate_nudge' }
  });

  const nudge = JSON.parse(completion.choices[0].message.function_call.arguments);
  return NudgeSchema.parse(nudge); // Validate schema
}
```

**Pinecone RAG Architecture:**
```typescript
// Protocol recommendation via RAG
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index('wellness-protocols');

const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-small', // 1536 dimensions, $0.02/1M tokens
  openAIApiKey: process.env.OPENAI_API_KEY
});

async function findRelevantProtocols(userQuery: string, topK: number = 5) {
  // Generate query embedding
  const queryEmbedding = await embeddings.embedQuery(userQuery);

  // Search Pinecone for similar protocols
  const results = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true
  });

  // Return protocols with citations
  return results.matches.map(match => ({
    protocol_id: match.id,
    name: match.metadata.name,
    description: match.metadata.description,
    citations: match.metadata.citations, // Array of DOIs
    similarity_score: match.score
  }));
}

// Example usage:
const protocols = await findRelevantProtocols(
  "I need help falling asleep faster",
  topK: 3
);
// Returns: [Wind-Down Routine, Sleep Restriction Therapy, Huberman Morning Light]
```

**LangChain Integration for RAG Pipeline:**
```typescript
import { RetrievalQAChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';

// Setup vector store
const vectorStore = await PineconeStore.fromExistingIndex(
  new OpenAIEmbeddings(),
  { pineconeIndex: index }
);

// Setup QA chain
const model = new ChatOpenAI({ modelName: 'gpt-4o' });
const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

// Query with context
const response = await chain.call({
  query: "What's the optimal morning light exposure duration?"
});

console.log(response.text);
// "10-30 minutes of bright light (10,000 lux or sunlight) within 1 hour of waking optimizes circadian rhythm. [Source: Walker et al., Nature Reviews, 2017; DOI: 10.1016/...]"
```

### Notification Infrastructure

**Multi-Channel Notification Router:**

```typescript
// Unified notification service
enum NotificationChannel {
  PUSH = 'push',         // Firebase Cloud Messaging
  EMAIL = 'email',       // SendGrid
  SMS = 'sms',           // Twilio
  IN_APP = 'in_app'      // Firebase RTDB
}

interface NotificationPayload {
  user_id: string;
  type: 'nudge' | 'streak' | 'challenge' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  priority: 'high' | 'normal' | 'low';
}

async function sendNotification(payload: NotificationPayload) {
  const user = await getUserPreferences(payload.user_id);

  // Respect user quiet hours
  if (isWithinQuietHours(user.quiet_hours)) {
    // Queue for later delivery
    await queueNotification(payload, user.quiet_hours.end_time);
    return;
  }

  // Multi-channel delivery
  const promises = payload.channels.map(channel => {
    switch (channel) {
      case NotificationChannel.PUSH:
        return sendPushNotification(payload);
      case NotificationChannel.EMAIL:
        return sendEmailNotification(payload);
      case NotificationChannel.SMS:
        return sendSMSNotification(payload);
      case NotificationChannel.IN_APP:
        return writeToFirebase(`/notifications/${payload.user_id}`, payload);
    }
  });

  await Promise.allSettled(promises);
}

// Firebase Cloud Messaging (Push)
async function sendPushNotification(payload: NotificationPayload) {
  const message = {
    notification: {
      title: payload.title,
      body: payload.body
    },
    data: payload.data,
    token: await getFCMToken(payload.user_id),
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    },
    android: {
      priority: payload.priority === 'high' ? 'high' : 'normal'
    }
  };

  await admin.messaging().send(message);
}
```

---

## AI/ML Systems & RAG Architecture

### Protocol RAG Pipeline

**Embedding Generation Workflow:**

```
┌──────────────────────────────────────────────────────────────┐
│ PROTOCOL CONTENT PIPELINE (Once per protocol update)         │
└──────────────────────────────────────────────────────────────┘
                         ↓
  1. Fetch protocol from PostgreSQL (protocol_id, content, citations)
  2. Construct embedding-ready text:
     "Protocol: Morning Light Exposure
      Description: View bright light (10,000 lux or sunlight) within 30 min of waking.
      Benefits: Advances circadian rhythm, improves sleep onset latency.
      Citations: Walker et al. 2017 (DOI: 10.1016/j.smrv.2016.10.001),
                 Zee et al. 2024 (DOI: 10.1016/j.sleh.2023.07.018)"
  3. Generate embedding via OpenAI text-embedding-3-small (1536 dim)
  4. Upsert to Pinecone:
     {
       id: 'protocol_morning_light',
       vector: [0.123, -0.456, ...], // 1536 floats
       metadata: {
         name: 'Morning Light Exposure',
         description: 'View bright light...',
         citations: ['10.1016/j.smrv.2016.10.001', '10.1016/j.sleh.2023.07.018'],
         category: 'sleep',
         duration_minutes: 10-30
       }
     }
  5. Index ready for query

┌──────────────────────────────────────────────────────────────┐
│ USER QUERY PIPELINE (Real-time, <500ms latency)              │
└──────────────────────────────────────────────────────────────┘
  User query: "I can't fall asleep, what should I do?"
                         ↓
  1. Generate query embedding (same model: text-embedding-3-small)
  2. Query Pinecone:
     - Similarity search (cosine similarity)
     - topK = 3-5 protocols
     - Filter by user tier (e.g., Free tier can't access Pro protocols)
  3. Retrieve matches:
     [
       {protocol: 'Wind-Down Routine', score: 0.87},
       {protocol: 'Caffeine Cutoff', score: 0.81},
       {protocol: 'Morning Light Exposure', score: 0.76}
     ]
  4. Pass to GPT-4o with context:
     "User can't fall asleep. Here are relevant protocols: [list].
      Recommend 1 protocol and explain why with citation."
  5. GPT-4o response:
     "Try the Wind-Down Routine: dim lights 90 min before bed, avoid screens.
      Research shows this reduces sleep onset latency by 15-30 min.
      [Source: Walker, 2017; DOI: 10.1016/j.smrv.2016.10.001]"
  6. Return to user via Evidence UX card
```

**Embeddings Cost Analysis:**

```
Protocol Count: 18 (MVP), 50 (Month 6), 200 (Year 2)
Embedding Model: text-embedding-3-small ($0.02 per 1M tokens)

One-time embedding generation:
  - Per protocol: ~500 tokens (description + citations)
  - MVP (18 protocols): 18 × 500 = 9,000 tokens = $0.0002
  - Year 2 (200 protocols): 200 × 500 = 100,000 tokens = $0.002

Query embeddings (user-facing):
  - Per query: ~50 tokens
  - 10,000 users × 3 queries/day × 30 days = 900,000 queries/month
  - 900K × 50 tokens = 45M tokens/month = $0.90/month

Total embedding cost: ~$1/month (negligible)
```

**Pinecone Scaling Plan:**

```
Plan: Serverless (pay-per-use)
  - Free: 1 index, 100K vectors, 2M queries/month
  - Paid: $0.096 per 1M queries + $0.15 per 1M vectors stored/month

MVP (Month 1):
  - Vectors: 18 protocols × 1 version = 18 vectors (free tier)
  - Queries: 1,000 users × 90 queries/month = 90K queries (free tier)
  - Cost: $0/month

Month 6 (10K users):
  - Vectors: 50 protocols = 50 vectors (free tier)
  - Queries: 10K users × 90 queries/month = 900K queries (free tier under 2M)
  - Cost: $0/month

Year 2 (100K users):
  - Vectors: 200 protocols = 200 vectors (free tier)
  - Queries: 100K users × 90 queries/month = 9M queries
  - Cost: 9M queries × $0.096/1M = $0.86/month

Conclusion: Pinecone costs <$1/month even at 100K users
```

### Adaptive Coach Decision Engine

**Nudge Generation Logic:**

```typescript
// Cloud Function: Triggered nightly at user's optimal time (e.g., 8 PM)
export const generateDailyNudges = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const users = await getActiveUsers(); // Users with AI Coach enabled

    for (const user of users) {
      // Fetch biometric context
      const wearableData = await getWearableData(user.id, days: 7);
      const recentProtocols = await getProtocolHistory(user.id, days: 7);

      // AI-driven nudge generation
      const nudge = await generateAdaptiveNudge({
        user_profile: user,
        wearable_data: wearableData,
        recent_protocols: recentProtocols,
        max_nudges_per_day: user.preferences.nudge_frequency || 2
      });

      // Store in Firebase RTDB for real-time delivery
      await writeToFirebase(`/nudges/${user.id}/${Date.now()}`, nudge);

      // Log for audit trail (GDPR compliance)
      await logAINudge({
        user_id: user.id,
        nudge_id: nudge.id,
        reasoning: nudge.reasoning,
        citations: nudge.evidence_citation,
        timestamp: new Date()
      });
    }
  });
```

**Fallback Logic (OpenAI API Failure):**

```typescript
async function generateAdaptiveNudge(context) {
  try {
    // Primary: OpenAI GPT-4o
    return await generateAINudge(context);
  } catch (error) {
    if (error.code === 'rate_limit_exceeded') {
      // Fallback 1: Rule-based nudges
      return generateRuleBasedNudge(context);
    } else if (error.code === 'service_unavailable') {
      // Fallback 2: Pre-cached generic nudges
      return getCachedNudge(context.user_profile.tier);
    } else {
      // Fail gracefully: No nudge today
      logger.error('AI Coach failure', error);
      return null;
    }
  }
}

function generateRuleBasedNudge(context) {
  const { wearable_data } = context;

  // Simple heuristics
  if (wearable_data.avg_sleep_hours < 7) {
    return {
      protocol_id: 'wind_down_routine',
      nudge_text: 'Your sleep was below 7 hours this week. Try the Wind-Down Routine tonight.',
      reasoning: 'Rule: avg_sleep < 7 hours → recommend sleep protocol',
      evidence_citation: 'Walker et al., 2017',
      confidence_score: 0.6, // Lower confidence for rule-based
      timing: 'evening'
    };
  } else if (wearable_data.hrv < 40) {
    return {
      protocol_id: 'nsdr_recovery',
      nudge_text: 'Your HRV is low. Consider a 10-min NSDR session for recovery.',
      reasoning: 'Rule: HRV < 40 → recommend recovery protocol',
      evidence_citation: 'Huberman Lab Toolkit',
      confidence_score: 0.5,
      timing: 'afternoon'
    };
  } else {
    return null; // No nudge needed
  }
}
```

---

## Core Data Model & Event Schema

### PostgreSQL Schema (Supabase)

**Users Table:**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'core', 'pro', 'elite'
  signup_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  onboarding_completed BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row-Level Security (RLS) for HIPAA compliance
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own data"
  ON users
  FOR ALL
  USING (auth.uid() = id);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);
```

**Protocols Table:**

```sql
CREATE TABLE protocols (
  id TEXT PRIMARY KEY, -- e.g., 'protocol_morning_light'
  name TEXT NOT NULL,
  version TEXT NOT NULL, -- Semantic versioning: 'MAJOR.MINOR.PATCH'
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'sleep', 'light', 'movement', 'nutrition', etc.
  optimal_timing TEXT, -- 'morning', 'afternoon', 'evening'
  duration_minutes JSONB, -- {min: 10, max: 30}
  frequency TEXT, -- '6-7 days per week'
  citations TEXT[], -- Array of DOIs
  tier_required TEXT DEFAULT 'free', -- 'free', 'core', 'pro', 'elite'
  status TEXT DEFAULT 'active', -- 'active', 'deprecated', 'draft'
  created_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  changelog JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX idx_protocols_category ON protocols(category);
CREATE INDEX idx_protocols_tier ON protocols(tier_required);
```

**Protocol Logs Table (User Activity):**

```sql
CREATE TABLE protocol_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  protocol_id TEXT NOT NULL REFERENCES protocols(id),
  date DATE NOT NULL,
  status TEXT NOT NULL, -- 'completed', 'skipped', 'partial'
  duration_actual_minutes INT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Users can only access their own logs
ALTER TABLE protocol_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own protocol logs"
  ON protocol_logs
  FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_protocol_logs_user_date ON protocol_logs(user_id, date DESC);
CREATE INDEX idx_protocol_logs_protocol ON protocol_logs(protocol_id);
```

**Wearable Data Table:**

```sql
CREATE TABLE wearable_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'oura', 'whoop', 'apple_health', 'google_fit', 'garmin'
  date DATE NOT NULL,
  sleep_hours DECIMAL(4,2),
  hrv INT, -- Heart Rate Variability
  resting_hr INT, -- Resting heart rate
  body_temperature_celsius DECIMAL(4,2),
  readiness_score INT, -- Oura/Whoop readiness (0-100)
  steps INT,
  calories_burned INT,
  raw_payload JSONB, -- Store full API response for debugging
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Users can only access their own wearable data
ALTER TABLE wearable_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own wearable data"
  ON wearable_data
  FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_wearable_user_date ON wearable_data(user_id, date DESC);
CREATE INDEX idx_wearable_source ON wearable_data(source);
```

**AI Audit Log (GDPR Article 22 Compliance):**

```sql
CREATE TABLE ai_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  decision_type TEXT NOT NULL, -- 'nudge_sent', 'protocol_recommended', 'frequency_adjusted'
  decision_details JSONB NOT NULL, -- Full reasoning + sources
  user_action TEXT, -- 'opened', 'dismissed', 'marked_helpful', 'marked_not_helpful'
  user_action_timestamp TIMESTAMPTZ,
  feedback_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE ai_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own AI audit log"
  ON ai_audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_ai_audit_user_time ON ai_audit_log(user_id, timestamp DESC);
```

**Challenges Table (Social Layer):**

```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'private', 'team', 'public'
  duration_days INT NOT NULL,
  target_completion_days INT NOT NULL, -- e.g., 25 out of 30 days
  protocol_ids TEXT[], -- Array of protocol IDs required
  participants UUID[], -- Array of user IDs
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'canceled'
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_participants ON challenges USING GIN(participants);
```

### Event Schema (Firebase Cloud Functions)

**Event Types:**

```typescript
enum EventType {
  // User events
  USER_SIGNED_UP = 'user.signed_up',
  USER_ONBOARDING_COMPLETED = 'user.onboarding_completed',
  USER_TIER_UPGRADED = 'user.tier_upgraded',
  USER_CHURNED = 'user.churned',

  // Protocol events
  PROTOCOL_COMPLETED = 'protocol.completed',
  PROTOCOL_SKIPPED = 'protocol.skipped',
  STREAK_ACHIEVED = 'streak.achieved', // 7, 30, 100 days

  // Wearable events
  WEARABLE_CONNECTED = 'wearable.connected',
  WEARABLE_DATA_SYNCED = 'wearable.data_synced',
  WEARABLE_SYNC_FAILED = 'wearable.sync_failed',

  // AI Coach events
  NUDGE_GENERATED = 'ai_coach.nudge_generated',
  NUDGE_DELIVERED = 'ai_coach.nudge_delivered',
  NUDGE_OPENED = 'ai_coach.nudge_opened',
  NUDGE_DISMISSED = 'ai_coach.nudge_dismissed',

  // Social events
  CHALLENGE_CREATED = 'social.challenge_created',
  CHALLENGE_JOINED = 'social.challenge_joined',
  CHALLENGE_COMPLETED = 'social.challenge_completed',

  // System events
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  FEEDBACK_SUBMITTED = 'feedback.submitted'
}
```

**Event Payload Structure:**

```typescript
interface BaseEvent {
  event_id: string;
  event_type: EventType;
  user_id: string;
  timestamp: number; // Unix epoch milliseconds
  metadata?: Record<string, any>;
}

// Example: Protocol Completed Event
interface ProtocolCompletedEvent extends BaseEvent {
  event_type: EventType.PROTOCOL_COMPLETED;
  metadata: {
    protocol_id: string;
    date: string; // ISO 8601
    duration_minutes: number;
    notes?: string;
    source: 'manual' | 'automated'; // Manual log vs. automated completion
  };
}

// Example: Wearable Data Synced Event
interface WearableDataSyncedEvent extends BaseEvent {
  event_type: EventType.WEARABLE_DATA_SYNCED;
  metadata: {
    source: 'oura' | 'whoop' | 'apple_health' | 'google_fit' | 'garmin';
    date: string;
    sleep_hours?: number;
    hrv?: number;
    readiness_score?: number;
    steps?: number;
  };
}
```

**Event Handlers (Cloud Functions):**

```typescript
// Triggered when protocol is completed → Check for streak achievement
export const onProtocolCompleted = functions.firestore
  .document('protocol_logs/{logId}')
  .onCreate(async (snapshot, context) => {
    const log = snapshot.data() as ProtocolLog;
    const user = await getUser(log.user_id);

    // Calculate current streak
    const streak = await calculateStreak(user.id);

    // Check for milestone achievements (7, 30, 100 days)
    if ([7, 30, 100].includes(streak)) {
      // Emit streak achievement event
      await emitEvent({
        event_type: EventType.STREAK_ACHIEVED,
        user_id: user.id,
        metadata: {
          streak_days: streak,
          protocol_id: log.protocol_id
        }
      });

      // Trigger celebration UI (confetti animation)
      await writeToFirebase(`/celebrations/${user.id}`, {
        type: 'streak',
        days: streak,
        timestamp: Date.now()
      });

      // Send push notification
      await sendNotification({
        user_id: user.id,
        type: 'streak',
        title: `${streak}-day streak! 🔥`,
        body: `You've completed protocols ${streak} days in a row. Keep it up!`,
        channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP]
      });

      // Check if should trigger NPS survey (30-day milestone)
      if (streak === 30) {
        await triggerNPSSurvey(user.id);
      }
    }
  });

// Triggered when wearable data synced → Generate AI nudge if conditions met
export const onWearableDataSynced = functions.firestore
  .document('wearable_data/{dataId}')
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() as WearableData;
    const user = await getUser(data.user_id);

    // Check if AI Coach is enabled for user
    if (!user.preferences.ai_coach_enabled) return;

    // Check for concerning patterns (e.g., sleep < 6 hours)
    if (data.sleep_hours && data.sleep_hours < 6) {
      // Generate adaptive nudge
      const nudge = await generateAdaptiveNudge({
        user_profile: user,
        wearable_data: data,
        trigger: 'low_sleep_detected'
      });

      // Store nudge for delivery
      await writeToFirebase(`/nudges/${user.id}/${Date.now()}`, nudge);

      // Log for audit trail
      await logAINudge(nudge);

      // Emit event for analytics
      await emitEvent({
        event_type: EventType.NUDGE_GENERATED,
        user_id: user.id,
        metadata: {
          nudge_id: nudge.id,
          trigger: 'low_sleep_detected',
          protocol_id: nudge.protocol_id
        }
      });
    }
  });
```

---

## Wearable Integration Architecture

### Supported Wearables & APIs

| Wearable | Integration Method | Data Refresh | Cost | MVP Priority |
|----------|-------------------|--------------|------|--------------|
| **Apple Health** | HealthKit SDK (iOS) | Real-time (on-device) | Free | ✅ MVP (Month 1) |
| **Google Fit** | Google Fit REST API + Android SDK | Hourly sync | Free | ✅ MVP (Month 1) |
| **Oura Ring** | Oura Cloud API v2 (OAuth) | Daily (3 AM PT) | Free (personal use token) | 🟡 Phase 2 (Month 2-3) |
| **Whoop** | Whoop API v1 (OAuth) | Real-time webhook | Free | 🟡 Phase 2 (Month 2-3) |
| **Garmin** | Garmin Health API (OAuth) | Daily sync | Free (requires approval) | 🔵 Phase 3 (Month 4+) |

### Apple Health Integration (HealthKit)

**iOS Permissions Request:**

```swift
import HealthKit

let healthStore = HKHealthStore()

// Define data types to read
let typesToRead: Set<HKSampleType> = [
  HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
  HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!,
  HKObjectType.quantityType(forIdentifier: .restingHeartRate)!,
  HKObjectType.quantityType(forIdentifier: .stepCount)!,
  HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!
]

// Request authorization
healthStore.requestAuthorization(toShare: nil, read: typesToRead) { success, error in
  if success {
    print("HealthKit authorized")
    // Start background delivery
    enableBackgroundDelivery()
  } else {
    print("HealthKit authorization failed: \(error?.localizedDescription ?? "Unknown error")")
  }
}
```

**Background Data Sync:**

```swift
// Enable background delivery for sleep data
func enableBackgroundDelivery() {
  let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!

  healthStore.enableBackgroundDelivery(for: sleepType, frequency: .hourly) { success, error in
    if success {
      // Setup observer query
      setupObserverQuery(for: sleepType)
    }
  }
}

// Observer query: Triggered when new data available
func setupObserverQuery(for sampleType: HKSampleType) {
  let query = HKObserverQuery(sampleType: sampleType, predicate: nil) { query, completionHandler, error in
    if error != nil {
      print("Observer query error: \(error!.localizedDescription)")
      return
    }

    // Fetch new data
    self.fetchLatestSleepData()

    // Call completion handler to acknowledge
    completionHandler()
  }

  healthStore.execute(query)
}

// Fetch sleep data from last 7 days
func fetchLatestSleepData() {
  let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
  let endDate = Date()
  let startDate = Calendar.current.date(byAdding: .day, value: -7, to: endDate)!

  let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictEndDate)

  let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { query, results, error in
    guard let samples = results as? [HKCategorySample] else {
      return
    }

    // Parse sleep data
    for sample in samples {
      let sleepAnalysis = sample.value
      let start = sample.startDate
      let end = sample.endDate
      let duration = end.timeIntervalSince(start) / 3600.0 // hours

      // Send to backend
      self.uploadWearableData(source: "apple_health", date: start, sleepHours: duration)
    }
  }

  healthStore.execute(query)
}
```

### Oura Ring Integration (Cloud API)

**OAuth Flow:**

```typescript
// Step 1: Redirect user to Oura authorization page
const OURA_AUTH_URL = 'https://cloud.ouraring.com/oauth/authorize';
const redirectUri = `${process.env.APP_URL}/api/wearables/oura/callback`;

const authUrl = `${OURA_AUTH_URL}?client_id=${process.env.OURA_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=daily%20personal`;

// Redirect user to authUrl

// Step 2: Handle callback (user approved)
app.get('/api/wearables/oura/callback', async (req, res) => {
  const { code } = req.query;

  // Exchange code for access token
  const tokenResponse = await fetch('https://api.ouraring.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code as string,
      client_id: process.env.OURA_CLIENT_ID!,
      client_secret: process.env.OURA_CLIENT_SECRET!,
      redirect_uri: redirectUri
    })
  });

  const tokens = await tokenResponse.json();
  // { access_token: '...', refresh_token: '...', expires_in: 86400 }

  // Store tokens in database (encrypted)
  await storeWearableCredentials({
    user_id: req.session.user_id,
    source: 'oura',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000)
  });

  res.redirect('/app/wearables?connected=oura');
});

// Step 3: Fetch daily sleep data (Oura Cloud API v2)
async function fetchOuraSleepData(userId: string, date: string) {
  const credentials = await getWearableCredentials(userId, 'oura');

  const response = await fetch(`https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${date}&end_date=${date}`, {
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`
    }
  });

  const data = await response.json();
  // { data: [{ day: '2025-10-22', contributors: { deep_sleep: 90, total_sleep: 420, ... }, score: 82 }] }

  // Parse and store
  const sleepData = data.data[0];
  await storeWearableData({
    user_id: userId,
    source: 'oura',
    date: sleepData.day,
    sleep_hours: sleepData.contributors.total_sleep / 60.0, // Convert minutes to hours
    readiness_score: sleepData.score,
    raw_payload: sleepData
  });
}
```

**Automated Daily Sync (Cloud Function):**

```typescript
// Runs daily at 4 AM PT (after Oura updates daily summaries at 3 AM)
export const syncOuraData = functions.pubsub
  .schedule('0 4 * * *')
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    const users = await getUsersWithWearable('oura');
    const yesterday = formatDate(new Date(Date.now() - 86400000)); // YYYY-MM-DD

    for (const user of users) {
      try {
        await fetchOuraSleepData(user.id, yesterday);
      } catch (error) {
        if (error.status === 401) {
          // Token expired, refresh
          await refreshOuraToken(user.id);
          await fetchOuraSleepData(user.id, yesterday);
        } else {
          logger.error(`Oura sync failed for user ${user.id}`, error);
        }
      }
    }
  });
```

### Data Normalization Layer

**Problem:** Each wearable uses different units, naming conventions, and data structures.

**Solution:** Normalize all wearable data into a common schema before storing in PostgreSQL.

```typescript
interface NormalizedWearableData {
  user_id: string;
  source: 'oura' | 'whoop' | 'apple_health' | 'google_fit' | 'garmin';
  date: string; // ISO 8601 date (YYYY-MM-DD)
  sleep_hours?: number; // Decimal hours (e.g., 7.5)
  hrv?: number; // Milliseconds (RMSSD or SDNN)
  resting_hr?: number; // Beats per minute
  body_temperature_celsius?: number;
  readiness_score?: number; // 0-100 (Oura/Whoop concept)
  steps?: number;
  calories_burned?: number;
  raw_payload: any; // Original API response for debugging
}

// Normalization functions for each source
function normalizeOuraData(ouraPayload: any): NormalizedWearableData {
  return {
    source: 'oura',
    date: ouraPayload.day,
    sleep_hours: ouraPayload.contributors.total_sleep / 60.0,
    hrv: ouraPayload.contributors.hrv_balance, // Oura uses HRV balance (ms)
    body_temperature_celsius: ouraPayload.contributors.body_temperature,
    readiness_score: ouraPayload.score,
    raw_payload: ouraPayload
  };
}

function normalizeAppleHealthData(hkSample: HKCategorySample): NormalizedWearableData {
  return {
    source: 'apple_health',
    date: formatDate(hkSample.startDate),
    sleep_hours: (hkSample.endDate.getTime() - hkSample.startDate.getTime()) / 3600000,
    // Apple Health doesn't provide readiness score → leave undefined
    raw_payload: hkSample
  };
}

// Unified storage function
async function storeWearableData(userId: string, rawData: any, source: string) {
  let normalized: NormalizedWearableData;

  switch (source) {
    case 'oura':
      normalized = normalizeOuraData(rawData);
      break;
    case 'apple_health':
      normalized = normalizeAppleHealthData(rawData);
      break;
    // Add other sources...
    default:
      throw new Error(`Unknown wearable source: ${source}`);
  }

  normalized.user_id = userId;

  // Upsert to PostgreSQL (update if exists for same user+date)
  await supabase
    .from('wearable_data')
    .upsert(normalized, { onConflict: 'user_id,source,date' });

  // Emit event for downstream processing
  await emitEvent({
    event_type: EventType.WEARABLE_DATA_SYNCED,
    user_id: userId,
    metadata: normalized
  });
}
```

---

## Security, Privacy & Compliance

### HIPAA Compliance Requirements

**Wellness OS handles Protected Health Information (PHI):** Biometric data (sleep, HRV, body temperature) qualifies as PHI under HIPAA.

**HIPAA Checklist:**

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **Encryption at Rest** | Supabase PostgreSQL with AES-256 encryption | ✅ Built-in |
| **Encryption in Transit** | TLS 1.3 for all API calls; HTTPS only | ✅ Enforced |
| **Access Controls** | Row-Level Security (RLS) in Supabase; users can only access their own data | ✅ Implemented |
| **Audit Logging** | AI audit log table; all PHI access logged | ✅ Implemented |
| **Data Minimization** | Only collect necessary biometric data; no medical diagnoses stored | ✅ By design |
| **Business Associate Agreements (BAA)** | Execute BAAs with Supabase, Firebase, OpenAI | 🟡 Pre-launch task |
| **Breach Notification** | Incident response plan; notify affected users within 60 days | 🟡 Pre-launch task |
| **User Rights (HIPAA Privacy Rule)** | Users can export data (GDPR Article 20), delete account (GDPR Article 17) | ✅ Implemented |

**Supabase BAA:** Supabase offers HIPAA-compliant infrastructure on paid plans ($25/month minimum). Requires manual BAA execution.

**Firebase BAA:** Google Cloud Platform offers HIPAA-compliant Firebase services with BAA. Must enable via GCP Console.

### GDPR Compliance Requirements

**GDPR Applies:** Wellness OS serves EU users; biometric data is "special category" personal data (GDPR Article 9).

**GDPR Checklist:**

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **Article 6: Lawful Basis** | User consent (onboarding opt-in for AI Coach, wearable sync) | ✅ Implemented |
| **Article 9: Special Category Data** | Explicit consent for biometric processing; health data clearly disclosed | ✅ Implemented |
| **Article 13-14: Transparency** | Privacy policy explains data collection, retention, third parties | 🟡 Legal review required |
| **Article 15: Right of Access** | Users can view all their data in Privacy Dashboard | ✅ Implemented |
| **Article 17: Right to be Forgotten** | Users can delete account; hard delete after 30 days | ✅ Implemented |
| **Article 20: Data Portability** | Users can export data as CSV/JSON | ✅ Implemented |
| **Article 22: Automated Decisions** | AI Coach nudges include explanation ("Why this recommendation?") | ✅ Implemented |
| **Article 25: Data Protection by Design** | RLS, encryption, minimal data collection baked into architecture | ✅ Implemented |
| **Article 30: Records of Processing Activities** | Maintain internal register of PHI processing activities | 🟡 Pre-launch task |
| **Article 33-34: Breach Notification** | Notify supervisory authority within 72 hours; notify users if high risk | 🟡 Incident response plan required |

**Data Processing Agreement (DPA):** Execute DPAs with all third-party processors:
- Supabase (data storage)
- Firebase/GCP (hosting, authentication)
- OpenAI (AI processing)
- Pinecone (vector storage)
- SendGrid (email)
- Twilio (SMS)

### Authentication & Authorization

**Firebase Authentication Strategy:**

```typescript
// User signup via email/password
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();

async function signUp(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create user profile in Supabase
  await supabase.from('users').insert({
    id: user.uid,
    email: user.email,
    tier: 'free',
    onboarding_completed: false
  });

  // Send email verification
  await sendEmailVerification(user);

  return user;
}
```

**Row-Level Security (RLS) in Supabase:**

```sql
-- Policy: Users can only access their own data
CREATE POLICY "Users can only read their own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can only update their own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can only access their own protocol logs
CREATE POLICY "Users can read their own protocol logs"
  ON protocol_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own protocol logs"
  ON protocol_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only access their own wearable data
CREATE POLICY "Users can read their own wearable data"
  ON wearable_data
  FOR SELECT
  USING (auth.uid() = user_id);
```

**API Authentication Flow:**

```
1. User logs in via Firebase Auth (email/password or OAuth)
2. Firebase returns JWT (JSON Web Token)
3. Client includes JWT in Authorization header for all API requests:
   Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
4. Backend API validates JWT with Firebase Admin SDK
5. Extract user_id from JWT; use for RLS queries
```

**Backend JWT Verification:**

```typescript
import admin from 'firebase-admin';

// Middleware: Verify JWT on every API request
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid; // Attach user ID to request
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Protected route example
app.get('/api/profile', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.userId)
    .single();

  res.json(data);
});
```

### Encryption Standards

**Encryption at Rest:**
- **Supabase PostgreSQL:** AES-256 encryption (automatic; managed by Supabase)
- **Firebase Storage:** AES-256 encryption (automatic; managed by Google Cloud Storage)
- **Secrets Management:** Google Secret Manager for API keys, database credentials

**Encryption in Transit:**
- **TLS 1.3** for all HTTPS connections (API <-> Client, API <-> Database, API <-> Third-party APIs)
- **Certificate Pinning** in React Native app (prevent MITM attacks)

**Code Example: Certificate Pinning (React Native):**

```javascript
// Use react-native-ssl-pinning library
import { fetch } from 'react-native-ssl-pinning';

const response = await fetch('https://api.wellness-os.app/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${authToken}`
  },
  sslPinning: {
    certs: ['api-wellness-os'], // SHA-256 hash of server certificate
  }
});
```

### Incident Response Plan

**Breach Detection:**
- **Sentry Alerts:** Crash reports, unexpected API errors
- **Datadog Monitoring:** Unusual database queries, high error rates
- **Manual Reports:** User-reported data leaks, unauthorized access

**Incident Response Workflow:**

```
1. DETECTION (T+0 hours)
   → Alert received (Sentry, Datadog, user report)
   → Assign incident commander (CTO/Security Lead)

2. CONTAINMENT (T+1 hour)
   → Isolate affected systems (disable API endpoints if needed)
   → Revoke compromised credentials (rotate API keys, invalidate JWTs)
   → Document incident timeline

3. ASSESSMENT (T+4 hours)
   → Determine scope: How many users affected?
   → Classify severity: Low (no PHI), Medium (limited PHI), High (mass PHI breach)
   → Notify leadership (CEO, Legal, Privacy Officer)

4. NOTIFICATION (T+24-72 hours)
   → If HIPAA breach: Notify HHS (60 days for <500 users, immediately for >500)
   → If GDPR breach: Notify supervisory authority (72 hours)
   → If high risk: Notify affected users (email + in-app notification)

5. REMEDIATION (T+1 week)
   → Fix root cause (patch vulnerability, enhance security controls)
   → Post-mortem (document lessons learned)
   → Update incident response plan

6. LONG-TERM (T+1 month)
   → Audit compliance (ensure all notifications sent)
   → Train team on incident prevention
   → Enhance monitoring (add new Datadog alerts)
```

**Example Breach Notification Email (GDPR):**

```
Subject: Important Notice Regarding Your Wellness OS Account

Dear [User],

We are writing to inform you of a data security incident affecting your Wellness OS account.

WHAT HAPPENED:
On [Date], we discovered unauthorized access to our database. The investigation revealed that [description of what data was accessed].

DATA AFFECTED:
• Email address
• Sleep data (last 30 days)
• [Other PHI if applicable]

DATA NOT AFFECTED:
• Payment information (handled separately by Stripe)
• Full wearable history (only recent data accessed)

WHAT WE'RE DOING:
• We have fixed the vulnerability and rotated all access credentials.
• We are working with cybersecurity experts to prevent future incidents.
• We have notified the appropriate regulatory authorities.

WHAT YOU CAN DO:
• Reset your password immediately: [Link]
• Review your account for unusual activity
• Contact us with questions: security@wellness-os.app

We sincerely apologize for this incident and are committed to protecting your privacy.

Sincerely,
[Name], CEO
Wellness OS
```

---

## Deployment & Operations

### CI/CD Pipeline (GitHub Actions + Fastlane)

**GitHub Actions Workflow (.github/workflows/deploy.yml):**

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*.*.*' # Trigger on version tags (e.g., v1.0.0)

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run linter
        run: npm run lint

  deploy-backend:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Cloud Functions
        run: |
          npm install -g firebase-tools
          firebase deploy --only functions --token ${{ secrets.FIREBASE_TOKEN }}

  deploy-ios:
    runs-on: macos-latest
    needs: test
    steps:
      - uses: actions/checkout@v3

      - name: Setup Fastlane
        run: |
          sudo gem install fastlane -NV
          cd ios && fastlane init

      - name: Build and deploy to App Store
        env:
          APP_STORE_CONNECT_API_KEY: ${{ secrets.APP_STORE_API_KEY }}
        run: cd ios && fastlane release

  deploy-android:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3

      - name: Setup Fastlane
        run: |
          sudo gem install fastlane -NV
          cd android && fastlane init

      - name: Build and deploy to Google Play
        env:
          ANDROID_KEYSTORE: ${{ secrets.ANDROID_KEYSTORE }}
        run: cd android && fastlane production
```

### Monitoring & Observability

**Datadog Dashboards:**

```
1. API Performance Dashboard
   - p50/p95/p99 latency for each endpoint
   - Error rate (4xx, 5xx)
   - Request volume (requests/min)

2. Database Dashboard
   - Supabase query latency
   - Firebase RTDB read/write operations
   - Connection pool utilization

3. AI/ML Dashboard
   - OpenAI API latency
   - Pinecone query latency
   - AI Coach nudge generation rate
   - RAG retrieval accuracy (manual validation)

4. User Experience Dashboard
   - App crash rate (%)
   - Onboarding completion rate (%)
   - Protocol adherence rate (%)
   - D1, D7, D30 retention
```

**Alert Rules:**

```typescript
// Datadog alerts configured via Terraform

// Alert 1: High API error rate
{
  name: 'High API Error Rate',
  query: 'sum(last_5m):sum:api.errors{env:production}.as_rate() > 0.05',
  message: '@pagerduty-critical API error rate >5% in last 5 min',
  thresholds: { critical: 0.05, warning: 0.02 }
}

// Alert 2: OpenAI API failure
{
  name: 'OpenAI API Unavailable',
  query: 'sum(last_1m):sum:openai.api.errors{env:production} > 10',
  message: '@slack-eng OpenAI API failing; AI Coach degraded',
  thresholds: { critical: 10 }
}

// Alert 3: Database connection pool exhaustion
{
  name: 'Supabase Connection Pool Full',
  query: 'avg(last_5m):avg:supabase.connections.active{env:production} > 90',
  message: '@pagerduty-critical Supabase connection pool >90% utilization',
  thresholds: { critical: 90, warning: 75 }
}
```

### Scaling Strategy

**Month 1 (MVP, 1K users):**
- Supabase Free Tier (500MB database, 2GB bandwidth)
- Firebase Spark Plan (Free tier)
- Pinecone Serverless (Free tier, 100K vectors, 2M queries/month)
- Total Infrastructure Cost: **$0/month**

**Month 6 (10K users):**
- Supabase Pro ($25/month, 8GB database, 50GB bandwidth)
- Firebase Blaze Plan (~$50/month, pay-per-use)
- Pinecone Serverless (~$1/month)
- OpenAI API (~$500/month, 10K users × 2 nudges/day × 200 tokens × $0.01/1K tokens)
- SendGrid (~$20/month, 20K emails)
- Total Infrastructure Cost: **~$600/month** ($0.06/user/month)

**Year 2 (100K users):**
- Supabase Team ($599/month, 100GB database)
- Firebase Blaze Plan (~$500/month)
- Pinecone Serverless (~$10/month)
- OpenAI API (~$6,000/month)
- SendGrid (~$100/month)
- Datadog (~$200/month)
- Total Infrastructure Cost: **~$7,500/month** ($0.075/user/month)

**Scaling Trigger Points:**

```
IF daily_active_users > 50K:
  → Move from Cloud Functions to dedicated Compute Engine (GCP)
  → Horizontal scaling: Add load balancer + 3-5 backend instances

IF database_size > 100GB:
  → Migrate to Supabase Enterprise (custom pricing)
  → Enable read replicas for analytics queries

IF openai_api_cost > $10K/month:
  → Evaluate fine-tuned GPT-3.5 model (cheaper at scale)
  → Implement aggressive caching (Redis) for common nudges

IF pinecone_queries > 50M/month:
  → Migrate to dedicated Pinecone pod ($70/month for p1 pod)
```

---

## Architecture Decision Records

### ADR-001: Hybrid Database Strategy (Firebase + Supabase)

**Context:** Need real-time UX (nudges, challenges) AND complex analytics queries (cohort analysis, protocol adherence trends).

**Decision:** Use Firebase Realtime Database for real-time UX state; Supabase PostgreSQL for analytical/historical data.

**Rationale:**
- Firebase RTDB excels at low-latency (<100ms) real-time sync but lacks SQL querying
- Supabase PostgreSQL supports complex JOINs, aggregations, RLS but has higher latency (~50-200ms)
- Hybrid approach optimizes for both use cases without compromising either

**Consequences:**
- ✅ Pro: Best-in-class UX latency + powerful analytics
- ❌ Con: Dual-write complexity (write to both databases for overlapping data)
- ❌ Con: Higher operational overhead (monitor two databases)

**Mitigation:**
- Use event-driven architecture: Write to Firebase first (UX priority), then async write to Supabase via Cloud Function
- Supabase is source-of-truth for historical data; Firebase is cache

---

### ADR-002: OpenAI GPT-4o for AI Coach (vs. Self-Hosted LLM)

**Context:** Need adaptive AI coaching with citations, reasoning, and natural language generation.

**Decision:** Use OpenAI GPT-4o API instead of self-hosted LLM (e.g., Llama 3, Mistral).

**Rationale:**
- GPT-4o has best-in-class reasoning and citation accuracy
- Self-hosted LLMs require GPU infrastructure ($500-2,000/month minimum)
- OpenAI API cost at 10K users: ~$500/month (cheaper than self-hosted)
- GPT-4o function calling enables structured outputs (validated with Zod schemas)

**Consequences:**
- ✅ Pro: No infrastructure overhead; scales automatically
- ✅ Pro: State-of-the-art quality (better than open-source LLMs as of 2025)
- ❌ Con: Vendor lock-in (OpenAI pricing changes could impact margins)
- ❌ Con: Privacy: User data sent to OpenAI (mitigated with DPA, HIPAA BAA)

**Mitigation:**
- Execute Business Associate Agreement (BAA) with OpenAI for HIPAA compliance
- Monitor OpenAI pricing; set budget alerts (>$10K/month triggers self-hosted evaluation)
- Implement fallback logic (rule-based nudges if OpenAI API fails)

---

### ADR-003: React Native for Cross-Platform Mobile

**Context:** Need iOS + Android apps; limited engineering resources in MVP phase.

**Decision:** Use React Native (single codebase) instead of native Swift/Kotlin.

**Rationale:**
- 80-90% code sharing between iOS/Android reduces development time by 50%
- Mature ecosystem (Expo SDK, React Navigation, Firebase SDKs)
- Acceptable performance for UI-heavy wellness app (not CPU-intensive like gaming)

**Consequences:**
- ✅ Pro: Faster iteration; single team can ship both platforms
- ✅ Pro: Shared business logic (AI Coach, Protocol Engine)
- ❌ Con: Platform-specific bugs (iOS gestures vs. Android back button)
- ❌ Con: Some native modules require custom bridges (e.g., HealthKit)

**Mitigation:**
- Use Expo managed workflow for MVP (handles native builds)
- Eject to bare React Native if custom native modules needed (Phase 2)
- Maintain 10-15% platform-specific code for edge cases

---

### ADR-004: Pinecone for RAG (vs. Self-Hosted Weaviate)

**Context:** Need vector database for protocol recommendations, citation search.

**Decision:** Use Pinecone Serverless instead of self-hosted Weaviate.

**Rationale:**
- Pinecone Serverless free tier covers MVP (100K vectors, 2M queries/month)
- Managed service (no infrastructure overhead)
- 50ms p99 latency (acceptable for non-real-time RAG)
- Cost at 100K users: ~$10/month (cheaper than self-hosting)

**Consequences:**
- ✅ Pro: Zero operational overhead
- ✅ Pro: Auto-scaling
- ❌ Con: Vendor lock-in (embeddings stored in Pinecone format)

**Mitigation:**
- Export embeddings quarterly (backup to S3)
- If Pinecone pricing increases >10x, migrate to Weaviate (2-week effort)

---

### ADR-005: Row-Level Security (RLS) in Supabase for Multi-Tenancy

**Context:** Need secure data isolation between users (HIPAA requirement).

**Decision:** Use Supabase Row-Level Security (RLS) policies instead of application-layer filtering.

**Rationale:**
- RLS enforces data isolation at database level (defense-in-depth)
- Prevents accidental data leaks from backend bugs
- HIPAA compliance requires database-level access controls

**Consequences:**
- ✅ Pro: Security even if backend logic fails
- ✅ Pro: Simplified backend code (no manual user_id filtering)
- ❌ Con: RLS policies can be complex for multi-tenant queries
- ❌ Con: Debugging harder (need to check both app logic and RLS policies)

**Mitigation:**
- Test RLS policies in staging environment with synthetic users
- Monitor query performance (RLS adds slight overhead)
- Document all RLS policies in schema migration files

---

## Appendices

### API Endpoint Reference

```
Authentication:
  POST   /api/auth/signup
  POST   /api/auth/login
  POST   /api/auth/logout
  POST   /api/auth/refresh-token

Users:
  GET    /api/users/:id
  PATCH  /api/users/:id
  DELETE /api/users/:id
  GET    /api/users/:id/privacy-dashboard
  POST   /api/users/:id/request-data-export
  POST   /api/users/:id/delete-account

Protocols:
  GET    /api/protocols
  GET    /api/protocols/:id
  POST   /api/protocols/:id/log
  GET    /api/protocols/recommendations (RAG-powered)

Wearables:
  GET    /api/wearables/sources
  POST   /api/wearables/connect/:source
  DELETE /api/wearables/disconnect/:source
  GET    /api/wearables/data?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
  POST   /api/wearables/sync (manual trigger)

AI Coach:
  GET    /api/ai-coach/nudges
  POST   /api/ai-coach/nudges/:id/feedback
  GET    /api/ai-coach/audit-log
  GET    /api/ai-coach/settings
  PATCH  /api/ai-coach/settings

Social:
  GET    /api/social/streaks
  GET    /api/social/challenges
  POST   /api/social/challenges
  POST   /api/social/challenges/:id/join
  GET    /api/social/leaderboards

Analytics:
  GET    /api/analytics/dashboard
  GET    /api/analytics/cohorts
```

### Database Backup & Recovery

**Automated Backups:**

```
Supabase:
  - Daily automated backups (last 7 days retained)
  - Point-in-time recovery (PITR) available on Pro plan
  - Manual backup trigger: supabase db dump > backup.sql

Firebase:
  - Daily automated backups (Firestore/RTDB)
  - Export to Google Cloud Storage
  - Manual export: firebase database:get / > backup.json

Recovery Time Objective (RTO): 4 hours
Recovery Point Objective (RPO): 24 hours (last backup)
```

**Disaster Recovery Plan:**

```
1. Database Failure (Supabase/Firebase unavailable)
   → Switch to read-only mode (display cached data)
   → Restore from latest backup (4-hour RTO)

2. Complete Infrastructure Failure (GCP region outage)
   → Activate backup region (us-central1 → us-east1)
   → Restore databases from Cloud Storage backups
   → Update DNS to point to backup region
   → RTO: 8 hours

3. Data Corruption (bad migration, accidental deletion)
   → Identify corruption timestamp
   → Restore from point-in-time backup
   → Replay event log to recover post-backup data
   → RTO: 2-4 hours
```

---

## Next Steps

**Pre-MVP (Month 0):**
1. ✅ Execute BAAs with Supabase, Firebase, OpenAI
2. ✅ Finalize database schema (PostgreSQL + Firebase RTDB)
3. ✅ Implement authentication (Firebase Auth + Supabase RLS)
4. ✅ Setup CI/CD pipeline (GitHub Actions + Fastlane)

**MVP (Month 1):**
1. ✅ Apple Health + Google Fit integration
2. ✅ Adaptive Coach (GPT-4o API + Pinecone RAG)
3. ✅ Protocol Engine (nudge delivery + logging)
4. ✅ Security audit (penetration testing, OWASP compliance)

**Phase 2 (Month 2-3):**
1. 🟡 Oura Ring + Whoop integration
2. 🟡 Advanced analytics dashboard
3. 🟡 Automated nightly jobs (leaderboard refresh, challenge status updates)

**Phase 3 (Month 4+):**
1. 🔵 Garmin integration
2. 🔵 Self-hosted LLM evaluation (if OpenAI costs >$10K/month)
3. 🔵 Multi-region deployment (GDPR data residency for EU users)

---

**Document Version:** 1.0
**Last Updated:** October 23, 2025
**Maintained By:** Engineering Team
**Review Cadence:** Monthly (after each major release)
