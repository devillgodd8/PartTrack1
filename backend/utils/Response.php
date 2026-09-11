<?php

require_once __DIR__ . '/../config/env.php';

/**
 * HTTP Request and Response helper utility.
 */
class Response {
    public static function json(mixed $data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function error(string $message, int $statusCode = 400): void {
        self::json(['error' => $message], $statusCode);
    }

    public static function getBody(): array {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            return $_POST ?: [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    public static function getBearerToken(): ?string {
        $header = self::getHeader('Authorization');
        if (!$header) {
            return null;
        }
        if (preg_match('/Bearer\s+(\S+)/i', $header, $matches)) {
            return $matches[1];
        }
        return null;
    }

    public static function getHeader(string $name): ?string {
        $target = strtolower($name);
        $headers = function_exists('getallheaders') ? getallheaders() : [];

        foreach ($headers as $k => $v) {
            if (strtolower($k) === $target) {
                return $v;
            }
        }

        // Fallback to $_SERVER
        $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return $_SERVER[$serverKey] ?? null;
    }

    public static function setCookie(string $name, string $value, int $maxAgeSeconds = 86400): void {
        $isProduction = env('NODE_ENV') === 'production';
        
        // PHP setcookie with SameSite Lax and HttpOnly
        setcookie($name, $value, [
            'expires' => time() + $maxAgeSeconds,
            'path' => '/',
            'domain' => '',
            'secure' => $isProduction,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    public static function clearCookie(string $name): void {
        $isProduction = env('NODE_ENV') === 'production';

        setcookie($name, '', [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => '',
            'secure' => $isProduction,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    public static function generateUuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // Version 4
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // Variant
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
