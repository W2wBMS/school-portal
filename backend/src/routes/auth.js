const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { protect } = require('../middleware/auth');
const { setCsrfCookie } = require('../middleware/csrf');
const { audit } = require('../utils/audit');
const { permissionsForRole } = require('../utils/permissions');
const { getJwtSecret } = require('../utils/jwtSecret');
const { isDatabaseUnavailable } = require('../utils/databaseStatus');
const { z } = require('zod');

const router = express.Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many login attempts. Try again later.' } });
const MAX_LOGIN_FAILURES = 5;
const LOCKOUT_MINUTES = 15;
const registerSchema = z.object({ fullName: z.string().trim().min(2).max(120), email: z.string().trim().email(), password: z.string().min(8).max(128), studentId: z.string().trim().max(40).optional(), department: z.string().trim().max(120).optional(), programme: z.string().trim().max(160).optional(), level: z.string().trim().max(40).optional() });
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(128) });

function createToken(user) {
  return jwt.sign({ id: user._id, role: user.role, sessionVersion: user.sessionVersion || 0 }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) return res.status(400).json({ message: 'Enter a valid name, email, and password of at least 8 characters' });
    const { fullName, email, password, studentId, department, programme, level } = parsed.data;

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      fullName,
      email: String(email).toLowerCase(),
      password,
      role: 'student',
      studentId: studentId || '',
      department: department || '',
      programme: programme || '',
      level: level || '',
    });

    await StudentProfile.create({
      userId: user._id,
      studentId: studentId || `STU-${user._id.toString().slice(-8).toUpperCase()}`,
      fullName: user.fullName,
      email: user.email,
      programme: programme || undefined,
      department: department || undefined,
      level: level || undefined,
    });

    const token = createToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    setCsrfCookie(res);
    await audit({ actorId: user._id, action: 'auth.registered', entity: 'User', entityId: user._id, after: { role: user.role } });

    return res.status(201).json({
      message: 'User registered successfully',
      user: user.toPublicJSON(),
    });
  } catch (error) {
    if (isDatabaseUnavailable(error)) return res.status(503).json({ message: 'Registration service is temporarily unavailable. Please try again.' });
    console.error(`Registration failed: ${error.name}`);
    return res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'A valid email and password are required' });
    const { email, password } = parsed.data;

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.lockUntil && user.lockUntil > new Date()) return res.status(423).json({ message: 'Account temporarily locked. Try again later.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_LOGIN_FAILURES) {
        user.lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        user.failedLoginAttempts = 0;
      }
      await user.save();
      await audit({ actorId: user._id, action: 'auth.login_failed', entity: 'User', entityId: user._id, metadata: { reason: 'invalid_password' } });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = createToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    setCsrfCookie(res);
    await audit({ actorId: user._id, action: 'auth.login_succeeded', entity: 'User', entityId: user._id, metadata: { role: user.role } });

    return res.json({
      message: 'Login successful',
      user: user.toPublicJSON(),
    });
  } catch (error) {
    if (isDatabaseUnavailable(error)) return res.status(503).json({ message: 'Sign-in service is temporarily unavailable. Please try again.' });
    console.error(`Login failed: ${error.name}`);
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.clearCookie('csrf_token');
  return res.json({ message: 'Logged out successfully' });
});

router.get('/me', protect, async (req, res) => {
  return res.json({ user: req.user, permissions: permissionsForRole(req.user.role) });
});

module.exports = router;
