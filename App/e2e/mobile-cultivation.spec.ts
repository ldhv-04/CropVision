import { test, expect, request as playwrightRequest, Page } from '@playwright/test';
import { randomUUID } from 'crypto';
import path from 'path';

const dotenv = require('../../backend/node_modules/dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '../backend/.env') });
const express = require('../../backend/node_modules/express');
const cors = require('../../backend/node_modules/cors');
const pool = require('../../backend/src/config/db');
const authRoutes = require('../../backend/src/routes/authRoutes');
const mobileRoutes = require('../../backend/src/routes/mobileRoutes');

const API_BASE = process.env.E2E_API_BASE || 'http://127.0.0.1:3000';
const FARMER_EMAIL = process.env.TEST_FARMER_EMAIL || 'farmer@cropvision.local';
const FARMER_PASS = process.env.TEST_FARMER_PASS || 'Password@123';
const RUN_ID = Date.now();
const MARKER = `__phase03_ui_${RUN_ID}`;
const BOUNDARY = {
  type: 'Polygon',
  coordinates: [[[106.6, 10.8], [106.61, 10.8], [106.61, 10.81], [106.6, 10.8]]],
};

type AuthState = {
  user: { id: string };
  token: string;
};

type TargetZone = {
  fieldId: string | number;
  zoneId: string | number;
  publicationVersion: number;
};

let authState: AuthState;
let targetZone: TargetZone;
let localBackendServer;
const fixtureFieldIds: Array<string> = [];
const fixtureZoneIds: Array<number> = [];
const fixtureMapIds: Array<number> = [];

async function startLocalBackend() {
  const { hostname, port } = new URL(API_BASE);
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ success: true, service: 'phase03-e2e-backend', port }));
  app.use('/api/auth', authRoutes);
  app.use('/api/mobile', mobileRoutes);

  await new Promise((resolve, reject) => {
    localBackendServer = app.listen(Number(port), hostname, resolve);
    localBackendServer.on('error', reject);
  });
}

async function stopLocalBackend() {
  if (!localBackendServer) return;
  localBackendServer.closeIdleConnections?.();
  localBackendServer.closeAllConnections?.();
  await Promise.race([
    new Promise((resolve, reject) => {
      localBackendServer.close((error) => (error ? reject(error) : resolve(undefined)));
    }),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ]);
  localBackendServer = null;
}

async function createPublishedMobileFixture(ownerUserId: string): Promise<TargetZone> {
  const fieldId = randomUUID();
  const fieldName = `${MARKER}_field`;

  await pool.query(`
    INSERT INTO fields (
      id, user_id, owner_user_id, name, crop_type, latitude, longitude,
      boundary, zones_published_at, zone_map_version, created_at, updated_at
    )
    VALUES ($1, $2, $2, $3, 'Rice', 10.8, 106.6, $4::jsonb, NOW(), 1, NOW(), NOW())
  `, [fieldId, ownerUserId, fieldName, JSON.stringify(BOUNDARY)]);
  fixtureFieldIds.push(fieldId);

  const zoneResult = await pool.query(`
    INSERT INTO sub_zones (field_id, crop_type, boundary, status, code, name, area, zone_status)
    VALUES ($1, 'Rice', $2::jsonb, 'HEALTHY', 'P3', 'Phase 03 UI Zone', 1.25, 'published')
    RETURNING id
  `, [fieldId, JSON.stringify(BOUNDARY)]);
  const zoneId = zoneResult.rows[0].id;
  fixtureZoneIds.push(zoneId);

  const mapResult = await pool.query(`
    INSERT INTO field_zone_maps (
      field_id, version, status, published_at, published_by,
      zones_data, boundary_data, zones_count
    )
    VALUES ($1, 1, 'published', NOW(), $2, $3::jsonb, $4::jsonb, 1)
    RETURNING id
  `, [
    fieldId,
    ownerUserId,
    JSON.stringify([{
      id: zoneId,
      code: 'P3',
      name: 'Phase 03 UI Zone',
      area: 1.25,
      boundary: BOUNDARY,
    }]),
    JSON.stringify(BOUNDARY),
  ]);
  fixtureMapIds.push(mapResult.rows[0].id);

  return {
    fieldId,
    zoneId,
    publicationVersion: 1,
  };
}

