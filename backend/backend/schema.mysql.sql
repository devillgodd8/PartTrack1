-- ==============================================================================
-- PartTrack — Complete MySQL / MariaDB Database Schema & Initial Seed Data
-- Character Set: utf8mb4, Engine: InnoDB
-- Compatible with: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. Table: users
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `status_history`;
DROP TABLE IF EXISTS `tracking_records`;
DROP TABLE IF EXISTS `api_keys`;
DROP TABLE IF EXISTS `otps`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'user',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `tracking_prefix` VARCHAR(5) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_email` (`email`),
    UNIQUE KEY `uk_users_tracking_prefix` (`tracking_prefix`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table: tracking_records
-- ------------------------------------------------------------------------------
CREATE TABLE `tracking_records` (
    `id` VARCHAR(36) NOT NULL,
    `tracking_number` VARCHAR(50) NOT NULL,
    `part_type` VARCHAR(50) NOT NULL,
    `vehicle_make` VARCHAR(100) NOT NULL,
    `vehicle_model` VARCHAR(100) NOT NULL,
    `vehicle_year` INT NOT NULL,
    `vin` VARCHAR(50) DEFAULT NULL,
    `part_stock_number` VARCHAR(100) NOT NULL,
    `shipment_origin` VARCHAR(255) NOT NULL,
    `destination` VARCHAR(255) NOT NULL,
    `current_status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
    `estimated_delivery_date` DATE DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `assigned_user_id` VARCHAR(36) NOT NULL,
    `created_by_id` VARCHAR(36) NOT NULL,
    `date_created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_tracking_records_tracking_number` (`tracking_number`),
    KEY `idx_tracking_assigned_user` (`assigned_user_id`),
    KEY `idx_tracking_created_by` (`created_by_id`),
    CONSTRAINT `fk_tracking_assigned_user` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `fk_tracking_created_by` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table: status_history
-- ------------------------------------------------------------------------------
CREATE TABLE `status_history` (
    `id` VARCHAR(36) NOT NULL,
    `tracking_record_id` VARCHAR(36) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `notes` TEXT DEFAULT NULL,
    `updated_by_id` VARCHAR(36) NOT NULL,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_history_tracking_record` (`tracking_record_id`),
    KEY `idx_history_updated_by` (`updated_by_id`),
    CONSTRAINT `fk_history_tracking_record` FOREIGN KEY (`tracking_record_id`) REFERENCES `tracking_records` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_history_updated_by` FOREIGN KEY (`updated_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table: otps
-- ------------------------------------------------------------------------------
CREATE TABLE `otps` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `otp_code` VARCHAR(10) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `payload` TEXT DEFAULT NULL,
    `expires_at` DATETIME NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_otps_email_type` (`email`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table: api_keys
-- ------------------------------------------------------------------------------
CREATE TABLE `api_keys` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `key_hash` VARCHAR(64) NOT NULL,
    `key_prefix` VARCHAR(32) NOT NULL,
    `permissions` VARCHAR(50) NOT NULL DEFAULT 'read:tracking',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `last_used_at` DATETIME DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_api_keys_hash` (`key_hash`),
    KEY `idx_api_keys_user` (`user_id`),
    CONSTRAINT `fk_api_keys_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- Initial Seed: Default Admin User
-- Email: admin@parttrack.local
-- Password: ChangeMe123!
-- ------------------------------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `is_active`, `tracking_prefix`, `created_at`)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Admin',
    'admin@parttrack.local',
    '$2b$12$5OZa7bWJqFHKG9id/2Gk5.3Ie02oeLOX1hrxXz5Qv5NNz3eUuay3W',
    'admin',
    1,
    '10001',
    NOW()
)
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);
