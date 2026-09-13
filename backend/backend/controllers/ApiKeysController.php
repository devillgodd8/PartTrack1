<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ApiKeysController {
    public static function index(): void {
        $currentUser = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        if ($currentUser['role'] === 'admin') {
            $stmt = $db->query("
                SELECT id, name, key_prefix, permissions, is_active, last_used_at, created_at 
                FROM api_keys 
                ORDER BY created_at DESC
            ");
            $keys = $stmt->fetchAll();
        } else {
            $stmt = $db->prepare("
                SELECT id, name, key_prefix, permissions, is_active, last_used_at, created_at 
                FROM api_keys 
                WHERE user_id = :uid 
                ORDER BY created_at DESC
            ");
            $stmt->execute([':uid' => $currentUser['id']]);
            $keys = $stmt->fetchAll();
        }

        foreach ($keys as &$k) {
            $k['is_active'] = (bool)$k['is_active'];
        }

        Response::json(['keys' => $keys]);
    }

    public static function create(): void {
        $currentUser = AuthMiddleware::authenticate();
        $body = Response::getBody();
        $db = Database::getConnection();

        $name = !empty($body['name']) ? substr(trim($body['name']), 0, 100) : 'Website Integration';

        $randomHex = bin2hex(random_bytes(24));
        $apiKey = "pt_live_{$randomHex}";
        $keyPrefix = "pt_live_" . substr($randomHex, 0, 8) . "...";
        $keyHash = hash('sha256', $apiKey);

        $id = Response::generateUuid();
        $now = date('Y-m-d H:i:s');

        $stmt = $db->prepare("
            INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, permissions, is_active, created_at)
            VALUES (:id, :uid, :name, :key_hash, :key_prefix, 'read:tracking', 1, :created_at)
        ");
        $stmt->execute([
            ':id' => $id,
            ':uid' => $currentUser['id'],
            ':name' => $name,
            ':key_hash' => $keyHash,
            ':key_prefix' => $keyPrefix,
            ':created_at' => $now,
        ]);

        Response::json([
            'id' => $id,
            'name' => $name,
            'key_prefix' => $keyPrefix,
            'apiKey' => $apiKey, // Returned ONLY once upon creation
            'permissions' => 'read:tracking',
            'created_at' => $now,
            'message' => 'API key generated successfully. Copy it now, it will not be shown again.',
        ], 201);
    }

    public static function delete(string $id): void {
        $currentUser = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        if ($currentUser['role'] === 'admin') {
            $stmt = $db->prepare("SELECT id FROM api_keys WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $id]);
        } else {
            $stmt = $db->prepare("SELECT id FROM api_keys WHERE id = :id AND user_id = :uid LIMIT 1");
            $stmt->execute([':id' => $id, ':uid' => $currentUser['id']]);
        }

        if (!$stmt->fetch()) {
            Response::error('API key not found', 404);
        }

        $del = $db->prepare("DELETE FROM api_keys WHERE id = :id");
        $del->execute([':id' => $id]);

        Response::json(['message' => 'API key revoked successfully']);
    }
}
