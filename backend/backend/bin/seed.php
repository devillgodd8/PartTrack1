<?php

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

echo "Running PartTrack Database Seeder...\n";

$db = Database::getConnection();

$email = env('ADMIN_EMAIL', 'admin@parttrack.local');
$password = env('ADMIN_PASSWORD', 'ChangeMe123!');
$name = env('ADMIN_NAME', 'Admin');

$stmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
$stmt->execute([':email' => $email]);
$existing = $stmt->fetch();

if ($existing) {
    echo "Admin user \"{$email}\" already exists — skipping seed.\n";
    exit(0);
}

$passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
$id = Response::generateUuid();

$insert = $db->prepare("
    INSERT INTO users (id, name, email, password_hash, role, is_active, tracking_prefix)
    VALUES (:id, :name, :email, :password_hash, 'admin', 1, '10001')
");
$insert->execute([
    ':id' => $id,
    ':name' => $name,
    ':email' => $email,
    ':password_hash' => $passwordHash,
]);

echo "✓ Admin user created: {$email}\n";
