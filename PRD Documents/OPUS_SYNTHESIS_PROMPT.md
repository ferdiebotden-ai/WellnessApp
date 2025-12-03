# Opus 4.5 Synthesis Mission: Phase 3 Implementation Plan

> Copy everything below the line into a fresh Opus 4.5 session.

---

## Your Mission

You are Claude Opus 4.5, Lead AI Architect for Apex OS. Your task is to:

1. **Synthesize** 6 Perplexity Deep Research documents + existing codebase into `PHASE_III_IMPLEMENTATION_PLAN.md`
2. **Create** `APEX_OS_PRD_v7.md` — the new master PRD that incorporates all Phase 1-3 understanding cohesively

A previous attempt using Gemini 3 Pro failed due to shallow synthesis and lack of codebase understanding. You will succeed because you can:
1. Explore the actual codebase to understand existing patterns
2. Validate technical feasibility against what's already built
3. Produce TypeScript interfaces that align with existing types
4. Estimate sessions based on actual Phase 2 delivery history
5. Create a cohesive PRD that ties everything together

---

## Phase 1: Research Ingestion (Read These Files)

### Core Reference Documents
```
PRD Documents/APEX_OS_PRD_FINAL_v6.md              — Master PRD (source of truth)
PRD Documents/PHASE_II_IMPLEMENTATION_PLAN.md      — Template + session structure to follow
Master_Protocol_Library.md                          — 18 protocols with evidence citations
```

### Perplexity Research Documents (Phase 3 Scope)
```
PRD Documents/Phase_II_III_Rsearch_Files - Gemini Synthesis/APEX_OS_WEARABLE_APIS_v1.md
PRD Documents/Phase_II_III_Rsearch_Files - Gemini Synthesis/APEX_OS_RECOVERY_ALGORITHM_v1.md
PRD Documents/Phase_II_III_Rsearch_Files - Gemini Synthesis/APEX_OS_WAKE_DETECTION_v1.md
PRD Documents/Phase_II_III_Rsearch_Files - Gemini Synthesis/APEX_OS_CALENDAR_INTEGRATION_v1.md
PRD Documents/Phase_II_III_Rsearch_Files - Gemini Synthesis/APEX_OS_REALTIME_SYNC_v1.md
PRD Documents/Phase_II_III_Rsearch_Files - Gemini Synthesis/APEX_OS_REASONING_SYSTEM_v1.md
```

### Widget Reference (Already Specified)
```
PRD Documents/APEX_OS_WIDGET_PRD_v1.md
PRD Documents/APEX_OS_WIDGET_ANALYTICS_v1.md
```

---

## Phase 2: Codebase Exploration

Before synthesizing, explore the existing codebase to understand:

