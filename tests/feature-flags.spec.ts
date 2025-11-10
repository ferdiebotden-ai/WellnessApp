import { test, expect } from '@playwright/test';

test.describe('Feature Flags', () => {
  test('modules are filtered based on feature flags', async ({ page }) => {
    test.skip(true, 'Feature flag flows require the native Wellness OS runtime and cannot run in Playwright.');

    await page.goto('/');
    await page.getByRole('tab', { name: 'Profile' }).click();
    await page.getByRole('tab', { name: 'Home' }).click();

    // Verify modules are displayed when flags are enabled
    // This test would need to mock Firebase Remote Config responses
    // In a real E2E scenario, you'd configure Remote Config in Firebase Console
    // and verify the UI updates accordingly

    // Example assertions (would need actual implementation):
    // await expect(page.getByTestId('module-card-sleep')).toBeVisible();
    // await expect(page.getByTestId('module-card-resilience')).toBeVisible();
  });

  test('AI chat button is hidden when feature flag is disabled', async ({ page }) => {
    test.skip(true, 'Feature flag flows require the native Wellness OS runtime and cannot run in Playwright.');

    await page.goto('/');

    // When enable_ai_chat is false, button should not exist
    await expect(page.getByTestId('ai-coach-button')).not.toBeVisible();
  });

  test('AI chat button is visible when feature flag is enabled', async ({ page }) => {
    test.skip(true, 'Feature flag flows require the native Wellness OS runtime and cannot run in Playwright.');

    await page.goto('/');

    // When enable_ai_chat is true, button should be visible
    await expect(page.getByTestId('ai-coach-button')).toBeVisible();
  });
});

