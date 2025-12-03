---
description: Close session - verify git sync, update STATUS.md, prune history
allowed-tools: ["Bash", "Read", "Edit"]
---

Close session for Apex OS.

**Session Closeout Protocol:**

1. **Verify Git Sync:**
   - Run `git status` - confirm no uncommitted changes
   - Run `git log -1 --oneline` - confirm last commit matches session work
   - If changes exist, commit with descriptive message and push

2. **Update STATUS.md:**
   - Update "Last Session" with today's accomplishments
   - List specific files created/modified
   - Set "Next Session Priority" to the next logical task
   - Move current "Last Session" to "Previous Session"

3. **Prune STATUS.md:**
   - Keep only the 3 most recent sessions in history
   - Remove stale items from "Known Issues / Tech Debt" that are resolved
   - Verify "Quick Reference" commands are still accurate

4. **Final Verification:**
   - Run `git status` to confirm clean state
   - Announce: "Session complete. STATUS.md updated. Next focus: [priority]."

$ARGUMENTS
