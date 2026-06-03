import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  timeout: 90000,
});
