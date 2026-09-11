const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate and store a new 6-digit OTP code in database.
 * Deletes any existing pending OTPs for this email and type.
 */
async function generateAndStoreOtp(db, email, type, payload = null) {
  const normalizedEmail = email.trim().toLowerCase();
  
  // Clear any existing OTPs for this email & action
  await db('otps').where({ email: normalizedEmail, type }).del();

  // Generate 6-digit cryptographically secure numeric OTP
  const otpCode = crypto.randomInt(100000, 1000000).toString();

  // 10-minute validity
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const id = uuidv4();
  await db('otps').insert({
    id,
    email: normalizedEmail,
    otp_code: otpCode,
    type,
    payload: payload ? JSON.stringify(payload) : null,
    expires_at: expiresAt,
  });

  return { id, otpCode, expiresAt };
}

/**
 * Verify an OTP code.
 */
async function verifyOtp(db, email, type, otpCode) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = String(otpCode).trim();

  const record = await db('otps')
    .where({ email: normalizedEmail, type })
    .first();

  if (!record) {
    return {
      valid: false,
      error: 'No active verification code found. Please request a new code.',
    };
  }

  // Check expiry
  if (new Date(record.expires_at) < new Date()) {
    await db('otps').where({ id: record.id }).del();
    return {
      valid: false,
      error: 'Verification code has expired. Please request a new code.',
    };
  }

  // Check code match
  if (record.otp_code !== normalizedCode) {
    return {
      valid: false,
      error: 'Invalid verification code. Please check and try again.',
    };
  }

  let parsedPayload = null;
  if (record.payload) {
    try {
      parsedPayload = JSON.parse(record.payload);
    } catch {
      parsedPayload = null;
    }
  }

  return {
    valid: true,
    otpId: record.id,
    payload: parsedPayload,
  };
}

/**
 * Delete consumed OTP
 */
async function consumeOtp(db, otpId) {
  if (!otpId) return;
  await db('otps').where({ id: otpId }).del();
}

module.exports = {
  generateAndStoreOtp,
  verifyOtp,
  consumeOtp,
};
