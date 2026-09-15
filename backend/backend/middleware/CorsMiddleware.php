<?php

require_once __DIR__ . '/../config/env.php';

/**
 * Handles CORS headers and OPTIONS preflight requests.
 */
class CorsMiddleware {
    public static function handle(string $uri): void {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $isPublicTracking = str_starts_with($uri, '/api/v1/track');

        header('Vary: Origin');

        if ($isPublicTracking) {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, Accept, Origin, X-Requested-With');
        } else {
            $allowedOrigin = env('FRONTEND_URL', 'https://parttract.vercel.app');
            
            // Allow origin dynamically with credentials support
            if (!empty($origin)) {
                header("Access-Control-Allow-Origin: {$origin}");
            } else {
                header("Access-Control-Allow-Origin: {$allowedOrigin}");
            }

            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, Accept, Origin, X-Requested-With, Cache-Control, Pragma');
            header('Access-Control-Expose-Headers: Set-Cookie, Authorization, X-Debug-Auth-Failure, X-Debug-Auth-Success, X-Debug-Server');
            header('Access-Control-Max-Age: 86400');
        }

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
