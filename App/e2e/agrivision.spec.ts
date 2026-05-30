import { test, expect, Page } from '@playwright/test';

/**
 * agrivision.spec.ts — Farmer (AgriVision) E2E Tests
 *
 * Auth state is stored in Zustand (in-memory). Playwright must login via UI
 * before accessing protected routes. We use farmer account (always seeded)
 * and click sidebar buttons to navigate on Web, keeping in-memory state.
 *
 * React Native Web: `testID` prop → `data-testid` attribute.
 */

const FARMER_EMAIL = 'farmer@cropvision.local';
const FARMER_PASS  = 'Password@123';

/**
 * Login via the UI form and wait for redirect away from /login.
 */
async function loginViaUI(page: Page) {
  await page.goto('/login');
  await page.locator('input[placeholder="Nhập email"]').click();
  await page.locator('input[placeholder="Nhập email"]').pressSequentially(FARMER_EMAIL);
  await page.locator('input[placeholder="Nhập mật khẩu"]').click();
  await page.locator('input[placeholder="Nhập mật khẩu"]').pressSequentially(FARMER_PASS);
  await page.locator('text=Đăng nhập').last().click();
  await expect(page.locator('text=Đăng xuất').first()).toBeVisible({ timeout: 20000 });
}

test.describe('AgriVision — Farmer Flow', () => {
  test('welcome page loads and has CTA button', async ({ page }) => {
    await page.goto('/welcome');
    // Exact CSS class selector avoids strict mode violation
    await expect(page.locator('span.text-gradient-primary').first()).toBeVisible({ timeout: 15000 });
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
    await expect(page.getByTestId('agrivision-home')).toBeVisible({ timeout: 15000 });
    const isMobile = await page.getByTestId('btn-fields').count() > 0;
    if (isMobile) {
      await expect(page.getByTestId('btn-diagnose')).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('btn-fields')).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.locator('button:has-text("Cánh đồng")').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('button:has-text("Phân tích ảnh")').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('fields screen renders with FAB button', async ({ page }) => {
    await loginViaUI(page);
    const isMobile = await page.getByTestId('btn-fields').count() > 0;
    if (isMobile) {
      await page.goto('/(agrivision)/fields');
    } else {
      await page.locator('button:has-text("Cánh đồng")').first().click();
    }
    const visibleScreen = page.getByTestId('fields-screen').filter({ visible: true }).first();
    await expect(visibleScreen).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('fab-add-field').filter({ visible: true }).first()).toBeVisible({ timeout: 10000 });
  });

  test('create field wizard works from end-to-end', async ({ page }) => {
    await loginViaUI(page);
    const isMobile = await page.getByTestId('btn-fields').count() > 0;
    if (isMobile) {
      await page.goto('/(agrivision)/fields');
    } else {
      await page.locator('button:has-text("Cánh đồng")').first().click();
    }
    const fab = page.getByTestId('fab-add-field').filter({ visible: true }).first();
    await expect(fab).toBeVisible({ timeout: 15000 });
    await fab.click();
    
    // Step 1: Walk Main Boundary
    const toggleGpsBtn = page.getByTestId('btn-toggle-gps').filter({ visible: true }).first();
    await expect(toggleGpsBtn).toBeVisible({ timeout: 8000 });
    await toggleGpsBtn.click(); // Start GPS streaming
    
    const completeBoundaryBtn = page.getByTestId('btn-complete-boundary').filter({ visible: true }).first();
    await expect(completeBoundaryBtn).toBeVisible();
    await completeBoundaryBtn.click(); // Move to Step 2
    
    // Step 2: Map Crop Sub-zones
    const nextBtn = page.getByTestId('btn-wizard-next').filter({ visible: true }).first();
    await expect(nextBtn).toBeVisible({ timeout: 8000 });
    await nextBtn.click(); // Move to Step 3
    
    // Step 3: Metadata Entry
    const nameInput = page.getByTestId('field-name-input').filter({ visible: true }).first();
    await expect(nameInput).toBeVisible({ timeout: 8000 });
    await nameInput.fill('Cánh đồng mẫu lớn');
    
    const submitBtn = page.getByTestId('btn-submit-field').filter({ visible: true }).first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();
    
    // Check if modal closed and field list is visible
    await expect(fab).toBeVisible({ timeout: 10000 });
  });

  test('inference screen renders', async ({ page }) => {
    await loginViaUI(page);
    const isMobile = await page.getByTestId('btn-fields').count() > 0;
    if (isMobile) {
      await page.goto('/(agrivision)/inference');
    } else {
      await page.locator('button:has-text("Phân tích ảnh")').first().click();
    }
    await expect(page.getByTestId('inference-screen').filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
  });

  test('diagnose quick action navigates to inference', async ({ page }) => {
    await loginViaUI(page);
    const isMobile = await page.getByTestId('btn-fields').count() > 0;
    if (isMobile) {
      await expect(page.getByTestId('btn-diagnose')).toBeVisible({ timeout: 15000 });
      await page.getByTestId('btn-diagnose').click();
      await expect(page).toHaveURL(/inference/, { timeout: 10000 });
    } else {
      await page.locator('button:has-text("Phân tích ảnh")').first().click();
      await expect(page.getByTestId('inference-screen').filter({ visible: true }).first()).toBeVisible({ timeout: 10000 });
    }
  });
});
