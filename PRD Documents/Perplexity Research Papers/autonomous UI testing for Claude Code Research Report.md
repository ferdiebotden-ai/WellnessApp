<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# I need to set up autonomous UI testing for Claude Code Opus 4.5 (Anthropic's

CLI AI assistant) so it can visually verify and catch bugs in my
React Native Expo web app without manual intervention.

**My Setup:**

- Development environment: WSL2 Ubuntu 24.04 on Windows 11
- IDE: VSCode with Remote WSL
- App: React Native Expo SDK 54 with web support (`npx expo start --web` on localhost:8081)
- AI Assistant: Claude Code (claude-opus-4-5) running in terminal
- Current MCP: GitHub MCP only
(`@modelcontextprotocol/server-github`)
- Existing tests: Playwright E2E tests in `tests/*.spec.ts` (run
via `npx playwright test`)

**What I want Claude Code to do autonomously:**

1. Navigate to screens in my running Expo web app
2. Take screenshots and visually analyze them for UI issues
3. Check browser console for JavaScript errors
4. Click elements and fill forms to test interactions
5. Report bugs and layout issues back to me

**Research Questions:**

1. What is the best MCP server for Claude Code to control a
browser? Compare:
    - `@anthropic/mcp-playwright` (if it exists)
    - `@playwright/mcp`
    - `@anthropic/mcp-puppeteer`
    - Any other browser automation MCP servers for Claude Code
2. How do I install and configure the chosen MCP for WSL2? Include:
    - Exact installation command (`claude mcp add ...`)
    - Any WSL2-specific networking considerations
    - How to connect to localhost:8081 from the MCP
3. What capabilities does the browser MCP provide? Specifically:
    - Can it take screenshots that Claude can "see" (vision
analysis)?
    - Can it read browser console logs?
    - Can it click, type, and interact with elements?
    - Can it wait for page loads and animations?
4. What are the limitations?
    - Performance (how slow is it?)
    - Reliability in WSL2 environment
    - Any headless vs headed browser considerations
5. Are there alternative approaches?
    - Can Claude Code run Playwright tests and read the screenshot
artifacts?
    - Is there a way to auto-screenshot on test failure and have
Claude analyze those?
    - Any specialized "visual QA" tools that integrate with Claude?
6. Show me a complete working example:
    - MCP installation command
    - Example Claude Code prompt to test a login screen
    - Expected output format

**Context for answers:**

- I'm using Claude Code in a terminal, not the web chat
- The app is already running on localhost:8081 during development
- I want to catch obvious bugs (blank screens, layout breaks,
console errors) before doing manual UX review
- December 2024/2025 information preferred (latest packages)

Based on my research, I'll provide you with a comprehensive guide to setting up autonomous UI testing for Claude Code with your React Native Expo web app in WSL2.

## 1. Best MCP Server for Browser Control: Playwright MCP (Clear Winner)

**Recommended:** `@playwright/mcp@latest` (official Playwright MCP server)

**Why Playwright MCP wins:**

- **Official support** from Microsoft/Playwright team
- **Cross-browser** capabilities (Chromium, Firefox, WebKit)
- **Accessibility tree-based** understanding (not just pixels) - Claude "sees" semantic structure
- **Built-in console log** monitoring
- **Screenshot capabilities** with visual analysis
- **Active development** and best documentation

**Puppeteer alternatives exist but are less suitable:**

- `@anthropic/mcp-puppeteer` - doesn't exist officially
- Community Puppeteer MCPs (twolven/mcp-server-puppeteer-py) - Chrome-only, Python-based
- Less robust than Playwright for cross-browser testing

***

## 2. Installation \& Configuration for WSL2

### Installation Command

```bash
# Install Playwright MCP for Claude Code
claude mcp add playwright npx @playwright/mcp@latest

# Verify installation
claude mcp list
```


### WSL2-Specific Setup (CRITICAL)

**Problem:** Playwright MCP looks for Chrome at `/opt/google/chrome/chrome` but WSL2 installs browsers in `~/.cache/ms-playwright/`

