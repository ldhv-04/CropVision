# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: agrivision.spec.ts >> AgriVision — Farmer Flow >> welcome page loads and has CTA button
- Location: e2e\agrivision.spec.ts:31:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('span.text-gradient-primary')
Expected: visible
Error: strict mode violation: locator('span.text-gradient-primary') resolved to 2 elements:
    1) <span class="text-gradient-primary">Nông Nghiệp Thông Minh.</span> aka getByText('Nông Nghiệp Thông Minh.')
    2) <span class="text-gradient-primary">Tối ưu hóa</span> aka getByText('Tối ưu hóa')

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('span.text-gradient-primary')

```

# Page snapshot

```yaml
- generic [ref=e12]:
  - generic [ref=e15]:
    - generic [ref=e16]: CropVision v2.0 - Kỷ nguyên mới của Nông nghiệp
    - heading "Tương lai của Nông Nghiệp Thông Minh." [level=1] [ref=e18]:
      - text: Tương lai của
      - text: Nông Nghiệp Thông Minh.
    - paragraph [ref=e19]: Đưa sức mạnh của trí tuệ nhân tạo (YOLO) và vạn vật kết nối (IoT) vào từng luống cây. Phân tích, cảnh báo và tự động hóa trong nháy mắt.
    - button "Bắt đầu miễn phí" [ref=e21] [cursor=pointer]
  - generic [ref=e37]:
    - generic [ref=e38]:
      - heading "Sinh ra để Tối ưu hóa" [level=2] [ref=e39]
      - paragraph [ref=e40]: Kết hợp sức mạnh phân tích của trí tuệ nhân tạo và mạng lưới cảm biến IoT để cung cấp cái nhìn toàn cảnh chưa từng có.
    - generic [ref=e41]:
      - generic [ref=e43]:
        - heading "Thị giác Máy tính xuất chúng" [level=3] [ref=e44]
        - paragraph [ref=e45]: Mô hình YOLOv8 được huấn luyện trên hàng triệu hình ảnh bệnh lý, nhận diện sâu bệnh ngay khi lá non vừa nhú.
        - generic [ref=e47]: 👁️
      - generic [ref=e49]:
        - generic [ref=e50]: 📡
        - heading "Cảm biến thời gian thực" [level=3] [ref=e51]
        - paragraph [ref=e52]: Kết nối hàng nghìn node IoT tại vườn, báo cáo độ ẩm, nhiệt độ mỗi 5 giây.
      - generic [ref=e54]:
        - generic [ref=e55]: ⚡
        - heading "Phác đồ tự động" [level=3] [ref=e56]
        - paragraph [ref=e57]: Nhận thông báo ngay lập tức kèm theo phương pháp trị liệu chuẩn xác.
  - generic [ref=e62]:
    - generic [ref=e63]:
      - generic [ref=e64]: 98.5% ĐỘ CHÍNH XÁC AI
      - generic [ref=e65]: •
      - generic [ref=e66]: 10,000+ HECTA GIÁM SÁT
      - generic [ref=e67]: •
      - generic [ref=e68]: PHÂN TÍCH TRONG 2 GIÂY
      - generic [ref=e69]: •
      - generic [ref=e70]: BẢO VỆ MÙA MÀNG 24/7
      - generic [ref=e71]: •
      - generic [ref=e72]: TÍCH HỢP HÀNG NGHÌN SENSOR
      - generic [ref=e73]: •
    - generic [ref=e74]:
      - generic [ref=e75]: 98.5% ĐỘ CHÍNH XÁC AI
      - generic [ref=e76]: •
      - generic [ref=e77]: 10,000+ HECTA GIÁM SÁT
      - generic [ref=e78]: •
      - generic [ref=e79]: PHÂN TÍCH TRONG 2 GIÂY
      - generic [ref=e80]: •
      - generic [ref=e81]: BẢO VỆ MÙA MÀNG 24/7
      - generic [ref=e82]: •
      - generic [ref=e83]: TÍCH HỢP HÀNG NGHÌN SENSOR
      - generic [ref=e84]: •
    - generic [ref=e85]:
      - generic [ref=e86]: 98.5% ĐỘ CHÍNH XÁC AI
      - generic [ref=e87]: •
      - generic [ref=e88]: 10,000+ HECTA GIÁM SÁT
      - generic [ref=e89]: •
      - generic [ref=e90]: PHÂN TÍCH TRONG 2 GIÂY
      - generic [ref=e91]: •
      - generic [ref=e92]: BẢO VỆ MÙA MÀNG 24/7
      - generic [ref=e93]: •
      - generic [ref=e94]: TÍCH HỢP HÀNG NGHÌN SENSOR
      - generic [ref=e95]: •
    - generic [ref=e96]:
      - generic [ref=e97]: 98.5% ĐỘ CHÍNH XÁC AI
      - generic [ref=e98]: •
      - generic [ref=e99]: 10,000+ HECTA GIÁM SÁT
      - generic [ref=e100]: •
      - generic [ref=e101]: PHÂN TÍCH TRONG 2 GIÂY
      - generic [ref=e102]: •
      - generic [ref=e103]: BẢO VỆ MÙA MÀNG 24/7
      - generic [ref=e104]: •
      - generic [ref=e105]: TÍCH HỢP HÀNG NGHÌN SENSOR
      - generic [ref=e106]: •
  - contentinfo [ref=e107]:
    - generic [ref=e109]:
      - heading "Bạn đã sẵn sàng?" [level=2] [ref=e110]
      - paragraph [ref=e111]: Gia nhập nền tảng quản lý nông nghiệp thông minh bậc nhất hiện nay.
      - button "Tham gia ngay" [ref=e112] [cursor=pointer]
    - generic [ref=e113]:
      - generic [ref=e114]: CropVision .
      - generic [ref=e115]: © 2026 CropVision AI. Đã đăng ký bản quyền.
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
  27 |   await page.waitForURL(/\/(station|agrivision|main)/, { timeout: 20000 });
  28 | }
  29 | 
  30 | test.describe('AgriVision — Farmer Flow', () => {
  31 |   test('welcome page loads and has CTA button', async ({ page }) => {
  32 |     await page.goto('/welcome');
  33 |     // Exact CSS class selector avoids strict mode violation
> 34 |     await expect(page.locator('span.text-gradient-primary')).toBeVisible({ timeout: 15000 });
     |                                                              ^ Error: expect(locator).toBeVisible() failed
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