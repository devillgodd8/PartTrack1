<?php

/**
 * Lightweight .env file loader.
 */
function loadEnv(string $filePath): void {
    if (!file_exists($filePath)) {
        return;
    }

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

            // Strip surrounding quotes
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

function env(string $key, mixed $default = null): mixed {
    $val = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
    if ($val === false || $val === null) {
        return $default;
    }
    if (strtolower($val) === 'true') return true;
    if (strtolower($val) === 'false') return false;
    return $val;
}
