---
description: Run verification checks before marking work complete
allowed-tools: ["Bash", "Read"]
---

Run verification checks for Apex OS.

**Quality Gates:**

1. **TypeScript Compilation:**
   ```bash
   cd /home/ferdi/projects/WellnessApp/functions && npx tsc --noEmit
   cd /home/ferdi/projects/WellnessApp/client && npx tsc --noEmit
   ```

2. **Git Status:**
   ```bash
   git status
   git diff --stat
   ```

3. **Recent Commits:**
   ```bash
   git log --oneline -5
   ```

4. **API Health (if applicable):**
   ```bash
   curl -s "https://api-26324650924.us-central1.run.app/" | head -c 200
   ```

Report: PASS/FAIL for each check with details on failures.
