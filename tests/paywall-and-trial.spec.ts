import { test, expect } from '@playwright/test';

test.describe('Trial paywall and monetization surfaces', () => {
  test('displays the trial banner, soft modal, and chat paywall gating', async ({ page }) => {
    test.skip(true, 'React Native trial flows require the native Wellness OS shell and are not runnable in Playwright.');

    await page.goto('/');
    await expect(page.getByTestId('trial-banner')).toContainText('days left in your trial');
    await expect(page.getByTestId('trial-soft-modal')).toBeVisible();
    await page.getByTestId('soft-modal-continue').click();

    const aiCoachButton = page.getByTestId('ai-coach-button');
    for (let attempt = 0; attempt < 11; attempt += 1) {
      await aiCoachButton.click();
    }

    await expect(page.getByTestId('paywall-modal')).toBeVisible();
    await expect(page.getByTestId('subscribe-core')).toContainText('$29');
  });

  test('shows the paywall when attempting to open a Pro module', async ({ page }) => {
    test.skip(true, 'React Native trial flows require the native Wellness OS shell and are not runnable in Playwright.');

    await page.goto('/');
    await page.getByTestId('module-card-sleep').click();
    await expect(page.getByTestId('paywall-modal')).toBeVisible();
  });
});
