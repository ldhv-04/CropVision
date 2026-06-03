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
// [NEW] Task 1: Station-to-Mobile bridge — mobile field/zone map APIs
const mobileRoutes = require('./src/routes/mobileRoutes');
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
// [NEW] Task 1: Station-to-Mobile bridge — mobile field & zone map APIs
// Mobile user fetches assigned fields and published polygon-only zone maps.
// No satellite tiles, no MapLibre, no draft zones exposed.
app.use('/api/mobile', mobileRoutes);              // /api/mobile/fields, /api/mobile/fields/:fieldId/zone-map

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

if (require.main === module) {
  // Khoi dong server sau khi dam bao tai khoan admin co dinh da duoc tao trong DB.
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
