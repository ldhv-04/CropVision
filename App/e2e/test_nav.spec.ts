import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@cropvision.local';
const ADMIN_PASS = process.env.TEST_ADMIN_PASS || 'Admin@123';

test('admin navigation stays within Station ownership', async ({ page }) => {
  await page.goto('/login');

  await page.getByPlaceholder('Nhap email').or(page.getByPlaceholder('Nhập email')).click();
  await page.getByPlaceholder('Nhap email').or(page.getByPlaceholder('Nhập email')).pressSequentially(ADMIN_EMAIL);
  await page.getByPlaceholder('Nhap mat khau').or(page.getByPlaceholder('Nhập mật khẩu')).click();
  await page.getByPlaceholder('Nhap mat khau').or(page.getByPlaceholder('Nhập mật khẩu')).pressSequentially(ADMIN_PASS);

  await page.locator('text=Đăng nhập').or(page.locator('text=Dang nhap')).last().click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 25000 });

  await expect(page).not.toHaveURL(/analysis/);
  await expect(page.locator('button:has-text("Phân tích ảnh")')).toHaveCount(0);
});
