/**
 * Quick smoke test — verify all new geo-epidemic modules load without errors.
 * Run: node test-load.js
 */

try {
  require('./src/services/geoService');
  console.log('[OK] geoService');

  require('./src/services/epidemicService');
  console.log('[OK] epidemicService');

  require('./src/services/mockMetricService');
  console.log('[OK] mockMetricService');

  require('./src/routes/subZoneRoutes');
  console.log('[OK] subZoneRoutes');

  require('./src/routes/epidemicRoutes');
  console.log('[OK] epidemicRoutes');

  console.log('\nAll modules loaded successfully.');
} catch (e) {
  console.error('[FAIL]', e.message);
  console.error(e.stack);
}