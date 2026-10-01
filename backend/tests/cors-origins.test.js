const test = require('node:test');
const assert = require('node:assert/strict');
const { getAllowedOrigins } = require('../src/utils/corsOrigins');

test('production CORS includes configured frontend origins without local origins', () => {
  const origins = getAllowedOrigins({
    NODE_ENV: 'production',
    CORS_ORIGINS: 'https://portal.onrender.com/',
  });

  assert.deepEqual(origins, ['https://portal.onrender.com']);
});

test('development CORS includes local and configured frontend origins', () => {
  const origins = getAllowedOrigins({
    NODE_ENV: 'development',
    CORS_ORIGIN: 'https://portal.onrender.com',
    CORS_ORIGINS: 'http://localhost:3000, http://localhost:5173/',
  });

  assert.deepEqual(origins, [
    'https://portal.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
  ]);
});