<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../services/JwtService.php';
require_once __DIR__ . '/../services/OtpService.php';
require_once __DIR__ . '/../services/EmailService.php';
require_once __DIR__ . '/../services/TrackingNumberService.php';
require_once __DIR__ . '/../middleware/RateLimiter.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class AuthController {
    public static function login(): void {
        RateLimiter::loginLimiter();

        $body = Response::getBody();
        $validationError = Validator::validateLogin($body);
        if ($validationError) {
            Response::error($validationError, 400);
        }

        $email = strtolower(trim($body['email']));
        $password = $body['password'];

        header('X-Debug-Server: PHP-PartTrack');
        error_log("[Auth Diagnostic] Login attempt for email: '{$email}' from IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM users WHERE LOWER(email) = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user) {
            header('X-Debug-Auth-Failure: UserNotFound');
            error_log("[Auth Diagnostic] User not found for email: '{$email}'");
            Response::error('Invalid email or password', 401);
        }

        if (!$user['is_active']) {
            header('X-Debug-Auth-Failure: AccountDeactivated');
            error_log("[Auth Diagnostic] Account '{$email}' is marked inactive (is_active=" . var_export($user['is_active'], true) . ")");
            Response::error('Account is deactivated. Contact your administrator.', 403);
        }

        if (!password_verify($password, $user['password_hash'])) {
            header('X-Debug-Auth-Failure: PasswordMismatch');
            error_log("[Auth Diagnostic] Password mismatch for user: '{$email}'");
            Response::error('Invalid email or password', 401);
        }

        header('X-Debug-Auth-Success: true');
        error_log("[Auth Diagnostic] Login successful for user: '{$email}' (role: {$user['role']})");

        $trackingPrefix = $user['tracking_prefix'] ?: TrackingNumberService::ensureUserPrefix($db, $user['id']);

        $payload = [
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'name' => $user['name'],
            'tracking_prefix' => $trackingPrefix,
        ];

        $token = JwtService::sign($payload, 86400);
        Response::setCookie('token', $token, 86400);

        Response::json([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'tracking_prefix' => $trackingPrefix,
            ],
        ]);
    }

    public static function logout(): void {
        Response::clearCookie('token');
        Response::json(['message' => 'Logged out']);
    }

    public static function me(): void {
        $currentUser = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT id, name, email, role, is_active, tracking_prefix 
            FROM users 
            WHERE id = :id 
            LIMIT 1
        ");
        $stmt->execute([':id' => $currentUser['id']]);
        $user = $stmt->fetch();

        if (!$user || !$user['is_active']) {
            Response::clearCookie('token');
            Response::error('Account not found or deactivated', 401);
        }

        if (empty($user['tracking_prefix'])) {
            $user['tracking_prefix'] = TrackingNumberService::ensureUserPrefix($db, $user['id']);
        }

        $user['is_active'] = (bool)$user['is_active'];

        Response::json(['user' => $user]);
    }

    public static function signupRequestOtp(): void {
        RateLimiter::otpLimiter();

        $body = Response::getBody();
        $validationError = Validator::validateSignupRequest($body);
        if ($validationError) {
            Response::error($validationError, 400);
        }

        $name = trim($body['name']);
        $email = strtolower(trim($body['email']));
        $password = $body['password'];

        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT id FROM users WHERE LOWER(email) = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        if ($stmt->fetch()) {
            Response::error('An account with this email already exists', 400);
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

        $otp = OtpService::generateAndStoreOtp($db, $email, 'signup', [
            'name' => $name,
            'password_hash' => $passwordHash,
        ]);

        EmailService::sendSignupOtpEmail($email, $otp['otpCode']);

        Response::json([
            'message' => 'Verification code sent to your email',
            'email' => $email,
        ]);
    }

    public static function signupVerifyOtp(): void {
        $body = Response::getBody();
        $validationError = Validator::validateSignupVerify($body);
        if ($validationError) {
            Response::error($validationError, 400);
        }

        $email = strtolower(trim($body['email']));
        $otp = trim((string)$body['otp']);

        $db = Database::getConnection();

        $verification = OtpService::verifyOtp($db, $email, 'signup', $otp);
        if (!$verification['valid']) {
            Response::error($verification['error'], 400);
        }

        $payload = $verification['payload'];
        if (!$payload || empty($payload['name']) || empty($payload['password_hash'])) {
            Response::error('Registration session expired. Please sign up again.', 400);
        }

        // Check if user exists
        $stmt = $db->prepare("SELECT id FROM users WHERE LOWER(email) = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        if ($stmt->fetch()) {
            OtpService::consumeOtp($db, $verification['otpId']);
            Response::error('An account with this email already exists', 400);
        }

        $trackingPrefix = TrackingNumberService::generateUniqueUserPrefix($db);
        $newId = Response::generateUuid();

        $insert = $db->prepare("
            INSERT INTO users (id, name, email, password_hash, role, is_active, tracking_prefix)
            VALUES (:id, :name, :email, :password_hash, 'user', 1, :prefix)
        ");
        $insert->execute([
            ':id' => $newId,
            ':name' => $payload['name'],
            ':email' => $email,
            ':password_hash' => $payload['password_hash'],
            ':prefix' => $trackingPrefix,
        ]);

        OtpService::consumeOtp($db, $verification['otpId']);

        $tokenPayload = [
            'id' => $newId,
            'email' => $email,
            'role' => 'user',
            'name' => $payload['name'],
            'tracking_prefix' => $trackingPrefix,
        ];

        $token = JwtService::sign($tokenPayload, 86400);
        Response::setCookie('token', $token, 86400);

        Response::json([
            'message' => 'Account created successfully',
            'token' => $token,
            'user' => $tokenPayload,
        ], 201);
    }

    public static function forgotPasswordRequestOtp(): void {
        RateLimiter::otpLimiter();

        $body = Response::getBody();
        $validationError = Validator::validateForgotPasswordRequest($body);
        if ($validationError) {
            Response::error($validationError, 400);
        }

        $email = strtolower(trim($body['email']));
        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT id, is_active FROM users WHERE LOWER(email) = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('No account found with this email address', 404);
        }

        if (!$user['is_active']) {
            Response::error('Account is deactivated. Contact your administrator.', 403);
        }

        $otp = OtpService::generateAndStoreOtp($db, $email, 'forgot_password');
        EmailService::sendForgotPasswordOtpEmail($email, $otp['otpCode']);

        Response::json([
            'message' => 'Password reset code sent to your email',
            'email' => $email,
        ]);
    }

    public static function forgotPasswordVerifyOtp(): void {
        $body = Response::getBody();
        $validationError = Validator::validateForgotPasswordVerify($body);
        if ($validationError) {
            Response::error($validationError, 400);
        }

        $email = strtolower(trim($body['email']));
        $otp = trim((string)$body['otp']);
        $password = $body['password'];

        $db = Database::getConnection();

        $verification = OtpService::verifyOtp($db, $email, 'forgot_password', $otp);
        if (!$verification['valid']) {
            Response::error($verification['error'], 400);
        }

        $stmt = $db->prepare("SELECT id FROM users WHERE LOWER(email) = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('Account not found', 404);
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $update = $db->prepare("UPDATE users SET password_hash = :hash WHERE id = :id");
        $update->execute([':hash' => $passwordHash, ':id' => $user['id']]);

        OtpService::consumeOtp($db, $verification['otpId']);

        Response::json([
            'message' => 'Password reset successfully. You can now sign in with your new password.',
        ]);
    }
}
