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
        if (isset($_SERVER[$serverKey])) {
            return $_SERVER[$serverKey];
        }

        // Apache mod_rewrite / FastCGI fallback (e.g. REDIRECT_HTTP_AUTHORIZATION)
        $redirectKey = 'REDIRECT_' . $serverKey;
        if (isset($_SERVER[$redirectKey])) {
            return $_SERVER[$redirectKey];
        }

        // Direct authorization key without HTTP_ prefix (some CGI servers)
        $plainKey = strtoupper(str_replace('-', '_', $name));
        if (isset($_SERVER[$plainKey])) {
            return $_SERVER[$plainKey];
        }

        return null;
    }

    public static function setCookie(string $name, string $value, int $maxAgeSeconds = 86400): void {
        $isProduction = env('NODE_ENV') === 'production';
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
            || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443)
            || $isProduction;

        $cookieDomain = env('COOKIE_DOMAIN', '');
        // For cross-domain authentication (e.g. frontend on one domain and admin.reviorcm.com on another):
        // Browsers require SameSite=None and Secure=true.
        $sameSite = $isHttps ? 'None' : 'Lax';
        $secure = $isHttps;

        $expires = gmdate('D, d M Y H:i:s T', time() + $maxAgeSeconds);
        $domainPart = !empty($cookieDomain) ? "; Domain={$cookieDomain}" : '';
        $securePart = $secure ? '; Secure' : '';
        $partitionedPart = ($secure && $sameSite === 'None') ? '; Partitioned' : '';

        // Emit raw Set-Cookie header to guarantee Partitioned and SameSite=None support across PHP versions
        $headerVal = "{$name}={$value}; Expires={$expires}; Max-Age={$maxAgeSeconds}; Path=/; HttpOnly; SameSite={$sameSite}{$domainPart}{$securePart}{$partitionedPart}";
        header("Set-Cookie: {$headerVal}", false);

        // Standard PHP setcookie fallback
        @setcookie($name, $value, [
            'expires' => time() + $maxAgeSeconds,
            'path' => '/',
            'domain' => $cookieDomain,
            'secure' => $secure,
            'httponly' => true,
            'samesite' => $sameSite,
        ]);
    }

    public static function clearCookie(string $name): void {
        $isProduction = env('NODE_ENV') === 'production';
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
            || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443)
            || $isProduction;

        $cookieDomain = env('COOKIE_DOMAIN', '');
        $sameSite = $isHttps ? 'None' : 'Lax';
        $secure = $isHttps;

        $expires = gmdate('D, d M Y H:i:s T', time() - 3600);
        $domainPart = !empty($cookieDomain) ? "; Domain={$cookieDomain}" : '';
        $securePart = $secure ? '; Secure' : '';
        $partitionedPart = ($secure && $sameSite === 'None') ? '; Partitioned' : '';

        $headerVal = "{$name}=; Expires={$expires}; Max-Age=0; Path=/; HttpOnly; SameSite={$sameSite}{$domainPart}{$securePart}{$partitionedPart}";
        header("Set-Cookie: {$headerVal}", false);

        @setcookie($name, '', [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => $cookieDomain,
            'secure' => $secure,
            'httponly' => true,
            'samesite' => $sameSite,
        ]);
    }

    public static function generateUuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // Version 4
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // Variant
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
