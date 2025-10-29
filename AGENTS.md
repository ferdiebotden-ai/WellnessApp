# Wellness OS - Codex Agent Configuration

## Project Overview
Wellness OS is a comprehensive health and wellness management platform.

**Tech Stack:**
- Frontend: React 18+, TypeScript 5.0+, Tailwind CSS
- Backend: Node.js 20+, Express, TypeScript
- Database: PostgreSQL with Prisma ORM
- Testing: Jest (unit), Playwright (E2E)

## Code Style & Quality
- **Formatting:** Prettier (2-space indent, single quotes, trailing commas)
- **TypeScript:** Strict mode, no implicit any, explicit return types
- **React:** Functional components, Props interfaces, `React.FC` typing
- **Function Length:** <20 lines preferred
- **Test Coverage:** Minimum 80% for new code
- **Error Handling:** Comprehensive try-catch with logging
- **Documentation:** JSDoc comments for public APIs

## Code Review Focus

### Security (CRITICAL - Always Flag)
- ⚠️ JWT validation and session management
- ⚠️ Authorization: Check role-based access controls (RBAC)
- ⚠️ Input Validation: Sanitize *all* user inputs
- ⚠️ SQL Injection: Use Prisma parameterized queries *only*
- ⚠️ XSS Prevention: Escape user-generated content in UI
- ⚠️ Sensitive Data: No API keys/secrets in code (use env vars)

### Performance
- Database queries: Check for N+1 problems
- API endpoints: Response times < 200ms target
- React components: Memoization for expensive renders
- Bundle size: Monitor chunk sizes (< 500KB per route)

### Review Output Format
*Structure feedback as follows:*
Security Issues
[CRITICAL | WARNING | INFO] path/to/file.ts:LineNumber - Concise issue description. Suggestion for fix.

Performance Issues
[INFO] path/to/file.tsx:LineNumber - Issue description. Suggestion.

Code Quality / Maintainability
[INFO] path/to/file.ts:LineNumber - Issue description. Suggestion.


## Playwright Test Generation

### Test Strategy
Focus on:
- **User workflows** (not implementation details)
- **Happy path + 2-3 edge cases** per feature
- **Accessibility** (keyboard navigation, ARIA labels)
- **Error states** and graceful handling
- Use `data-testid` attributes for selectors

### Test Structure Template
*Generate tests following this structure:*
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login, navigate, seed data if needed
    await page.goto('/feature-url');
  });

  test('should handle primary user flow', async ({ page }) => {
    // Arrange (if needed)
    // Act
    await page.locator('[data-testid="submit-button"]').click();
    // Assert
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should handle edge case: invalid input', async ({ page }) => {
    // Act: Enter invalid data
    // Assert: Expect error message
  });

  // Add accessibility test if applicable
  test('should be navigable via keyboard', async ({ page }) => {
     // Act: Use page.keyboard.press('Tab') etc.
     // Assert: Expect focus to move correctly
  });
});
Iteration & Auto-Fix Rules
Maximum 3 test fix iterations before reporting failure.

Auto-fix allowed for selector updates and adding reasonable waits (page.waitForSelector).

Require human review for test logic changes or implementation code fixes.
