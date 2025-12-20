# Apex OS — Opus 4.5 MVP Implementation Brief (Beta-Ready, 20–30 Users)

**Purpose:** Guide Claude **Opus 4.5** to take Apex OS from “works in parts” to a **solid, valuable MVP/beta** without scope creep.  
**Canonical product source:** Apex OS PRD v8.1. fileciteturn0file0  
**Voice/tone source:** Apex OS Brand & Voice Reference. fileciteturn0file1  
**Positioning source:** Competitive Analysis + Product Summary. fileciteturn0file2 fileciteturn0file3  
**Protocol library target:** 18 protocols. fileciteturn0file0 fileciteturn0file4  

---

## 0) How to use Opus 4.5 for this project (prompting contract)

Opus 4.5 is designed for **real-world software engineering** and **agentic coding** work (multi-file refactors, sustained planning, repo-level changes). citeturn0search3turn0search10  
Claude’s own docs emphasize **structured instructions** and clear outputs for Claude 4.x models, plus awareness of context + tool usage constraints. citeturn0search1turn0search2  

### Working style (required)
For each session below, Opus should:
1) **Read the relevant code paths** and PRD sections.
2) Produce a **short plan (5–12 bullets)** with explicit “Done when…” acceptance criteria.
3) Implement changes in small PR-sized chunks.
4) Run tests/lint/build; add/adjust tests as needed.
5) Update `STATUS.md` with what shipped + what’s next (PRD references this workflow). fileciteturn0file0  

### Non-negotiable MVP principles (from PRD)
- **Magic moment:** user sees **recovery score + first protocol** fast (PRD targets this within ~30 seconds after onboarding completion) and knows today’s plan in **<10 seconds**. fileciteturn0file0  
- **Notification discipline:** 3–5/day with suppression engine. fileciteturn0file0  
- **Evidence transparency:** every recommendation has a “Why” layer with DOI/citations and confidence. fileciteturn0file0  
- **MVD:** app adapts to bad days and reduces plan to essentials. fileciteturn0file0  
- **Tone:** direct, data-focused, no cheerleader energy (with Direct vs Supportive option). fileciteturn0file0turn0file1  

---

# Sessions (Opus iterates in order)

> **Definition of Beta-Ready:** A new user can onboard, immediately get a non-empty “Today plan”, complete an action with “Why + Evidence”, receive 1–2 well-timed nudges (not spam), see MVD behavior on a “bad day”, and receive a coherent Weekly Synthesis by Day 7—without identity/auth or notification failures.

---

## Session 1 — “Day-0 Bootstrap”: deterministically produce a plan + first win

### What
Implement a **deterministic bootstrap** so that *every* new user reliably gets:
- A non-empty **Today plan** (3–5 actions)
- A visible **Recovery score** (even estimated / Lite mode)
- At least one action with **Why + Evidence** available immediately
- Optional: seed the day with **one nudge scheduled** (respecting suppression rules)

### Why
This is the #1 predictor of Day‑7 retention per PRD: the first minutes must feel like an “OS,” not an empty shell waiting for cron. fileciteturn0file0  

### Done when (acceptance)
- New account → complete onboarding → within **<60 seconds** the Home/Today surface is **non-empty** and shows “Top 3 actions”
- If scheduled jobs are down, the app still produces today’s plan via on-demand bootstrap
- No “invalid UUID / user mapping” errors during bootstrap (see Session 2 hardening)
- Basic telemetry logs “bootstrap success/fail” server-side

### Explicitly out of scope
- Full coach chat history
- Advanced correlation modeling
- Deep wearable breadth expansion

---

## Session 2 — Identity mapping + data integrity hardening (Firebase ↔ Supabase)

### What
Stabilize the identity layer so **all write paths** (enrollments, metrics, synthesis, correlations, notifications) work for every beta user:
- Confirm the canonical user identifier strategy and enforce it consistently
- Make any necessary migration/state sync safe + idempotent
- Add a small “identity healthcheck” utility for debugging

### Why
If identity breaks, the app fails in invisible ways: empty plans, missing nudges, missing syntheses—users churn and you can’t diagnose quickly.

### Done when (acceptance)
- Brand new user can:
  1) enroll in protocols
  2) generate today plan
  3) log completion/feedback
  4) generate synthesis
  without integrity errors
- A single script/test can reproduce the above path
- Clear logs for mapping creation and failures (without leaking sensitive data)

### Explicitly out of scope
- Major schema redesign
- Multi-tenant enterprise roles

---

## Session 3 — Replace “Chat coming soon” with a Day‑1 “Micro‑Coach” (one-shot)

### What
Ship the smallest possible AI coaching experience that matches positioning:
- Replace any dead-end coach CTA with a **one-shot “Explain Today”** micro‑coach
- Provide 3 fixed prompts:
  1) “Explain my plan in one paragraph”
  2) “Why these 3 actions today?”
  3) “If I only do one thing, what is it?”
- Responses must be concise, data-first, no cheerleading, and include citations when relevant (PRD tone + evidence constraints). fileciteturn0file0turn0file1  

### Why
This is the “AI-native” proof point and supports Day‑1 activation without exploding scope into full chat history.

### Done when (acceptance)
- Micro‑coach answers are:
  - **<200 words**
  - action-oriented (ends with 1–2 steps)
  - include “Why” + citations when available
  - safe/guardrailed (no medical diagnosis/prescription)
- Works even if the user has minimal data (uses honest uncertainty per PRD) fileciteturn0file0  

### Explicitly out of scope
- Long-term memory, journaling, multi-turn chat
- Voice mode

---

## Session 4 — Surface “Why + Evidence” at the moment of action (one-tap)

