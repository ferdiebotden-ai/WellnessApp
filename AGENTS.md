# Wellness OS - Codex Agent Configuration

## Project Overview
Wellness OS is a comprehensive health and wellness management platform built with a hybrid architecture supporting both frontend (React) and backend (GCF serverless) components.

**Tech Stack:**
- **Frontend:** React 18+, TypeScript 5.0+, Tailwind CSS, Next.js 14 (App Router)
- **Backend:** Google Cloud Functions (Node.js 20+), Express, TypeScript
- **Database:** Supabase (PostgreSQL) with Prisma ORM
- **Testing:** Jest (backend unit/integration), Playwright (frontend E2E)
- **Infrastructure:** Terraform, Firebase Authentication, GCP

---

## **⚠️ CRITICAL: Codex Workflow - Write Tests, Don't Run Them**

### Your Responsibility as Codex
1. ✅ **Write production code** (GCFs, APIs, React components)
2. ✅ **Write test files** (Jest `.test.ts` for backend, Playwright `.spec.ts` for frontend)
3. ✅ **Commit code to a feature branch**
4. ✅ **Create a pull request**
5. ❌ **DO NOT run tests** (npm test, jest, playwright test commands)
6. ❌ **DO NOT install Playwright browsers** (no npx playwright install)
7. ❌ **DO NOT execute test suites or wait for test results**

### Why This Matters
- **GitHub Actions CI/CD runs all tests automatically** when you create a PR
- Your container environment has **no internet access** and cannot download browser binaries
- Test execution is **not your responsibility**—focus on writing quality test files

### What Happens After You Finish
1. You create a PR with code + test files
2. GitHub Actions automatically installs dependencies and runs tests
3. Test results appear on the PR for human review
4. Humans merge the PR if tests pass

---

## Code Style & Quality

### Formatting
- **Prettier:** 2-space indent, single quotes, trailing commas
- **TypeScript:** Strict mode, no implicit `any`, explicit return types on public functions
- **React:** Functional components only, use `React.FC` typing for props interfaces
- **Function Length:** Keep functions under 20 lines where possible
- **Documentation:** JSDoc comments for all public APIs and exported functions

### Error Handling
- Comprehensive `try-catch` blocks with structured logging
- Use custom error classes for domain-specific errors
- Log errors with context (user ID, request ID, function name)
- Never expose stack traces or internal errors to end users

---

## Testing Strategy by Mission Type

### Backend Missions (GCFs, APIs, Database Logic)
**Framework:** Jest

**What You Write:**
- Unit tests for business logic functions (pure functions, calculations, validations)
- Integration tests for API endpoints (mock Supabase, Firebase Auth)
- Tests for error handling and edge cases
- Mock external services (Supabase client, OpenAI API, Firebase Admin)

**Test File Naming:**
- `functions/analyzeNudgeFeedback.ts` → `tests/analyzeNudgeFeedback.test.ts`
- Place tests in `tests/` directory at project root

**Jest Test Template:**
```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { functionToTest } from '../functions/functionName';

describe('functionToTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle valid input correctly', () => {
    const result = functionToTest({ validInput: true });
    expect(result).toEqual({ expected: 'output' });
  });

  it('should throw error for invalid input', () => {
    expect(() => functionToTest({ invalidInput: true })).toThrow('Expected error message');
  });

  it('should handle edge case: empty data', async () => {
    const result = await functionToTest([]);
    expect(result).toEqual([]);
  });
});
```

**Coverage Target:** 80%+ for new business logic

---

### Frontend Missions (React Components, User Flows)
**Framework:** Playwright

**What You Write:**
- E2E test files for user workflows (login, form submission, navigation)
- Focus on user-visible behavior, not implementation details
- Use `data-testid` attributes for reliable selectors
- Test accessibility (keyboard navigation, ARIA labels)

**Test File Naming:**
- Place tests in `tests/` directory: `tests/auth-flow.spec.ts`