### Backend Patterns (functions/src/)
- `nudgeEngine.ts` — How nudges are generated (you'll extend this)
- `dailyScheduler.ts` — How daily schedules work
- `wearablesSync.ts` — Existing wearable sync stub (if any)
- `mvd/` — MVD Detector module (latest Phase 2 work)
- `synthesis/` — Weekly synthesis module
- `safety/` — Safety scanning patterns

### Client Patterns (client/src/)
- `components/NudgeCard.tsx` — Nudge display (will need "Why?" panel)
- `services/` — Existing service patterns
- `stores/` — Zustand store patterns

### Database Schema
- `supabase/migrations/` — Current schema
- Understand existing tables: `protocols`, `user_protocols`, `daily_logs`, `weekly_syntheses`

### Types
- `functions/src/types/` — Existing TypeScript interfaces
- Understand `Protocol`, `NudgeContext`, `RecoveryScore` shapes

---

## Phase 3: Synthesis Output

Create `PRD Documents/PHASE_III_IMPLEMENTATION_PLAN.md` with this structure:

### Required Sections

```markdown
# Phase III Implementation Plan: Nervous System

> Real data flow — wearables, calendar, wake detection, real-time sync

## Executive Summary
- Phase 3 scope (3-4 sentences)
- Session count estimate (Phase 2 had 13 sessions)
- Key dependencies on Phase 2 components

## Component Overview

| # | Component | Sessions | Priority | Dependencies |
|---|-----------|----------|----------|--------------|

## Component 1: {Name}

### Scope
{What this delivers, why it matters}

### Technical Specification

#### New Files
| File | Purpose | Lines (est) |
|------|---------|-------------|

#### TypeScript Interfaces
\`\`\`typescript
// MUST be complete, valid TypeScript
// Reference existing types where applicable
// No `any`, no TODOs, no placeholders
\`\`\`

#### API Endpoints
| Method | Path | Auth | Request Body | Response | Rate Limit |
|--------|------|------|--------------|----------|------------|

#### Database Changes
| Migration | Table/Column | Type | Purpose |
|-----------|--------------|------|---------|

#### Integration Points
- How this connects to existing code
- Specific file paths that will be modified

### Implementation Sessions

| Session | Focus | Deliverables | Acceptance Criteria |
|---------|-------|--------------|---------------------|
| N | ... | ... | - [ ] Criteria 1<br>- [ ] Criteria 2 |

### Testing Strategy
- Unit test coverage requirements
- Integration test scenarios
- E2E test cases

### Open Questions
> Items requiring human decision before implementation

---

## Component 2: {Name}
{Same structure}

---

## Cross-Cutting Concerns

### Error Handling Patterns
{Consistent patterns across all components}

### Offline/Degraded Mode
{How each component behaves without connectivity}

### Rate Limit Management
{Central rate limit handling strategy}

### Privacy & Consent
{GDPR, health data handling, user consent flows}

### Security Considerations
{OAuth token storage, API key management, data encryption}

---

## Implementation Order & Dependencies

\`\`\`mermaid
graph TD
    A[Wearable OAuth] --> B[Data Sync]
    B --> C[Recovery Score]
    C --> D[Wake Detection]
    D --> E[Daily Scheduler Integration]
    F[Calendar OAuth] --> G[Meeting Load]
    G --> E
\`\`\`

## Session Timeline

| Session | Component | Cumulative Progress |
|---------|-----------|---------------------|

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|

## Research Gaps

{Items that need additional research before implementation}

## Deferred to Phase 4

| Item | Reason | Prerequisite |
|------|--------|--------------|

---

*Created by: Claude Opus 4.5*
*Date: {date}*
*Source Documents: 6 Perplexity research files + codebase exploration*
```

---

## Phase 4: PRD v7 Creation

After completing `PHASE_III_IMPLEMENTATION_PLAN.md`, create the new master PRD.

### Output: `PRD Documents/APEX_OS_PRD_v7.md`

This is NOT a simple update to v6. It's a cohesive rewrite that:

1. **Incorporates Phase 3 scope** as first-class features (not appendices)
2. **References implementation plans** for technical details
3. **Reflects actual codebase state** after Phase 1-2 completion
4. **Maintains the product vision** while adding concrete specifications

### Required Structure

```markdown
# Apex OS — Product Requirements Document v7.0

> AI-Native Wellness Operating System
> Last Updated: {date}

## Document Map

| Document | Purpose | Status |
|----------|---------|--------|
| This PRD | Product vision, features, specifications | Master |
| PHASE_II_IMPLEMENTATION_PLAN.md | Phase 2 session details | Complete |
| PHASE_III_IMPLEMENTATION_PLAN.md | Phase 3 session details | Ready |
| Master_Protocol_Library.md | Evidence-based protocols | Reference |

---

## 1. Product Vision
{Refined from v6, incorporating learnings}

## 2. Target User
{The Optimized Founder — keep from v6}

## 3. Core Features

### 3.1 Protocol Engine (Phase 1 — Complete)
{What was built, how it works}

### 3.2 AI Reasoning Layer (Phase 2 — Complete)
- Memory Layer
- Confidence Scoring
- Suppression Engine
- Safety & Compliance
- Weekly Synthesis
- MVD Detector

### 3.3 Real Data Integration (Phase 3 — Ready)
- Wearable Sync (Oura, WHOOP, Apple Health, Google Fit, Garmin)
- Recovery Score Engine
- Wake Detection
- Calendar Integration
- Real-time Sync Architecture

### 3.4 User Experience
- Nudge Cards with "Why?" Reasoning Panel
- Widgets (iOS/Android)
- Weekly Synthesis Notifications

## 4. Technical Architecture
{Updated to reflect actual implementation}

### 4.1 System Diagram
{Mermaid diagram showing all components}

### 4.2 Data Flow
{How data moves through the system}

### 4.3 Database Schema
{Current schema from migrations}

## 5. API Reference
{All endpoints, organized by domain}

## 6. Privacy & Compliance
{Health data handling, consent, GDPR}

## 7. Quality Standards
{Testing requirements, performance targets}

## 8. Roadmap

### Phase 1: Spinal Cord ✅ Complete
### Phase 2: Brain ✅ Complete
### Phase 3: Nervous System 🔄 Ready
### Phase 4: Polish & Launch 📋 Planned

## 9. Appendices
{Link to detailed implementation plans}

---

*Version History:*
- v7.0 (Dec 2025): Comprehensive rewrite incorporating Phase 3 research
- v6.0: Original PRD with Phase 1-2 scope
```

### PRD v7 Quality Requirements

- [ ] All Phase 1-2 features documented as "Complete"
- [ ] Phase 3 features integrated (not just appended)
- [ ] References implementation plans for technical depth
- [ ] Consistent terminology throughout
- [ ] Accurate reflection of current codebase
- [ ] Clear distinction between complete/ready/planned features
- [ ] Updated architecture diagrams

### What to Preserve from v6
- Product vision and positioning
- Target user persona
- Aesthetic guidelines (dark mode, teal/navy)
- Protocol-first philosophy

### What to Add/Update
- Actual database schema (from migrations)
- Real API endpoints (from codebase)
- Phase 3 features as core features
- System architecture reflecting implementation
- Research-backed specifications from Perplexity docs

---

## Quality Requirements

### TypeScript Interfaces Must:
- [ ] Reference existing types from `functions/src/types/`
- [ ] Be complete (no `Partial<>` unless justified)
- [ ] Include JSDoc comments for complex fields
- [ ] Be immediately usable by implementing agent

### Session Estimates Must:
- [ ] Be realistic based on Phase 2 actuals (avg 1-2 sessions per component)
- [ ] Account for OAuth complexity (calendar, wearables = more sessions)
- [ ] Include testing time in estimates

### API Specifications Must:
- [ ] Include authentication requirements
- [ ] Specify rate limits from research
- [ ] Define error response shapes
- [ ] Match existing API patterns in `functions/src/api.ts`

### Database Migrations Must:
- [ ] Follow existing naming convention (YYYYMMDDHHMMSS_description.sql)
- [ ] Include rollback considerations
- [ ] Reference existing table relationships

---

## What to Flag for Human Decision

Create an "Open Questions" section for each component. Flag items like:
- Multiple valid implementation approaches (present options with tradeoffs)
- Scope ambiguity (what's P0 vs P1 vs deferred)
- Third-party service decisions (which OAuth provider for calendar?)
- Privacy/compliance questions
- Features that might conflict with existing PRD vision

---

## After Completing Both Documents

### Deliverables Checklist

- [ ] `PRD Documents/PHASE_III_IMPLEMENTATION_PLAN.md` — Implementation roadmap
- [ ] `PRD Documents/APEX_OS_PRD_v7.md` — New master PRD

### Report to User

Provide a summary including:
1. **Phase 3 Implementation Plan**
   - Component count and total sessions
   - Key technical decisions made
   - Open questions requiring input

2. **PRD v7**
   - Major changes from v6
   - New sections added
   - What was deprecated/removed

3. **Research Gaps** (if any)
   - Missing information from Perplexity docs
   - Additional research needed
   - Questions to clarify with user

4. **Recommendation**
   - Suggested order of review
   - Priority decisions needed before implementation

### Do NOT:
- Begin Phase 3 implementation until both documents are approved
- Delete or modify v6 (it becomes historical reference)
- Make assumptions about ambiguous requirements — flag them instead

---

## Remember

- You are the Lead AI Architect, not a summarizer
- Explore the codebase — don't guess at existing patterns
- Produce implementation-ready specs, not high-level descriptions
- Flag uncertainty rather than making assumptions
- The goal is one-shot implementation success for each session

Start by reading STATUS.md, then begin the research ingestion phase.
