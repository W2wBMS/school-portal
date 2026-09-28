const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const User = require('../src/models/User');
const StudentProfile = require('../src/models/StudentProfile');
const authRouter = require('../src/routes/auth');

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

test('User generates an 8-digit student index starting with 1029 when no ID is provided', async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/student-portal-test');
  await mongoose.connection.db.dropDatabase().catch(() => {});

  const firstUser = new User({
    fullName: 'Index One',
    email: 'index.one@example.com',
    password: 'StrongPass123',
    role: 'student',
  });

  const secondUser = new User({
    fullName: 'Index Two',
    email: 'index.two@example.com',
    password: 'StrongPass123',
    role: 'student',
  });

  await firstUser.save();
  await secondUser.save();

  assert.match(firstUser.studentId, /^1029\d{4}$/);
  assert.equal(firstUser.studentId.length, 8);
  assert.match(secondUser.studentId, /^1029\d{4}$/);
  assert.equal(secondUser.studentId.length, 8);
  assert.notEqual(firstUser.studentId, secondUser.studentId);

  await User.deleteMany({});
  await mongoose.disconnect();
});

test('New student profiles default to zero CGPA and credits completed', async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/student-portal-test');
  await mongoose.connection.db.dropDatabase().catch(() => {});

  const user = new User({
    fullName: 'New Student',
    email: 'new.student@example.com',
    password: 'StrongPass123',
    role: 'student',
  });

  await user.save();

  const profile = await StudentProfile.create({
    userId: user._id,
    studentId: user.studentId,
    fullName: user.fullName,
    email: user.email,
  });

  assert.equal(profile.cgpa, 0);
  assert.equal(profile.creditsCompleted, 0);
  assert.equal(profile.hallResidence, '');

  await StudentProfile.deleteMany({});
  await User.deleteMany({});
  await mongoose.disconnect();
});

test('Admissions lookup accepts a numeric level when the CSV stores Level 100', () => {
  const record = authRouter.findAdmissionRecord('Daniel Owusu', 'Cocoa Production Systems', 'Agronomy', '100');
  assert.ok(record);
  assert.equal(record.fullName || record.fullname, 'Daniel Owusu');
});
