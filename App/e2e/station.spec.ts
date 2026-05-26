import { test, expect, Page } from '@playwright/test';

/**
 * station.spec.ts — Admin (CropVision Station) E2E Tests
 *
 * Auth state is stored in Zustand (in-memory per page load).
 * Must login via UI form before accessing protected routes.
 *
 * React Native Web: `testID` prop → `data-testid` attribute.
 */

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@cropvision.local';
const ADMIN_PASS  = process.env.TEST_ADMIN_PASS  || 'Admin@123';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.locator('input[placeholder="Nhập email"]').fill(ADMIN_EMAIL);
  await page.locator('input[placeholder="Nhập mật khẩu"]').fill(ADMIN_PASS);
  await page.locator('text=Đăng nhập').last().click();
  // Admin redirects to /(station)
  await page.waitForURL(/\/station/, { timeout: 20000 });
}

test.describe('CropVision Station — Admin Flow', () => {
  test('login as admin → redirect to Station', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('station-dashboard')).toBeVisible({ timeout: 15000 });
  });

  test('command center shows KPI cards', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('kpi-users')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('kpi-samples')).toBeVisible();
    await expect(page.getByTestId('kpi-today')).toBeVisible();
    await expect(page.getByTestId('kpi-accuracy')).toBeVisible();
  });

  test('system screen tabs work', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/(station)/system');
    await expect(page.getByTestId('station-system')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('tab-users')).toBeVisible();
    await expect(page.getByTestId('tab-samples')).toBeVisible();
    // Click samples tab
    await page.getByTestId('tab-samples').click();
    await expect(page.locator('text=Samples')).toBeVisible({ timeout: 5000 });
  });

  test('system search works', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/(station)/system');
    await expect(page.getByTestId('system-search')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('system-search').fill('admin');
    await expect(page.getByTestId('system-search')).toHaveValue('admin');
  });

  test('admin logout works', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('btn-station-logout')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('btn-station-logout').click();
    await expect(page).toHaveURL(/welcome/, { timeout: 10000 });
  });
});
