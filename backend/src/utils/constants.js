/**
 * Application constants — status enums, part types, roles.
 */

const STATUSES = [
  'Pending',
  'Processing',
  'Picked Up',
  'In Transit',
  'Out for Delivery',
  'Delayed',
  'Delivered',
  'Cancelled',
  'On Hold',
];

const PART_TYPES = ['Engine', 'Transmission', 'Other'];

const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

module.exports = { STATUSES, PART_TYPES, ROLES };
