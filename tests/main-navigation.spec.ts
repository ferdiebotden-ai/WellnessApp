import { test, expect } from '@playwright/test';

/**
 * Main Navigation Tests
 *
 * Tests the core navigation flows of the app.
 * Since authentication with real credentials requires a test user in Supabase,
 * these tests focus on the unauthenticated flows and screen rendering.
 *
 * For authenticated navigation tests, a test user must be created in Supabase.
 */
test.describe('Main App Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display sign-in screen as default landing page', async ({ page }) => {
    // Unauthenticated users should see sign-in screen
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByTestId('signin-email-input')).toBeVisible();
    await expect(page.getByTestId('signin-password-input')).toBeVisible();
    await expect(page.getByTestId('signin-submit-button')).toBeVisible();
  });

  test('should navigate from sign-in to sign-up', async ({ page }) => {
    await expect(page.getByTestId('goto-signup-link')).toBeVisible();
    await page.getByTestId('goto-signup-link').click();

    // Should now be on sign-up screen
    await expect(page.getByText('Create Account').first()).toBeVisible();
    await expect(page.getByTestId('signup-email-input')).toBeVisible();
  });

  test('should navigate from sign-up back to sign-in', async ({ page }) => {
    // Go to sign-up first
    await page.getByTestId('goto-signup-link').click();
    await expect(page.getByTestId('signup-email-input')).toBeVisible();

    // Navigate back to sign-in
    await page.getByTestId('goto-signin-link').click();
    await expect(page.getByText('Welcome Back')).toBeVisible();
  });

  test('should navigate to forgot password screen', async ({ page }) => {
    await page.getByTestId('forgot-password-link').click();

    // Should be on forgot password screen
    await expect(page.getByText('Reset Password')).toBeVisible();
    await expect(page.getByTestId('forgot-email-input')).toBeVisible();
    await expect(page.getByTestId('forgot-reset-button')).toBeVisible();
  });

  test('should show sign-up form elements correctly', async ({ page }) => {
    await page.getByTestId('goto-signup-link').click();

    // Verify all sign-up form elements are present
    await expect(page.getByTestId('signup-email-input')).toBeVisible();
    await expect(page.getByTestId('signup-password-input')).toBeVisible();
    await expect(page.getByTestId('signup-confirm-password-input')).toBeVisible();
    await expect(page.getByTestId('terms-checkbox')).toBeVisible();
    await expect(page.getByTestId('signup-submit-button')).toBeVisible();
  });
});

/**
 * Authenticated Navigation Tests
 *
 * These tests require a valid test user in Supabase.
 * They are currently skipped until the test user is created.
 *
 * To enable:
 * 1. Create user e2e-test@apexos.dev in Supabase Auth
 * 2. Complete onboarding for the user
 * 3. Remove test.skip() calls
 */
test.describe('Authenticated Navigation', () => {
  test('should navigate to Home tab after login', async ({ page }) => {
    test.skip(true, 'Requires test user in Supabase - create e2e-test@apexos.dev to enable');

    // This test would:
    // 1. Login with test credentials
    // 2. Verify home screen is displayed
    // 3. Check home-screen testID is visible
    await page.goto('/');
  });

  test('should navigate between bottom tabs', async ({ page }) => {
    test.skip(true, 'Requires test user in Supabase - create e2e-test@apexos.dev to enable');

    // This test would:
    // 1. Login with test credentials
    // 2. Navigate to Protocols tab
    // 3. Verify protocols-screen is visible
    // 4. Navigate to Insights tab
    // 5. Verify insights-screen is visible
    // 6. Navigate to Profile tab
    // 7. Verify profile-screen is visible
    // 8. Navigate back to Home tab
    await page.goto('/');
  });
});
