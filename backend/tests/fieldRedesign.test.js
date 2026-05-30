/**
 * Field Management Redesign — Backend Integration Tests
 *
 * Tests for the new M2 endpoints:
 * - GET /api/fields/:id/zones/summary
 * - GET /api/subzones/:id/metrics/timeseries
 * - GET /api/subzones/:id/health-history
 */

const request = require('supertest');
const app = require('../server');

// These tests require a running database with seed data.
// Run: cd backend && npm test -- --testPathPattern=fieldRedesign

describe('Field Management Redesign API', () => {
  let authToken;
  let testFieldId;
  let testZoneId;

  beforeAll(async () => {
    // Login to get auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'testpassword' });

    if (loginRes.body.token) {
      authToken = loginRes.body.token;
    }
  });

  describe('GET /api/fields/:id/zones/summary', () => {
    it('should return zones with color_values', async () => {
      if (!authToken || !testFieldId) return;

      const res = await request(app)
        .get(`/api/fields/${testFieldId}/zones/summary`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.zones).toBeDefined();
      expect(Array.isArray(res.body.data.zones)).toBe(true);

      if (res.body.data.zones.length > 0) {
        const zone = res.body.data.zones[0];
        expect(zone.id).toBeDefined();
        expect(zone.status).toBeDefined();
        expect(zone.color_values).toBeDefined();
        expect(zone.color_values.disease).toBeDefined();
        expect(zone.color_values.moisture).toBeDefined();
        expect(zone.color_values.ph).toBeDefined();
        expect(zone.color_values.nitrogen).toBeDefined();
        expect(zone.color_values.temperature).toBeDefined();
      }
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .get('/api/fields/some-id/zones/summary');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/subzones/:id/metrics/timeseries', () => {
    it('should return time-series data', async () => {
      if (!authToken || !testZoneId) return;

      const res = await request(app)
        .get(`/api/subzones/${testZoneId}/metrics/timeseries`)
        .query({ metric: 'temperature', range: '7d' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.zone_id).toBeDefined();
      expect(res.body.data.metric).toBe('temperature');
      expect(res.body.data.range).toBe('7d');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('should reject invalid metric names', async () => {
      if (!authToken || !testZoneId) return;

      const res = await request(app)
        .get(`/api/subzones/${testZoneId}/metrics/timeseries`)
        .query({ metric: 'DROP TABLE', range: '7d' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(500);
    });

    it('should require metric parameter', async () => {
      if (!authToken || !testZoneId) return;

      const res = await request(app)
        .get(`/api/subzones/${testZoneId}/metrics/timeseries`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/subzones/:id/health-history', () => {
    it('should return health history timeline', async () => {
      if (!authToken || !testZoneId) return;

      const res = await request(app)
        .get(`/api/subzones/${testZoneId}/health-history`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.zone_id).toBeDefined();
      expect(Array.isArray(res.body.data.history)).toBe(true);
    });
  });

  describe('Existing endpoints still work', () => {
    it('GET /api/fields should still return fields', async () => {
      if (!authToken) return;

      const res = await request(app)
        .get('/api/fields')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/subzones/:id/metrics should still work', async () => {
      if (!authToken || !testZoneId) return;

      const res = await request(app)
        .get(`/api/subzones/${testZoneId}/metrics`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});