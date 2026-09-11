<?php

require_once __DIR__ . '/../config/env.php';

/**
 * Handles CORS headers and OPTIONS preflight requests.
 */
class CorsMiddleware {
    public static function handle(string $uri): void {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $isPublicTracking = str_starts_with($uri, '/api/v1/track');

        if ($isPublicTracking) {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, Accept, Origin');
        } else {
            $allowedOrigin = env('FRONTEND_URL', 'http://localhost:5173');
            
            // Allow localhost during development or matching configured origin
            if (!empty($origin)) {
                header("Access-Control-Allow-Origin: {$origin}");
            } else {
                header("Access-Control-Allow-Origin: {$allowedOrigin}");
            }

            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, Accept, Origin');
        }

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
