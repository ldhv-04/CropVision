import { test, expect } from '@playwright/test';
import * as path from 'path';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@cropvision.local';
const ADMIN_PASS  = process.env.TEST_ADMIN_PASS  || 'Admin@123';
const ARTIFACT_DIR = 'C:/Users/Vu/.gemini/antigravity/brain/ed3ca988-a8b3-4f1f-80e2-70081d6f5bc0';

test('debug zone editor rendering', async ({ page }) => {
  page.on('console', msg => {
    console.log(`[BROWSER]: ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  // 1. Go to login
  await page.goto('/login');
  await page.locator('input[placeholder="Nhập email"]').click();
  await page.locator('input[placeholder="Nhập email"]').pressSequentially(ADMIN_EMAIL);
  await page.locator('input[placeholder="Nhập mật khẩu"]').click();
  await page.locator('input[placeholder="Nhập mật khẩu"]').pressSequentially(ADMIN_PASS);
  await page.locator('text=Đăng nhập').last().click();

  // Wait for redirect to dashboard
  await expect(page.locator('text=Đăng xuất').first()).toBeVisible({ timeout: 20000 });
  const dashboard = page.getByTestId('dashboard-page').filter({ visible: true }).first();
  await expect(dashboard).toBeVisible({ timeout: 15000 });

  // 2. Click nav-fields to go to fields page
  const fieldsNav = page.getByTestId('nav-fields').filter({ visible: true }).first();
  await expect(fieldsNav).toBeVisible({ timeout: 5000 });
  await fieldsNav.click();
  await page.waitForTimeout(3000); // Wait for fields to load

  // Take screenshot of Fields Page
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fields_page_before.png') });

  // 3. Click on a field in the explorer sidebar to open details
  const fieldItem = page.locator('text=Sinh trưởng').first();
  if (await fieldItem.count() > 0) {
    await fieldItem.click();
    await page.waitForTimeout(2000);
  } else {
    // Click on the first element in search list or click map
    await page.locator('[data-testid^="explorer-item-"]').first().click();
    await page.waitForTimeout(2000);
  }

  // Take screenshot of detail panel
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'fields_page_detail.png') });

  // 4. Click "Configure Zones"
  const configZonesBtn = page.locator('text=Configure Zones').first();
  if (await configZonesBtn.count() === 0) {
    // Try Vietnamese/alternative
    await page.locator('text=🗺️ Configure Zones').first().click();
  } else {
    await configZonesBtn.click();
  }

  // 5. Wait for Zone Editor to mount
  await page.waitForTimeout(5000);

  // Print DOM states of Map container and canvas using evaluate
  const domInfo = await page.evaluate(() => {
    const mapContainer = document.querySelector('[data-zone-editor-map]');
    const maplibreglMap = document.querySelector('.maplibregl-map');
    const canvasContainer = document.querySelector('.maplibregl-canvas-container');
    const canvas = document.querySelector('.maplibregl-canvas');

    return {
      mapContainerExists: !!mapContainer,
      mapContainerHTML: mapContainer ? mapContainer.outerHTML : null,
      maplibreglMap: maplibreglMap ? {
        tagName: maplibreglMap.tagName,
        className: maplibreglMap.className,
        clientWidth: maplibreglMap.clientWidth,
        clientHeight: maplibreglMap.clientHeight,
        style: maplibreglMap.getAttribute('style'),
      } : null,
      canvasContainer: canvasContainer ? {
        tagName: canvasContainer.tagName,
        className: canvasContainer.className,
        clientWidth: canvasContainer.clientWidth,
        clientHeight: canvasContainer.clientHeight,
        style: canvasContainer.getAttribute('style'),
        computedStyle: {
          display: window.getComputedStyle(canvasContainer).display,
          position: window.getComputedStyle(canvasContainer).position,
          width: window.getComputedStyle(canvasContainer).width,
          height: window.getComputedStyle(canvasContainer).height,
        }
      } : null,
      canvas: canvas ? {
        tagName: canvas.tagName,
        className: canvas.className,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        widthAttr: canvas.getAttribute('width'),
        heightAttr: canvas.getAttribute('height'),
        style: canvas.getAttribute('style'),
        computedStyle: {
          display: window.getComputedStyle(canvas).display,
          position: window.getComputedStyle(canvas).position,
          width: window.getComputedStyle(canvas).width,
          height: window.getComputedStyle(canvas).height,
        }
      } : null,
    };
  });

  console.log('E2E DOM INSPECTION:', JSON.stringify(domInfo, null, 2));

  // Take screenshot of Zone Editor Page
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'zone_editor_page_debug.png') });
});
