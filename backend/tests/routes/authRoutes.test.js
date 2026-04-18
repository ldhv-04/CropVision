const request = require('supertest');
const express = require('express');

// Setup mock app
const app = express();
app.use(express.json());

const authService = require('../../src/services/authService');
jest.mock('../../src/services/authService');

const authRoutes = require('../../src/routes/authRoutes');
app.use('/api/auth', authRoutes);

describe('Auth Routes & Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('should return 200 on success', async () => {
            authService.registerUser.mockResolvedValue();

            const response = await request(app)
                .post('/api/auth/register')
                .send({ fullName: 'John', email: 'john@gmail.com', password: 'Password123' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(authService.registerUser).toHaveBeenCalledWith('John', 'john@gmail.com', 'Password123');
        });

        it('should return error status from service', async () => {
            const err = new Error('Email exists');
            err.status = 400;
            authService.registerUser.mockRejectedValue(err);

            const response = await request(app)
                .post('/api/auth/register')
                .send({ fullName: 'John', email: 'john@gmail.com', password: 'Password123' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Email exists');
        });
    });

    describe('POST /api/auth/verify', () => {
        it('should verify OTP and return 200', async () => {
            authService.verifyUserOtp.mockResolvedValue();

            const response = await request(app)
                .post('/api/auth/verify')
                .send({ email: 'john@gmail.com', otpCode: '123456' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Xác thực tài khoản thành công.');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login and return 200 with token', async () => {
            authService.loginUser.mockResolvedValue({ token: 'abc', user: { id: 1, role: 'user' } });

            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'john@gmail.com', password: 'Password123' });

            expect(response.status).toBe(200);
            expect(response.body.data.token).toBe('abc');
        });
    });
});
