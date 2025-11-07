import { test, expect } from '@playwright/test';

test.describe('Premium tier waitlist', () => {
  test('allows users to open the waitlist screen and submit email', async ({ page }) => {
    test.skip(true, 'Waitlist flow requires the native mobile app runtime and cannot run in Playwright.');

    await page.goto('/');
    await page.getByText('Stress & Emotional Regulation').click();
    await page.getByTestId('waitlist-email-input').fill('user@example.com');
    await page.getByTestId('waitlist-submit-button').click();
    await expect(page.getByText("You're on the list!")).toBeVisible();
  });
});
