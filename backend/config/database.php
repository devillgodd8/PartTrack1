<?php

require_once __DIR__ . '/env.php';

/**
 * Database connection provider using PDO.
 * Supports SQLite and PostgreSQL (with Supabase pooler auto-port retry and graceful fallback).
 */
class Database {
    private static ?PDO $pdo = null;

    public static function getConnection(): PDO {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $dbClient = strtolower((string)env('DB_CLIENT', ''));
        $databaseUrl = env('DATABASE_URL', '');
        $pgHost = env('PG_HOST', '');

        // If user explicitly configured SQLite, respect it
        if ($dbClient === 'sqlite' || $dbClient === 'sqlite3') {
            self::$pdo = self::connectSqlite();
            self::configurePdo(self::$pdo);
            return self::$pdo;
        }

        $usePostgres = ($dbClient === 'pg' || !empty($databaseUrl) || !empty($pgHost));

        if ($usePostgres) {
            try {
                self::$pdo = self::connectPostgres($databaseUrl);
            } catch (Throwable $e) {
                // If DB_FALLBACK_SQLITE is true, fall back to SQLite instead of crashing
                $allowFallback = env('DB_FALLBACK_SQLITE', true);
                if ($allowFallback) {
                    error_log("PostgreSQL connection failed: " . $e->getMessage() . ". Falling back to SQLite.");
                    self::$pdo = self::connectSqlite();
                } else {
                    throw $e;
                }
            }
        } else {
            self::$pdo = self::connectSqlite();
        }

        self::configurePdo(self::$pdo);
        return self::$pdo;
    }

    private static function configurePdo(PDO $pdo): void {
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
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

    private static function parseDatabaseUrl(string $url): array {
        // Robust regex for postgresql://[user]:[password]@[host]:[port]/[database]
        // Correctly handles special characters in passwords such as '@', '$', '!'
        if (preg_match('#^postgres(?:ql)?://([^:]+):(.*)@([^:/]+)(?::(\d+))?/(.+)$#', $url, $m)) {
            $dbname = explode('?', $m[5])[0];
            return [
                'user' => urldecode($m[1]),
                'pass' => urldecode($m[2]),
                'host' => $m[3],
                'port' => !empty($m[4]) ? (int)$m[4] : 5432,
                'dbname' => $dbname,
            ];
        }

        $parsed = parse_url($url);
        return [
            'user' => $parsed['user'] ?? 'postgres',
            'pass' => $parsed['pass'] ?? '',
            'host' => $parsed['host'] ?? 'localhost',
            'port' => isset($parsed['port']) ? (int)$parsed['port'] : 5432,
            'dbname' => ltrim($parsed['path'] ?? 'postgres', '/'),
        ];
    }

    private static function connectPostgres(string $databaseUrl): PDO {
        if (!empty($databaseUrl)) {
            $config = self::parseDatabaseUrl($databaseUrl);
            $host = $config['host'];
            $port = $config['port'];
            $dbname = $config['dbname'];
            $user = $config['user'];
            $pass = $config['pass'];
            $sslMode = 'require';
        } else {
            $host = env('PG_HOST', 'localhost');
            $port = (int)env('PG_PORT', 5432);
            $dbname = env('PG_DATABASE', 'postgres');
            $user = env('PG_USER', 'postgres');
            $pass = env('PG_PASSWORD', '');
            $sslMode = env('PG_SSL', 'true') === 'false' ? 'disable' : 'require';
        }

        // Determine candidate ports (Supabase pooler uses 6543 for Transaction mode)
        $candidatePorts = [$port];
        if (str_contains($host, 'pooler.supabase.com')) {
            if ($port === 5432) {
                $candidatePorts = [6543, 5432];
            } else {
                $candidatePorts = [$port, 6543];
            }
            $candidatePorts = array_values(array_unique($candidatePorts));
        }

        $lastException = null;

        foreach ($candidatePorts as $p) {
            try {
                $dsn = "pgsql:host={$host};port={$p};dbname={$dbname};sslmode={$sslMode};connect_timeout=5";
                $pdo = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_TIMEOUT => 5,
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                ]);
                return $pdo;
            } catch (Throwable $e) {
                $lastException = $e;
                error_log("Failed connecting to PostgreSQL on {$host}:{$p} - " . $e->getMessage());
            }
        }

        throw new Exception(
            "Could not connect to PostgreSQL on {$host} (tried ports: " . implode(', ', $candidatePorts) . "). " .
            "Error: " . ($lastException ? $lastException->getMessage() : 'Unknown error') . ". " .
            "Tip: If using Supabase Pooler, ensure port 6543 is used or verify that your host firewall allows outbound database traffic."
        );
    }

    public static function isPostgres(): bool {
        $client = self::getConnection()->getAttribute(PDO::ATTR_DRIVER_NAME);
        return $client === 'pgsql';
    }
}
