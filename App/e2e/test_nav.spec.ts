import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@cropvision.local';
const ADMIN_PASS  = 'Admin@123';

test('verify admin login and sidebar navigation', async ({ page }) => {
  // 1. Go to login
  await page.goto('/login');
  
  // 2. Fill credentials
  await page.getByPlaceholder('Nhập email').click();
  await page.getByPlaceholder('Nhập email').pressSequentially(ADMIN_EMAIL);
  await page.getByPlaceholder('Nhập mật khẩu').click();
  await page.getByPlaceholder('Nhập mật khẩu').pressSequentially(ADMIN_PASS);
  
  // 3. Click Login
  console.log('Submitting login form...');
  await page.locator('text=Đăng nhập').last().click();
  
  // 4. Wait for redirect
  console.log('Waiting for URL redirect...');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 25000 });
  console.log('Current URL after login redirect:', page.url());
  expect(page.url()).not.toContain('/login');
  
  // 5. Try to click "Phân tích ảnh" (now links to /analysis)
  console.log('Clicking "Phân tích ảnh" menu button...');
  // Use a more specific selector to avoid matching hidden menus if any
  await page.locator('button:has-text("Phân tích ảnh")').filter({ visible: true }).first().click();
  
  // 6. Wait and verify URL is /analysis
  await page.waitForURL((url) => url.pathname.includes('/analysis'), { timeout: 10000 });
  console.log('Current URL after clicking Phân tích ảnh:', page.url());
  expect(page.url()).toContain('/analysis');

  // Verify the inference layout components are visible
  await expect(page.locator('text=Tải ảnh lên để bắt đầu phân tích').filter({ visible: true }).first()).toBeVisible({ timeout: 5000 });
  
  // 7. Click "Lịch sử mẫu" (links to /history)
  console.log('Clicking "Lịch sử mẫu" menu button...');
  await page.locator('button:has-text("Lịch sử mẫu")').filter({ visible: true }).first().click();
  
  // Wait and verify URL is /history
  await page.waitForURL((url) => url.pathname.includes('/history'), { timeout: 10000 });
  console.log('Current URL after clicking Lịch sử mẫu:', page.url());
  expect(page.url()).toContain('/history');
  
  // 8. Click "Phân tích ảnh" again
  console.log('Clicking "Phân tích ảnh" again...');
  await page.locator('button:has-text("Phân tích ảnh")').filter({ visible: true }).first().click();
  
  // Wait and verify URL is /analysis again
  await page.waitForURL((url) => url.pathname.includes('/analysis'), { timeout: 10000 });
  console.log('Current URL after clicking Phân tích ảnh again:', page.url());
  expect(page.url()).toContain('/analysis');
});
