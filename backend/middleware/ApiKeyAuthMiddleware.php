<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

/**
 * Middleware to authenticate requests via Scoped API Key (X-API-Key header or Bearer token).
 */
class ApiKeyAuthMiddleware {
    private static ?array $currentApiKey = null;

    public static function authenticate(): array {
        if (self::$currentApiKey !== null) {
            return self::$currentApiKey;
        }

        $rawKey = Response::getHeader('X-API-Key');
        if (empty($rawKey)) {
            $rawKey = Response::getBearerToken();
        }

        if (empty($rawKey) || !is_string($rawKey)) {
            Response::error('API key is required. Pass via X-API-Key header or Authorization: Bearer <key>', 401);
        }

        $trimmedKey = trim($rawKey);
        if (!str_starts_with($trimmedKey, 'pt_live_')) {
            Response::error('Invalid API key format. PartTrack API keys start with pt_live_', 401);
        }

        $keyHash = hash('sha256', $trimmedKey);
        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT * FROM api_keys WHERE key_hash = :hash AND is_active = 1 LIMIT 1");
        $stmt->execute([':hash' => $keyHash]);
        $keyRecord = $stmt->fetch();

        if (!$keyRecord) {
            Response::error('Invalid or revoked API key.', 401);
        }

        // Update last_used_at
        try {
            $now = date('Y-m-d H:i:s');
            $update = $db->prepare("UPDATE api_keys SET last_used_at = :now WHERE id = :id");
            $update->execute([':now' => $now, ':id' => $keyRecord['id']]);
        } catch (Throwable $e) {
            error_log('Could not update API key last_used_at: ' . $e->getMessage());
        }

        self::$currentApiKey = $keyRecord;
        return self::$currentApiKey;
    }

    public static function getCurrentApiKey(): ?array {
        return self::$currentApiKey;
    }
}