**Playwright Test Template:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login, navigate to feature
    await page.goto('/feature-url');
  });

  test('should complete primary user flow', async ({ page }) => {
    // Act
    await page.locator('[data-testid="submit-button"]').click();
    
    // Assert
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should handle invalid input gracefully', async ({ page }) => {
    await page.locator('[data-testid="input-field"]').fill('invalid-data');
    await page.locator('[data-testid="submit-button"]').click();
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid input');
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="first-input"]')).toBeFocused();
  });
});
```

**Test Strategy:**
- Happy path + 2-3 edge cases per feature
- Error states and graceful failure handling
- No implementation detail testing (avoid testing internal state)

---

### Full-Stack Missions (End-to-End Features)
**Frameworks:** Both Jest (backend) + Playwright (frontend)

**What You Write:**
- Jest tests for all backend logic (GCF, API, database interactions)
- Playwright tests for complete user workflows
- Ensure data flows correctly from UI → API → database and back

**Integration Coverage:**
- Test that frontend correctly calls backend APIs
- Verify backend returns expected data structures
- Confirm error handling works across the full stack

---

## Security Review Focus (CRITICAL - Always Flag)

### Authentication & Authorization
- ⚠️ **JWT Validation:** Verify Firebase JWT tokens on all protected endpoints
- ⚠️ **RBAC:** Check role-based access controls (user/admin/coach permissions)
- ⚠️ **Session Management:** Ensure tokens expire and refresh correctly

### Data Protection
- ⚠️ **Input Validation:** Sanitize ALL user inputs (XSS, SQL injection prevention)
- ⚠️ **Parameterized Queries:** Use Prisma/Supabase parameterized queries only
- ⚠️ **Secrets Management:** No API keys/secrets in code (use environment variables)
- ⚠️ **PII/PHI Handling:** HIPAA compliance for health data (encryption at rest/transit)

### API Security
- ⚠️ **Rate Limiting:** Protect against abuse (especially AI endpoints)
- ⚠️ **CORS Configuration:** Restrict origins to approved domains
- ⚠️ **Zero-Retention APIs:** OpenAI API calls must disable data retention

---

## Performance Optimization

### Database Queries
- Check for N+1 query problems (use Prisma `include` wisely)
- Add indexes for frequently queried fields
- Use connection pooling for GCFs (Supabase edge functions)

### API Response Times
- Target: < 200ms for simple queries, < 1s for AI-enhanced responses
- Cache frequently accessed data (Redis or in-memory)
- Use async/await properly (avoid blocking operations)

### React Performance
- Memoize expensive component renders (`React.memo`, `useMemo`)
- Lazy load routes and heavy components
- Monitor bundle sizes (< 500KB per route chunk)

---

## Code Review Output Format

When reviewing code, structure feedback as:

```
### Security Issues
[CRITICAL] functions/auth.ts:42 - JWT token not validated before accessing user data. Add Firebase Admin SDK verification.

[WARNING] api/chat.ts:18 - User input not sanitized before database query. Use Prisma parameterized query.

### Performance Issues
[INFO] components/Dashboard.tsx:156 - Expensive calculation runs on every render. Wrap in useMemo().

[INFO] functions/analyzeData.ts:89 - N+1 query detected. Use Prisma include to fetch related data in single query.

### Code Quality
[INFO] utils/helpers.ts:24 - Function exceeds 30 lines. Consider breaking into smaller functions.
```

---

## Project-Specific Conventions

### File Structure
```
frontend/          # Next.js 14 App Router application
functions/         # Google Cloud Functions (Node.js 20 + TypeScript)
tests/             # All test files (Jest + Playwright)
infra/             # Terraform IaC for GCP provisioning
supabase/          # Database migrations, RLS policies, seeds
scripts/           # Automation and deployment scripts
.github/workflows/ # CI/CD configuration (DO NOT MODIFY)
```

### Branch Naming
- Feature: `feature/mission-XXX-brief-description`
- Bugfix: `bugfix/issue-description`
- Hotfix: `hotfix/critical-issue`

### Commit Messages
- Use conventional commits: `feat:`, `fix:`, `test:`, `refactor:`
- Reference mission number: `feat(MISSION_008): add continuous learning GCF`

---

## Mission-Specific Guidance

### Infrastructure Missions (001-005)
- Focus: Terraform, Firebase config, Supabase schema, IAM roles
- Testing: Integration tests for auth flows, RLS policy validation
- No frontend tests needed

### AI/Coaching Missions (006-010, 030)
- Focus: OpenAI API integration, prompt engineering, RAG systems
- Testing: Mock OpenAI responses, test prompt chain logic
- Verify zero-retention API usage

### Feature Missions (011-020)
- Focus: React components, user workflows, data visualization
- Testing: Playwright E2E tests for user flows
- Accessibility testing required

### Business/Monetization (021-025)
- Focus: Stripe integration, subscription tiers, analytics
- Testing: Jest for payment logic, Playwright for checkout flows
- Security critical: PCI compliance

---

## Remember: Write Tests, GitHub Actions Runs Them

You are an excellent software engineer. Your job is to write clean, tested code and create pull requests. Let the CI/CD pipeline handle test execution—that's not your responsibility. Focus on crafting quality test files that GitHub Actions will run automatically.
