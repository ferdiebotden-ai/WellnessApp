import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display sign-in screen on initial load', async ({ page }) => {
    // Wait for sign-in screen to appear
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByTestId('signin-email-input')).toBeVisible();
    await expect(page.getByTestId('signin-password-input')).toBeVisible();
    await expect(page.getByTestId('signin-submit-button')).toBeVisible();
  });

  test('should navigate to sign-up screen', async ({ page }) => {
    await expect(page.getByText('Welcome Back')).toBeVisible();

    // Click "Sign Up" link in footer
    await page.getByTestId('goto-signup-link').click();

    // Verify sign-up screen is displayed
    await expect(page.getByText('Create Account').first()).toBeVisible();
    await expect(page.getByTestId('signup-email-input')).toBeVisible();
    await expect(page.getByTestId('signup-password-input')).toBeVisible();
    await expect(page.getByTestId('signup-confirm-password-input')).toBeVisible();
  });

  test('should handle invalid email format on sign-up', async ({ page }) => {
    // Navigate to sign-up
    await page.getByTestId('goto-signup-link').click();
    await expect(page.getByTestId('signup-email-input')).toBeVisible();

    // Fill form with invalid email
    await page.getByTestId('signup-email-input').fill('invalid-email');
    await page.getByTestId('signup-password-input').fill('Password123!');
    await page.getByTestId('signup-confirm-password-input').fill('Password123!');

    // Accept terms and submit
    await page.getByTestId('terms-checkbox').click();
    await page.getByTestId('signup-submit-button').click();

    // Should show validation error
    await expect(page.getByText('Please enter a valid email')).toBeVisible();
  });

  test('should handle password mismatch on sign-up', async ({ page }) => {
    // Navigate to sign-up
    await page.getByTestId('goto-signup-link').click();
    await expect(page.getByTestId('signup-email-input')).toBeVisible();

    // Fill form with mismatched passwords
    await page.getByTestId('signup-email-input').fill('test@example.com');
    await page.getByTestId('signup-password-input').fill('Password123!');
    await page.getByTestId('signup-confirm-password-input').fill('DifferentPass123!');

    // Accept terms and submit
    await page.getByTestId('terms-checkbox').click();
    await page.getByTestId('signup-submit-button').click();

    // Should show password mismatch error
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('should navigate to forgot password screen', async ({ page }) => {
    await expect(page.getByText('Welcome Back')).toBeVisible();

    // Click forgot password link
    await page.getByTestId('forgot-password-link').click();

    // Should navigate to forgot password screen
    await expect(page.getByText('Reset Password')).toBeVisible();
  });

  test('should handle sign-in with valid credentials format', async ({ page }) => {
    await expect(page.getByTestId('signin-email-input')).toBeVisible();

    // Fill sign-in form
    await page.getByTestId('signin-email-input').fill('test@example.com');
    await page.getByTestId('signin-password-input').fill('Password123!');

    // Click sign in button
    await page.getByTestId('signin-submit-button').click();

    // Note: This will fail auth (no real user), but verifies form submission works
    // In a full test, we'd mock Firebase or use a test user
  });

  test('should navigate between sign-in and sign-up screens', async ({ page }) => {
    // Start on sign-in
    await expect(page.getByText('Welcome Back')).toBeVisible();

    // Go to sign-up
    await page.getByTestId('goto-signup-link').click();
    await expect(page.getByText('Create Account').first()).toBeVisible();

    // Go back to sign-in
    await page.getByTestId('goto-signin-link').click();
    await expect(page.getByText('Welcome Back')).toBeVisible();
  });
});
