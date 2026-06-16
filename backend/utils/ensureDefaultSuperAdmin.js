const User = require('../models/User');

const ensureDefaultSuperAdmin = async () => {
  const count = await User.countDocuments();
  if (count > 0) return;

  const email = process.env.SUPERADMIN_EMAIL || 'admin@pos.com';
  const password = process.env.SUPERADMIN_PASSWORD || 'admin123';

  await User.create({
    name: 'Super Admin',
    email,
    password,
    role: 'superadmin',
    isActive: true,
  });

  console.log(`Default superadmin created (${email})`);
};

module.exports = ensureDefaultSuperAdmin;
