import { defineConfig, devices } from '@playwright/test';

const browserChannel = process.env.PLAYWRIGHT_CHANNEL;

export default defineConfig({
  testDir: '.',
  testMatch: 'smoke.spec.ts',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], ...(browserChannel ? { channel: browserChannel } : {}) },
    },
  ],
});
