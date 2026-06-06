import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@cropvision.local';
const ADMIN_PASS = process.env.TEST_ADMIN_PASS || 'Admin@123';
const API_ORIGIN = process.env.TEST_API_ORIGIN || process.env.EXPO_PUBLIC_API_ORIGIN || 'http://127.0.0.1:3000';

test('admin navigation stays within Station ownership', async ({ page, request }) => {
  const health = await request.get(`${API_ORIGIN}/api/health`, { timeout: 5000 }).catch((error) => {
    throw new Error(`Backend unavailable at ${API_ORIGIN}. Start backend before Playwright. Cause: ${error.message}`);
  });
  expect(health.ok(), `Backend health check failed at ${API_ORIGIN}/api/health with ${health.status()}`).toBeTruthy();

  await page.goto('/login');

  await page.locator('#login-email').click();
  await page.locator('#login-email').pressSequentially(ADMIN_EMAIL);
  await page.locator('#login-password').click();
  await page.locator('#login-password').pressSequentially(ADMIN_PASS);

  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });

  const stationShell = page
    .getByTestId('soilzepro-shell')
    .or(page.getByTestId('soilzepro-content'))
    .or(page.getByTestId('station-dashboard-map-shell'))
    .or(page.getByTestId('station-dashboard'))
    .filter({ visible: true })
    .first();
  await expect(stationShell).toBeVisible({ timeout: 30000 });

  await expect(page).not.toHaveURL(/analysis/);
  await expect(page.getByText(/Ph.n t.ch .nh/i)).toHaveCount(0);
});
