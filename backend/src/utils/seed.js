const User = require('../models/User');

async function seedAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const resetPassword = process.env.BOOTSTRAP_ADMIN_RESET_PASSWORD === 'true';

  if (!email || !password) {
    console.log('Bootstrap admin credentials are not configured; skipping admin seed');
    return;
  }

  let admin = await User.findOne({ email });

  if (!admin) {
    admin = await User.create({
      fullName: 'System Administrator',
      email,
      password,
      role: 'super_admin',
      isVerified: true,
      status: 'active',
    });

    console.log('Default super admin created');
  } else if (resetPassword) {
    // Password recovery is deliberately opt-in so routine deploys never
    // overwrite an administrator's password.
    admin.password = password;
    admin.status = 'active';
    admin.failedLoginAttempts = 0;
    admin.lockUntil = null;
    admin.sessionVersion = (admin.sessionVersion || 0) + 1;
    await admin.save();
    console.log('Bootstrap super admin password reset');
  } else {
    console.log('Bootstrap super admin already exists in MongoDB');
  }
}

module.exports = { seedAdmin };
