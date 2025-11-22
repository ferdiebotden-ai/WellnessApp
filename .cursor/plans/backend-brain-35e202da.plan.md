<!-- 35e202da-d6ad-4f64-b00d-933af958999e 992c20aa-e171-4efa-a2ca-df27b879e9ff -->
# Backend Brain Validation & Demo Readiness

## Context

We just successfully deployed three critical "Backend Brain" Google Cloud Functions:

- `generateDailySchedules` - Creates personalized daily protocol schedules (MISSION_004)
- `generateAdaptiveNudges` - Generates proactive AI coaching nudges with RAG (MISSION_006)
- `postChat` - Two-way conversational AI with HIPAA safeguards (MISSION_030)

These functions are deployed but not yet activated or tested. To get a working demo, we need to:

1. Ensure database has protocol/module data
2. Set up automatic triggers for scheduled functions
3. Validate each function works end-to-end
4. Test the complete user journey

## Phase 1: Data Foundation (MISSION_009)

### Verify and Seed Supabase Database

**File:** `supabase/seed/mission_009_modules_protocols.sql` (already exists)

This seed file contains:

- 6 modules (3 core: Sleep, Morning, Focus; 3 pro: Stress, Energy, Dopamine)
- 18 protocols with evidence-based summaries
- Module-protocol mappings with tier requirements

**Action Required:**

1. Connect to Supabase project and verify if tables exist and are populated
2. If empty, run the seed file to populate modules, protocols, and mappings
3. Verify data with sample queries

### Seed Pinecone Vector Index

**Files to create:**

- `scripts/seed-pinecone.ts` - Script to embed all 18 protocols and upload to Pinecone

**Requirements:**

- Read protocols from Supabase
- Generate embeddings using OpenAI `text-embedding-3-large`
- Upsert vectors to Pinecone with metadata (protocol_id, module_id, category)
- Verify vectors are searchable

This enables the RAG (Retrieval-Augmented Generation) system for AI nudges and chat.

## Phase 2: Cloud Scheduler Setup

### Create Pub/Sub Topics (Already Done)

Confirmed these topics exist:

- `daily-tick` - For daily scheduler
- `hourly-tick` - For nudge engine

### Set Up Cloud Scheduler Jobs

Create two Cloud Scheduler jobs in GCP Console:

**Daily Scheduler Job:**

- Name: `trigger-daily-scheduler`
- Frequency: `0 2 * * *` (2 AM UTC daily)
- Target: Pub/Sub topic `daily-tick`
- Payload: `{}`

**Hourly Nudge Job:**

- Name: `trigger-nudge-engine`
- Frequency: `0 * * * *` (Every hour)
- Target: Pub/Sub topic `hourly-tick`
- Payload: `{}`

These will automatically trigger the deployed functions on schedule.

## Phase 3: End-to-End Testing

### Test 1: Daily Scheduler Function

**Goal:** Verify `generateDailySchedules` creates schedules in Firestore

**Steps:**

1. Create a test user in Supabase `users` table
2. Create a module enrollment for the test user (e.g., enroll in `mod_sleep`)
3. Manually trigger the function via Pub/Sub in GCP Console
4. Check Firestore `/schedules/{user_id}/{YYYY-MM-DD}` for generated schedule
5. Verify schedule contains correct protocols from enrolled module

**Expected Result:** Firestore document with array of scheduled protocols (morning light, evening light, NSDR)

### Test 2: AI Nudge Engine

**Goal:** Verify `generateAdaptiveNudges` creates personalized nudges

**Steps:**

1. Use the same test user from Test 1
2. Add mock health metrics to user profile (sleep_hours, hrv)
3. Add a protocol_log entry (simulate user completed a protocol)
4. Manually trigger via Pub/Sub topic `hourly-tick`
5. Check Firestore `/live_nudges/{user_id}/entries` for new nudge
6. Verify nudge text is contextual and mentions user's module/protocol
7. Check Supabase `ai_audit_log` table for logged decision

**Expected Result:** Firestore nudge with GPT-generated text referencing user context and RAG-retrieved protocol evidence

### Test 3: Conversational Chat API

**Goal:** Verify `postChat` endpoint works with RAG and safety checks

**Steps:**

1. Get Firebase Auth token for test user
2. Send POST request to `/api/chat` with message: "How can I improve my sleep quality?"
3. Verify response includes:

- GPT-generated coaching advice
- Protocol citations from Pinecone RAG
- Medical disclaimer if medical advice detected

4. Check Firestore `/users/{userId}/conversations/{conversationId}/messages` for saved chat
5. Check `ai_audit_log` for logged interaction
6. Test crisis detection: Send "I'm feeling suicidal" → expect crisis response

**Expected Result:** Contextual, evidence-based response with protocol recommendations and proper safety handling

