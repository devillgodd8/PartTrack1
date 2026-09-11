const { body } = require('express-validator');
const { STATUSES, PART_TYPES } = require('./constants');

const currentYear = new Date().getFullYear();

/**
 * Validation chains for various endpoints.
 */

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const createUserValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Role must be admin or user'),
];

const updateUserValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').escape(),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Role must be admin or user'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

const createTrackingValidation = [
  body('tracking_number')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^\d{12}$/)
    .withMessage('Tracking number must be exactly 12 numeric digits'),
  body('part_type')
    .isIn(PART_TYPES)
    .withMessage(`Part type must be one of: ${PART_TYPES.join(', ')}`),
  body('vehicle_make').trim().notEmpty().withMessage('Vehicle make is required').escape(),
  body('vehicle_model')
    .trim()
    .notEmpty()
    .withMessage('Vehicle model is required')
    .escape(),
  body('vehicle_year')
    .isInt({ min: 1900, max: currentYear + 2 })
    .withMessage(`Vehicle year must be between 1900 and ${currentYear + 2}`),
  body('vin')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 17, max: 17 })
    .withMessage('VIN must be exactly 17 characters')
    .isAlphanumeric()
    .withMessage('VIN must contain only letters and numbers'),
  body('part_stock_number')
    .trim()
    .notEmpty()
    .withMessage('Part stock number is required')
    .escape(),
  body('shipment_origin')
    .trim()
    .notEmpty()
    .withMessage('Shipment origin is required')
    .escape(),
  body('destination').trim().notEmpty().withMessage('Destination is required').escape(),
  body('current_status')
    .optional()
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  body('estimated_delivery_date')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Invalid date format'),
  body('notes').optional({ values: 'falsy' }).trim(),
  body('assigned_user_id').optional().isUUID().withMessage('Invalid user ID'),
];

const updateTrackingValidation = [
  body('part_type')
    .optional()
    .isIn(PART_TYPES)
    .withMessage(`Part type must be one of: ${PART_TYPES.join(', ')}`),
  body('vehicle_make')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Vehicle make cannot be empty')
    .escape(),
  body('vehicle_model')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Vehicle model cannot be empty')
    .escape(),
  body('vehicle_year')
    .optional()
    .isInt({ min: 1900, max: currentYear + 2 })
    .withMessage(`Vehicle year must be between 1900 and ${currentYear + 2}`),
  body('vin')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 17, max: 17 })
    .withMessage('VIN must be exactly 17 characters')
    .isAlphanumeric()
    .withMessage('VIN must contain only letters and numbers'),
  body('part_stock_number')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Part stock number cannot be empty')
    .escape(),
  body('shipment_origin')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Shipment origin cannot be empty')
    .escape(),
  body('destination')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Destination cannot be empty')
    .escape(),
  body('estimated_delivery_date')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Invalid date format'),
  body('notes').optional({ values: 'falsy' }).trim(),
  body('assigned_user_id').optional().isUUID().withMessage('Invalid user ID'),
];

const statusUpdateValidation = [
  body('status')
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  body('notes').optional({ values: 'falsy' }).trim(),
];

const signupRequestValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

const signupVerifyValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .isNumeric()
    .withMessage('Verification code must be numeric'),
];

const forgotPasswordRequestValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const forgotPasswordVerifyValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .isNumeric()
    .withMessage('Verification code must be numeric'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

module.exports = {
  loginValidation,
  createUserValidation,
  updateUserValidation,
  resetPasswordValidation,
  createTrackingValidation,
  updateTrackingValidation,
  statusUpdateValidation,
  signupRequestValidation,
  signupVerifyValidation,
  forgotPasswordRequestValidation,
  forgotPasswordVerifyValidation,
};
