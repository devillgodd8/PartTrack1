/**
 * Create the api_keys table for scoped external integrations.
 */
exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('api_keys');
  if (!exists) {
    return knex.schema.createTable('api_keys', (table) => {
      table.string('id', 36).primary(); // UUID
      table
        .string('user_id', 36)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table.string('name', 100).notNullable();
      table.string('key_hash', 64).notNullable().unique();
      table.string('key_prefix', 32).notNullable();
      table.string('permissions', 50).notNullable().defaultTo('read:tracking');
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamp('last_used_at').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['key_hash'], 'idx_api_keys_hash');
      table.index(['user_id'], 'idx_api_keys_user');
    });
  }
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('api_keys');
};
