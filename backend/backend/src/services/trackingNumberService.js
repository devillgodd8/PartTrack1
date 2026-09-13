const crypto = require('crypto');

/**
 * Generate a unique 5-digit numeric prefix for a user.
 * Format: Exactly 5 numeric digits ('10000' - '99999').
 */
async function generateUniqueUserPrefix(db) {
  let prefix;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 100;

  while (exists && attempts < maxAttempts) {
    prefix = crypto.randomInt(10000, 100000).toString();
    const match = await db('users').where({ tracking_prefix: prefix }).first();
    if (!match) {
      exists = false;
      return prefix;
    }
    attempts++;
  }

  // Fallback to random 5 digits if needed
  if (exists) {
    throw new Error('Unable to allocate a unique 5-digit user prefix. Please try again.');
  }

  return prefix;
}

/**
 * Ensure a user has a fixed 5-digit tracking prefix assigned.
 * If missing, generates, persists, and returns it.
 */
async function ensureUserPrefix(db, userId) {
  const user = await db('users')
    .select('id', 'tracking_prefix')
    .where({ id: userId })
    .first();

  if (!user) {
    throw new Error(`User with ID ${userId} not found.`);
  }

  if (user.tracking_prefix && /^\d{5}$/.test(user.tracking_prefix)) {
    return user.tracking_prefix;
  }

  // Generate new unique prefix and persist
  const newPrefix = await generateUniqueUserPrefix(db);
  await db('users').where({ id: userId }).update({ tracking_prefix: newPrefix });
  return newPrefix;
}

/**
 * Generate an exact 12-digit tracking number:
 * [5-digit user prefix][7-digit random unique suffix] = 12 digits.
 * Guaranteed collision prevention with database check.
 */
async function generate12DigitTrackingNumber(db, userPrefix) {
  if (!userPrefix || !/^\d{5}$/.test(String(userPrefix))) {
    throw new Error(`Invalid user prefix: "${userPrefix}". Prefix must be exactly 5 numeric digits.`);
  }

  const prefix = String(userPrefix);
  let trackingNumber = null;
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    // Generate 7 numeric digits ('0000000' - '9999999')
    const suffix = crypto.randomInt(0, 10000000).toString().padStart(7, '0');
    const candidate = `${prefix}${suffix}`;

    // Verify exactly 12 digits
    if (!/^\d{12}$/.test(candidate)) {
      attempts++;
      continue;
    }

    // Check collision in database
    const exists = await db('tracking_records')
      .where({ tracking_number: candidate })
      .first();

    if (!exists) {
      trackingNumber = candidate;
      break;
    }

    attempts++;
  }

  if (!trackingNumber) {
    throw new Error('Failed to generate a unique 12-digit tracking number after multiple attempts. Please retry.');
  }

  return trackingNumber;
}

module.exports = {
  generateUniqueUserPrefix,
  ensureUserPrefix,
  generate12DigitTrackingNumber,
};
