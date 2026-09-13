<?php

require_once __DIR__ . '/../config/database.php';

/**
 * Service for managing unique 5-digit user prefixes and 12-digit tracking numbers.
 */
class TrackingNumberService {
    public static function generateUniqueUserPrefix(PDO $db): string {
        $maxAttempts = 100;
        for ($i = 0; $i < $maxAttempts; $i++) {
            $prefix = (string)random_int(10000, 99999);
            $stmt = $db->prepare("SELECT id FROM users WHERE tracking_prefix = :prefix LIMIT 1");
            $stmt->execute([':prefix' => $prefix]);
            if (!$stmt->fetch()) {
                return $prefix;
            }
        }

        throw new Exception('Unable to allocate a unique 5-digit user prefix. Please try again.');
    }

    public static function ensureUserPrefix(PDO $db, string $userId): string {
        $stmt = $db->prepare("SELECT id, tracking_prefix FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch();

        if (!$user) {
            throw new Exception("User with ID {$userId} not found.");
        }

        if (!empty($user['tracking_prefix']) && preg_match('/^\d{5}$/', $user['tracking_prefix'])) {
            return $user['tracking_prefix'];
        }

        $newPrefix = self::generateUniqueUserPrefix($db);
        $update = $db->prepare("UPDATE users SET tracking_prefix = :prefix WHERE id = :id");
        $update->execute([':prefix' => $newPrefix, ':id' => $userId]);

        return $newPrefix;
    }

    public static function generate12DigitTrackingNumber(PDO $db, string $userPrefix): string {
        if (!preg_match('/^\d{5}$/', $userPrefix)) {
            throw new Exception("Invalid user prefix: \"{$userPrefix}\". Prefix must be exactly 5 numeric digits.");
        }

        $maxAttempts = 20;
        for ($i = 0; $i < $maxAttempts; $i++) {
            $suffix = sprintf('%07d', random_int(0, 9999999));
            $candidate = $userPrefix . $suffix;

            if (strlen($candidate) !== 12) {
                continue;
            }

            $stmt = $db->prepare("SELECT id FROM tracking_records WHERE tracking_number = :tn LIMIT 1");
            $stmt->execute([':tn' => $candidate]);
            if (!$stmt->fetch()) {
                return $candidate;
            }
        }

        throw new Exception('Failed to generate a unique 12-digit tracking number after multiple attempts. Please retry.');
    }
}
