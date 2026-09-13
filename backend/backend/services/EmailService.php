<?php

require_once __DIR__ . '/../config/env.php';

/**
 * Service for sending transactional emails (Registration OTP, Password Reset OTP).
 * Supports SMTP with TLS/SSL authentication and fallback console logging.
 */
class EmailService {
    private static function logOtpToConsole(string $email, string $otpCode, string $purpose): void {
        $purposeUpper = strtoupper($purpose);
        $output = <<<TXT

=============================================================
[PartTrack Email Service] {$purposeUpper} OTP
To:       {$email}
OTP Code: >>> {$otpCode} <<<
Valid:    10 minutes
=============================================================

TXT;
        error_log($output);
        // Also print to stdout if CLI or php built-in server
        echo $output;
    }

    public static function sendSignupOtpEmail(string $email, string $otpCode): array {
        self::logOtpToConsole($email, $otpCode, 'Account Registration');

        $smtpHost = env('SMTP_HOST');
        $smtpUser = env('SMTP_USER');

        if (empty($smtpHost) || empty($smtpUser)) {
            return ['success' => true, 'simulated' => true];
        }

        $subject = "PartTrack Verification Code: {$otpCode}";
        $html = <<<HTML
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
      <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">{$otpCode}</span>
    </div>
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
      This code is valid for <strong>10 minutes</strong>. If you did not request this registration, please safely disregard this email.
    </p>
  </div>
</div>
HTML;

        return self::sendMail($email, $subject, $html);
    }

    public static function sendForgotPasswordOtpEmail(string $email, string $otpCode): array {
        self::logOtpToConsole($email, $otpCode, 'Password Reset');

        $smtpHost = env('SMTP_HOST');
        $smtpUser = env('SMTP_USER');

        if (empty($smtpHost) || empty($smtpUser)) {
            return ['success' => true, 'simulated' => true];
        }

        $subject = "PartTrack Password Reset Code: {$otpCode}";
        $html = <<<HTML
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
      <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #f59e0b; font-family: monospace;">{$otpCode}</span>
    </div>
    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
      This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, you can safely ignore this email — your account remains secure.
    </p>
  </div>
</div>
HTML;

        return self::sendMail($email, $subject, $html);
    }

    private static function sendMail(string $to, string $subject, string $html): array {
        try {
            $host = env('SMTP_HOST');
            $port = (int)env('SMTP_PORT', 587);
            $user = env('SMTP_USER');
            $pass = env('SMTP_PASS');
            $from = env('SMTP_FROM', 'noreply@parttrack.local');

            $socket = @fsockopen($host, $port, $errno, $errstr, 10);
            if (!$socket) {
                throw new Exception("Could not connect to SMTP server {$host}: {$errstr}");
            }

            self::readSmtpResponse($socket);

            fputs($socket, "EHLO " . gethostname() . "\r\n");
            self::readSmtpResponse($socket);

            if ($port === 587) {
                fputs($socket, "STARTTLS\r\n");
                self::readSmtpResponse($socket);
                stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                fputs($socket, "EHLO " . gethostname() . "\r\n");
                self::readSmtpResponse($socket);
            }

            fputs($socket, "AUTH LOGIN\r\n");
            self::readSmtpResponse($socket);

            fputs($socket, base64_encode($user) . "\r\n");
            self::readSmtpResponse($socket);

            fputs($socket, base64_encode($pass) . "\r\n");
            self::readSmtpResponse($socket);

            // Extract plain email from "Name <email@domain>"
            $fromEmail = $from;
            if (preg_match('/<([^>]+)>/', $from, $m)) {
                $fromEmail = $m[1];
            }

            fputs($socket, "MAIL FROM:<{$fromEmail}>\r\n");
            self::readSmtpResponse($socket);

            fputs($socket, "RCPT TO:<{$to}>\r\n");
            self::readSmtpResponse($socket);

            fputs($socket, "DATA\r\n");
            self::readSmtpResponse($socket);

            $headers = "MIME-Version: 1.0\r\n" .
                       "Content-Type: text/html; charset=UTF-8\r\n" .
                       "From: {$from}\r\n" .
                       "To: {$to}\r\n" .
                       "Subject: {$subject}\r\n" .
                       "Date: " . date('r') . "\r\n";

            fputs($socket, $headers . "\r\n" . $html . "\r\n.\r\n");
            self::readSmtpResponse($socket);

            fputs($socket, "QUIT\r\n");
            fclose($socket);

            return ['success' => true, 'simulated' => false];
        } catch (Throwable $e) {
            error_log("Failed to send email via SMTP: " . $e->getMessage());
            return ['success' => true, 'simulated' => true, 'error' => $e->getMessage()];
        }
    }

    private static function readSmtpResponse($socket): string {
        $data = "";
        while ($str = fgets($socket, 515)) {
            $data .= $str;
            if (substr($str, 3, 1) === " ") {
                break;
            }
        }
        return $data;
    }
}
