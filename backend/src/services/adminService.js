const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const adminModel = require('../models/adminModel');

const BACKEND_ROOT = path.join(__dirname, '../..');

const ADMIN_DEFAULTS = {
  fullName: process.env.ADMIN_FULL_NAME || 'CropVision Admin',
  email: process.env.ADMIN_EMAIL || 'admin@cropvision.local',
  password: process.env.ADMIN_PASSWORD || 'Admin@123',
};

// Khoi tao tai khoan admin co dinh trong database ngay khi server bat dau.
const ensureFixedAdminAccount = async () => {
  await userModel.ensureUserRoleColumn();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(ADMIN_DEFAULTS.password, salt);

  const adminUser = await userModel.upsertAdminUser(
    ADMIN_DEFAULTS.fullName,
    ADMIN_DEFAULTS.email,
    passwordHash
  );

  return {
    ...adminUser,
    plainPassword: ADMIN_DEFAULTS.password,
  };
};

// Xoa sample trong DB va xoa file anh vat ly neu ton tai.
const deleteSampleWithFile = async (sampleId) => {
  const deletedSample = await adminModel.deleteSampleById(sampleId);

  if (!deletedSample) {
    return null;
  }

  if (deletedSample.image_url && deletedSample.image_url.startsWith('/uploads/')) {
    const absoluteImagePath = path.join(BACKEND_ROOT, deletedSample.image_url.replace(/^\//, ''));
    try {
      await fs.promises.unlink(absoluteImagePath);
    } catch (_err) {
      // File da bi xoa truoc do hoac khong ton tai — bo qua loi.
    }
  }

  return deletedSample;
};

module.exports = {
  ensureFixedAdminAccount,
  deleteSampleWithFile,
};
