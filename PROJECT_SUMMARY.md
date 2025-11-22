# Wellness OS V3.2 - Project Summary

**Document Purpose:** Technical overview for software engineers joining the project  
**Last Updated:** January 2025  
**Project Status:** MVP Development Phase

---

## Executive Summary

**Wellness OS V3.2** is a HIPAA-compliant health and wellness management platform designed to transform peer-reviewed health protocols into sustainable daily habits for performance professionals. The platform combines AI-powered coaching, evidence-based protocol delivery, and multi-wearable biometric integration to help users optimize sleep, energy, focus, and resilience.

**Vision:** "Evidence made effortless."  
**Mission:** To transform peer-reviewed health protocols into sustainable daily habits for performance professionals through AI-powered personalization.

**Target Users:** Performance professionals (Founders, Executives, Knowledge Workers, age 25-40), "Huberman Lab" listeners, existing wearable owners, evidence-obsessed, and time-starved individuals.

**North Star Metric:** ≥6 days/week protocol adherence by Day 30 (Target: 40% of users)

---

## Mission & Vision

### Core Mission
Wellness OS bridges the gap between scientific research and practical daily implementation. We take protocols from peer-reviewed studies (with DOI citations) and deliver them as personalized, actionable nudges through an AI coach that understands each user's context, goals, and biometric data.

### Key Differentiators
1. **Module-Centric UX** - Users focus on life-area improvement (Sleep, Focus, Stress, etc.) rather than individual protocols
2. **Evidence UX** - Every protocol includes DOI citations linking to peer-reviewed research
3. **Conversational AI Coach** - RAG-powered, HIPAA-compliant AI that provides personalized guidance
4. **Multi-Wearable BYOD** - Bring Your Own Device - integrates with Apple Health, Google Fit, and future direct integrations (Oura, Whoop)
5. **Protocol Engine with Evidence-Based Engagement** - Retention driven by health outcomes, not gamification

### Business Model
- **14-day free trial** (no credit card required)
- **Tier 1 (Core):** $29/month - 3 Core Modules, limited AI chat (10 queries/week)
- **Tier 2 (Pro):** $59/month - All 6 Modules, unlimited AI chat
- **Tier 3 (Elite):** $99/month - All Pro features + 1:1 coaching (Phase 3)

---

## Technical Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Mobile Client  │  React Native (Expo) - iOS/Android/Web
│  (React Native) │  Firebase Auth SDK, Firestore SDK
└────────┬────────┘
         │ HTTPS + Firebase JWT
         │
