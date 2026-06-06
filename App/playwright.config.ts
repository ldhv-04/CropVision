import { defineConfig } from '@playwright/test';

const E2E_PORT = Number(process.env.PLAYWRIGHT_PORT || 8082);
const API_ORIGIN = process.env.EXPO_PUBLIC_API_ORIGIN || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: 'on-first-retry',
    // Give each test enough time for API calls + Expo render
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  timeout: 60000,
  webServer: {
    // Force localhost API origin so Android emulator .env values do not leak
    // into desktop browser tests.
    command: `cross-env NODE_OPTIONS="--max_old_space_size=4096" EXPO_PUBLIC_API_ORIGIN=${API_ORIGIN} npx expo start --web --port ${E2E_PORT}`,
    port: E2E_PORT,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
