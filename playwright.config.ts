import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests', // Assumes your tests will be in a 'tests' directory
  fullyParallel: true,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
