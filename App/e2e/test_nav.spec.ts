import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@cropvision.local';
const ADMIN_PASS = process.env.TEST_ADMIN_PASS || 'Admin@123';
const FARMER_EMAIL = process.env.TEST_FARMER_EMAIL || 'farmer@cropvision.local';
const FARMER_PASS = process.env.TEST_FARMER_PASS || 'Password@123';
const API_ORIGIN = process.env.TEST_API_ORIGIN || process.env.EXPO_PUBLIC_API_ORIGIN || 'http://127.0.0.1:3000';

async function assertBackendAvailable(request: APIRequestContext) {
  const health = await request.get(`${API_ORIGIN}/api/health`, { timeout: 5000 }).catch((error) => {
    throw new Error(`Backend unavailable at ${API_ORIGIN}. Start backend before Playwright. Cause: ${error.message}`);
  });
  expect(health.ok(), `Backend health check failed at ${API_ORIGIN}/api/health with ${health.status()}`).toBeTruthy();
}

async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login');

  await page.locator('#login-email').click();
  await page.locator('#login-email').pressSequentially(email);
  await page.locator('#login-password').click();
  await page.locator('#login-password').pressSequentially(password);

  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });
}

async function expectStationOwnership(page: Page) {
  const stationShell = page
    .getByTestId('soilzepro-shell')
    .or(page.getByTestId('soilzepro-content'))
    .or(page.getByTestId('station-dashboard-map-shell'))
    .or(page.getByTestId('station-dashboard'))
    .filter({ visible: true })
    .first();
  await expect(stationShell).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('inference-screen')).toHaveCount(0);
  await expect(page.getByTestId('agrivision-home')).toHaveCount(0);
}

async function expectAgrivisionOwnership(page: Page) {
  await expect(page.getByTestId('agrivision-home').filter({ visible: true }).first()).toBeVisible({ timeout: 30000 });
  await expect(page).not.toHaveURL(/\/login|\/analysis|station|dashboard|admin/);
  await expectNoStationShell(page);
}

async function expectNoStationShell(page: Page) {
  await expect(page.getByTestId('soilzepro-shell')).toHaveCount(0);
  await expect(page.getByTestId('station-dashboard-map-shell')).toHaveCount(0);
  await expect(page.getByTestId('station-dashboard')).toHaveCount(0);
  await expect(page.getByTestId('station-system')).toHaveCount(0);
  await expect(page.getByTestId('alerts-admin-screen')).toHaveCount(0);
  await expect(page.getByText(/Qu.n tr./i)).toHaveCount(0);
}

async function expectNoAgrivisionSurface(page: Page) {
  await expect(page.getByTestId('inference-screen')).toHaveCount(0);
  await expect(page.getByTestId('agrivision-home')).toHaveCount(0);
  await expect(page.getByTestId('fields-screen')).toHaveCount(0);
  await expect(page.getByTestId('sample-history-screen')).toHaveCount(0);
}

test('admin navigation stays within Station ownership', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASS);
  await expectStationOwnership(page);
  await expect(page).not.toHaveURL(/analysis/);
  await expect(page.getByText(/Ph.n t.ch .nh/i)).toHaveCount(0);
});

test('farmer navigation stays within Agrivision ownership', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, FARMER_EMAIL, FARMER_PASS);
  await expectAgrivisionOwnership(page);
});

test('farmer inference route is Agrivision-owned', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, FARMER_EMAIL, FARMER_PASS);
  await page.goto('/(agrivision)/inference');

  await expect(page).toHaveURL(/agrivision.*inference|inference/, { timeout: 30000 });
  await expect(page.getByTestId('inference-screen').filter({ visible: true }).first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('soilzepro-shell')).toHaveCount(0);
  await expect(page.getByTestId('station-dashboard-map-shell')).toHaveCount(0);
});

test('direct inference alias renders Agrivision inference for farmer', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, FARMER_EMAIL, FARMER_PASS);
  await page.goto('/inference');

  await expect(page).toHaveURL(/\/inference/, { timeout: 30000 });
  await expect(page.getByTestId('inference-screen').filter({ visible: true }).first()).toBeVisible({ timeout: 30000 });
  await expectNoStationShell(page);
});

test('direct inference alias redirects admin away from user inference', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASS);
  await page.goto('/inference');

  await expect(page).not.toHaveURL(/\/inference/, { timeout: 30000 });
  await expectStationOwnership(page);
});

