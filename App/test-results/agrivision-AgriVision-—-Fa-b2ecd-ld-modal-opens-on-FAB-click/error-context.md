# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: agrivision.spec.ts >> AgriVision — Farmer Flow >> create field modal opens on FAB click
- Location: e2e\agrivision.spec.ts:60:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:8081/"
  navigated to "http://localhost:8081/"
  navigated to "http://localhost:8081/"
  navigated to "http://localhost:8081/"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e8]:
  - generic [ref=e11]:
    - heading "🛰️ CropVision Station" [level=1] [ref=e14]
    - generic [ref=e18]:
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]: 🛰️ Command Center
          - generic [ref=e22]: Xin chào, CropVision Admin · Admin
        - generic [ref=e24] [cursor=pointer]: Logout
      - generic [ref=e25]: 📊 Chỉ số hệ thống
      - generic [ref=e26]:
        - generic [ref=e27] [cursor=pointer]:
          - generic [ref=e30]: 👥
          - generic [ref=e31]: "3"
          - generic [ref=e32]: Người dùng
          - generic [ref=e33]: Đã đăng ký
        - generic [ref=e34] [cursor=pointer]:
          - generic [ref=e37]: 🔬
          - generic [ref=e38]: "82"
          - generic [ref=e39]: Mẫu phân tích
          - generic [ref=e40]: Tổng cộng
      - generic [ref=e41]:
        - generic [ref=e42] [cursor=pointer]:
          - generic [ref=e45]: 📅
          - generic [ref=e46]: "0"
          - generic [ref=e47]: Hôm nay
          - generic [ref=e48]: Mẫu mới
        - generic [ref=e49] [cursor=pointer]:
          - generic [ref=e52]: 🎯
          - generic [ref=e53]: —
          - generic [ref=e54]: Độ tin cậy TB
          - generic [ref=e55]: AI confidence
      - generic [ref=e56]:
        - generic [ref=e57]: 📈 Tần suất bệnh phát hiện
        - generic [ref=e58]: Chưa có dữ liệu bệnh
      - generic [ref=e59]:
        - generic [ref=e60]:
          - generic [ref=e61]: ⚡ Hoạt động gần đây
          - generic [ref=e62]: 10 mẫu
        - generic [ref=e66]:
          - generic [ref=e67]: Không phát hiện
          - generic [ref=e68]: 👤 CropVision Admin · 19:07:34 24/5/2026
        - generic [ref=e72]:
          - generic [ref=e73]: Không phát hiện
          - generic [ref=e74]: 👤 CropVision Admin · 19:07:31 24/5/2026
        - generic [ref=e78]:
          - generic [ref=e79]: Không phát hiện
          - generic [ref=e80]: 👤 CropVision Admin · 18:51:59 24/5/2026
        - generic [ref=e84]:
          - generic [ref=e85]: Không phát hiện
          - generic [ref=e86]: 👤 CropVision Admin · 13:00:37 24/5/2026
        - generic [ref=e90]:
          - generic [ref=e91]: Không phát hiện
          - generic [ref=e92]: 👤 CropVision Admin · 12:26:13 24/5/2026
        - generic [ref=e96]:
          - generic [ref=e97]: Không phát hiện
          - generic [ref=e98]: 👤 CropVision Admin · 12:25:08 24/5/2026
        - generic [ref=e102]:
          - generic [ref=e103]: Không phát hiện
          - generic [ref=e104]: 👤 CropVision Admin · 12:01:27 24/5/2026
        - generic [ref=e108]:
          - generic [ref=e109]: Không phát hiện
          - generic [ref=e110]: 👤 CropVision Admin · 08:50:03 24/5/2026
        - generic [ref=e114]:
          - generic [ref=e115]: Không phát hiện
          - generic [ref=e116]: 👤 CropVision Admin · 19:27:25 14/5/2026
        - generic [ref=e120]:
          - generic [ref=e121]: Không phát hiện
          - generic [ref=e122]: 👤 CropVision Admin · 13:29:15 14/5/2026
  - tablist [ref=e124]:
    - tab "📊 Dashboard 📊 Dashboard" [selected] [ref=e126] [cursor=pointer]:
      - generic [ref=e127]:
        - generic [ref=e129]:
          - generic [ref=e130]: 📊
          - generic [ref=e131]: Dashboard
        - generic [ref=e133]:
          - generic [ref=e134]: 📊
          - generic [ref=e135]: Dashboard
    - tab "⚙️ System ⚙️ System" [ref=e137] [cursor=pointer]:
      - generic [ref=e138]:
        - generic [ref=e140]:
          - generic [ref=e141]: ⚙️
          - generic [ref=e142]: System
        - generic [ref=e144]:
          - generic [ref=e145]: ⚙️
          - generic [ref=e146]: System
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