**Solution:**

```bash
# 1. Install Playwright browsers in WSL2
cd your-project-directory
npx playwright install

# 2. Install Xvfb for headless display (required in WSL2)
sudo apt-get update && sudo apt-get install xvfb

# 3. Create symlink to fix Chrome path issue
sudo mkdir -p /opt/google/chrome
sudo ln -s ~/.cache/ms-playwright/chromium-*/chrome-linux/chrome /opt/google/chrome/chrome

# 4. Verify browser installation
npx playwright screenshot --browser=chromium http://localhost:8081 test.png
```


### Accessing localhost:8081 from MCP

**No special networking needed** - WSL2 can access localhost directly. The MCP will connect to `http://localhost:8081` without issues.

**Optional:** If you encounter networking issues, use the WSL2 IP:

```bash
# Get WSL2 IP address
hostname -I
# Use http://<wsl-ip>:8081 instead
```


***

## 3. Playwright MCP Capabilities

### ✅ What It CAN Do

| Capability | Details |
| :-- | :-- |
| **Screenshots** | `browser_screenshot` - Full page or specific elements |
| **Visual Analysis** | Claude can "see" screenshots via vision and analyze UI issues |
| **Console Logs** | Built-in console message monitoring - captures errors, warnings, logs |
| **Element Interaction** | `browser_click`, `browser_type`, `browser_select_option` |
| **Navigation** | `browser_navigate` to any URL |
| **Wait for Elements** | `browser_wait_for` - handles async loading |
| **Accessibility Tree** | Uses `page.accessibility.snapshot()` - Claude sees semantic structure (buttons, inputs, roles) |
| **Form Filling** | Type into inputs, select dropdowns, check boxes |
| **Tab Management** | `browser_tab_list`, `browser_tab_new`, `browser_tab_select` |
| **Hover Actions** | `browser_hover` for tooltips/dropdowns |

### Console Log Monitoring Example

Playwright MCP automatically captures console messages:

```javascript
// The MCP sets up console listeners like this:
page.on("console", msg => {
    console.log(`[${msg.type()}]: ${msg.text()}`);
});

// Claude can access these logs and report:
// "Console errors detected: TypeError: Cannot read property 'x' of undefined"
```


### Screenshot + Vision Analysis Flow

1. **MCP captures screenshot** → Returns base64 image data
2. **Claude Code receives image** → Uses vision capabilities (Opus 4.5 has vision)
3. **Claude analyzes visually** → "The login button is misaligned 20px to the right"
4. **Claude suggests fixes** → CSS adjustments or layout changes

***

## 4. Limitations \& Considerations

### Performance

| Aspect | Impact |
| :-- | :-- |
| **Speed** | ~4-5 seconds per page navigation (acceptable for automated testing) |
| **Overhead** | Headless mode: minimal. Headed mode: ~30% slower |
| **Parallel execution** | Playwright supports parallel tests, but MCP runs sequentially per Claude session |
| **Resource usage** | Moderate - one browser instance per MCP session |

### WSL2-Specific Limitations

- **Headed browser display** requires X11 forwarding (Xvfb workaround recommended)
- **GPU acceleration** limited in WSL2 - use headless mode for best performance
- **File system** access slower than native Linux - store screenshots in WSL filesystem


### Reliability Concerns

**High reliability in WSL2 IF:**

- ✅ Xvfb installed for headless display
- ✅ Symlink created for Chrome path
- ✅ Using headless mode (default)
- ✅ Proper wait strategies used

**Common issues:**

- ❌ "No browser installed" → Run `npx playwright install`
- ❌ "Failed to start MCP" → Restart Claude Code completely (`claude exit`)
- ❌ Timeout errors → Ensure Expo app is running before testing

***

## 5. Alternative Approaches

### Option A: Playwright Tests + Artifact Analysis (RECOMMENDED)

Instead of real-time MCP control, have Claude analyze test failures:

```bash
# Run Playwright tests with screenshot-on-failure
npx playwright test --screenshot=on-failure

# Claude reads test reports and screenshots
claude "Analyze the test failures in tests/*.spec.ts and the screenshots in test-results/"
```

