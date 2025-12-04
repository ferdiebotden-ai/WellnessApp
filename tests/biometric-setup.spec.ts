import { test, expect } from '@playwright/test';

/**
 * Biometric Setup Tests
 *
 * These tests are SKIPPED because:
 * 1. BiometricSetupScreen checks `getSupportedBiometryType()` which returns null on web
 * 2. The screen renders `null` when no biometry is available
 * 3. Biometric functionality requires native iOS/Android runtime
 *
 * To test biometric flows, use Detox or device testing.
 */
test.describe('Biometric Setup Flow', () => {
  test('should show biometric setup screen after onboarding', async ({ page }) => {
    test.skip(true, 'Biometric setup screen requires native runtime - getSupportedBiometryType returns null on web');
    await page.goto('/');
  });

  test('should allow skipping biometric setup', async ({ page }) => {
    test.skip(true, 'Biometric setup screen requires native runtime - screen does not render on web');
    await page.goto('/');
  });

  test('should enable biometrics and navigate to main app', async ({ page }) => {
    test.skip(true, 'Biometric setup screen requires native runtime - cannot test biometric enrollment on web');
    await page.goto('/');
  });

  test('should show benefits of biometric unlock', async ({ page }) => {
    test.skip(true, 'Biometric setup screen requires native runtime - screen does not render on web');
    await page.goto('/');
  });
});

