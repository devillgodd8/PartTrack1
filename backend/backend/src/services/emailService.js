const nodemailer = require('nodemailer');

// Build transporter if SMTP config is provided
let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM_ADDRESS = process.env.SMTP_FROM || '"PartTrack Support" <noreply@parttrack.local>';

/**
 * Log OTP to console in development / fallback mode
 */
function logOtpToConsole(email, otpCode, purpose) {
  console.log('\n=============================================================');
  console.log(`[PartTrack Email Service] ${purpose.toUpperCase()} OTP`);
  console.log(`To:       ${email}`);
  console.log(`OTP Code: >>> ${otpCode} <<<`);
  console.log(`Valid:    10 minutes`);
  console.log('=============================================================\n');
}

/**
 * Send Signup verification OTP email
 */
async function sendSignupOtpEmail(email, otpCode) {
  logOtpToConsole(email, otpCode, 'Account Registration');

  if (!transporter) {
    return { success: true, simulated: true };
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #38bdf8; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">PartTrack</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Automotive Parts Tracking Portal</p>
        </div>
        <h2 style="color: #f8fafc; font-size: 18px; margin-bottom: 12px; font-weight: 600;">Verify Your Email Address</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Thank you for signing up with PartTrack. Use the One-Time Password (OTP) below to complete your registration:
        </p>
        <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">${otpCode}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          This code is valid for <strong>10 minutes</strong>. If you did not request this registration, please safely disregard this email.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: `PartTrack Verification Code: ${otpCode}`,
      html,
    });
    return { success: true, simulated: false };
  } catch (err) {
    console.error('Failed to send signup email via SMTP:', err.message);
    return { success: true, simulated: true, error: err.message };
  }
}

/**
 * Send Password Reset OTP email
 */
async function sendForgotPasswordOtpEmail(email, otpCode) {
  logOtpToConsole(email, otpCode, 'Password Reset');

  if (!transporter) {
    return { success: true, simulated: true };
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #38bdf8; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">PartTrack</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Automotive Parts Tracking Portal</p>
        </div>
        <h2 style="color: #f8fafc; font-size: 18px; margin-bottom: 12px; font-weight: 600;">Reset Your Password</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          We received a request to reset your PartTrack password. Use the One-Time Password (OTP) below to set a new password:
        </p>
        <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #f59e0b; font-family: monospace;">${otpCode}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, you can safely ignore this email — your account remains secure.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: `PartTrack Password Reset Code: ${otpCode}`,
      html,
    });
    return { success: true, simulated: false };
  } catch (err) {
    console.error('Failed to send password reset email via SMTP:', err.message);
    return { success: true, simulated: true, error: err.message };
  }
}

module.exports = {
  sendSignupOtpEmail,
  sendForgotPasswordOtpEmail,
};
