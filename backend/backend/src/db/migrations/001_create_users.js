/**
 * Create the users table.
 */
exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('users');
  if (!exists) {
    return knex.schema.createTable('users', (table) => {
      table.string('id', 36).primary(); // UUID
      table.string('name').notNullable();
      table.string('email').notNullable().unique();
      table.string('password_hash').notNullable();
      table.string('role').notNullable().defaultTo('user'); // 'admin' or 'user'
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('users');
};
