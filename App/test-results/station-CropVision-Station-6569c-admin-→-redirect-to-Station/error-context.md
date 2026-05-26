# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: station.spec.ts >> CropVision Station — Admin Flow >> login as admin → redirect to Station
- Location: e2e\station.spec.ts:25:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e13]:
  - generic [ref=e14]: CropVision AI
  - generic [ref=e15]: Đăng nhập hệ thống phân tích
  - generic [ref=e16]:
    - generic [ref=e17]: Email
    - textbox "Nhập email" [ref=e18]
  - generic [ref=e19]:
    - generic [ref=e20]: Mật khẩu
    - textbox "Nhập mật khẩu" [ref=e21]: Admin@123
  - generic [ref=e23] [cursor=pointer]: Đăng nhập
  - generic [ref=e25] [cursor=pointer]: Chưa có tài khoản? Đăng ký ngay
```

# Test source

```ts
  1  | import { test, expect, Page } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * station.spec.ts — Admin (CropVision Station) E2E Tests
  5  |  *
  6  |  * Auth state is stored in Zustand (in-memory per page load).
  7  |  * Must login via UI form before accessing protected routes.
  8  |  *
  9  |  * React Native Web: `testID` prop → `data-testid` attribute.
  10 |  */
  11 | 
  12 | const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@cropvision.local';
  13 | const ADMIN_PASS  = process.env.TEST_ADMIN_PASS  || 'Admin@123';
  14 | 
  15 | async function loginAsAdmin(page: Page) {
  16 |   await page.goto('/login');
  17 |   await page.locator('input[placeholder="Nhập email"]').fill(ADMIN_EMAIL);
  18 |   await page.locator('input[placeholder="Nhập mật khẩu"]').fill(ADMIN_PASS);
  19 |   await page.locator('text=Đăng nhập').last().click();
  20 |   // Admin redirects to /(station)
> 21 |   await page.waitForURL(/\/station/, { timeout: 20000 });
     |              ^ TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
  22 | }
  23 | 
  24 | test.describe('CropVision Station — Admin Flow', () => {
  25 |   test('login as admin → redirect to Station', async ({ page }) => {
  26 |     await loginAsAdmin(page);
  27 |     await expect(page.getByTestId('station-dashboard')).toBeVisible({ timeout: 15000 });
  28 |   });
  29 | 
  30 |   test('command center shows KPI cards', async ({ page }) => {
  31 |     await loginAsAdmin(page);
  32 |     await expect(page.getByTestId('kpi-users')).toBeVisible({ timeout: 15000 });
  33 |     await expect(page.getByTestId('kpi-samples')).toBeVisible();
  34 |     await expect(page.getByTestId('kpi-today')).toBeVisible();
  35 |     await expect(page.getByTestId('kpi-accuracy')).toBeVisible();
  36 |   });
  37 | 
  38 |   test('system screen tabs work', async ({ page }) => {
  39 |     await loginAsAdmin(page);
  40 |     await page.goto('/(station)/system');
  41 |     await expect(page.getByTestId('station-system')).toBeVisible({ timeout: 15000 });
  42 |     await expect(page.getByTestId('tab-users')).toBeVisible();
  43 |     await expect(page.getByTestId('tab-samples')).toBeVisible();
  44 |     // Click samples tab
  45 |     await page.getByTestId('tab-samples').click();
  46 |     await expect(page.locator('text=Samples')).toBeVisible({ timeout: 5000 });
  47 |   });
  48 | 
  49 |   test('system search works', async ({ page }) => {
  50 |     await loginAsAdmin(page);
  51 |     await page.goto('/(station)/system');
  52 |     await expect(page.getByTestId('system-search')).toBeVisible({ timeout: 15000 });
  53 |     await page.getByTestId('system-search').fill('admin');
  54 |     await expect(page.getByTestId('system-search')).toHaveValue('admin');
  55 |   });
  56 | 
  57 |   test('admin logout works', async ({ page }) => {
  58 |     await loginAsAdmin(page);
  59 |     await expect(page.getByTestId('btn-station-logout')).toBeVisible({ timeout: 15000 });
  60 |     await page.getByTestId('btn-station-logout').click();
  61 |     await expect(page).toHaveURL(/welcome/, { timeout: 10000 });
  62 |   });
  63 | });
  64 | 
```