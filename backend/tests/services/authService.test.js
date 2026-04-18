process.env.JWT_SECRET = 'test_secret';

const authService = require('../../src/services/authService');
const userModel = require('../../src/models/userModel');
const mailService = require('../../src/utils/mailService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../../src/models/userModel');
jest.mock('../../src/utils/mailService');

describe('Auth Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('registerUser', () => {
        it('should successfully register a user and send an OTP', async () => {
            userModel.getUserByEmail.mockResolvedValue(null);
            userModel.ensureUserRoleColumn.mockResolvedValue();
            userModel.createUser.mockResolvedValue();
            mailService.sendOTP.mockResolvedValue(true);

            await authService.registerUser('Test User', 'test@gmail.com', 'Password@123');

            expect(userModel.getUserByEmail).toHaveBeenCalledWith('test@gmail.com');
            expect(userModel.ensureUserRoleColumn).toHaveBeenCalled();
            expect(userModel.createUser).toHaveBeenCalledWith(
                'Test User',
                'test@gmail.com',
                expect.any(String), // passwordHash
                expect.any(String), // otpCode
                expect.any(Date)    // otpExpiresAt
            );
            expect(mailService.sendOTP).toHaveBeenCalledWith('test@gmail.com', expect.any(String));
        });

        it('should throw an error if email already exists', async () => {
            userModel.getUserByEmail.mockResolvedValue({ id: 1, is_verified: true });

            await expect(
                authService.registerUser('test@gmail.com', 'Test User', 'Password@123')
            ).rejects.toThrow('Email này đã được đăng ký.');
        });
    });

    describe('verifyUserOtp', () => {
        it('should successfully verify user with correct OTP', async () => {
            const mockUser = {
                id: 1, 
                otp_code: '123456', 
                otp_expires_at: new Date(Date.now() + 100000).toISOString()
            };
            userModel.getUserByEmail.mockResolvedValue(mockUser);
            userModel.verifyUserAccount.mockResolvedValue();

            await authService.verifyUserOtp('test@gmail.com', '123456');

            expect(userModel.verifyUserAccount).toHaveBeenCalledWith('test@gmail.com');
        });

        it('should throw email not found error', async () => {
            userModel.getUserByEmail.mockResolvedValue(null);

            await expect(
                authService.verifyUserOtp('test@gmail.com', '123456')
            ).rejects.toThrow('Không tìm thấy tài khoản.');
        });

        it('should throw incorrect OTP error', async () => {
            const mockUser = {
                id: 1, 
                otp_code: '654321', 
                otp_expires_at: new Date(Date.now() + 100000).toISOString()
            };
            userModel.getUserByEmail.mockResolvedValue(mockUser);

            await expect(
                authService.verifyUserOtp('test@gmail.com', '123456')
            ).rejects.toThrow('Mã xác thực không chính xác.');
        });

        it('should throw expired OTP error', async () => {
            const mockUser = {
                id: 1, 
                otp_code: '123456', 
                otp_expires_at: new Date(Date.now() - 100000).toISOString() // Past
            };
            userModel.getUserByEmail.mockResolvedValue(mockUser);

            await expect(
                authService.verifyUserOtp('test@gmail.com', '123456')
            ).rejects.toThrow('Mã xác thực đã hết hạn.');
        });
    });

    describe('loginUser', () => {
        it('should successfully login and return token', async () => {
            const mockUser = {
                id: 1,
                email: 'test@gmail.com',
                password_hash: await bcrypt.hash('Password@123', 10),
                is_verified: true,
                role: 'user'
            };
            userModel.getUserByEmail.mockResolvedValue(mockUser);

            const result = await authService.loginUser('test@gmail.com', 'Password@123');

            expect(result.token).toBeDefined();
            expect(result.user.email).toBe('test@gmail.com');
            expect(result.user.role).toBe('user');
        });

        it('should reject unverified users', async () => {
            const mockUser = {
                id: 1,
                email: 'test@gmail.com',
                password_hash: await bcrypt.hash('Password@123', 10),
                is_verified: false
            };
            userModel.getUserByEmail.mockResolvedValue(mockUser);

            await expect(
                authService.loginUser('test@gmail.com', 'Password@123')
            ).rejects.toThrow('Vui lòng xác thực email trước khi đăng nhập.');
        });

        it('should reject incorrect password', async () => {
            const mockUser = {
                id: 1,
                email: 'test@gmail.com',
                password_hash: await bcrypt.hash('Password@123', 10),
                is_verified: true
            };
            userModel.getUserByEmail.mockResolvedValue(mockUser);

            await expect(
                authService.loginUser('test@gmail.com', 'WrongPass')
            ).rejects.toThrow('Email hoặc mật khẩu không đúng.');
        });
    });
});
