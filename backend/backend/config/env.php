<?php

/**
 * Direct configuration for PartTrack PHP Backend.
 * Replaces external .env dependency by embedding settings directly in PHP,
 * while still allowing server-level environment variable overrides.
 */

function getAppConfig(): array {
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $config = [
        // Environment & Server
        'PORT' => 5000,
        'NODE_ENV' => 'production',

        // Endpoints
        'BACKEND_URL' => 'https://admin.reviorcm.com',
        'FRONTEND_URL' => 'https://parttract.vercel.app',
        'COOKIE_DOMAIN' => '',

        // JWT Authentication
        'JWT_SECRET' => 'parttrack-dev-secret-key-change-in-production',
        'JWT_EXPIRY' => '24h',

        // Database Configuration (MySQL on StackCP)
        'DB_CLIENT' => 'mysql',
        'MYSQL_HOST' => 'sdb-82.hosting.stackcp.net',
        'MYSQL_PORT' => 3306,
        'MYSQL_DATABASE' => 'parttrack-353038398dc7',
        'MYSQL_USER' => 'parttrack-353038398dc7',
        'MYSQL_PASSWORD' => 'd}-sB5b2:P+N',
        'DATABASE_URL' => 'mysql://parttrack-353038398dc7:d%7D-sB5b2%3AP%2BN@sdb-82.hosting.stackcp.net:3306/parttrack-353038398dc7',
        'DB_PATH' => dirname(__DIR__) . '/data/parttrack.db',
        'DB_FALLBACK_SQLITE' => true,

        // Initial Admin Account
        'ADMIN_NAME' => 'Admin',
        'ADMIN_EMAIL' => 'admin@parttrack.local',
        'ADMIN_PASSWORD' => 'ChangeMe123!',

        // Email / SMTP Configuration (for transactional OTP emails)
        'SMTP_HOST' => 'smtp.gmail.com',
        'SMTP_PORT' => 587,
        'SMTP_SECURE' => false,
        'SMTP_USER' => 'colsonomari98@gmail.com',
        'SMTP_PASS' => 'zxcdijdyjgdiiaxm',
        'SMTP_FROM' => '"PartTrack Support" <colsonomari98@gmail.com>',
    ];

    return $config;
}

/**
 * Backward-compatible no-op: does not require a physical .env file on disk.
 */
function loadEnv(?string $filePath = null): void {
    // If a physical file exists, optionally populate $_ENV, but no longer dependent on it
    if ($filePath !== null && file_exists($filePath)) {
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $name = trim($parts[0]);
                $val = trim($parts[1]);
                if ((str_starts_with($val, '"') && str_ends_with($val, '"')) ||
                    (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
                    $val = substr($val, 1, -1);
                }
                if (!isset($_SERVER[$name]) && !isset($_ENV[$name])) {
                    putenv("$name=$val");
                    $_ENV[$name] = $val;
                    $_SERVER[$name] = $val;
                }
            }
        }
    }
}

/**
 * Retrieves a configuration value.
 * Checks system environment first, falls back to embedded PHP config, then default argument.
 */
function env(string $key, mixed $default = null): mixed {
    $config = getAppConfig();

    // Check system environment overrides first
    $val = $_ENV[$key] ?? $_SERVER[$key] ?? (getenv($key) !== false ? getenv($key) : null);
    if ($val === null || $val === false) {
        $val = $config[$key] ?? $default;
    }

    if ($val === false || $val === null) {
        return $default;
    }

    if (is_string($val)) {
        if (strtolower($val) === 'true') return true;
        if (strtolower($val) === 'false') return false;
    }

    return $val;
}
