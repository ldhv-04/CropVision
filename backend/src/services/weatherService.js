const axios = require('axios');
const pool = require('../config/db');

class WeatherService {
  /**
   * Fetches weather data for a given lat/lon.
   * Checks the weather_cache table first to avoid hitting API limits.
   * Cache expires after 30 minutes.
   */
  async getWeatherData(lat, lon) {
    const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
    const roundedLat = parseFloat(lat).toFixed(2);
    const roundedLon = parseFloat(lon).toFixed(2);

    // 1. Check Cache
    const cacheQuery = `
      SELECT weather_data, cached_at 
      FROM weather_cache 
      WHERE latitude = $1 AND longitude = $2
    `;
    const cacheResult = await pool.query(cacheQuery, [roundedLat, roundedLon]);

    if (cacheResult.rows.length > 0) {
      const { weather_data, cached_at } = cacheResult.rows[0];
      const ageMs = Date.now() - new Date(cached_at).getTime();
      
      if (ageMs < CACHE_EXPIRY_MS) {
        return weather_data;
      }
    }

    // 2. Fetch from API if not cached or expired
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      // Fallback mock data if key is missing (for local testing without key)
      console.warn("OPENWEATHERMAP_API_KEY not found. Using mock weather data.");
      return this._getMockWeatherData();
    }

    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          lat: roundedLat,
          lon: roundedLon,
          appid: apiKey,
          units: 'metric',
          lang: 'vi'
        }
      });
      
      const weatherData = {
        temp: response.data.main.temp,
        humidity: response.data.main.humidity,
        description: response.data.weather[0].description,
        wind_speed: response.data.wind.speed,
        rain_1h: response.data.rain ? response.data.rain['1h'] : 0
      };

      // 3. Update Cache
      const upsertQuery = `
        INSERT INTO weather_cache (latitude, longitude, weather_data, cached_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (latitude, longitude) 
        DO UPDATE SET weather_data = EXCLUDED.weather_data, cached_at = CURRENT_TIMESTAMP
      `;
      await pool.query(upsertQuery, [roundedLat, roundedLon, weatherData]);

      return weatherData;
    } catch (error) {
      console.error('Error fetching weather API:', error.message);
      // Fallback to cache if API fails (even if expired)
      if (cacheResult.rows.length > 0) {
          return cacheResult.rows[0].weather_data;
      }
      return this._getMockWeatherData();
    }
  }

  _getMockWeatherData() {
    return {
      temp: 28.5,
      humidity: 85,
      description: 'mưa rào nhẹ',
      wind_speed: 3.5,
      rain_1h: 2.5
    };
  }
}

module.exports = new WeatherService();
