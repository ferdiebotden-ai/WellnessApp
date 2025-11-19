import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app (assuming it's running on localhost or test server)
    await page.goto('/');
  });

  test('should complete sign-up flow and reach home screen', async ({ page }) => {
    // Wait for sign-in screen to appear
    await expect(page.locator('text=Welcome Back')).toBeVisible();

    // Navigate to sign-up
    await page.locator('text=Sign Up').click();
    await expect(page.locator('text=Create Account')).toBeVisible();

    // Fill sign-up form
    await page.locator('[placeholder="Enter your email"]').fill('test@example.com');
    await page.locator('[placeholder="Create a password"]').fill('password123');
    await page.locator('[placeholder="Confirm your password"]').fill('password123');

    // Accept terms
    await page.locator('text=I agree to the Terms').click();

    // Submit sign-up
    await page.locator('text=Create Account').click();

    // Should navigate to onboarding
    await expect(page.locator('text=Choose your first focus area')).toBeVisible();
  });

  test('should handle invalid email format', async ({ page }) => {
    await page.locator('text=Sign Up').click();

    await page.locator('[placeholder="Enter your email"]').fill('invalid-email');
    await page.locator('[placeholder="Create a password"]').fill('password123');

    // Try to submit
    await page.locator('text=I agree to the Terms').click();
    await page.locator('text=Create Account').click();

    // Should show validation error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('should handle password mismatch', async ({ page }) => {
    await page.locator('text=Sign Up').click();

    await page.locator('[placeholder="Enter your email"]').fill('test@example.com');
    await page.locator('[placeholder="Create a password"]').fill('password123');
    await page.locator('[placeholder="Confirm your password"]').fill('different123');

    await page.locator('text=I agree to the Terms').click();
    await page.locator('text=Create Account').click();

    // Should show password mismatch error
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should navigate to forgot password screen', async ({ page }) => {
    await expect(page.locator('text=Welcome Back')).toBeVisible();

    await page.locator('text=Forgot Password?').click();
    await expect(page.locator('text=Reset Password')).toBeVisible();
  });

  test('should sign in with existing credentials', async ({ page }) => {
    // Assuming user already exists (would need test setup)
    await page.locator('[placeholder="Enter your email"]').fill('existing@example.com');
    await page.locator('[placeholder="Enter your password"]').fill('password123');
    await page.locator('text=Sign In').click();

    // Should navigate to home or onboarding depending on user state
    // This test would need proper test user setup
  });
});