**Advantages:**

- Faster (no MCP overhead)
- Works with existing Playwright tests
- Claude can read trace files (`npx playwright show-trace`)


### Option B: Visual Regression Testing with Applitools/Percy

Integrate with specialized tools:

- **Applitools** - AI-powered visual testing
- **Percy** - Screenshot comparison
- Claude analyzes diff reports from these tools


### Option C: Auto-Screenshot on Test Failure

Configure Playwright to capture screenshots automatically:

```typescript
// playwright.config.ts
export default {
  use: {
    screenshot: 'only-on-failure', // Auto-capture on failure
    trace: 'retain-on-failure',    // Full trace for debugging
  }
}
```

Then use Claude Code to analyze:

```bash
claude "Review the failing tests and screenshots in test-results/"
```


***

## 6. Complete Working Example

### MCP Installation

```bash
# From your WSL2 terminal
cd ~/your-expo-project

# Install Playwright MCP
claude mcp add playwright npx @playwright/mcp@latest

# Verify
claude mcp list
# Should show: playwright (npx @playwright/mcp@latest)
```


### Claude Code Prompt for Login Screen Testing

**Ensure your Expo app is running:**

```bash
npx expo start --web  # Running on http://localhost:8081
```

**Claude Code prompt:**

```
Use the Playwright MCP to test the login screen at http://localhost:8081:

1. Navigate to the login page
2. Take a screenshot and analyze the layout
3. Check the browser console for any JavaScript errors
4. Try to fill in the email field with "test@example.com"
5. Try to fill in the password field with "password123"
6. Click the "Login" button (or whatever it's called)
7. Wait for any network requests to complete
8. Take another screenshot
9. Report any UI issues, console errors, or broken functionality

Focus on catching:
- Blank screens
- Layout breaks (misaligned elements, overlapping text)
- Console errors (especially network failures or undefined errors)
- Non-functional buttons or inputs
```


### Expected Output Format

Claude Code will respond with structured feedback:

```
🔍 Test Results for Login Screen

✅ Navigation: Successfully loaded http://localhost:8081
✅ Page Load: Rendered without blank screen

📸 Screenshot Analysis (Initial):
- Email input field visible at correct position
- Password input field visible
- Login button centered and accessible

⚠️ Console Errors Detected:
1. [error] TypeError: Cannot read property 'user' of undefined
   Location: app.bundle.js:1234
2. [warning] React Warning: Each child in a list should have a unique "key" prop

✅ Form Interaction:
- Email field accepts input
- Password field accepts input (masked correctly)
- Login button is clickable

❌ ISSUE FOUND - Network Request Failed:
POST http://localhost:8081/api/login → 404 Not Found

📸 Screenshot Analysis (After Click):
- Error message not displayed to user (missing error handling)
- Button stays in "loading" state indefinitely

🐛 Bugs Found:
1. API endpoint returns 404 - login endpoint may not be configured
2. No error message shown to user when login fails
3. Loading state doesn't reset after failure

💡 Recommendations:
1. Add error boundary to catch undefined user object
2. Implement proper error handling for failed login
3. Add timeout for loading states
4. Display user-friendly error messages
```


***

## Key Takeaways

**Best Setup for Your Use Case:**

1. ✅ Use **Playwright MCP** (`@playwright/mcp@latest`)
2. ✅ Install **Xvfb** for WSL2 compatibility
3. ✅ Create **symlink** for Chrome path
4. ✅ Run tests in **headless mode** for speed
5. ✅ Use **explicit prompts** mentioning "playwright mcp" to trigger MCP usage

**Performance Expectations:**

- ~5-10 seconds per test scenario
- Screenshot capture: ~1-2 seconds
- Console log analysis: real-time
- Reliability: **High** with proper WSL2 setup

**Pro Tips:**

- Start with **simple scenarios** (single page load + screenshot)
- Use **explicit waits** for network requests (`wait for 2 seconds after clicking login`)
- **Restart Claude Code** after MCP installation (`claude exit` then restart)
- Check `claude doctor` if you encounter issues

