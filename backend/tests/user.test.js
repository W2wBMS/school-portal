const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const User = require('../src/models/User');

test('User password hashes during save without a next callback', async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/student-portal-test');
  await mongoose.connection.db.dropDatabase().catch(() => {});

  const user = new User({
    fullName: 'Test User',
    email: 'test.user@example.com',
    password: 'StrongPass123',
    role: 'student',
  });

  await user.save();

  assert.notEqual(user.password, 'StrongPass123');
  assert.ok(user.password.length > 20);

  await User.deleteMany({});
  await mongoose.disconnect();
});
