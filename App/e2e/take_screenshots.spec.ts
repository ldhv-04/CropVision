import { test, expect, Page } from '@playwright/test';
import * as path from 'path';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@cropvision.local';
const ADMIN_PASS  = process.env.TEST_ADMIN_PASS  || 'Admin@123';

const FARMER_EMAIL = 'farmer@cropvision.local';
const FARMER_PASS  = 'Password@123';

const BACKEND_URL = 'http://localhost:3000';
const ARTIFACT_DIR = 'C:/Users/Vu/.gemini/antigravity/brain/8369c8f0-1040-4a41-baf2-8adbb155ae0e';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('Nhập email').click();
  await page.getByPlaceholder('Nhập email').pressSequentially(ADMIN_EMAIL);
  await page.getByPlaceholder('Nhập mật khẩu').click();
  await page.getByPlaceholder('Nhập mật khẩu').pressSequentially(ADMIN_PASS);
  await page.locator('text=Đăng nhập').last().click();
  await expect(page.locator('text=Đăng xuất').first()).toBeVisible({ timeout: 20000 });
}

async function loginAsFarmer(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('Nhập email').click();
  await page.getByPlaceholder('Nhập email').pressSequentially(FARMER_EMAIL);
  await page.getByPlaceholder('Nhập mật khẩu').click();
  await page.getByPlaceholder('Nhập mật khẩu').pressSequentially(FARMER_PASS);
  await page.locator('text=Đăng nhập').last().click();
  await expect(page.locator('text=Đăng xuất').first()).toBeVisible({ timeout: 20000 });
}

test.describe('Take E2E Screenshots for Geo-Spatial & Epidemic Module', () => {

  test.beforeAll(async ({ playwright }) => {
    const requestContext = await playwright.request.newContext();
    
    // 1. Login as farmer to get JWT token
    const loginRes = await requestContext.post(`${BACKEND_URL}/api/auth/login`, {
      data: { email: FARMER_EMAIL, password: FARMER_PASS }
    });
    
    expect(loginRes.status()).toBe(200);
    const loginData = await loginRes.json();
    const token = loginData.data?.token;
    expect(token).toBeDefined();
    
    // 2. Fetch fields
    const fieldsRes = await requestContext.get(`${BACKEND_URL}/api/fields`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(fieldsRes.status()).toBe(200);
    const fieldsData = await fieldsRes.json();
    const fields = fieldsData.data;
    expect(fields).toBeDefined();
    expect(fields.length).toBeGreaterThan(0);
    
    const field = fields[0];
    
    // 3. Fetch subzones
    const subzonesRes = await requestContext.get(`${BACKEND_URL}/api/fields/${field.id}/subzones`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(subzonesRes.status()).toBe(200);
    const subzonesData = await subzonesRes.json();
    const subzones = subzonesData.data;
    expect(subzones).toBeDefined();
    expect(subzones.length).toBeGreaterThan(0);
    
    const subzone = subzones[0];
    
    // 4. Report outbreak
    const reportRes = await requestContext.post(`${BACKEND_URL}/api/epidemic/report`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        subZoneId: subzone.id,
        diseaseType: 'Rầy nâu',
        dangerRadius: 5.0
      }
    });
    
    expect(reportRes.status()).toBe(201);
    const reportData = await reportRes.json();
    expect(reportData.success).toBe(true);
    
    console.log(`Successfully reported mock outbreak on subzone ${subzone.id} (status: ${reportRes.status()})`);
    
    await requestContext.dispose();
  });

  test('Capture Farmer App screen views', async ({ page }) => {
    test.setTimeout(120000);
    // 1. Home tab
    await loginAsFarmer(page);

    // Set mobile viewport for phone screenshots
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'farmer_home.png'), fullPage: true });

    // 2. Navigate to fields screen
    await page.goto('/(agrivision)/fields');
    const visibleScreen = page.getByTestId('fields-screen').filter({ visible: true }).first();
    await expect(visibleScreen).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'farmer_fields.png'), fullPage: true });

    // 3. Open details and click "Vùng trồng & IoT"
    const fieldCard = visibleScreen.locator('text=Sinh trưởng').first();
    if (await fieldCard.count() > 0) {
      await fieldCard.click();
      await page.waitForTimeout(2000);
      
      // Select the Vùng trồng & IoT tab
      await page.locator('text=Vùng trồng & IoT').click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'farmer_field_subzones.png'), fullPage: true });
    }

    // 4. Open Field Mapping Wizard & capture Step 1
    await page.goto('/(agrivision)/fields');
    const fab = page.getByTestId('fab-add-field').filter({ visible: true }).first();
    await expect(fab).toBeVisible({ timeout: 15000 });
    await fab.click();
    await page.waitForTimeout(2000);

    const toggleGpsBtn = page.getByTestId('btn-toggle-gps').filter({ visible: true }).first();
    await expect(toggleGpsBtn).toBeVisible({ timeout: 8000 });
    await toggleGpsBtn.click(); // Start GPS streaming
    await page.waitForTimeout(3000); // Wait for drifting path to show
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'wizard_step1.png'), fullPage: true });

    // 5. Capture Step 2
    const completeBoundaryBtn = page.getByTestId('btn-complete-boundary').filter({ visible: true }).first();
    await expect(completeBoundaryBtn).toBeVisible();
    await completeBoundaryBtn.click(); // Proceed to Step 2
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'wizard_step2.png'), fullPage: true });

    // 6. Capture Step 3
    const nextBtn = page.getByTestId('btn-wizard-next').filter({ visible: true }).first();
    await expect(nextBtn).toBeVisible({ timeout: 8000 });
    await nextBtn.click(); // Proceed to Step 3
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'wizard_step3.png'), fullPage: true });

    // Clean up: Close wizard
    const closeBtn = page.locator('#btn-close-modal').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
    }
  });

  test('Capture Station Admin app views & simulation', async ({ page }) => {
    test.setTimeout(120000);
    // 1. Dashboard screen
    await loginAsAdmin(page);

    // Set mobile viewport for phone screenshots
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'station_dashboard.png'), fullPage: true });

    // 2. Try simulation if "Mô phỏng" button is available
    const simulateBtn = page.locator('button:has-text("Mô phỏng")').first();
    if (await simulateBtn.count() > 0) {
      await simulateBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'station_simulation_active.png'), fullPage: true });
      
      // Stop simulation
      const stopBtn = page.locator('button:has-text("Hủy mô phỏng")').first();
      if (await stopBtn.count() > 0) {
        await stopBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });

});