test('legacy analysis route redirects farmer to Agrivision inference', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, FARMER_EMAIL, FARMER_PASS);
  await page.goto('/analysis');

  await expect(page).toHaveURL(/agrivision.*inference|inference/, { timeout: 30000 });
  await expect(page).not.toHaveURL(/\/analysis/);
  await expect(page.getByTestId('inference-screen').filter({ visible: true }).first()).toBeVisible({ timeout: 30000 });
});

test('legacy analysis route redirects admin away from user inference', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASS);
  await page.goto('/analysis');

  await expect(page).not.toHaveURL(/\/analysis|inference/, { timeout: 30000 });
  await expectStationOwnership(page);
});

test('legacy dashboard route redirects farmer to Agrivision ownership', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, FARMER_EMAIL, FARMER_PASS);
  await page.goto('/dashboard');

  await expectAgrivisionOwnership(page);
});

test('legacy dashboard route redirects admin to Station ownership', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASS);
  await page.goto('/dashboard');

  await expect(page).not.toHaveURL(/\/dashboard/, { timeout: 30000 });
  await expectStationOwnership(page);
});

test('legacy admin route redirects admin to Station ownership', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASS);
  await page.goto('/admin');

  await expect(page).not.toHaveURL(/\/admin/, { timeout: 30000 });
  await expectStationOwnership(page);
});

test('legacy admin route redirects farmer to Agrivision ownership', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, FARMER_EMAIL, FARMER_PASS);
  await page.goto('/admin');

  await expectAgrivisionOwnership(page);
});

test('legacy system route renders Station system for admin', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASS);
  await page.goto('/system');

  await expect(page.getByTestId('station-system').filter({ visible: true }).first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('soilzepro-shell').filter({ visible: true }).first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('station-dashboard')).toHaveCount(0);
  await expectNoAgrivisionSurface(page);
});

test('Station system owner route renders SystemPage for admin', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASS);
  await page.goto('/(station)/system');

  await expect(page.getByTestId('station-system').filter({ visible: true }).first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('soilzepro-shell').filter({ visible: true }).first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('station-dashboard')).toHaveCount(0);
  await expectNoAgrivisionSurface(page);
});

test('legacy alerts route renders Station alerts for admin', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASS);
  await page.goto('/alerts');

  await expect(page.getByTestId('alerts-admin-screen').filter({ visible: true }).first()).toBeVisible({ timeout: 30000 });
  await expectNoAgrivisionSurface(page);
});

test('legacy system route redirects farmer away from Station system', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, FARMER_EMAIL, FARMER_PASS);
  await page.goto('/system');

  await expect(page).not.toHaveURL(/\/system/, { timeout: 30000 });
  await expectAgrivisionOwnership(page);
});

test('legacy alerts route redirects farmer away from Station alerts', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, FARMER_EMAIL, FARMER_PASS);
  await page.goto('/alerts');

  await expect(page).not.toHaveURL(/\/alerts/, { timeout: 30000 });
  await expectAgrivisionOwnership(page);
});

test('farmer owned fields route renders without Station shell', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, FARMER_EMAIL, FARMER_PASS);
  await page.goto('/(agrivision)/fields');

  await expect(page.getByTestId('fields-screen').filter({ visible: true }).first()).toBeVisible({ timeout: 30000 });
  await expectNoStationShell(page);
});

test('farmer field map route renders without Station shell', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, FARMER_EMAIL, FARMER_PASS);
  await page.goto('/(agrivision)/field-map');

  const fieldMapOrShell = page
    .getByTestId('field-map-screen')
    .or(page.getByTestId('agrivision-home'))
    .filter({ visible: true })
    .first();
  await expect(fieldMapOrShell).toBeVisible({ timeout: 30000 });
  await expectNoStationShell(page);
});

test('legacy fields alias renders farmer-compatible fields without Station shell', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, FARMER_EMAIL, FARMER_PASS);
  await page.goto('/fields');

  await expect(page.getByTestId('fields-screen').filter({ visible: true }).first()).toBeVisible({ timeout: 30000 });
  await expectNoStationShell(page);
});

test('legacy history route smoke test does not expose Station shell to farmer', async ({ page, request }) => {
  await assertBackendAvailable(request);

  await loginViaUI(page, FARMER_EMAIL, FARMER_PASS);
  await page.goto('/history');

  await expect(page.getByTestId('sample-history-screen').filter({ visible: true }).first()).toBeVisible({ timeout: 30000 });
  await expectNoStationShell(page);
});
