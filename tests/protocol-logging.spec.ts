import { test, expect } from '@playwright/test';

test.describe('Protocol Logging Adherence Loop', () => {
  test('logs a protocol and queues it for sync', async ({ page }) => {
    test.skip(true, 'Protocol logging requires the native Wellness client runtime and Firestore SDK.');

    await page.goto('/protocols/sleep-foundation');
    await page.getByRole('button', { name: 'Log Complete' }).click();
    await expect(page.getByText('✓ Logged')).toBeVisible();
  });
});
