/**
 * Create the otps table for email verification and password resets.
 */
exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('otps');
  if (!exists) {
    return knex.schema.createTable('otps', (table) => {
      table.string('id', 36).primary(); // UUID
      table.string('email').notNullable();
      table.string('otp_code', 10).notNullable();
      table.string('type', 50).notNullable(); // 'signup' or 'forgot_password'
      table.text('payload').nullable(); // Optional JSON payload
      table.timestamp('expires_at').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['email', 'type'], 'idx_otps_email_type');
    });
  }
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('otps');
};
