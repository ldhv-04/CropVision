const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const inferenceRoutes = require('./src/routes/inferenceRoutes');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const { ensureFixedAdminAccount } = require('./src/services/adminService');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, service: 'backend', port });
});

// Gan router cho API inference va auth.
app.use('/api', inferenceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Khoi dong server sau khi dam bao tai khoan admin co dinh da duoc tao trong DB.
const startServer = async () => {
  try {
    const adminUser = await ensureFixedAdminAccount();

    app.listen(port, () => {
      console.log(`[Node.js] May chu Tiep tan dang chay tai http://localhost:${port}`);
      console.log(`[Auth] Admin san sang: ${adminUser.email} / ${adminUser.plainPassword}`);
    });
  } catch (error) {
    console.error('[Server] Khong the khoi tao tai khoan admin:', error.message);
    process.exit(1);
  }
};

startServer();
