<?php

require_once __DIR__ . '/../services/JwtService.php';
require_once __DIR__ . '/../utils/Response.php';

/**
 * Authentication and authorization middleware.
 */
class AuthMiddleware {
    private static ?array $currentUser = null;

    public static function authenticate(): array {
        if (self::$currentUser !== null) {
            return self::$currentUser;
        }

        $token = $_COOKIE['token'] ?? Response::getBearerToken();

        if (empty($token)) {
            Response::error('Authentication required', 401);
        }

        $decoded = JwtService::verify($token);
        if (!$decoded) {
            Response::error('Invalid or expired token', 401);
        }

        self::$currentUser = $decoded;
        return self::$currentUser;
    }

    public static function authorize(string ...$roles): array {
        $user = self::authenticate();

        if (!in_array($user['role'] ?? '', $roles, true)) {
            Response::error('Insufficient permissions', 403);
        }

        return $user;
    }

    public static function getCurrentUser(): ?array {
        return self::$currentUser;
    }

    public static function setCurrentUser(?array $user): void {
        self::$currentUser = $user;
    }
}
