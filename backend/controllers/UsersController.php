<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../services/TrackingNumberService.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class UsersController {
    public static function index(): void {
        AuthMiddleware::authorize('admin');
        $db = Database::getConnection();

        $stmt = $db->query("
            SELECT id, name, email, role, is_active, created_at, tracking_prefix 
            FROM users 
            ORDER BY created_at DESC
        ");
        $users = $stmt->fetchAll();

        foreach ($users as &$u) {
            $u['is_active'] = (bool)$u['is_active'];
        }

        Response::json(['users' => $users]);
    }

    public static function show(string $id): void {
        AuthMiddleware::authorize('admin');
        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT id, name, email, role, is_active, created_at, tracking_prefix 
            FROM users 
            WHERE id = :id 
            LIMIT 1
        ");
        $stmt->execute([':id' => $id]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('User not found', 404);
        }

        $user['is_active'] = (bool)$user['is_active'];
        Response::json(['user' => $user]);
    }

    public static function create(): void {
        AuthMiddleware::authorize('admin');
        $body = Response::getBody();

        $validationError = Validator::validateCreateUser($body);
        if ($validationError) {
            Response::error($validationError, 400);
        }

        $db = Database::getConnection();
        $email = strtolower(trim($body['email']));

        $check = $db->prepare("SELECT id FROM users WHERE LOWER(email) = :email LIMIT 1");
        $check->execute([':email' => $email]);
        if ($check->fetch()) {
            Response::error('A user with this email already exists', 409);
        }

        $passwordHash = password_hash($body['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        $id = Response::generateUuid();
        $trackingPrefix = TrackingNumberService::generateUniqueUserPrefix($db);
        $role = $body['role'] ?? 'user';

        $insert = $db->prepare("
            INSERT INTO users (id, name, email, password_hash, role, is_active, tracking_prefix)
            VALUES (:id, :name, :email, :password_hash, :role, 1, :prefix)
        ");
        $insert->execute([
            ':id' => $id,
            ':name' => trim($body['name']),
            ':email' => $email,
            ':password_hash' => $passwordHash,
            ':role' => $role,
            ':prefix' => $trackingPrefix,
        ]);

        Response::json([
            'user' => [
                'id' => $id,
                'name' => trim($body['name']),
                'email' => $email,
                'role' => $role,
                'is_active' => true,
                'tracking_prefix' => $trackingPrefix,
            ],
        ], 201);
    }

    public static function update(string $id): void {
        AuthMiddleware::authorize('admin');
        $body = Response::getBody();

        $validationError = Validator::validateUpdateUser($body);
        if ($validationError) {
            Response::error($validationError, 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT id FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        if (!$stmt->fetch()) {
            Response::error('User not found', 404);
        }

        $fields = [];
        $params = [':id' => $id];

        if (array_key_exists('name', $body)) {
            $fields[] = "name = :name";
            $params[':name'] = trim($body['name']);
        }

        if (array_key_exists('email', $body)) {
            $email = strtolower(trim($body['email']));
            $check = $db->prepare("SELECT id FROM users WHERE LOWER(email) = :email AND id != :id LIMIT 1");
            $check->execute([':email' => $email, ':id' => $id]);
            if ($check->fetch()) {
                Response::error('A user with this email already exists', 409);
            }
            $fields[] = "email = :email";
            $params[':email'] = $email;
        }

        if (array_key_exists('role', $body)) {
            $fields[] = "role = :role";
            $params[':role'] = $body['role'];
        }

        if (array_key_exists('is_active', $body)) {
            $fields[] = "is_active = :is_active";
            $params[':is_active'] = filter_var($body['is_active'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        }

        if (empty($fields)) {
            Response::error('No fields to update', 400);
        }

        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
        $updateStmt = $db->prepare($sql);
        $updateStmt->execute($params);

        $fetch = $db->prepare("
            SELECT id, name, email, role, is_active, created_at, tracking_prefix 
            FROM users 
            WHERE id = :id
        ");
        $fetch->execute([':id' => $id]);
        $updated = $fetch->fetch();
        $updated['is_active'] = (bool)$updated['is_active'];

        Response::json(['user' => $updated]);
    }

    public static function deactivate(string $id): void {
        $currentUser = AuthMiddleware::authorize('admin');

        if ($id === $currentUser['id']) {
            Response::error('Cannot deactivate your own account', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT id FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        if (!$stmt->fetch()) {
            Response::error('User not found', 404);
        }

        $update = $db->prepare("UPDATE users SET is_active = 0 WHERE id = :id");
        $update->execute([':id' => $id]);

        Response::json(['message' => 'User deactivated']);
    }

    public static function resetPassword(string $id): void {
        AuthMiddleware::authorize('admin');
        $body = Response::getBody();

        $validationError = Validator::validateResetPassword($body);
        if ($validationError) {
            Response::error($validationError, 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT id FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        if (!$stmt->fetch()) {
            Response::error('User not found', 404);
        }

        $passwordHash = password_hash($body['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        $update = $db->prepare("UPDATE users SET password_hash = :hash WHERE id = :id");
        $update->execute([':hash' => $passwordHash, ':id' => $id]);

        Response::json(['message' => 'Password reset successfully']);
    }

    public static function delete(string $id): void {
        $currentUser = AuthMiddleware::authorize('admin');

        if ($id === $currentUser['id']) {
            Response::error('Cannot delete your own account', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT id FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        if (!$stmt->fetch()) {
            Response::error('User not found', 404);
        }

        $recordsCheck = $db->prepare("
            SELECT id FROM tracking_records 
            WHERE assigned_user_id = :id OR created_by_id = :id 
            LIMIT 1
        ");
        $recordsCheck->execute([':id' => $id]);
        if ($recordsCheck->fetch()) {
            Response::error('Cannot delete user with associated tracking records. Deactivate instead.', 409);
        }

        $del = $db->prepare("DELETE FROM users WHERE id = :id");
        $del->execute([':id' => $id]);

        Response::json(['message' => 'User deleted']);
    }
}
