<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

class HealthController {
    public static function check(): void {
        try {
            $db = Database::getConnection();
            $db->query('SELECT 1');

            Response::json([
                'status' => 'ok',
                'database' => 'connected',
                'client' => Database::isPostgres() ? 'pg' : 'sqlite3',
                'hasDatabaseUrl' => !empty(env('DATABASE_URL')),
                'hasJwtSecret' => !empty(env('JWT_SECRET')),
                'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
            ]);
        } catch (Throwable $e) {
            Response::json([
                'status' => 'error',
                'database' => $e->getMessage(),
                'client' => Database::isPostgres() ? 'pg' : 'sqlite3',
                'hasDatabaseUrl' => !empty(env('DATABASE_URL')),
                'hasJwtSecret' => !empty(env('JWT_SECRET')),
                'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
            ], 500);
        }
    }
}
