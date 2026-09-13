<?php

require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/database.php';

echo "Running PartTrack Database Migrations (PHP / PDO)...\n";

$db = Database::getConnection();
$isPg = Database::isPostgres();

$boolType = $isPg ? 'BOOLEAN' : 'INTEGER';
$timestampType = $isPg ? 'TIMESTAMP WITH TIME ZONE' : 'TIMESTAMP';

// 1. users table
$db->exec("
    CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        is_active {$boolType} NOT NULL DEFAULT 1,
        tracking_prefix VARCHAR(5) UNIQUE,
        created_at {$timestampType} DEFAULT CURRENT_TIMESTAMP
    );
");
echo "✓ Users table checked/created\n";

// 2. tracking_records table
$db->exec("
    CREATE TABLE IF NOT EXISTS tracking_records (
        id VARCHAR(36) PRIMARY KEY,
        tracking_number VARCHAR(50) NOT NULL UNIQUE,
        part_type VARCHAR(50) NOT NULL,
        vehicle_make VARCHAR(100) NOT NULL,
        vehicle_model VARCHAR(100) NOT NULL,
        vehicle_year INTEGER NOT NULL,
        vin VARCHAR(50) NULL,
        part_stock_number VARCHAR(100) NOT NULL,
        shipment_origin VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        current_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        estimated_delivery_date DATE NULL,
        notes TEXT NULL,
        assigned_user_id VARCHAR(36) NOT NULL REFERENCES users(id),
        created_by_id VARCHAR(36) NOT NULL REFERENCES users(id),
        date_created {$timestampType} DEFAULT CURRENT_TIMESTAMP,
        last_updated {$timestampType} DEFAULT CURRENT_TIMESTAMP
    );
");
echo "✓ Tracking records table checked/created\n";

// 3. status_history table
$db->exec("
    CREATE TABLE IF NOT EXISTS status_history (
        id VARCHAR(36) PRIMARY KEY,
        tracking_record_id VARCHAR(36) NOT NULL REFERENCES tracking_records(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        notes TEXT NULL,
        updated_by_id VARCHAR(36) NOT NULL REFERENCES users(id),
        updated_at {$timestampType} DEFAULT CURRENT_TIMESTAMP
    );
");
echo "✓ Status history table checked/created\n";

// 4. otps table
$db->exec("
    CREATE TABLE IF NOT EXISTS otps (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        type VARCHAR(50) NOT NULL,
        payload TEXT NULL,
        expires_at {$timestampType} NOT NULL,
        created_at {$timestampType} DEFAULT CURRENT_TIMESTAMP
    );
");
echo "✓ OTPs table checked/created\n";

// 5. api_keys table
$db->exec("
    CREATE TABLE IF NOT EXISTS api_keys (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        key_hash VARCHAR(64) NOT NULL UNIQUE,
        key_prefix VARCHAR(32) NOT NULL,
        permissions VARCHAR(50) NOT NULL DEFAULT 'read:tracking',
        is_active {$boolType} NOT NULL DEFAULT 1,
        last_used_at {$timestampType} NULL,
        created_at {$timestampType} DEFAULT CURRENT_TIMESTAMP
    );
");
echo "✓ API keys table checked/created\n";

// Create indexes
try {
    $db->exec("CREATE INDEX IF NOT EXISTS idx_otps_email_type ON otps (email, type);");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys (key_hash);");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys (user_id);");
    echo "✓ Indexes checked/created\n";
} catch (Throwable $e) {
    // Indexes might already exist or alternate syntax
}

echo "All migrations completed successfully.\n";
