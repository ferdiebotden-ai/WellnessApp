import { test, expect } from '@playwright/test';

test.describe('Social Anonymity Toggle', () => {
  test('displays social anonymity toggle on profile screen', async ({ page }) => {
    test.skip(true, 'Social toggle flows require the native Wellness OS runtime and cannot run in Playwright.');

    await page.goto('/');
    await page.getByRole('tab', { name: 'Profile' }).click();

    // Verify toggle is visible
    await expect(page.getByTestId('social-anonymous-toggle')).toBeVisible();
    await expect(page.getByText('Social Features (Coming Soon)')).toBeVisible();
    await expect(page.getByText('Appear anonymously in future social features')).toBeVisible();
  });

  test('toggles social anonymity preference', async ({ page }) => {
    test.skip(true, 'Social toggle flows require the native Wellness OS runtime and cannot run in Playwright.');

    await page.goto('/');
    await page.getByRole('tab', { name: 'Profile' }).click();

    const toggle = page.getByTestId('social-anonymous-toggle');
    
    // Get initial state
    const initialChecked = await toggle.isChecked();
    
    // Toggle the switch
    await toggle.click();
    
    // Verify state changed
    await expect(toggle).toHaveProperty('checked', !initialChecked);
  });

  test('handles API error gracefully', async ({ page }) => {
    test.skip(true, 'Social toggle flows require the native Wellness OS runtime and cannot run in Playwright.');

    // Intercept and fail the PATCH request
    await page.route('**/api/users/me', (route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/');
    await page.getByRole('tab', { name: 'Profile' }).click();

    const toggle = page.getByTestId('social-anonymous-toggle');
    const initialChecked = await toggle.isChecked();
    
    // Attempt to toggle
    await toggle.click();
    
    // Verify error message appears
    await expect(page.getByTestId('preferences-error')).toBeVisible();
    await expect(page.getByTestId('preferences-error')).toContainText('Failed to update preference');
    
    // Verify toggle reverts to original state
    await expect(toggle).toHaveProperty('checked', initialChecked);
  });
});