┌────────▼─────────────────────────────────────┐
│     Google Cloud Functions (Serverless)       │
│  - generateDailySchedules (Pub/Sub)          │
│  - generateAdaptiveNudges (Pub/Sub)          │
│  - postChat (HTTP)                            │
│  - API endpoints (HTTP)                       │
└────────┬──────────────────────────────────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼────┐ ┌───▼────┐ ┌───▼────┐
│Supabase│ │Firestore│ │Pinecone│ │Vertex AI│
│Postgres│ │ (NoSQL) │ │Vector DB│ │ Gemini  │
└────────┘ └─────────┘ └─────────┘ └─────────┘
```

### Tech Stack

#### Frontend
- **Framework:** React Native with Expo (~54.0.0)
- **Language:** TypeScript 5.2+
- **State Management:** React hooks + Firestore real-time listeners
- **Navigation:** React Navigation (Bottom Tabs + Native Stack)
- **Platforms:** iOS, Android, Web (via Expo Web)

#### Backend
- **Runtime:** Google Cloud Functions (Gen 2)
- **Language:** Node.js 20+ with TypeScript
- **API Style:** RESTful HTTP endpoints + Pub/Sub event-driven functions
- **Authentication:** Firebase Authentication (JWT-based)
- **Deployment:** GitHub Actions CI/CD → GCP

#### Databases (3-Database Hybrid Strategy)

1. **Supabase (PostgreSQL)** - Source of Truth
   - User profiles, protocol logs, module enrollments
   - Wearable data archive (>90 days)
   - AI audit logs
   - Row-Level Security (RLS) policies enforce user data isolation

2. **Firestore (NoSQL)** - Real-time State & Sync
   - Daily schedules (`/schedules/{userId}/{date}`)
   - Live nudges queue (`/live_nudges/{userId}`)
   - Chat conversations (`/users/{userId}/conversations/{conversationId}`)
   - Offline-first mobile SDK support

3. **Pinecone (Vector Database)** - RAG & Semantic Search
   - Protocol embeddings (768 dimensions)
   - Semantic search for protocol recommendations
   - RAG (Retrieval-Augmented Generation) for AI responses

#### AI/ML Stack

**Current AI Provider:** Google Vertex AI Gemini 2.0 Flash
- **Completion Model:** `gemini-2.0-flash-exp`
- **Embedding Model:** `text-embedding-004` (768 dimensions)
- **Cost:** ~$0.15 input / $0.60 output per million tokens
- **Performance:** 5x faster than GPT-4 Turbo, 96% cost savings

**Previous Stack (Migrated):**
- Originally used OpenAI GPT-4 Turbo
- Migrated to Vertex AI in November 2025 for cost optimization and GCP integration

**AI Functions:**
1. **generateAdaptiveNudges** - Proactive coaching nudges using RAG
2. **postChat** - Two-way conversational AI with HIPAA safeguards
3. **generateDailySchedules** - AI-assisted protocol scheduling

#### Infrastructure & DevOps

**Cloud Platform:** Google Cloud Platform (GCP)
- **Project:** `wellness-os-app`
- **Region:** `us-central1`
- **Infrastructure as Code:** Terraform
- **CI/CD:** GitHub Actions
- **Secrets Management:** Google Secret Manager

**Firebase Services:**
- **Authentication** - Email, Google, Apple sign-in
- **Firestore** - Real-time database
- **Storage** - File storage (future use)
- **Remote Config** - Feature flags

**Other Services:**
- **Pinecone** - Vector database for RAG
- **Mixpanel** - Analytics (MVP), migrating to BigQuery (Phase 2)
- **RevenueCat** - Subscription management
- **Sentry** - Error tracking

---

## AI Software Setup & Configuration

### Vertex AI Configuration

**Project Setup:**
```bash
# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com --project=wellness-os-app

# IAM Permissions
# Cloud Functions service account needs: roles/aiplatform.user
```

**Environment Variables (Secret Manager):**
- `VERTEX_AI_PROJECT_ID` - GCP project ID
- `VERTEX_AI_LOCATION` - Region (us-central1)
- `VERTEX_AI_MODEL` - Model name (gemini-2.0-flash-exp)

**Code Implementation:**
- Provider-agnostic abstraction layer (`functions/src/lib/vertexAI.ts`)
- Centralized completion and embedding generation
- Automatic retry logic and error handling

### RAG (Retrieval-Augmented Generation) Pipeline

**Process:**
1. **Embedding Generation:** User query → Vertex AI embedding (768-dim vector)
2. **Vector Search:** Query Pinecone index for top-K relevant protocol chunks
3. **Context Assembly:** Combine user context + retrieved protocols + conversation history
4. **AI Generation:** Send to Gemini 2.0 Flash with evidence-grounded prompt
5. **Response:** Return personalized response with citations

**Pinecone Configuration:**
- **Index:** `wellness-protocols`
- **Dimensions:** 768 (Vertex AI embeddings)
- **Metadata:** protocol_id, module_tags, category, citations
- **Vectors:** 18 protocols from Protocol Library

### HIPAA Compliance & Security

**7-Layer Ethical Safeguard System:**
1. **Medical Advice Disclaimer** - Automatic disclaimers for medical queries
2. **Crisis Detection** - Suicide/self-harm language detection → crisis resources
3. **Transparency Markers** - All AI responses badged "AI-generated"
4. **Citation Verification** - DOI validation against PubMed/CrossRef APIs
5. **Bias Monitoring** - Monthly audit of random responses
6. **Human Escalation** - "Talk to human coach" option for complex cases
7. **Consent & Data Control** - Explicit consent + Privacy Dashboard

**PHI De-identification:**
- Proxy layer pseudonymizes direct identifiers before AI prompts
- Mapping stored securely in Firestore `/phi_mappings/{userId}`
- Example: "John Doe's HRV is 58ms" → "User [uid:a7b9c3]'s HRV is 58ms"

**Data Encryption:**
- At rest: Automatic encryption (Firestore/Supabase)
- In transit: TLS 1.3
- Access control: RLS policies (Supabase) + Firestore Security Rules

---

## Google Cloud Console Setup

### Required GCP Services

**APIs Enabled (via Terraform):**
- `cloudbuild.googleapis.com` - CI/CD builds
- `cloudfunctions.googleapis.com` - Serverless functions
- `firebase.googleapis.com` - Firebase services
- `firestore.googleapis.com` - Firestore database
- `iam.googleapis.com` - Identity & Access Management
- `run.googleapis.com` - Cloud Run (for Gen 2 Functions)
- `secretmanager.googleapis.com` - Secrets management
- `storage.googleapis.com` - Cloud Storage
- `aiplatform.googleapis.com` - Vertex AI (manually enabled)

### Infrastructure Components

**Terraform-Managed Resources:**
- GCP Project (`wellness-os-app`)
- Firebase project linkage
- Firestore database (native mode)
- Cloud Storage bucket
- Service accounts with IAM bindings

**Manual Setup Required:**
1. **Pub/Sub Topics:**
   - `daily-tick` - Triggers daily scheduler at 2 AM UTC
   - `hourly-tick` - Triggers nudge engine every hour

2. **Cloud Scheduler Jobs:**
   - `daily-scheduler` - Publishes to `daily-tick` topic
   - `hourly-nudge-engine` - Publishes to `hourly-tick` topic

3. **Secret Manager Secrets:**
   - `supabase-url` - Supabase project URL
   - `supabase-service-role-key` - Service role key for backend
   - `supabase-jwt-secret` - JWT secret for RLS
   - `pinecone-api-key` - Pinecone API key
   - `pinecone-index-name` - Index name
   - `revenuecat-webhook-secret` - RevenueCat webhook secret
   - Firebase Admin SDK credentials

### Deployment Pipeline

**GitHub Actions Workflow:**
1. **Trigger:** Push to `main` branch
2. **Lint:** ESLint validation
3. **Test:** Jest (backend) + Playwright (frontend E2E)
4. **Deploy:** Deploy all Cloud Functions to GCP

**Required GitHub Secrets:**
- `GCP_SA_KEY` - Service account JSON key
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`
- `REVENUECAT_WEBHOOK_SECRET`

