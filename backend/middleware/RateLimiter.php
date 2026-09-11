<?php

require_once __DIR__ . '/../utils/Response.php';

/**
 * File-backed sliding window IP rate limiter.
 */
class RateLimiter {
    private static string $cacheDir = __DIR__ . '/../data/cache/rate_limit';

    private static function initDir(): void {
        if (!is_dir(self::$cacheDir)) {
            mkdir(self::$cacheDir, 0777, true);
        }
    }

    public static function check(string $action, int $maxAttempts = 10, int $windowSeconds = 900, string $errorMessage = 'Too many requests. Please try again later.'): void {
        self::initDir();

        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $ipHash = md5($ip . '_' . $action);
        $file = self::$cacheDir . '/' . $ipHash . '.json';

        $now = time();
        $attempts = [];

        if (file_exists($file)) {
            $content = file_get_contents($file);
            $data = json_decode($content, true);
            if (is_array($data)) {
                // Filter out attempts older than window
                $attempts = array_filter($data, fn($timestamp) => ($now - $timestamp) < $windowSeconds);
            }
        }

        if (count($attempts) >= $maxAttempts) {
            Response::error($errorMessage, 429);
        }

        $attempts[] = $now;
        file_put_contents($file, json_encode($attempts));
    }

    public static function loginLimiter(): void {
        self::check('login', 10, 900, 'Too many login attempts. Please try again in 15 minutes.');
    }

    public static function otpLimiter(): void {
        self::check('otp', 5, 900, 'Too many OTP requests. Please wait a few minutes before trying again.');
    }
}
