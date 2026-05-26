const { loginUser } = require('../src/services/authService');
require('dotenv').config();

async function test() {
  try {
    console.log('Testing login service with farmer@cropvision.local...');
    const result = await loginUser('farmer@cropvision.local', 'Password@123');
    console.log('Login success! Session:', result);
  } catch (err) {
    console.error('Login failed! Error status:', err.status, 'Message:', err.message);
  }
}

test();
