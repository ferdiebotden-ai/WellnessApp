---
description: Start a new development session - reads STATUS.md and confirms priorities
---

Resume session for Apex OS.

**Session Initialization Protocol:**

1. **Read STATUS.md** - Identify current phase, last session work, and next priority
2. **Announce state**: "Resuming session. Last: [X]. Next: [Y]."
3. **If task involves code**: Read relevant files before proposing changes
4. **Output execution plan** with specific files to create/modify
5. **Wait for approval** before writing any code

$ARGUMENTS
