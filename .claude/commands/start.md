---
description: Start a new development session - reads STATUS.md and confirms priorities
---

Resume session for Apex OS.

**Session Initialization Protocol:**

1. **Read STATUS.md** — Identify current phase, last session work, and next priority

2. **Check for MVP Issue Argument:**
   - If argument provided (e.g., `/start MVP-001`), read `MVP_ISSUES.md` for that specific issue
   - Load the issue details: problem, expected behavior, files to modify, verification steps
   - This becomes the session focus

3. **Announce state**:
   - With issue: "Starting session for MVP-001: Protocol Toggle Not De-selecting"
   - Without issue: "Resuming session. Last: [X]. Next: [Y]."

4. **If task involves code**: Read relevant files before proposing changes ensuring PRD v8.1 is referenced to make sure we have the user journey in mind to accomplish our vision and mission.

5. **If task involves UI/frontend**: Read `skills/apex-os-design/SKILL.md` first

6. **Output execution plan** with specific files to create/modify

7. **Wait for approval** before writing any code

8. **Enhanced Planning** — Leverage full capabilities:
   - Use sub-agents for research and parallel exploration
   - Apply relevant skills (apex-os-design for UI, webapp-testing for E2E)
   - Web search for current best practices when needed
   - Reference PRD for UI/UX alignment with Apex OS vision

   **Include a TL;DR section** at the end of each plan and each coding session for founder review (non-technical, a few key bullets).

**MVP Issue Workflow:**
When working on an MVP issue, follow the verification steps in the issue before marking complete.
After completing an issue, update its status in MVP_ISSUES.md from "Open" to "Complete".

$ARGUMENTS