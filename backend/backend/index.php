<?php

// Front controller & router for PartTrack PHP backend
error_reporting(E_ALL);
ini_set('display_errors', '0');

require_once __DIR__ . '/config/env.php';

require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/middleware/CorsMiddleware.php';
require_once __DIR__ . '/controllers/HealthController.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/UsersController.php';
require_once __DIR__ . '/controllers/TrackingController.php';
require_once __DIR__ . '/controllers/ActivityController.php';
require_once __DIR__ . '/controllers/DashboardController.php';
require_once __DIR__ . '/controllers/ApiKeysController.php';
require_once __DIR__ . '/controllers/PublicTrackingController.php';

// Extract URI path
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$rawPath = parse_url($requestUri, PHP_URL_PATH) ?? '/';

// 1. Prefer PATH_INFO if available (e.g. when executing /backend/index.php/api/...)
if (!empty($_SERVER['PATH_INFO'])) {
    $path = $_SERVER['PATH_INFO'];
} elseif (!empty($_GET['route'])) {
    $path = $_GET['route'];
} elseif (!empty($_GET['path'])) {
    $path = $_GET['path'];
} else {
    // 2. Strip directory prefixes like /backend/backend or /backend, and optional /index.php
    $cleanPath = preg_replace('#^/(?:backend/)*(?:index\.php)?/?#', '/', $rawPath);
    $path = ($cleanPath === '' || $cleanPath === false) ? '/' : $cleanPath;
}

// Ensure leading slash
if (!str_starts_with($path, '/')) {
    $path = '/' . $path;
}
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Handle CORS
CorsMiddleware::handle($path);

// Global exception handling
try {
    // 1. Health check
    if ($path === '/api/health' && $method === 'GET') {
        HealthController::check();
    }

    // 2. Auth routes
    if ($path === '/api/auth/login' && $method === 'POST') {
        AuthController::login();
    }
    if ($path === '/api/auth/logout' && $method === 'POST') {
        AuthController::logout();
    }
    if ($path === '/api/auth/me' && $method === 'GET') {
        AuthController::me();
    }
    if ($path === '/api/auth/signup/request-otp' && $method === 'POST') {
        AuthController::signupRequestOtp();
    }
    if ($path === '/api/auth/signup/verify-otp' && $method === 'POST') {
        AuthController::signupVerifyOtp();
    }
    if ($path === '/api/auth/forgot-password/request-otp' && $method === 'POST') {
        AuthController::forgotPasswordRequestOtp();
    }
    if ($path === '/api/auth/forgot-password/verify-otp' && $method === 'POST') {
        AuthController::forgotPasswordVerifyOtp();
    }

    // 3. User routes
    if ($path === '/api/users' && $method === 'GET') {
        UsersController::index();
    }
    if ($path === '/api/users' && $method === 'POST') {
        UsersController::create();
    }
    if (preg_match('#^/api/users/([^/]+)/deactivate$#', $path, $matches) && $method === 'PUT') {
        UsersController::deactivate($matches[1]);
    }
    if (preg_match('#^/api/users/([^/]+)/reset-password$#', $path, $matches) && $method === 'PUT') {
        UsersController::resetPassword($matches[1]);
    }
    if (preg_match('#^/api/users/([^/]+)$#', $path, $matches)) {
        $id = $matches[1];
        if ($method === 'GET') {
            UsersController::show($id);
        } elseif ($method === 'PUT') {
            UsersController::update($id);
        } elseif ($method === 'DELETE') {
            UsersController::delete($id);
        }
    }

    // 4. Tracking routes
    if ($path === '/api/tracking' && $method === 'GET') {
        TrackingController::index();
    }
    if ($path === '/api/tracking' && $method === 'POST') {
        TrackingController::create();
    }
    if (preg_match('#^/api/tracking/lookup/([^/]+)$#', $path, $matches) && $method === 'GET') {
        TrackingController::lookup($matches[1]);
    }
    if (preg_match('#^/api/tracking/([^/]+)/status$#', $path, $matches) && $method === 'POST') {
        TrackingController::updateStatus($matches[1]);
    }
    if (preg_match('#^/api/tracking/([^/]+)$#', $path, $matches)) {
        $id = $matches[1];
        if ($method === 'GET') {
            TrackingController::show($id);
        } elseif ($method === 'PUT') {
            TrackingController::update($id);
        } elseif ($method === 'DELETE') {
            TrackingController::delete($id);
        }
    }

    // 5. Activity log
    if ($path === '/api/activity' && $method === 'GET') {
        ActivityController::index();
    }

    // 6. Dashboard
    if ($path === '/api/dashboard/stats' && $method === 'GET') {
        DashboardController::stats();
    }

    // 7. API Keys
    if ($path === '/api/keys' && $method === 'GET') {
        ApiKeysController::index();
    }
    if ($path === '/api/keys' && $method === 'POST') {
        ApiKeysController::create();
    }
    if (preg_match('#^/api/keys/([^/]+)$#', $path, $matches) && $method === 'DELETE') {
        ApiKeysController::delete($matches[1]);
    }

    // 8. Public tracking API (/api/v1/track or /api/v1/track/:number)
    if (preg_match('#^/api/v1/track(?:/([^/]+))?$#', $path, $matches) && $method === 'GET') {
        $trackNum = $matches[1] ?? null;
        PublicTrackingController::track($trackNum);
    }

    // Not found
    Response::error("Route not found: {$method} {$path}", 404);

} catch (Throwable $e) {
    error_log("PartTrack Unhandled Exception: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    Response::error($e->getMessage() ?: 'Internal server error', 500);
}
