import { test, expect } from '@playwright/test';

test.describe('Biometric Setup Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and assume user is authenticated and in onboarding
    await page.goto('/');
    // Would need to set up authenticated state for these tests
  });

  test('should show biometric setup screen after onboarding', async ({ page }) => {
    // Complete onboarding flow first
    // Then check for biometric setup screen
    await expect(page.locator('text=Enable Face ID')).toBeVisible();
  });

  test('should allow skipping biometric setup', async ({ page }) => {
    await expect(page.locator('text=Enable Face ID')).toBeVisible();

    await page.locator('text=Skip for now').click();

    // Should navigate to main app
    await expect(page.locator('text=Health Dashboard')).toBeVisible();
  });

  test('should enable biometrics and navigate to main app', async ({ page }) => {
    await expect(page.locator('text=Enable Face ID')).toBeVisible();

    await page.locator('text=Enable Face ID').click();

    // Would need to mock biometric prompt for E2E test
    // In real scenario, user would authenticate with Face ID
    // Then should navigate to main app
    await expect(page.locator('text=Health Dashboard')).toBeVisible();
  });

  test('should show benefits of biometric unlock', async ({ page }) => {
    await expect(page.locator('text=Secure access to your health data')).toBeVisible();
    await expect(page.locator('text=Quick unlock without typing')).toBeVisible();
    await expect(page.locator('text=Protected by device security')).toBeVisible();
  });
});

