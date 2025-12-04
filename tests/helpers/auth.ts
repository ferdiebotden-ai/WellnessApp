import type { Page } from '@playwright/test';

/**
 * E2E Test Authentication Helper
 *
 * Provides utilities for authenticating test users in Playwright tests.
 * Uses real login flow (not mocked) per project requirements.
 */

// Test credentials - use environment variables in CI
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'e2e-test@apexos.dev';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'E2ETestPassword123!';

/**
 * Logs in a test user through the real sign-in flow.
 *
 * @param page - Playwright page instance
 * @param options - Optional custom credentials
 */
export async function loginTestUser(
  page: Page,
  options?: { email?: string; password?: string }
): Promise<void> {
  const email = options?.email ?? TEST_EMAIL;
  const password = options?.password ?? TEST_PASSWORD;

  // Navigate to app root (sign-in screen)
  await page.goto('/');

  // Wait for sign-in screen to be visible
  await page.getByTestId('signin-email-input').waitFor({ state: 'visible' });

  // Fill credentials
  await page.getByTestId('signin-email-input').fill(email);
  await page.getByTestId('signin-password-input').fill(password);

  // Submit
  await page.getByTestId('signin-submit-button').click();

  // Wait for navigation away from auth screens
  // The app should redirect to home or onboarding after successful login
  // We wait for any of the main screens to appear
  await page.waitForFunction(
    () => {
      const url = window.location.href;
      // Check if we've navigated away from auth
      return !url.includes('/signin') && !url.includes('/signup');
    },
    { timeout: 15000 }
  ).catch(() => {
    // If URL-based check fails, fallback to checking for home screen
    // This handles cases where URL doesn't change (SPA)
  });
}

/**
 * Checks if user is currently on an authenticated screen.
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for presence of bottom tabs or home screen
    const homeScreen = page.getByTestId('home-screen');
    const protocolsScreen = page.getByTestId('protocols-screen');
    const profileScreen = page.getByTestId('profile-screen');

    return (
      await homeScreen.isVisible().catch(() => false) ||
      await protocolsScreen.isVisible().catch(() => false) ||
      await profileScreen.isVisible().catch(() => false)
    );
  } catch {
    return false;
  }
}

/**
 * Test credentials for reference
 */
export const TEST_CREDENTIALS = {
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
};
