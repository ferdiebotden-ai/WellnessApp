# Backend Brain Activation Debrief
**Date:** November 20, 2025
**Status:** ✅ Activated & Seeded
**Architecture:** Vertex AI (Gemini 2.0 Flash) + Pinecone (768-dim) + Supabase

---

## Executive Summary
We have successfully "hydrated" and activated the Wellness App's backend intelligence. The infrastructure is now live, the database is seeded with protocols, and the RAG (Retrieval-Augmented Generation) system is populated with embeddings.

## Key Accomplishments

### 1. Infrastructure "Hydration"
- **Database Schema:** Created `modules`, `protocols`, `module_protocol_map`, and `ai_audit_log` tables in Supabase.
- **Cloud Triggers:** Established Google Cloud Pub/Sub topics (`daily-tick`, `hourly-tick`) and Cloud Scheduler jobs to drive the autonomous agents.
- **IAM Configuration:** Granted `Vertex AI User` permissions to the Firebase Service Account, enabling serverless AI inference.

### 2. Knowledge Injection (RAG Setup)
- **Data Seeding:** Populated the SQL database with 5 core wellness protocols (Morning Light, Evening Light, NSDR, Hydration, Deep Work).
- **Embedding Generation:** Successfully ran `scripts/seed-pinecone.ts` to generate **768-dimensional embeddings** for all protocols using **Vertex AI (`text-embedding-005`)**.
- **Vector DB Population:** Upserted these vectors into the `wellness-protocols` Pinecone index, enabling the AI to "search" this knowledge base.

### 3. Security & Secrets
- **GitHub Actions:** Configured 12 production secrets (including Firebase Admin SDK, Supabase Service Role, and Pinecone API Key) to enable continuous deployment.
- **Authentication:** Verified service-to-service authentication between Cloud Functions, Vertex AI, and Supabase.

---

## How The "Brain" Now Works

### A. The Daily Scheduler (Autonomous)
1. **Trigger:** Cloud Scheduler fires at **2:00 AM UTC**.
2. **Action:** `generateDailySchedules` function wakes up.
3. **Logic:** Reads user's enrolled module -> Checks protocol constraints -> Writes a `DailySchedule` document to Firestore.
4. **Result:** User wakes up to a personalized to-do list on their phone.

### B. The Nudge Engine (Proactive)
1. **Trigger:** Cloud Scheduler fires **every hour**.
2. **Action:** `generateAdaptiveNudges` function wakes up.
3. **Logic:** Checks if user missed a protocol -> Queries Pinecone for motivational context -> Asks Gemini 2.0 Flash to write a 2-sentence nudge.
4. **Result:** User receives a notification: *"Hey, it's 2 PM. A quick 5-minute walk now will boost your afternoon focus. 🚶"*

### C. The Chat Coach (Reactive)
1. **Trigger:** User asks "Why do I need morning light?" in the app.
2. **Action:** `postChat` API is called.
3. **Logic:**
   - **Retrieval:** Embeds user query -> Searches Pinecone -> Finds "Morning Light Exposure" protocol.
   - **Generation:** Sends Protocol Context + User Query to Gemini 2.0 Flash.
   - **Safeguard:** Checks response for medical advice/crisis keywords.
4. **Result:** User gets a scientifically grounded answer with citations.

---

## Configuration Reference

| Component | Value | Purpose |
|-----------|-------|---------|
| **AI Model** | `gemini-2.0-flash-001` | Low-cost, high-speed chat & nudges |
| **Embedding** | `text-embedding-005` | 768-dim vector generation |
| **Vector DB** | Pinecone (`wellness-protocols`) | RAG knowledge retrieval |
| **Database** | Supabase (`vcrdogdyjljtwgoxpkew`) | Structured data & logs |
| **Region** | `us-central1` | Low latency colocation |

---

## Next Steps (Validation Phase)
The system is built and live. The immediate next session should focus on **End-to-End Validation**:
1. **Manual Trigger:** Force-run the Nudge Engine via GCP Console to verify Firestore writes.
2. **Client Test:** Connect the React Native app and chat with the bot to verify RAG accuracy.
3. **Monitoring:** Check `ai_audit_log` in Supabase to see the AI's internal reasoning.