---

## Application Features & Modules

### Module Framework

The app is organized around **6 Life Domain Modules:**

1. **Sleep Optimization** (Core Tier)
   - Starter Protocols: Morning Light, Evening Light Management, NSDR Session
   - Outcome Metric: Sleep Quality Score

2. **Morning Routine** (Core Tier)
   - Starter Protocols: Morning Light, Hydration, Morning Movement
   - Outcome Metric: Routine Completion %

3. **Focus & Productivity** (Core Tier)
   - Starter Protocols: Caffeine Timing, Breathwork, Deep Work Protocols
   - Outcome Metric: Focus Blocks/day

4. **Stress & Emotional Regulation** (Pro Tier)
   - Starter Protocols: NSDR Session, Breathwork, Gratitude Practice
   - Outcome Metric: HRV Trend

5. **Energy & Recovery** (Pro Tier)
   - Starter Protocols: Cold Exposure, Movement Snacks, Hydration
   - Outcome Metric: Readiness Score

6. **Dopamine Hygiene** (Pro Tier)
   - Starter Protocols: Digital Sunset, Screen-Time Blocks, Information Diet
   - Outcome Metric: Screen Time

### Core User Flows

**Onboarding (< 3 minutes):**
1. User signs up (Firebase Auth)
2. Selects primary module (e.g., "Sleep Optimization")
3. 14-day trial starts
4. First protocol nudge delivered within 5 minutes

**Daily Experience:**
1. User receives personalized daily schedule (Firestore)
2. AI nudges appear based on context (wearable data, protocol history)
3. User logs protocol completion
4. Streaks and progress tracked per module
5. Weekly insights delivered Sunday evening

**AI Coach Interaction:**
1. User taps AI Coach button (top bar) or contextual entry point
2. Asks question about protocols, health metrics, or goals
3. AI responds with evidence-grounded answer + citations
4. Conversation history stored in Firestore
5. Rate limiting enforced (10 queries/week for Core tier)

---

## Data Flow & Architecture Patterns

### Authentication Flow