### What
Make transparency feel real in the core loop:
- On each of the top daily actions (at least the top 3), add:
  - a **“Why”** affordance (1–2 sentences + optional expand)
  - an **“Evidence”** affordance (DOI/citation list)
  - a **Confidence** label (Low/Med/High per PRD philosophy)
- Ensure the UI avoids clutter (Bloomberg-meets-Calm; data-dense but serene). fileciteturn0file0turn0file1  

### Why
Apex’s moat is evidence transparency—if it’s buried in deep pages, users perceive it as “just another coach.”

### Done when (acceptance)
- From Home/Today, user can tap Why/Evidence in **<2 taps** per action
- Citations are not hallucinated: prefer protocol library sources and known DOI links
- The “Today plan” remains scannable in **<10 seconds**

### Explicitly out of scope
- Shareable Evidence Cards (Phase 2)
- Full protocol browsing overhaul (unless currently broken)

---

## Session 5 — Notifications: E2E delivery + suppression rules + diagnostics

### What
Make Ambient Intelligence work reliably and safely:
- Verify end-to-end push registration and delivery
- Confirm 3–5/day cap and suppression rules per PRD (quiet hours, meeting load, fatigue, recent completion, etc.). fileciteturn0file0  
- Add a **Notifications Diagnostics** screen for beta testers:
  - token registered? last send? suppression reasons? daily count?

### Why
If nudges don’t arrive, the product feels passive. If they arrive too often, users disable notifications and retention collapses.

### Done when (acceptance)
- A beta user reliably receives 1–2 nudges/day for the first week (depending on settings/data)
- Suppression reasons are visible in diagnostics (no guesswork during beta)
- No more than 5 nudges/day under any condition (unless user explicitly opts in)

### Explicitly out of scope
- Full calendar integration UX polish
- Advanced notification personalization beyond current engine

---

## Session 6 — MVD: visible mode + reduced plan + user control

### What
Turn MVD from “internal logic” into a user-experienced feature:
- Add a clear “Minimum Viable Day” banner and explanation
- Reduce Today plan to essentials (3 items max) when MVD triggers
- Add user control:
  - “I’m struggling today” to activate
  - “I’m good” to override (with guardrails)

### Why
Bad days are the churn moment. MVD is designed to prevent abandonment and protect adherence. fileciteturn0file0  

### Done when (acceptance)
- User can *see* when MVD is active and why
- Actions reduce to essentials and are easy to complete
- The system never shames; it supports (tone constraints)

### Explicitly out of scope
- Multiple MVD variants (Travel MVD etc.) unless already partially implemented
- Complex travel detection polish

---

## Session 7 — Weekly Synthesis: make it coherent, specific, and trustworthy

### What
Improve Weekly Synthesis so it feels like a premium OS feature:
- Produce a structured 5-part synthesis (Win/Watch/Pattern/Trajectory/Experiment per PRD). fileciteturn0file0  
- Ensure it references:
  - adherence (6/7 style)
  - at least one quantified metric delta (even if simple)
  - one recommended experiment for next week
- Prevent generic “AI fluff”: be concise and specific.

### Why
Weekly Synthesis is the retention “reasons to return” loop; it must feel personalized and evidence-led.

### Done when (acceptance)
- A seeded beta account receives a Weekly Synthesis that:
  - is readable in 45–90 seconds
  - has at least 1 specific number
  - includes 1 experiment with clear instructions
- Output is schema-validated (avoid brittle parsing failures)

### Explicitly out of scope
- Advanced charts, share cards
- Full correlation engine overhaul

---

## Session 8 — Beta instrumentation + “quality gates” (ship discipline)

### What
Add minimal but sufficient instrumentation and a beta ops layer:
- Log key events: onboarding completion, plan generated, first action complete, why/evidence opened, nudge sent/opened/suppressed, MVD activation, synthesis opened
- Add a simple dashboard config (even if basic) and ensure events are consistent
- Add a release checklist + triage rubric for the team (P0/P1/P2)

### Why
Without instrumentation, the beta can’t answer the core questions:
- Are users reaching first win?
- Are nudges helping or annoying?
- Are they coming back at Day 7?

### Done when (acceptance)
- Events fire in the right order for a test account
- A single page/doc explains how to validate and interpret beta metrics
- Release checklist exists in-repo and is used

### Explicitly out of scope
- Full analytics warehouse build
- Complex cohort tooling

---

# Beta test script (for internal use)

**Day 1 (15 min):**
- Onboard → verify plan appears → complete 1 action → open Why + Evidence → set quiet hours → confirm 1 nudge arrives

**Day 7 (10 min):**
- Open Weekly Synthesis → run the suggested experiment → test MVD toggle

---

# Final MVP / Beta acceptance checklist (must all be true)

1) New user sees Recovery + Today plan in **<60 seconds** post-onboarding fileciteturn0file0  
2) User completes first action + sees Why/Evidence within **<5 minutes**  
3) Nudges arrive and stay within **3–5/day** (cap at 5) fileciteturn0file0  
4) MVD visibly reduces plan on bad days fileciteturn0file0  
5) Weekly Synthesis is coherent and specific by Day 7 fileciteturn0file0  
6) Tone matches brand (direct, data-first; optional supportive) fileciteturn0file0turn0file1  
7) No identity/auth integrity failures across Firebase/Supabase writes  
8) Instrumentation answers activation + retention questions

---

## Notes / constraints for Opus 4.5
- Keep changes “beta-value dense”: every session should measurably improve activation, trust, adherence, or retention.
- Prefer small PRs, each shippable.
- If something is ambiguous, Opus should **inspect code** and update `STATUS.md` with the discovered truth.

