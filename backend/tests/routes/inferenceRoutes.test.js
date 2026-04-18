const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');

// Setup mock app
const app = express();
app.use(express.json());

// Set env variable early so middleware works
process.env.JWT_SECRET = 'test_secret_key_12345';

// Mock inferenceService so we don't do real requests
const inferenceService = require('../../src/services/inferenceService');
const inferenceModel = require('../../src/models/inferenceModel');
jest.mock('../../src/services/inferenceService');
jest.mock('../../src/models/inferenceModel');

const inferenceRoutes = require('../../src/routes/inferenceRoutes');
app.use('/api/inference', inferenceRoutes);

describe('Inference Routes', () => {
    let validToken;

    beforeAll(() => {
        // Generate valid token for authMiddleware
        validToken = jwt.sign({ userId: 1, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/inference/analyze', () => {
        it('should require authentication', async () => {
            const response = await request(app).post('/api/inference/analyze');
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Thiếu token xác thực.');
        });

        it('should block file uploads without image field', async () => {
            const response = await request(app)
                .post('/api/inference/analyze')
                .set('Authorization', `Bearer ${validToken}`);
            
            // Expected to hit controller logic expecting req.file
            expect(response.status).toBe(400); 
            expect(response.body.message).toBe('Vui long tai len mot buc anh.');
        });

        it('should reject invalid MIME types', async () => {
            // Because multer fileFilter is active
            const response = await request(app)
                .post('/api/inference/analyze')
                .set('Authorization', `Bearer ${validToken}`)
                .attach('image', Buffer.from('hello text'), 'hello.txt'); 
                
            expect(response.status).toBe(415);
            expect(response.body.message).toContain('Dinh dang anh khong ho tro');
        });

        it('should reject large files that transcend multer limits', async () => {
            // Mocking a file larger than 10MB
            const largeBuffer = Buffer.alloc(11 * 1024 * 1024, '0');
            const response = await request(app)
                .post('/api/inference/analyze')
                .set('Authorization', `Bearer ${validToken}`)
                .attach('image', largeBuffer, 'large.jpg'); 
            
            // Express error handler typically returns 415 or 500 when limit is exceeded based on middleware
            expect(response.status).toBeGreaterThanOrEqual(400); 
        });

        it('should process a valid image successfully', async () => {
            // Mock successful service calls
            inferenceService.callAiCore.mockResolvedValue({ success: true, dummy: "data" });
            inferenceService.persistUpload.mockResolvedValue({ imageUrl: '/uploads/abc.jpg' });
            inferenceService.saveResult.mockResolvedValue(10);

            // Small valid buffer mimicking an image
            const validBuffer = Buffer.from('ffd8ffe0', 'hex');

            const response = await request(app)
                .post('/api/inference/analyze')
                .set('Authorization', `Bearer ${validToken}`)
                .attach('image', validBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Phan tich va luu tru thanh cong');
            
            expect(inferenceService.callAiCore).toHaveBeenCalled();
            expect(inferenceService.persistUpload).toHaveBeenCalled();
            expect(inferenceService.saveResult).toHaveBeenCalled();
        });
    });

    describe('GET /api/inference/samples', () => {
        it('should fetch samples for user', async () => {
            inferenceModel.getSamplesHistory.mockResolvedValue([ { id: 1, file_name: 'test.jpg' } ]);

            const response = await request(app)
                .get('/api/inference/samples')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(inferenceModel.getSamplesHistory).toHaveBeenCalledWith({ userId: 1, role: 'user' });
        });
    });
});
