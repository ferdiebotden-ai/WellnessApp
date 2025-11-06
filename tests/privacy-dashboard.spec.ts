import { test, expect } from '@playwright/test';

test.describe('Privacy Dashboard', () => {
  test('navigates to the privacy dashboard from the profile tab', async ({ page }) => {
    test.skip(true, 'Privacy dashboard flows require the native Wellness OS runtime and cannot run in Playwright.');

    await page.goto('/');
    await page.getByRole('tab', { name: 'Profile' }).click();
    await page.getByTestId('open-privacy-dashboard').click();
    await expect(page.getByText('Privacy Dashboard')).toBeVisible();
    await expect(page.getByTestId('request-export')).toBeVisible();
  });
});
