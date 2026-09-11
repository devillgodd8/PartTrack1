<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

/**
 * Service for generating, storing, verifying and consuming OTP codes.
 */
class OtpService {
    public static function generateAndStoreOtp(PDO $db, string $email, string $type, ?array $payload = null): array {
        $normalizedEmail = strtolower(trim($email));

        // Delete any existing OTPs for this email & action
        $stmt = $db->prepare("DELETE FROM otps WHERE email = :email AND type = :type");
        $stmt->execute([':email' => $normalizedEmail, ':type' => $type]);

        // Generate 6-digit cryptographically secure numeric OTP
        $otpCode = (string)random_int(100000, 999999);

        // 10-minute validity
        $expiresAt = date('Y-m-d H:i:s', time() + 10 * 60);
        $id = Response::generateUuid();

        $stmt = $db->prepare("
            INSERT INTO otps (id, email, otp_code, type, payload, expires_at)
            VALUES (:id, :email, :otp_code, :type, :payload, :expires_at)
        ");
        $stmt->execute([
            ':id' => $id,
            ':email' => $normalizedEmail,
            ':otp_code' => $otpCode,
            ':type' => $type,
            ':payload' => $payload ? json_encode($payload) : null,
            ':expires_at' => $expiresAt,
        ]);

        return [
            'id' => $id,
            'otpCode' => $otpCode,
            'expiresAt' => $expiresAt,
        ];
    }

    public static function verifyOtp(PDO $db, string $email, string $type, string $otpCode): array {
        $normalizedEmail = strtolower(trim($email));
        $normalizedCode = trim((string)$otpCode);

        $stmt = $db->prepare("
            SELECT * FROM otps 
            WHERE email = :email AND type = :type 
            ORDER BY created_at DESC 
            LIMIT 1
        ");
        $stmt->execute([':email' => $normalizedEmail, ':type' => $type]);
        $record = $stmt->fetch();

        if (!$record) {
            return [
                'valid' => false,
                'error' => 'No active verification code found. Please request a new code.',
            ];
        }

        // Check expiry
        if (strtotime($record['expires_at']) < time()) {
            $del = $db->prepare("DELETE FROM otps WHERE id = :id");
            $del->execute([':id' => $record['id']]);
            return [
                'valid' => false,
                'error' => 'Verification code has expired. Please request a new code.',
            ];
        }

        // Check code match
        if ($record['otp_code'] !== $normalizedCode) {
            return [
                'valid' => false,
                'error' => 'Invalid verification code. Please check and try again.',
            ];
        }

        $parsedPayload = null;
        if (!empty($record['payload'])) {
            $parsedPayload = json_decode($record['payload'], true);
        }

        return [
            'valid' => true,
            'otpId' => $record['id'],
            'payload' => $parsedPayload,
        ];
    }

    public static function consumeOtp(PDO $db, ?string $otpId): void {
        if (!$otpId) {
            return;
        }
        $stmt = $db->prepare("DELETE FROM otps WHERE id = :id");
        $stmt->execute([':id' => $otpId]);
    }
}
