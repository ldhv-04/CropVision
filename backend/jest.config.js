module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/task1-mobile-bridge.test.js',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'src/config/db.js',
    'src/utils/',
  ]
};
