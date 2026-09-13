const crypto = require('crypto');

/**
 * Add tracking_prefix column to users table and backfill existing users.
 */
exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'tracking_prefix');
  if (!hasColumn) {
    await knex.schema.alterTable('users', (table) => {
      table.string('tracking_prefix', 5).nullable().unique();
    });

    // Backfill any existing users with a unique 5-digit prefix
    const users = await knex('users').select('id', 'tracking_prefix');
    const assignedPrefixes = new Set();

    // Collect already assigned prefixes if any
    users.forEach((u) => {
      if (u.tracking_prefix) assignedPrefixes.add(u.tracking_prefix);
    });

    for (const u of users) {
      if (!u.tracking_prefix) {
        let prefix;
        do {
          prefix = crypto.randomInt(10000, 100000).toString();
        } while (assignedPrefixes.has(prefix));

        assignedPrefixes.add(prefix);
        await knex('users').where({ id: u.id }).update({ tracking_prefix: prefix });
      }
    }
  }
};

exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'tracking_prefix');
  if (hasColumn) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('tracking_prefix');
    });
  }
};
