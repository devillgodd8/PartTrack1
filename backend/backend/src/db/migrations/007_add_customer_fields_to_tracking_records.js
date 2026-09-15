/**
 * Add customer_name and customer_number columns to tracking_records table.
 */
exports.up = async function (knex) {
  const hasCustomerName = await knex.schema.hasColumn('tracking_records', 'customer_name');
  if (!hasCustomerName) {
    await knex.schema.alterTable('tracking_records', (table) => {
      table.string('customer_name', 255).nullable();
    });
  }

  const hasCustomerNumber = await knex.schema.hasColumn('tracking_records', 'customer_number');
  if (!hasCustomerNumber) {
    await knex.schema.alterTable('tracking_records', (table) => {
      table.string('customer_number', 100).nullable();
    });
  }
};

exports.down = async function (knex) {
  const hasCustomerName = await knex.schema.hasColumn('tracking_records', 'customer_name');
  if (hasCustomerName) {
    await knex.schema.alterTable('tracking_records', (table) => {
      table.dropColumn('customer_name');
    });
  }

  const hasCustomerNumber = await knex.schema.hasColumn('tracking_records', 'customer_number');
  if (hasCustomerNumber) {
    await knex.schema.alterTable('tracking_records', (table) => {
      table.dropColumn('customer_number');
    });
  }
};
