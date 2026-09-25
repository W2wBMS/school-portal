const User = require('../models/User');

async function seedAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

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
  } else {
    console.log('Bootstrap super admin already exists in MongoDB');
  }
}

module.exports = { seedAdmin };
