import { test, expect } from '@playwright/test';

test.describe('Biometric Authentication Lock Screen', () => {
  test('locks the application and requests biometrics on launch', async ({ page }) => {
    test.skip(true, 'Biometric authentication flows require a native runtime and cannot be exercised in Playwright.');

    await page.goto('/');
    await expect(page.getByText('Wellness OS Locked')).toBeVisible();
    await expect(page.getByRole('button', { name: /Unlock with/ })).toBeVisible();
  });

  test('provides a PIN fallback when biometrics are unavailable', async ({ page }) => {
    test.skip(true, 'Biometric authentication flows require a native runtime and cannot be exercised in Playwright.');

    await page.goto('/');
    await page.getByRole('button', { name: 'Use PIN' }).click();
    await page.getByLabel('PIN Input').fill('1234');
    await page.getByRole('button', { name: 'Unlock with PIN' }).click();
  });
});