```
User → Firebase Auth SDK → Firebase JWT Token
  ↓
Client → API Request (JWT in Authorization header)
  ↓
Cloud Function → Validates JWT → Extracts user_id
  ↓
Supabase Query → RLS Policy checks: auth.uid() = user_id
  ↓
Returns user data
```

### AI Nudge Generation Flow

```
Pub/Sub Trigger (hourly-tick)
  ↓
generateAdaptiveNudges Function
  ↓
1. Fetch user context (Supabase: protocol_logs, wearable_data)
2. Query Pinecone for relevant protocols (RAG)
3. Generate embedding for user context
4. Call Vertex AI Gemini 2.0 Flash with:
   - System prompt (professional wellness coach)
   - User context + RAG results
   - Protocol citations
5. Write nudge to Firestore (/live_nudges/{userId})
6. Log to Supabase (ai_audit_log)
```

### Chat Flow

```
User → POST /api/chat (JWT authenticated)
  ↓
postChat Function
  ↓
1. Intent Detection (LangChain chain)
2. Context Retrieval (Supabase/Firestore)
3. PHI De-identification
4. Evidence Grounding (Pinecone RAG)
5. Personalization (Vertex AI Gemini)
6. Safety Check (7-Layer Safeguards)
7. Store in Firestore (/conversations/{userId}/{conversationId})
8. Log to Supabase (ai_audit_log)
  ↓
Return response + citations
```

### Wearable Data Sync Flow

```
Client → Reads Apple Health / Google Fit
  ↓
POST /api/wearables/sync (batched data)
  ↓
Backend Function:
1. Normalize metrics (SDNN → RMSSD conversion)
2. Store in Supabase (wearable_data_archive)
3. Update User.healthMetrics JSONB (trends)
4. Trigger nudge engine (if significant change)
```

---

## Development Workflow

### Codex Agent Integration

This project uses **OpenAI Codex** as an autonomous coding agent:

**Phase 1: Codex Writes Code**
- Human provides mission prompt
- Codex reads repository structure and `AGENTS.md`
- Codex writes production code + test files
- Codex commits to feature branch
- Codex creates pull request

**Phase 2: GitHub Actions Runs Tests**
- PR triggers CI/CD pipeline
- Installs dependencies
- Runs Jest (backend) + Playwright (frontend E2E)
- Reports results on PR

**Phase 3: Human Review & Merge**
- Developer reviews code + test results
- Merge if approved

**Important:** Codex writes tests but does NOT run them. GitHub Actions handles test execution.

### Mission-Based Development

Features are organized as **MISSIONS** (MISSION_001 through MISSION_034):

- **MISSION_001-005:** Infrastructure (Terraform, Firebase, Supabase, RAG pipeline)
- **MISSION_006-010:** AI coaching engine and adaptive nudging
- **MISSION_011-020:** Feature modules (gamification, analytics, onboarding)
- **MISSION_021-025:** Business and monetization features
- **MISSION_026-030:** Launch, compliance, and advanced AI features

Each mission is assigned to Codex via requirements-focused prompts.

---

## Security & Compliance

### HIPAA Compliance

**Requirements:**
- All PHI/PII encrypted at rest and in transit
- Business Associate Agreements (BAAs) with:
  - Google Cloud Platform
  - Supabase
  - Vertex AI (for AI processing)
- Zero-retention AI API usage (no data stored by AI provider)
- PHI de-identification layer before AI prompts

**Access Control:**
- Firebase Authentication (JWT-based)
- Supabase Row-Level Security (RLS) policies
- Firestore Security Rules
- Service account IAM roles (principle of least privilege)

### Data Privacy

**User Rights (GDPR/HIPAA):**
- Privacy Dashboard (view all data)
- Data export (CSV download)
- Account deletion (anonymization workflow)
- Chat history deletion

**Audit Logging:**
- All AI decisions logged to `ai_audit_log` table
- Includes: prompts, responses, citations, user feedback
- Enables continuous learning and bias monitoring

---

## Testing Strategy

### Backend Tests (Jest)
- **Location:** `tests/*.test.ts`
- **Coverage:** Unit tests for business logic, integration tests for API endpoints
- **Mocking:** Supabase client, Firebase Admin, Vertex AI API
- **Run:** `npm run test:backend`

