const weatherService = require('../services/weatherService');

const getWeather = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Missing lat or lon parameters' });
    }

    const weatherData = await weatherService.getWeatherData(lat, lon);
    res.json({ success: true, data: weatherData });
  } catch (error) {
    console.error('getWeather error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getWeather
};
