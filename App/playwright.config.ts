import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  reporter: 'list',
  use: {
    // [M4] Expo Web dev server runs on port 8081 by default (not 3000).
    //       Update this if you change the port in package.json "web" script.
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    // Give each test enough time for API calls + Expo render
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  timeout: 60000,
  webServer: {
    // [M4] Start Expo Web dev server for E2E tests.
    //       Uses port 8081 to match the baseURL above.
    //       NODE_OPTIONS bumped to 4 GB to avoid OOM during Metro bundling.
    command: 'cross-env NODE_OPTIONS="--max_old_space_size=4096" npx expo start --web --port 8081',
    port: 8081,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
