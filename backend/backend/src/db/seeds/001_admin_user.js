const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Seed initial admin user from environment variables.
 */
exports.seed = async function (knex) {
  const email = process.env.ADMIN_EMAIL || 'admin@parttrack.local';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const name = process.env.ADMIN_NAME || 'Admin';

  // Check if admin already exists
  const existing = await knex('users').where({ email }).first();
  if (existing) {
    console.log(`Admin user "${email}" already exists — skipping seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await knex('users').insert({
    id: uuidv4(),
    name,
    email,
    password_hash: passwordHash,
    role: 'admin',
    is_active: true,
    tracking_prefix: '10001',
  });

  console.log(`✓ Admin user created: ${email}`);
};