### Frontend E2E Tests (Playwright)
- **Location:** `tests/*.spec.ts`
- **Coverage:** User workflows (login, onboarding, protocol logging, chat)
- **Strategy:** Happy path + 2-3 edge cases per feature
- **Run:** `npm run test:ci`

**Note:** Tests are written by Codex but executed by GitHub Actions CI/CD pipeline.

---

## Current Status & Next Steps

### Completed (MVP Phase 1)
- ✅ Infrastructure provisioning (Terraform)
- ✅ Authentication & user management
- ✅ Module-aware onboarding
- ✅ Daily scheduler (protocol engine)
- ✅ RAG pipeline (Pinecone + Vertex AI)
- ✅ Adaptive nudge engine
- ✅ AI chat (HIPAA-compliant)
- ✅ Wearable integration (Apple Health, Google Fit)
- ✅ Protocol logging & streaks
- ✅ Paywall & subscription (RevenueCat)
- ✅ CI/CD pipeline

### In Progress
- 🔄 Frontend UI refinement
- 🔄 Advanced analytics dashboard
- 🔄 Direct wearable APIs (Oura, Whoop)

### Future (Phase 2-3)
- 📋 Social features (private challenges, anonymous sharing)
- 📋 Advanced modules (Fitness Optimization, Supplement Optimization)
- 📋 1:1 human coaching integration
- 📋 Full continuous learning engine

---

## Key Files & Directories

```
WellnessApp/
├── client/                 # React Native app (Expo)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API clients, Firebase, etc.
│   │   └── screens/        # Screen components
│   └── package.json
├── functions/              # Google Cloud Functions
│   ├── src/
│   │   ├── chat.ts         # AI chat endpoint
│   │   ├── dailyScheduler.ts
│   │   ├── nudgeEngine.ts
│   │   └── lib/
│   │       └── vertexAI.ts # AI provider abstraction
│   └── package.json
├── tests/                  # Test files
│   ├── *.test.ts          # Jest tests (backend)
│   └── *.spec.ts          # Playwright tests (frontend)
├── infra/                  # Infrastructure as Code
│   └── terraform/         # Terraform configs
├── supabase/              # Database
│   ├── migrations/        # SQL migrations
│   └── seed/              # Seed data
└── .github/workflows/     # CI/CD pipelines
```

---

## Getting Started (For New Engineers)

### Prerequisites
- Node.js 20+
- Google Cloud SDK (`gcloud`)
- Terraform 1.5+
- Expo CLI (for mobile development)

### Setup Steps

1. **Clone Repository**
   ```bash
   git clone <repo-url>
   cd WellnessApp
   ```

2. **Install Dependencies**
   ```bash
   # Root dependencies
   npm install
   
   # Client dependencies
   cd client && npm install
   
   # Functions dependencies
   cd ../functions && npm install
   ```

3. **Configure Environment**
   - Copy `.env.example` files (if available)
   - Set up Firebase project credentials
   - Configure Supabase connection
   - Set up Pinecone index

4. **Run Locally**
   ```bash
   # Start Expo dev server
   cd client && npm run start:web
   
   # Run backend functions locally (requires Firebase emulator)
   cd functions && npm run serve
   ```

5. **Run Tests**
   ```bash
   # Backend tests
   npm run test:backend
   
   # Frontend E2E tests (requires Playwright browsers)
   npx playwright install
   npm run test:ci
   ```

### Important Notes
- **Do NOT run tests in CI/CD environment** - GitHub Actions handles this
- **Do NOT install Playwright browsers** unless running tests locally
- All secrets should be in Google Secret Manager (not committed)
- Follow the mission-based development workflow for new features

---

## Contact & Resources

**Key Documentation:**
- `README.md` - Development workflow and setup
- `AGENTS.md` - Codex agent configuration
- `1. Master Blueprint Wellness OS V3.2 Gemini Synthesis.md` - Complete product specification
- `MIGRATION_DEBRIEF.md` - AI migration details (OpenAI → Vertex AI)

**Architecture Decisions:**
- ADR-001: 3-Database Hybrid Strategy (Supabase + Firestore + Pinecone)
- ADR-002: Serverless API & Auth (GCF + Firebase Auth)
- ADR-003: Module-First Architecture
- ADR-004: Vertex AI Migration (cost optimization)

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained By:** Development Team

