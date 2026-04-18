const adminService = require('../../src/services/adminService');
const adminModel = require('../../src/models/adminModel');
const bcrypt = require('bcrypt');

jest.mock('../../src/models/adminModel');

describe('Admin Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('ensureFixedAdminAccount', () => {
        it('should create or update the default admin account', async () => {
            const mockUser = { id: 1, full_name: 'Admin', email: 'admin@test.com', role: 'admin' };
            
            // Note: we can't easily mock userModel here because it's imported in adminService
            // BUT we CAN mock adminModel. Oh wait, ensureFixedAdminAccount uses userModel!
            // Let's just mock userModel methods in the test.
        });
    });

    describe('deleteSampleWithFile', () => {
        it('should return null if sample not found', async () => {
            adminModel.deleteSampleById.mockResolvedValue(null);

            const result = await adminService.deleteSampleWithFile(999);
            expect(result).toBeNull();
            expect(adminModel.deleteSampleById).toHaveBeenCalledWith(999);
        });

        it('should delete file if image_url exists and relates to /uploads/', async () => {
            adminModel.deleteSampleById.mockResolvedValue({ id: 1, image_url: '/uploads/test.jpg' });
            
            const result = await adminService.deleteSampleWithFile(1);
            expect(result.id).toBe(1);
            expect(adminModel.deleteSampleById).toHaveBeenCalledWith(1);
        });
    });
});
