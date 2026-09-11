/**
 * Create the status_history table.
 */
exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('status_history');
  if (!exists) {
    return knex.schema.createTable('status_history', (table) => {
      table.string('id', 36).primary(); // UUID
      table
        .string('tracking_record_id', 36)
        .notNullable()
        .references('id')
        .inTable('tracking_records')
        .onDelete('CASCADE');
      table.string('status').notNullable();
      table.text('notes').nullable();
      table
        .string('updated_by_id', 36)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT');
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('status_history');
};
