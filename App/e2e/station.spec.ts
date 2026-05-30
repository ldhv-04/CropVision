import { test, expect, Page } from '@playwright/test';

/**
 * station.spec.ts — Admin (CropVision Station) E2E Tests
 *
 * Auth state is stored in Zustand (in-memory per page load, persisted in localStorage).
 * Must login via UI form before accessing protected routes.
 *
 * React Native Web: `testID` prop → `data-testid` attribute.
 */

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@cropvision.local';
const ADMIN_PASS  = process.env.TEST_ADMIN_PASS  || 'Admin@123';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.locator('input[placeholder="Nhập email"]').click();
  await page.locator('input[placeholder="Nhập email"]').pressSequentially(ADMIN_EMAIL);
  await page.locator('input[placeholder="Nhập mật khẩu"]').click();
  await page.locator('input[placeholder="Nhập mật khẩu"]').pressSequentially(ADMIN_PASS);
  await page.locator('text=Đăng nhập').last().click();
  await expect(page.locator('text=Đăng xuất').first()).toBeVisible({ timeout: 20000 });
}

test.describe('CropVision Station — Admin Flow', () => {
  test('login as admin → redirect to Station', async ({ page }) => {
    await loginAsAdmin(page);
    const dashboard = page.getByTestId('station-dashboard').filter({ visible: true }).first();
    await expect(dashboard).toBeVisible({ timeout: 15000 });
  });

  test('command center shows KPI cards', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('kpi-users').filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('kpi-samples').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByTestId('kpi-today').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByTestId('kpi-accuracy').filter({ visible: true }).first()).toBeVisible();
  });

  test('system screen tabs work', async ({ page }) => {
    await loginAsAdmin(page);
    const isMobile = await page.getByTestId('btn-station-logout').count() > 0;
    if (isMobile) {
      await page.goto('/(station)/system');
    } else {
      await page.locator('button:has-text("Quản trị")').first().click();
    }

    const systemScreen = page.getByTestId('station-system').filter({ visible: true }).first();
    await expect(systemScreen).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('tab-users').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByTestId('tab-samples').filter({ visible: true }).first()).toBeVisible();

    // Click samples tab
    await page.getByTestId('tab-samples').filter({ visible: true }).first().click();
    await expect(page.locator('text=Samples').filter({ visible: true }).first()).toBeVisible({ timeout: 5000 });
  });

  test('system search works', async ({ page }) => {
    await loginAsAdmin(page);
    const isMobile = await page.getByTestId('btn-station-logout').count() > 0;
    if (isMobile) {
      await page.goto('/(station)/system');
    } else {
      await page.locator('button:has-text("Quản trị")').first().click();
    }

    const searchInput = page.getByTestId('system-search').filter({ visible: true }).first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill('admin');
    await expect(searchInput).toHaveValue('admin');
  });

  test('admin logout works', async ({ page }) => {
    await loginAsAdmin(page);
    const isMobile = await page.getByTestId('btn-station-logout').count() > 0;
    if (isMobile) {
      await page.getByTestId('btn-station-logout').click();
    } else {
      await page.locator('button:has-text("Đăng xuất")').first().click();
    }
    await expect(page).toHaveURL(/welcome/, { timeout: 10000 });
  });
});
