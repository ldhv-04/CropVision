import { test, expect } from '@playwright/test';

/**
 * auth.spec.ts — Auth & Welcome E2E Tests
 *
 * React Native Web: `testID` → `data-testid`. HTML welcome page uses native selectors.
 */

test.describe('Auth Flow', () => {
  test('welcome page loads with CTA button', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/welcome/, { timeout: 20000 });
    // Use exact span text to avoid strict mode violation
    await expect(page.locator('span.text-gradient-primary').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Bắt đầu miễn phí")')).toBeVisible({ timeout: 10000 });
  });

  test('CTA navigates to /login', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.locator('button:has-text("Bắt đầu miễn phí")')).toBeVisible({ timeout: 15000 });
    await page.locator('button:has-text("Bắt đầu miễn phí")').click();
    await expect(page).toHaveURL(/.*\/login/, { timeout: 15000 });
  });

  test('login page has form fields and submit button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=CropVision AI')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input[placeholder="Nhập email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[placeholder="Nhập mật khẩu"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Đăng nhập').last()).toBeVisible({ timeout: 10000 });
  });
});