async function publishNewVersion(fieldId: string | number, ownerUserId: string, zoneId: string | number, version: number) {
  await pool.query(
    `UPDATE field_zone_maps SET status = 'archived', updated_at = NOW() WHERE field_id = $1 AND status = 'published'`,
    [fieldId]
  );
  const mapResult = await pool.query(`
    INSERT INTO field_zone_maps (
      field_id, version, status, published_at, published_by,
      zones_data, boundary_data, zones_count
    )
    VALUES ($1, $2, 'published', NOW(), $3, $4::jsonb, $5::jsonb, 1)
    RETURNING id
  `, [
    fieldId,
    version,
    ownerUserId,
    JSON.stringify([{
      id: zoneId,
      code: 'P3',
      name: 'Phase 03 UI Zone',
      area: 1.25,
      boundary: BOUNDARY,
    }]),
    JSON.stringify(BOUNDARY),
  ]);
  fixtureMapIds.push(mapResult.rows[0].id);
}

async function cleanupFixture() {
  if (fixtureFieldIds.length > 0) {
    await pool.query('DELETE FROM zone_cultivation_logs WHERE field_id = ANY($1::uuid[])', [fixtureFieldIds]);
    await pool.query('DELETE FROM zone_cultivation_profiles WHERE field_id = ANY($1::uuid[])', [fixtureFieldIds]);
    await pool.query('DELETE FROM field_zone_maps WHERE field_id = ANY($1::uuid[])', [fixtureFieldIds]);
    await pool.query('DELETE FROM sub_zones WHERE field_id = ANY($1::uuid[])', [fixtureFieldIds]);
    await pool.query('DELETE FROM fields WHERE id = ANY($1::uuid[])', [fixtureFieldIds]);
  }
}

async function loginViaUI(page: Page) {
  await page.goto('/login');
  await page.locator('#login-email').click();
  await page.locator('#login-email').pressSequentially(FARMER_EMAIL);
  await page.locator('#login-password').click();
  await page.locator('#login-password').pressSequentially(FARMER_PASS);
  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20000 });
}

async function clearAndType(page: Page, testId: string, value: string) {
  const input = page.getByTestId(testId);
  await input.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  if (value) await input.pressSequentially(value);
}

test.beforeAll(async () => {
  await startLocalBackend();
  const api = await playwrightRequest.newContext({ baseURL: API_BASE });

  const loginRes = await api.post('/api/auth/login', {
    data: { email: FARMER_EMAIL, password: FARMER_PASS },
  });
  expect(loginRes.ok(), `Farmer login failed with ${loginRes.status()}`).toBeTruthy();

  const loginData = await loginRes.json();
  authState = {
    user: loginData.data.user,
    token: loginData.data.token,
  };

  targetZone = await createPublishedMobileFixture(loginData.data.user.id);

  const fieldsRes = await api.get('/api/mobile/fields', {
    headers: { Authorization: `Bearer ${authState.token}` },
  });
  expect(fieldsRes.ok(), `Mobile field list failed with ${fieldsRes.status()}`).toBeTruthy();

  const fieldsData = await fieldsRes.json();
  const field = fieldsData.fields?.find((candidate: { id: string | number }) => candidate.id === targetZone.fieldId);
  expect(field, 'Fixture prerequisite failed: disposable published mobile field was not returned.').toBeTruthy();

  const mapRes = await api.get(`/api/mobile/fields/${targetZone.fieldId}/zone-map`, {
    headers: { Authorization: `Bearer ${authState.token}` },
  });
  expect(mapRes.ok(), `Published zone map failed with ${mapRes.status()}`).toBeTruthy();

  const mapData = await mapRes.json();
  const zone = mapData.map?.zones?.find((candidate: { id: string | number }) => candidate.id === targetZone.zoneId);
  expect(zone, 'Fixture prerequisite failed: disposable published zone was not returned.').toBeTruthy();
  expect(mapData.map.version).toBe(targetZone.publicationVersion);

  await api.dispose();
});

