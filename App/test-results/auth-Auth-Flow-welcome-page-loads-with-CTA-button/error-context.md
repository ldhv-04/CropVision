# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Auth Flow >> welcome page loads with CTA button
- Location: e2e\auth.spec.ts:10:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('span.text-gradient-primary')
Expected: visible
Error: strict mode violation: locator('span.text-gradient-primary') resolved to 2 elements:
    1) <span class="text-gradient-primary">Nông Nghiệp Thông Minh.</span> aka getByText('Nông Nghiệp Thông Minh.')
    2) <span class="text-gradient-primary">Tối ưu hóa</span> aka getByText('Tối ưu hóa')

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('span.text-gradient-primary')

```

# Page snapshot

```yaml
- generic [ref=e2]:
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
  - generic:
    - img
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * auth.spec.ts — Auth & Welcome E2E Tests
  5  |  *
  6  |  * React Native Web: `testID` → `data-testid`. HTML welcome page uses native selectors.
  7  |  */
  8  | 
  9  | test.describe('Auth Flow', () => {
  10 |   test('welcome page loads with CTA button', async ({ page }) => {
  11 |     await page.goto('/');
  12 |     await expect(page).toHaveURL(/.*\/welcome/, { timeout: 20000 });
  13 |     // Use exact span text to avoid strict mode violation
> 14 |     await expect(page.locator('span.text-gradient-primary')).toBeVisible({ timeout: 10000 });
     |                                                              ^ Error: expect(locator).toBeVisible() failed
  15 |     await expect(page.locator('button:has-text("Bắt đầu miễn phí")')).toBeVisible({ timeout: 10000 });
  16 |   });
  17 | 
  18 |   test('CTA navigates to /login', async ({ page }) => {
  19 |     await page.goto('/welcome');
  20 |     await expect(page.locator('button:has-text("Bắt đầu miễn phí")')).toBeVisible({ timeout: 15000 });
  21 |     await page.locator('button:has-text("Bắt đầu miễn phí")').click();
  22 |     await expect(page).toHaveURL(/.*\/login/, { timeout: 15000 });
  23 |   });
  24 | 
  25 |   test('login page has form fields and submit button', async ({ page }) => {
  26 |     await page.goto('/login');
  27 |     await expect(page.locator('text=CropVision AI')).toBeVisible({ timeout: 15000 });
  28 |     await expect(page.locator('input[placeholder="Nhập email"]')).toBeVisible({ timeout: 10000 });
  29 |     await expect(page.locator('input[placeholder="Nhập mật khẩu"]')).toBeVisible({ timeout: 10000 });
  30 |     await expect(page.locator('text=Đăng nhập').last()).toBeVisible({ timeout: 10000 });
  31 |   });
  32 | });
  33 | 
```