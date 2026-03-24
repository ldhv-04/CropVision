const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

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

module.exports = {
  ensureFixedAdminAccount,
};
