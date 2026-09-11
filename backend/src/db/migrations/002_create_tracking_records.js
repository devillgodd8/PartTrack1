/**
 * Create the tracking_records table.
 */
exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('tracking_records');
  if (!exists) {
    return knex.schema.createTable('tracking_records', (table) => {
      table.string('id', 36).primary(); // UUID
      table.string('tracking_number').notNullable().unique();
      table.string('part_type').notNullable(); // Engine, Transmission, Other
      table.string('vehicle_make').notNullable();
      table.string('vehicle_model').notNullable();
      table.integer('vehicle_year').notNullable();
      table.string('vin').nullable();
      table.string('part_stock_number').notNullable();
      table.string('shipment_origin').notNullable();
      table.string('destination').notNullable();
      table.string('current_status').notNullable().defaultTo('Pending');
      table.date('estimated_delivery_date').nullable();
      table.text('notes').nullable();
      table
        .string('assigned_user_id', 36)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT');
      table
        .string('created_by_id', 36)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT');
      table.timestamp('date_created').defaultTo(knex.fn.now());
      table.timestamp('last_updated').defaultTo(knex.fn.now());
    });
  }
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('tracking_records');
};
