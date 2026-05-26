import { test, expect, Page } from '@playwright/test';

/**
 * agrivision.spec.ts — Farmer (AgriVision) E2E Tests
 *
 * Auth state is stored in Zustand (in-memory). Playwright must login via UI
 * before accessing protected routes. We use admin account (always seeded)
 * then navigate to agrivision routes.
 *
 * React Native Web: `testID` prop → `data-testid` attribute.
 * Use `page.getByTestId('xyz')` for RN components.
 */

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@cropvision.local';
const ADMIN_PASS  = process.env.TEST_ADMIN_PASS  || 'Admin@123';

/**
 * Login via the UI form and wait for redirect away from /login.
 * Uses admin account which is always seeded by backend startup.
 */
async function loginViaUI(page: Page) {
  await page.goto('/login');
  await page.locator('input[placeholder="Nhập email"]').fill(ADMIN_EMAIL);
  await page.locator('input[placeholder="Nhập mật khẩu"]').fill(ADMIN_PASS);
  await page.locator('text=Đăng nhập').last().click();
  // Wait for redirect away from /login (admin goes to /station)
  await page.waitForURL(/\/(station|agrivision|main)/, { timeout: 20000 });
}

test.describe('AgriVision — Farmer Flow', () => {
  test('welcome page loads and has CTA button', async ({ page }) => {
    await page.goto('/welcome');
    // Exact CSS class selector avoids strict mode violation
    await expect(page.locator('span.text-gradient-primary')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Bắt đầu miễn phí")')).toBeVisible();
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=CropVision AI')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input[placeholder="Nhập email"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Nhập mật khẩu"]')).toBeVisible();
  });

  test('AgriVision home screen has quick action buttons', async ({ page }) => {
    await loginViaUI(page);
    await page.goto('/(agrivision)');
    await expect(page.getByTestId('agrivision-home')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('btn-diagnose')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('btn-fields')).toBeVisible({ timeout: 10000 });
  });

  test('fields screen renders with FAB button', async ({ page }) => {
    await loginViaUI(page);
    await page.goto('/(agrivision)/fields');
    await expect(page.getByTestId('fields-screen')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('fab-add-field')).toBeVisible({ timeout: 10000 });
  });

  test('create field modal opens on FAB click', async ({ page }) => {
    await loginViaUI(page);
    await page.goto('/(agrivision)/fields');
    await expect(page.getByTestId('fab-add-field')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('fab-add-field').click();
    await expect(page.getByTestId('field-name-input')).toBeVisible({ timeout: 8000 });
  });

  test('inference screen renders', async ({ page }) => {
    await loginViaUI(page);
    await page.goto('/(agrivision)/inference');
    await expect(page.getByTestId('inference-screen')).toBeVisible({ timeout: 15000 });
  });

  test('diagnose quick action navigates to inference', async ({ page }) => {
    await loginViaUI(page);
    await page.goto('/(agrivision)');
    await expect(page.getByTestId('btn-diagnose')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('btn-diagnose').click();
    await expect(page).toHaveURL(/inference/, { timeout: 10000 });
  });
});