## Phase 4: Client Integration Verification

### Test AI Coach Button Flow

**Files to review:**

- `client/src/navigation/MainStack.tsx` - AI Coach button wiring
- `client/src/components/ChatModal.tsx` - Chat UI
- `client/src/services/api.ts` - `sendChatQuery` function

**Verification:**

1. Run the React Native app on a simulator/device
2. Authenticate as test user
3. Tap the AI Coach button in top navigation
4. Verify `ChatModal` opens
5. Send a test message: "What protocols should I try?"
6. Verify response appears in chat bubbles with proper styling
7. Check monetization gate respects `DEV_MODE_FULL_ACCESS` flag

**Expected Result:** Full conversational flow works from UI → API → GPT → UI

### Test Home Screen Integration

**Files to review:**

- `client/src/screens/HomeScreen.tsx` - Dashboard
- `client/src/hooks/useTaskFeed.ts` - Firestore listeners

**Verification:**

1. Open Home screen
2. Verify daily schedule from Firestore `/schedules/` appears as task cards
3. Verify live nudge from Firestore `/live_nudges/` appears as coaching card
4. Tap a task to mark complete → verify updates Firestore and Supabase `protocol_logs`

**Expected Result:** Real-time dashboard showing AI-generated schedule and nudges

## Phase 5: Error Handling & Monitoring

### Add Cloud Function Logging

**Files to enhance:**

- `functions/src/dailyScheduler.ts`
- `functions/src/nudgeEngine.ts`
- `functions/src/chat.ts`

**Enhancements:**

- Add structured logging for key events (start, RAG query, GPT call, completion)
- Log errors with context (user_id, operation, error message)
- Track timing metrics (RAG latency, GPT latency)

### Set Up GCP Monitoring Alerts

Create alerts in GCP Console:

- Function error rate > 10%
- Function execution time > 30 seconds
- Function invocation failures

## Phase 6: Demo User Journey

### Create Complete Test Flow

**Script to automate:**

1. Sign up new user via Firebase Auth
2. Complete onboarding → select "Sleep Optimization" module
3. Wait 5 seconds → verify first-win nudge appears
4. Tap AI Coach → ask "Why is morning light important?"
5. Receive GPT response with protocol citations
6. View Home dashboard → see today's schedule (morning light, evening light, NSDR)
7. Mark "Morning Light" complete
8. Check streak counter increments
9. Next day → scheduler runs → new schedule generated

**Success Criteria:**

- Complete user journey works without manual intervention
- All AI features respond within acceptable time (<5s for nudges, <3s for chat)
- No errors in Cloud Functions logs
- Data persists correctly across Supabase and Firestore

## Key Files

**Backend:**

- `functions/src/dailyScheduler.ts` - Daily schedule generator
- `functions/src/nudgeEngine.ts` - AI nudge generator
- `functions/src/chat.ts` - Conversational AI endpoint
- `functions/src/index.ts` - Function exports
- `.github/workflows/deploy-backend.yml` - CD pipeline

**Data:**

- `supabase/seed/mission_009_modules_protocols.sql` - Module/protocol seed data
- `scripts/seed-pinecone.ts` - (to create) Vector embedding script

**Frontend:**

- `client/src/components/ChatModal.tsx` - Chat UI
- `client/src/navigation/MainStack.tsx` - AI Coach button
- `client/src/screens/HomeScreen.tsx` - Dashboard
- `client/src/hooks/useTaskFeed.ts` - Firestore listeners
- `client/src/services/api.ts` - API client

**Infrastructure:**

- GCP Cloud Scheduler jobs (to create via Console)
- Pinecone index (verify population)
- Supabase database (verify seed)

## Notes

- All functions are already deployed and accessible in GCP
- Seed data exists but needs to be applied to Supabase
- Pinecone needs initial vector population
- Cloud Scheduler needs one-time setup
- Frontend already has UI components, just needs working backend
- `DEV_MODE_FULL_ACCESS=true` in `MonetizationProvider.tsx` bypasses paywalls for testing

### To-dos

- [ ] Verify Supabase has modules/protocols seeded, run seed file if needed
- [ ] Create script to embed 18 protocols and upload to Pinecone index
- [ ] Create Cloud Scheduler jobs for daily and hourly triggers
- [ ] Test generateDailySchedules with test user, verify Firestore output
- [ ] Test generateAdaptiveNudges with RAG, verify nudge generation
- [ ] Test postChat endpoint with sample queries, verify RAG and safety
- [ ] Test AI Coach button flow in React Native app end-to-end
- [ ] Verify Home screen displays schedules and nudges from Firestore
- [ ] Add structured logging and GCP monitoring alerts for functions
- [ ] Execute complete user journey from signup to AI interaction