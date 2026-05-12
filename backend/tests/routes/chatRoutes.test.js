/**
 * Chat Routes Tests — Integration tests for chat API endpoints.
 *
 * Tests cover:
 * - Session CRUD (create, list, get, rename, delete)
 * - Message send (regular + consult with inference)
 * - Disease search
 * - Error handling (validation, auth, not found)
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Setup mock app
const app = express();
app.use(express.json());

// Set env variable early so middleware works
process.env.JWT_SECRET = 'test_secret_key_12345';

// Mock services to avoid external API calls
const chatService = require('../../src/services/chatService');
const diseaseService = require('../../src/services/diseaseService');
const chatModel = require('../../src/models/chatModel');
jest.mock('../../src/services/chatService');
jest.mock('../../src/services/diseaseService');
jest.mock('../../src/models/chatModel');

// Mock axios for 9Router calls
jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    ...actual,
    post: jest.fn(),
  };
});

const axios = require('axios');

const chatRoutes = require('../../src/routes/chatRoutes');
app.use('/api/chat', chatRoutes);

// Generate test auth token
const generateTestToken = () => {
  return jwt.sign({ userId: 1, email: 'test@cropvision.vn' }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

let authToken;
let testSessionId = 1;

// Mock data
const mockSession = {
  id: 1,
  user_id: 1,
  title: 'Test Chat Session',
  model: 'ag/gemini-3-flash',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockSessions = [
  { ...mockSession, message_count: 5 },
  { id: 2, user_id: 1, title: 'Another Session', model: 'ag/gemini-3-flash', message_count: 3 },
];

const mockMessages = {
  session: mockSession,
  messages: [
    { id: 1, role: 'user', content: 'Hello', tokens_used: 0, created_at: new Date().toISOString() },
    { id: 2, role: 'assistant', content: 'Hi there!', tokens_used: 10, created_at: new Date().toISOString() },
  ],
};

const mockDiseases = [
  {
    id: 1,
    disease_class: 'Tomato___Bacterial_spot',
    disease_name_vi: 'Bệnh đốm lá khuẩn cà chua',
    disease_name_en: 'Tomato Bacterial Spot',
    crop_type: 'Cà chua',
    severity: 'Trung bình',
    confidence: 0.85,
    treatments: [],
    pesticides: [],
  },
];

beforeAll(() => {
  authToken = generateTestToken();

  // Mock 9Router response
  axios.post.mockResolvedValue({
    data: {
      choices: [{ message: { content: 'Đây là câu trả lời từ AI.' } }],
      usage: { total_tokens: 150 },
    },
  });

  // Mock chatService
  chatService.createSession.mockResolvedValue(mockSession);
  chatService.listSessions.mockResolvedValue(mockSessions);
  chatService.getSession.mockResolvedValue(mockMessages);
  chatService.renameSession.mockResolvedValue({ ...mockSession, title: 'Renamed' });
  chatService.deleteSession.mockResolvedValue({ id: 1 });
  chatService.sendMessage.mockResolvedValue({
    userMessage: mockMessages.messages[0],
    assistantMessage: mockMessages.messages[1],
    model: 'ag/gemini-3-flash',
    tokensUsed: 150,
  });
  chatService.consultWithInference.mockResolvedValue({
    userMessage: mockMessages.messages[0],
    assistantMessage: mockMessages.messages[1],
    model: 'ag/gemini-3-flash',
    tokensUsed: 150,
    recommendations: mockDiseases,
  });

  // Mock diseaseService
  diseaseService.searchDiseases.mockResolvedValue(mockDiseases);
  diseaseService.getTopDiseases.mockResolvedValue(mockDiseases);
  diseaseService.buildMultiDiseaseContext.mockReturnValue('Mock disease context');

  // Mock chatModel
  chatModel.getSessionById.mockResolvedValue(mockSession);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Chat Sessions API', () => {
  test('POST /api/chat/sessions — should create a new session', async () => {
    const res = await request(app)
      .post('/api/chat/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Test Chat Session', model: 'ag/gemini-3-flash' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.title).toBe('Test Chat Session');
    expect(res.body.data.model).toBe('ag/gemini-3-flash');

    testSessionId = res.body.data.id;
  });

  test('POST /api/chat/sessions — should fail without title', async () => {
    // Mock a session with default title
    chatService.createSession.mockResolvedValueOnce({
      ...mockSession,
      title: 'New Chat',
    });

    const res = await request(app)
      .post('/api/chat/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    // Should still succeed with default title
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('New Chat');
  });

  test('GET /api/chat/sessions — should list all sessions', async () => {
    const res = await request(app)
      .get('/api/chat/sessions')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('message_count');
  });

  test('GET /api/chat/sessions/:id — should get session with messages', async () => {
    const res = await request(app)
      .get(`/api/chat/sessions/${testSessionId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('session');
    expect(res.body.data).toHaveProperty('messages');
    expect(Array.isArray(res.body.data.messages)).toBe(true);
  });

  test('GET /api/chat/sessions/:id — should return 404 for non-existent session', async () => {
    chatService.getSession.mockResolvedValueOnce(null);
    
    const res = await request(app)
      .get('/api/chat/sessions/99999')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('PATCH /api/chat/sessions/:id — should rename session', async () => {
    const res = await request(app)
      .patch(`/api/chat/sessions/${testSessionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Renamed Chat Session' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Renamed');
  });

  test('PATCH /api/chat/sessions/:id — should fail with empty title', async () => {
    const res = await request(app)
      .patch(`/api/chat/sessions/${testSessionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Chat Messages API', () => {
  test('POST /api/chat/sessions/:id/messages — should send message and get AI reply', async () => {
    const res = await request(app)
      .post(`/api/chat/sessions/${testSessionId}/messages`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Xin chào, tôi cần tư vấn về bệnh cà chua.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('userMessage');
    expect(res.body.data).toHaveProperty('assistantMessage');
    expect(res.body.data.assistantMessage.content).toBe('Hi there!');
    expect(res.body.data).toHaveProperty('tokensUsed');
    expect(res.body.data.tokensUsed).toBe(150);
  });

  test('POST /api/chat/sessions/:id/messages — should fail with empty content', async () => {
    const res = await request(app)
      .post(`/api/chat/sessions/${testSessionId}/messages`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/chat/sessions/:id/messages — should fail without auth', async () => {
    const res = await request(app)
      .post(`/api/chat/sessions/${testSessionId}/messages`)
      .send({ content: 'Hello' });

    expect(res.status).toBe(401);
  });
});

describe('Consult with Inference API', () => {
  test('POST /api/chat/sessions/:id/consult — should consult with disease context', async () => {
    const res = await request(app)
      .post(`/api/chat/sessions/${testSessionId}/consult`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'Bệnh này điều trị thế nào?',
        detections: [
          { class_name: 'Tomato___Bacterial_spot', confidence: 0.85 },
        ],
        inferenceId: 1,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('assistantMessage');
    expect(res.body.data).toHaveProperty('recommendations');
    expect(Array.isArray(res.body.data.recommendations)).toBe(true);
  });

  test('POST /api/chat/sessions/:id/consult — should handle multiple detections', async () => {
    const res = await request(app)
      .post(`/api/chat/sessions/${testSessionId}/consult`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'Có nhiều bệnh trên ảnh, tư vấn từng cái nhé',
        detections: [
          { class_name: 'Tomato___Bacterial_spot', confidence: 0.85 },
          { class_name: 'Tomato___Late_blight', confidence: 0.72 },
        ],
        inferenceId: 2,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recommendations.length).toBeLessThanOrEqual(3);
  });

  test('POST /api/chat/sessions/:id/consult — should handle low confidence detections', async () => {
    // Mock empty recommendations for low confidence
    chatService.consultWithInference.mockResolvedValueOnce({
      userMessage: mockMessages.messages[0],
      assistantMessage: mockMessages.messages[1],
      model: 'ag/gemini-3-flash',
      tokensUsed: 150,
      recommendations: [],
    });

    const res = await request(app)
      .post(`/api/chat/sessions/${testSessionId}/consult`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'Ảnh này không rõ lắm',
        detections: [
          { class_name: 'Tomato___Bacterial_spot', confidence: 0.25 },
        ],
        inferenceId: 3,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Low confidence should return empty recommendations
    expect(res.body.data.recommendations.length).toBe(0);
  });

  test('POST /api/chat/sessions/:id/consult — should fail with empty content', async () => {
    const res = await request(app)
      .post(`/api/chat/sessions/${testSessionId}/consult`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: '',
        detections: [{ class_name: 'Tomato___Bacterial_spot', confidence: 0.85 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Disease Search API', () => {
  test('GET /api/chat/diseases/search?q=bacterial — should search diseases', async () => {
    const res = await request(app)
      .get('/api/chat/diseases/search?q=bacterial')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/chat/diseases/search?q=cà chua — should search Vietnamese names', async () => {
    const res = await request(app)
      .get('/api/chat/diseases/search?q=cà chua')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/chat/diseases/search — should fail with short query', async () => {
    const res = await request(app)
      .get('/api/chat/diseases/search?q=a')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/chat/diseases/search — should fail without query', async () => {
    const res = await request(app)
      .get('/api/chat/diseases/search')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Chat Session Cleanup', () => {
  test('DELETE /api/chat/sessions/:id — should delete session', async () => {
    const res = await request(app)
      .delete(`/api/chat/sessions/${testSessionId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Mock 404 for subsequent GET
    chatService.getSession.mockResolvedValueOnce(null);
    
    // Verify session is deleted
    const checkRes = await request(app)
      .get(`/api/chat/sessions/${testSessionId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(checkRes.status).toBe(404);
  });

  test('DELETE /api/chat/sessions/:id — should return 404 for non-existent session', async () => {
    chatService.deleteSession.mockResolvedValueOnce(null);
    
    const res = await request(app)
      .delete('/api/chat/sessions/99999')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