This setup will allow Claude Code to autonomously navigate, screenshot, analyze, and report bugs in your Expo web app without manual intervention—catching layout breaks, console errors, and interaction failures automatically during development.
<span style="display:none">[^1][^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^2][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^3][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^4][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^5][^50][^51][^52][^53][^54][^55][^56][^57][^58][^59][^6][^60][^61][^62][^63][^64][^65][^66][^67][^68][^69][^7][^70][^71][^72][^73][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://testomat.io/blog/playwright-mcp-claude-code/

[^2]: https://skywork.ai/skypage/en/puppeteer-mcp-server-browser-automation/1977938101525204992

[^3]: https://www.youtube.com/watch?v=0RbbAXPEiZs

[^4]: https://vladimirsiedykh.com/blog/claude-code-mcp-workflow-playwright-supabase-figma-linear-integration-2025

[^5]: https://www.mcpnow.io/en/server/puppeteer-hushaudio-puppeteermcp

[^6]: https://executeautomation.github.io/mcp-playwright/docs/local-setup/Installation

[^7]: https://www.youtube.com/watch?v=dHa5MQKhnQk\&vl=en

[^8]: https://skywork.ai/skypage/en/A-Deep-Dive-into-Browser-Control-MCP-Servers:-Architecture,-Implementation,-and-Security-for-AI-Engineers/1972189478467506176

[^9]: https://testomat.io/blog/playwright-mcp-modern-test-automation-from-zero-to-hero/

[^10]: https://www.reddit.com/r/ClaudeAI/comments/1o9afej/claude_code_playwright_mcp_real_browser_testing/

[^11]: https://github.com/sultannaufal/puppeteer-mcp-server

[^12]: https://skywork.ai/skypage/en/playwright-mcp-server-browser-automation/1977618624476024832

[^13]: https://nikiforovall.github.io/ai/2025/09/06/playwright-claude-code-testing.html

[^14]: https://playbooks.com/mcp/modelcontextprotocol-puppeteer

[^15]: https://www.anthropic.com/news/model-context-protocol

[^16]: https://til.simonwillison.net/claude-code/playwright-mcp-claude-code

[^17]: https://digma.ai/15-best-mcp-servers/

[^18]: https://www.reddit.com/r/ClaudeAI/comments/1odt4iu/claude_code_seamless_mcp_server_setup_playwright/

[^19]: https://wmedia.es/en/writing/automating-code-review-claude-code-playwright-notion

[^20]: https://www.reddit.com/r/ClaudeAI/comments/1hbfiuj/quick_tutorial_on_setting_up_claude_desktop_with/

[^21]: https://forum.cursor.com/t/playwrite-mcp-in-wsl2/136874

[^22]: https://composio.dev/blog/cluade-code-with-mcp-is-all-you-need

[^23]: https://www.reddit.com/r/mcp/comments/1nz9ukx/built_an_mcp_server_that_adds_vision_capabilities/

[^24]: https://www.cometapi.com/create-a-mcp-server-for-claude-code/

[^25]: https://codoid.com/automation-testing/playwright-visual-testing-a-comprehensive-guide-to-ui-regression/

[^26]: https://supatest.ai/blog/playwright-mcp-setup-guide

[^27]: https://www.claudelog.com/configuration/

[^28]: https://www.zstack-cloud.com/blog/playwright-mcp-deep-dive-the-perfect-combination-of-large-language-models-and-browser-automation/

[^29]: https://www.reddit.com/r/ClaudeAI/comments/1lijm1i/playwright_alternatives_for_wsl2/

[^30]: https://www.reddit.com/r/ClaudeAI/comments/1pbj3ul/other_ways_to_get_opus_45_without_the_max_plan/

[^31]: https://www.lambdatest.com/blog/playwright-screenshot-comparison/

[^32]: https://stackoverflow.com/questions/75335485/how-to-run-playwright-inspector-inside-wsl2

[^33]: https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan

[^34]: https://playwright.dev/docs/test-snapshots

[^35]: https://github.com/microsoft/playwright-mcp/issues/1082

[^36]: https://www.anthropic.com/news/claude-opus-4-5

[^37]: https://dev.to/debs_obrien/automate-your-screenshot-documentation-with-playwright-mcp-3gk4

[^38]: https://playwright.dev/docs/intro

[^39]: https://vps-commander.com/blog/claude-opus-4-5-setup-2025/

[^40]: https://www.youtube.com/watch?v=ZyGYYurWZ5Y

[^41]: https://shipyard.build/blog/playwright-agents-claude-code/

[^42]: https://www.reddit.com/r/ChatGPTCoding/comments/1k1r4sq/mcp_for_console_logs/

[^43]: https://dev.to/kirodotdev/fixing-javascript-console-errors-with-kiro-and-the-playwright-mcp-server-397k

[^44]: https://skywork.ai/skypage/en/unlocking-visual-ai-playwright-screenshot/1978336890142236672

[^45]: https://blog.testery.io/green-playwright-tests-in-5-minutes-with-claude-code/

[^46]: https://executeautomation.github.io/mcp-playwright/docs/playwright-web/Console-Logging

[^47]: https://www.youtube.com/watch?v=NjOqPbUecC4

[^48]: https://github.com/microsoft/playwright/issues/32487

[^49]: https://uxdesign.cc/designing-with-claude-code-and-codex-cli-building-ai-driven-workflows-powered-by-code-connect-ui-f10c136ec11f

[^50]: https://playbooks.com/mcp/lumeva-playwright-consolelogs

[^51]: https://shipyard.build/blog/playwright-mcp-screenshots/

[^52]: https://www.reddit.com/r/ClaudeCode/comments/1oun4gp/i_built_a_0month_autonomous_qa_agent_that_writes/

[^53]: https://developer.microsoft.com/blog/the-complete-playwright-end-to-end-story-tools-ai-and-real-world-workflows

[^54]: https://lobehub.com/mcp/bradydouthit-screenshot-mcp

[^55]: https://www.qatouch.com/blog/playwright-mcp-server/

[^56]: https://scrapingant.com/blog/playwright-vs-puppeteer

[^57]: https://www.synlabs.io/post/playwright-mcp-for-automated-testing-streamlining-reliable-test-automation

[^58]: https://www.getautonoma.com/blog/cursor-ai-e2e-testing-comparison

[^59]: https://skywork.ai/skypage/en/Unlocking-AI-Powered-Web-Automation-A-Deep-Dive-into-the-Puppeteer-MCP-Server/1970688613757808640

[^60]: https://www.alphabin.co/blog/playwright-mcp-for-smarter-qa-automation

[^61]: https://www.youtube.com/watch?v=uCI19W0Bmp4

[^62]: https://www.contentful.com/blog/puppeteer-vs-playwright/

[^63]: https://www.getpanto.ai/blog/playwright-mcp-for-mobile-app-testing

[^64]: https://dev.to/chiefremote/part-4-using-cursor-and-claude-to-create-automated-tests-with-playwright-2p7j

[^65]: https://www.lambdatest.com/learning-hub/puppeteer-vs-playwright

[^66]: https://primeqasolutions.com/run-tests-like-a-pro-a-practical-guide-to-playwright-mcp-server/

[^67]: https://www.reddit.com/r/ClaudeCode/comments/1mr8ck9/claude_code_as_fully_automated_e2e_test_runner/

[^68]: https://dev.to/jamescantor38/top-7-puppeteer-alternatives-for-web-automation-and-testing-2025-33ad

[^69]: https://morphllm.com/blog/playwright-mcp-browser-testing

[^70]: https://github.com/anthropics/claude-code/issues/6224

[^71]: https://brightdata.com/blog/ai/agent-browser-vs-puppeteer-playwright

[^72]: https://www.skyvern.com/blog/puppeteer-vs-playwright-complete-performance-comparison-2025/

[^73]: https://www.youtube.com/watch?v=Ec_3h5Q8RHY

