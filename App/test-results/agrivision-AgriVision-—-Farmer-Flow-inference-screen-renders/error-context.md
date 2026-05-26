# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: agrivision.spec.ts >> AgriVision — Farmer Flow >> inference screen renders
- Location: e2e\agrivision.spec.ts:68:7

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
  4  |  * agrivision.spec.ts — Farmer (AgriVision) E2E Tests
  5  |  *
  6  |  * Auth state is stored in Zustand (in-memory). Playwright must login via UI
  7  |  * before accessing protected routes. We use admin account (always seeded)
  8  |  * then navigate to agrivision routes.
  9  |  *
  10 |  * React Native Web: `testID` prop → `data-testid` attribute.
  11 |  * Use `page.getByTestId('xyz')` for RN components.
  12 |  */
  13 | 
  14 | const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@cropvision.local';
  15 | const ADMIN_PASS  = process.env.TEST_ADMIN_PASS  || 'Admin@123';
  16 | 
  17 | /**
  18 |  * Login via the UI form and wait for redirect away from /login.
  19 |  * Uses admin account which is always seeded by backend startup.
  20 |  */
  21 | async function loginViaUI(page: Page) {
  22 |   await page.goto('/login');
  23 |   await page.locator('input[placeholder="Nhập email"]').fill(ADMIN_EMAIL);
  24 |   await page.locator('input[placeholder="Nhập mật khẩu"]').fill(ADMIN_PASS);
  25 |   await page.locator('text=Đăng nhập').last().click();
  26 |   // Wait for redirect away from /login (admin goes to /station)
> 27 |   await page.waitForURL(/\/(station|agrivision|main)/, { timeout: 20000 });
     |              ^ TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
  28 | }
  29 | 
  30 | test.describe('AgriVision — Farmer Flow', () => {
  31 |   test('welcome page loads and has CTA button', async ({ page }) => {
  32 |     await page.goto('/welcome');
  33 |     // Exact CSS class selector avoids strict mode violation
  34 |     await expect(page.locator('span.text-gradient-primary')).toBeVisible({ timeout: 15000 });
  35 |     await expect(page.locator('button:has-text("Bắt đầu miễn phí")')).toBeVisible();
  36 |   });
  37 | 
  38 |   test('login page renders correctly', async ({ page }) => {
  39 |     await page.goto('/login');
  40 |     await expect(page.locator('text=CropVision AI')).toBeVisible({ timeout: 15000 });
  41 |     await expect(page.locator('input[placeholder="Nhập email"]')).toBeVisible();
  42 |     await expect(page.locator('input[placeholder="Nhập mật khẩu"]')).toBeVisible();
  43 |   });
  44 | 
  45 |   test('AgriVision home screen has quick action buttons', async ({ page }) => {
  46 |     await loginViaUI(page);
  47 |     await page.goto('/(agrivision)');
  48 |     await expect(page.getByTestId('agrivision-home')).toBeVisible({ timeout: 15000 });
  49 |     await expect(page.getByTestId('btn-diagnose')).toBeVisible({ timeout: 10000 });
  50 |     await expect(page.getByTestId('btn-fields')).toBeVisible({ timeout: 10000 });
  51 |   });
  52 | 
  53 |   test('fields screen renders with FAB button', async ({ page }) => {
  54 |     await loginViaUI(page);
  55 |     await page.goto('/(agrivision)/fields');
  56 |     await expect(page.getByTestId('fields-screen')).toBeVisible({ timeout: 15000 });
  57 |     await expect(page.getByTestId('fab-add-field')).toBeVisible({ timeout: 10000 });
  58 |   });
  59 | 
  60 |   test('create field modal opens on FAB click', async ({ page }) => {
  61 |     await loginViaUI(page);
  62 |     await page.goto('/(agrivision)/fields');
  63 |     await expect(page.getByTestId('fab-add-field')).toBeVisible({ timeout: 15000 });
  64 |     await page.getByTestId('fab-add-field').click();
  65 |     await expect(page.getByTestId('field-name-input')).toBeVisible({ timeout: 8000 });
  66 |   });
  67 | 
  68 |   test('inference screen renders', async ({ page }) => {
  69 |     await loginViaUI(page);
  70 |     await page.goto('/(agrivision)/inference');
  71 |     await expect(page.getByTestId('inference-screen')).toBeVisible({ timeout: 15000 });
  72 |   });
  73 | 
  74 |   test('diagnose quick action navigates to inference', async ({ page }) => {
  75 |     await loginViaUI(page);
  76 |     await page.goto('/(agrivision)');
  77 |     await expect(page.getByTestId('btn-diagnose')).toBeVisible({ timeout: 15000 });
  78 |     await page.getByTestId('btn-diagnose').click();
  79 |     await expect(page).toHaveURL(/inference/, { timeout: 10000 });
  80 |   });
  81 | });
  82 | 
```