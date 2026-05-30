/**
 * MockMetricService — Real-Time Telemetry Simulation Engine
 *
 * Provides mathematically stable telemetry simulation loops using sinusoidal
 * time functions to replace missing hardware sensor inputs during verification phases.
 *
 * The diurnal temperature model peaks at 13:00 and troughs at 01:00, mimicking
 * real-world solar heating cycles in tropical agricultural zones.
 *
 * Three status profiles (HEALTHY, WARNING, INFECTED) produce distinctly different
 * metric ranges to allow downstream UI and alert systems to react accordingly.
 */

// ── Public API ──────────────────────────────────────────────

/**
 * Generates localized cyclic environmental telemetry mock data based on zone health status.
 *
 * Temperature and humidity use a sinusoidal diurnal model:
 *   temp = 30 + 5 * sin((hour - 7) * PI / 12)   → peaks ~35°C at 13:00, troughs ~25°C at 01:00
 *   humidity = 70 - 15 * sin((hour - 7) * PI / 12) → inversely correlated with temperature
 *
 * @param {'HEALTHY'|'WARNING'|'INFECTED'} status - Current zone health status
 * @returns {Object} LiveMetric with healthScore, temperature, humidity, soilMoisture, pH, ec
 */
const generateMetrics = (status) => {
  const currentHour = new Date().getHours();

  // Diurnal temperature model: sinusoidal curve peaking at 13:00
  // (hour - 7) shifts the sine wave so that peak occurs at hour 13
  const computedTemp = 30 + 5 * Math.sin(((currentHour - 7) * Math.PI) / 12);
  const computedHumidity = 70 - 15 * Math.sin(((currentHour - 7) * Math.PI) / 12);

  // Add small random jitter to simulate sensor noise
  const jitter = (range) => (Math.random() - 0.5) * range;

  switch (status) {
    case 'INFECTED':
      return {
        healthScore: Math.floor(Math.random() * 20) + 10,    // 10 - 30
        temperature: computedTemp + jitter(1),
        humidity: computedHumidity + jitter(1),
        soilMoisture: Math.floor(Math.random() * 15) + 30,   // 30 - 45 (dry)
        pH: 5.5 + Math.random() * 0.5,                       // 5.5 - 6.0 (acidic)
        ec: 0.8 + Math.random() * 0.4,                       // 0.8 - 1.2 dS/m (low)
      };

    case 'WARNING':
      return {
        healthScore: Math.floor(Math.random() * 20) + 50,    // 50 - 70
        temperature: computedTemp + jitter(0.5),
        humidity: computedHumidity + jitter(0.5),
        soilMoisture: Math.floor(Math.random() * 10) + 45,   // 45 - 55
        pH: 6.0 + Math.random() * 0.3,                       // 6.0 - 6.3
        ec: 1.1 + Math.random() * 0.3,                       // 1.1 - 1.4 dS/m
      };

    case 'HEALTHY':
    default:
      return {
        healthScore: Math.floor(Math.random() * 15) + 85,    // 85 - 100
        temperature: computedTemp + jitter(0.3),
        humidity: computedHumidity + jitter(0.3),
        soilMoisture: Math.floor(Math.random() * 10) + 65,   // 65 - 75 (well-watered)
        pH: 6.5 + jitter(0.2),                               // ~6.3 - 6.7 (optimal)
        ec: 1.5 + jitter(0.2),                               // ~1.4 - 1.6 dS/m (good)
      };
  }
};

/**
 * Simulates regional weather station telemetry reports.
 *
 * In a production environment this would read from an IoT gateway or
 * external weather API. For verification, it returns deterministic values
 * so that epidemic cone calculations are reproducible.
 *
 * @returns {Object} Weather data with windDirection, windSpeed, ambientTemp
 */
const getStationWeatherMock = () => ({
  windDirection: 'SE',   // Fixed Southeast wind vector for deterministic target validation
  windSpeed: 5.4,        // meters per second
  ambientTemp: 29.5,     // degrees Celsius
});

module.exports = {
  generateMetrics,
  getStationWeatherMock,
};