test.afterAll(async () => {
  await cleanupFixture();
  await stopLocalBackend();
  await Promise.race([
    pool.end(),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ]);
});

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginViaUI(page);
});

test('opens cultivation from selected zone and covers profile/log/conflict/error states', async ({ page }) => {
  const createdLogIds: Array<string | number> = [];

  page.on('response', async (response) => {
    if (
      response.request().method() === 'POST'
      && response.url().includes(`/api/mobile/fields/${targetZone.fieldId}/zones/${targetZone.zoneId}/cultivation/logs`)
    ) {
      const body = await response.json().catch(() => null);
      const id = body?.data?.log?.id;
      if (id) createdLogIds.push(id);
    }
  });

  await page.goto(`/(agrivision)/field-detail/${targetZone.fieldId}`);
  await expect(page.getByTestId('mobile-field-detail-screen')).toBeVisible({ timeout: 20000 });

  const zoneRow = page.getByTestId(`mobile-zone-row-${targetZone.zoneId}`);
  await expect(zoneRow).toBeVisible({ timeout: 15000 });
  await zoneRow.click();

  await expect(page.getByTestId('btn-zone-cultivation')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('btn-zone-cultivation').click();

  await expect(page).toHaveURL(new RegExp(`/field-detail/${targetZone.fieldId}/cultivation/${targetZone.zoneId}`), {
    timeout: 10000,
  });
  await expect(page.getByTestId('mobile-zone-cultivation-screen')).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(`Map v${targetZone.publicationVersion}`)).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('btn-save-cultivation-profile')).toBeVisible();
  await expect(page.getByTestId('btn-save-cultivation-log')).toBeVisible();

  await page.getByTestId('btn-save-cultivation-profile').click();
  await expect(page.getByText('Crop type is required.')).toBeVisible({ timeout: 5000 });

  await clearAndType(page, 'log-event-date-input', '2026-02-30');
  await page.getByTestId('btn-save-cultivation-log').click();
  await expect(page.getByText('Event date must use YYYY-MM-DD.')).toBeVisible({ timeout: 5000 });

  await clearAndType(page, 'log-event-date-input', '2026-06-03');
  await clearAndType(page, 'log-amount-input', '-1');
  await clearAndType(page, 'log-unit-input', 'l');
  await page.getByTestId('btn-save-cultivation-log').click();
  await expect(page.getByText('Amount must be a non-negative number.')).toBeVisible({ timeout: 5000 });

  await clearAndType(page, 'log-amount-input', '2');
  await clearAndType(page, 'log-unit-input', '');
  await page.getByTestId('btn-save-cultivation-log').click();
  await expect(page.getByText('Unit is required when amount is provided.')).toBeVisible({ timeout: 5000 });

  const title = `Phase03 temporary UI log ${Date.now()}`;
  await clearAndType(page, 'log-unit-input', 'l');
  await clearAndType(page, 'log-title-input', title);
  await clearAndType(page, 'log-note-input', 'Created by Phase 03 focused Playwright validation.');

  const createResponse = page.waitForResponse((response) => (
    response.request().method() === 'POST'
    && response.url().includes(`/api/mobile/fields/${targetZone.fieldId}/zones/${targetZone.zoneId}/cultivation/logs`)
  ), { timeout: 30000 });
  await page.getByTestId('btn-save-cultivation-log').scrollIntoViewIfNeeded();
  await page.getByTestId('btn-save-cultivation-log').click();
  await expect((await createResponse).ok()).toBeTruthy();
  await expect(page.getByText(title)).toBeVisible({ timeout: 10000 });
  expect(createdLogIds.length).toBeGreaterThan(0);
  const createdLogId = createdLogIds[0];

  await page.getByTestId(`btn-edit-cultivation-log-${createdLogId}`).click();
  await expect(page.getByText('Edit log')).toBeVisible({ timeout: 5000 });
  const editedTitle = `${title} edited`;
  await page.getByTestId('log-title-input').click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.getByTestId('log-title-input').pressSequentially(editedTitle);
  const patchResponse = page.waitForResponse((response) => (
    response.request().method() === 'PATCH'
    && response.url().includes(`/api/mobile/fields/${targetZone.fieldId}/zones/${targetZone.zoneId}/cultivation/logs/${createdLogId}`)
  ), { timeout: 30000 });
  await page.getByTestId('btn-save-cultivation-log').click();
  await expect((await patchResponse).ok()).toBeTruthy();
  await expect(page.getByText(editedTitle)).toBeVisible({ timeout: 10000 });

  await page.getByTestId(`btn-delete-cultivation-log-${createdLogId}`).click();
  await expect(page.getByTestId('delete-cultivation-log-confirmation')).toBeVisible({ timeout: 5000 });
  const deleteResponse = page.waitForResponse((response) => (
    response.request().method() === 'DELETE'
    && response.url().includes(`/api/mobile/fields/${targetZone.fieldId}/zones/${targetZone.zoneId}/cultivation/logs/${createdLogId}`)
  ), { timeout: 30000 });
  await page.getByTestId('btn-confirm-delete-cultivation-log').click();
  await expect((await deleteResponse).ok()).toBeTruthy();
  await expect(page.getByText(editedTitle)).not.toBeVisible({ timeout: 10000 });

  await clearAndType(page, 'profile-crop-type-input', 'Rice');
  const profileCreateResponse = page.waitForResponse((response) => (
    response.request().method() === 'PUT'
    && response.url().includes(`/api/mobile/fields/${targetZone.fieldId}/zones/${targetZone.zoneId}/cultivation/profile`)
  ), { timeout: 30000 });
  await page.getByTestId('btn-save-cultivation-profile').click();
  await expect((await profileCreateResponse).ok()).toBeTruthy();
  await expect(page.getByText('Edit visible crop setup')).toBeVisible({ timeout: 10000 });

  await clearAndType(page, 'profile-crop-type-input', 'Rice updated');
  const profileUpdateResponse = page.waitForResponse((response) => (
    response.request().method() === 'PUT'
    && response.url().includes(`/api/mobile/fields/${targetZone.fieldId}/zones/${targetZone.zoneId}/cultivation/profile`)
  ), { timeout: 30000 });
  await page.getByTestId('btn-save-cultivation-profile').click();
  await expect((await profileUpdateResponse).ok()).toBeTruthy();

  await publishNewVersion(targetZone.fieldId, authState.user.id, targetZone.zoneId, 2);
  await clearAndType(page, 'profile-crop-type-input', 'Rice stale');
  const conflictResponse = page.waitForResponse((response) => (
    response.request().method() === 'PUT'
    && response.url().includes(`/api/mobile/fields/${targetZone.fieldId}/zones/${targetZone.zoneId}/cultivation/profile`)
  ), { timeout: 30000 });
  await page.getByTestId('btn-save-cultivation-profile').click();
  expect((await conflictResponse).status()).toBe(409);
  await expect(page.getByText('Map changed', { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Reload latest map')).toBeVisible({ timeout: 5000 });

  await page.goto(`/(agrivision)/field-detail/${targetZone.fieldId}/cultivation/99999999`);
  await expect(page.getByText('Zone not found.')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('btn-retry-cultivation')).toBeVisible({ timeout: 5000 });
});
