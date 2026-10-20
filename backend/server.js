const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const inferenceRoutes = require('./src/routes/inferenceRoutes');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const weatherRoutes = require('./src/routes/weatherRoutes');
const fieldRoutes = require('./src/routes/fieldRoutes');
const diseaseRoutes = require('./src/routes/diseaseRoutes');
const alertRoutes = require('./src/routes/alertRoutes');
// [NEW] Geo-Spatial Mapping & Epidemiological Dispersion module routes
const { topLevelRouter: subZoneTopRouter } = require('./src/routes/subZoneRoutes');
const epidemicRoutes = require('./src/routes/epidemicRoutes');
const homepageRoutes = require('./src/routes/homepageRoutes');
const { ensureFixedAdminAccount } = require('./src/services/adminService');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, service: 'backend', port });
});

// Gan router cho API inference, auth va chat.
app.use('/api', inferenceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/alerts', alertRoutes);
// [NEW] Geo-Spatial & Epidemic module endpoints
app.use('/api/subzones', subZoneTopRouter);       // /api/subzones/:id, /api/subzones/:id/metrics
app.use('/api/epidemic', epidemicRoutes);          // /api/epidemic/report, /api/epidemic/alerts
app.use('/api/homepage', homepageRoutes);          // /api/homepage/summary, /api/homepage/diseases

// Khoi dong server sau khi dam bao tai khoan admin co dinh da duoc tao trong DB.
const startServer = async () => {
  try {
    const adminUser = await ensureFixedAdminAccount();

    const server = app.listen(port, () => {
      console.log(`[Node.js] May chu Tiep tan dang chay tai http://localhost:${port}`);
      console.log(`[Auth] Admin san sang: ${adminUser.email} / ${adminUser.plainPassword}`);
    });

    // 12-Factor Factor IX: Graceful Disposability
    if (process.env.NODE_ENV !== 'test') {
      const pool = require('./src/config/db');
      const shutdown = async (signal) => {
        console.log(`[Server] Nhan tin hieu ${signal}, dang tat tien trinh an toan...`);
        server.close(async () => {
          try {
            await pool.end();
            console.log('[Server] Da dong ket noi CSDL va HTTP server sach se.');
            process.exit(0);
          } catch (err) {
            console.error('[Server] Loi khi dong pool:', err.message);
            process.exit(1);
          }
        });
        setTimeout(() => {
          console.error('[Server] Dong tien trinh cuong buc do timeout 10s.');
          process.exit(1);
        }, 10000).unref();
      };

      process.once('SIGTERM', () => shutdown('SIGTERM'));
      process.once('SIGINT', () => shutdown('SIGINT'));
    }

    return server;
  } catch (error) {
    console.error('[Server] Khong the khoi tao tai khoan admin:', error.message);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.app = app;
module.exports.startServer = startServer;
