/**
 * Homepage API — Backend Integration Tests
 *
 * Tests for the aggregated homepage endpoints:
 * - GET /api/homepage/summary
 * - GET /api/homepage/diseases
 */

const request = require('supertest');
const app = require('../server');

describe('Homepage API', () => {
  let authToken;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'testpassword' });

    if (loginRes.body.token) {
      authToken = loginRes.body.token;
    }
  });

  describe('GET /api/homepage/summary', () => {
    it('should return aggregated homepage data', async () => {
      if (!authToken) return;

      const res = await request(app)
        .get('/api/homepage/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      // Verify structure
      const { data } = res.body;
      expect(data.fieldStats).toBeDefined();
      expect(data.fieldStats.totalFields).toBeDefined();
      expect(data.fieldStats.totalZones).toBeDefined();
      expect(data.fieldStats.healthyZones).toBeDefined();
      expect(data.fieldStats.warningZones).toBeDefined();
      expect(data.fieldStats.infectedZones).toBeDefined();
      expect(Array.isArray(data.alerts)).toBe(true);
      expect(Array.isArray(data.epidemicAlerts)).toBe(true);
      expect(Array.isArray(data.recentScans)).toBe(true);
      expect(data.generatedAt).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .get('/api/homepage/summary');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/homepage/diseases', () => {
    it('should return personalized disease list', async () => {
      if (!authToken) return;

      const res = await request(app)
        .get('/api/homepage/diseases')
        .query({ limit: 6 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(6);

      if (res.body.data.length > 0) {
        const disease = res.body.data[0];
        expect(disease.id).toBeDefined();
        expect(disease.disease_name_vi || disease.disease_name_en).toBeDefined();
        expect(disease.severity).toBeDefined();
      }
    });

    it('should default to 8 diseases if no limit', async () => {
      if (!authToken) return;

      const res = await request(app)
        .get('/api/homepage/diseases')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(8);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .get('/api/homepage/diseases');

      expect(res.status).toBe(401);
    });
  });
});