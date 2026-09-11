<?php

require_once __DIR__ . '/env.php';

/**
 * Database connection provider using PDO.
 * Supports SQLite (default) and PostgreSQL (via DATABASE_URL or PG_* envs).
 */
class Database {
    private static ?PDO $pdo = null;

    public static function getConnection(): PDO {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $dbClient = env('DB_CLIENT', '');
        $databaseUrl = env('DATABASE_URL', '');
        $pgHost = env('PG_HOST', '');

        $usePostgres = ($dbClient === 'pg' || !empty($databaseUrl) || !empty($pgHost));

        if ($usePostgres) {
            self::$pdo = self::connectPostgres($databaseUrl);
        } else {
            self::$pdo = self::connectSqlite();
        }

        self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        return self::$pdo;
    }

    private static function connectSqlite(): PDO {
        $dbPath = env('DB_PATH', './data/parttrack.db');
        if (!str_starts_with($dbPath, '/') && !preg_match('/^[a-zA-Z]:\\\\/', $dbPath)) {
            $dbPath = dirname(__DIR__) . '/' . ltrim($dbPath, './');
        }

        $dir = dirname($dbPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        $pdo = new PDO("sqlite:" . $dbPath);
        $pdo->exec('PRAGMA foreign_keys = ON;');
        return $pdo;
    }

    private static function connectPostgres(string $databaseUrl): PDO {
        if (!empty($databaseUrl)) {
            $parsed = parse_url($databaseUrl);
            $host = $parsed['host'] ?? 'localhost';
            $port = $parsed['port'] ?? 5432;
            $dbname = ltrim($parsed['path'] ?? 'postgres', '/');
            $user = $parsed['user'] ?? 'postgres';
            $pass = $parsed['pass'] ?? '';
            $sslMode = 'require';
        } else {
            $host = env('PG_HOST', 'localhost');
            $port = env('PG_PORT', 5432);
            $dbname = env('PG_DATABASE', 'postgres');
            $user = env('PG_USER', 'postgres');
            $pass = env('PG_PASSWORD', '');
            $sslMode = env('PG_SSL', 'true') === 'false' ? 'disable' : 'require';
        }

        $dsn = "pgsql:host={$host};port={$port};dbname={$dbname};sslmode={$sslMode}";
        return new PDO($dsn, $user, $pass);
    }

    public static function isPostgres(): bool {
        $client = self::getConnection()->getAttribute(PDO::ATTR_DRIVER_NAME);
        return $client === 'pgsql';
    }
}
