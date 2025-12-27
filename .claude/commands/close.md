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
   - Include MVP issue ID in commit message if applicable (e.g., "MVP-001: Fix protocol toggle de-selection")

2. **Update MVP_ISSUES.md (if working on an issue):**
   - Change issue status from "Open" to "Complete"
   - Add completion date if tracking

3. **Update STATUS.md:**
   - Update "Last Session" with today's accomplishments
   - If MVP issue was fixed, note the issue ID
   - List specific files created/modified
   - Set "Next Session Priority" to the next logical task or next MVP issue
   - Move current "Last Session" to "Previous Session"

4. **Prune STATUS.md:**
   - Keep only the 3 most recent sessions in history
   - Remove stale items from "Known Issues / Tech Debt" that are resolved
   - Verify "Quick Reference" commands are still accurate

5. **Final Verification:**
   - Run TypeScript check: `cd client && npx tsc --noEmit`
   - Run `git status` to confirm clean state
   - Announce: "Session complete. STATUS.md updated. Next focus: [priority or MVP-XXX]."

$ARGUMENTS
