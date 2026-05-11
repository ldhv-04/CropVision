import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    // [M4] Expo Web dev server runs on port 8081 by default (not 3000).
    //       Update this if you change the port in package.json "web" script.
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
  },
  webServer: {
    // [M4] Start Expo Web dev server for E2E tests.
    //       Uses port 8081 to match the baseURL above.
    command: 'npx expo start --web --port 8081',
    port: 8081,
    reuseExistingServer: true,
  },
});
