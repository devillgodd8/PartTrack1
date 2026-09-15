<?php

require_once __DIR__ . '/Constants.php';

/**
 * Validation utility matching express-validator rules in the original Node backend.
 */
class Validator {
    public static function validateLogin(array $data): ?string {
        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return 'Valid email is required';
        }
        if (empty($data['password'])) {
            return 'Password is required';
        }
        return null;
    }

    public static function validateCreateUser(array $data): ?string {
        if (empty(trim($data['name'] ?? ''))) {
            return 'Name is required';
        }
        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return 'Valid email is required';
        }
        if (empty($data['password']) || strlen($data['password']) < 8) {
            return 'Password must be at least 8 characters';
        }
        if (isset($data['role']) && !in_array($data['role'], ['admin', 'user'], true)) {
            return 'Role must be admin or user';
        }
        return null;
    }

    public static function validateUpdateUser(array $data): ?string {
        if (array_key_exists('name', $data) && empty(trim($data['name']))) {
            return 'Name cannot be empty';
        }
        if (array_key_exists('email', $data) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return 'Valid email is required';
        }
        if (array_key_exists('role', $data) && !in_array($data['role'], ['admin', 'user'], true)) {
            return 'Role must be admin or user';
        }
        if (array_key_exists('is_active', $data) && !is_bool($data['is_active']) && !in_array($data['is_active'], [0, 1, '0', '1', 'true', 'false'], true)) {
            return 'is_active must be boolean';
        }
        return null;
    }

    public static function validateResetPassword(array $data): ?string {
        if (empty($data['password']) || strlen($data['password']) < 8) {
            return 'Password must be at least 8 characters';
        }
        return null;
    }

    public static function validateCreateTracking(array $data): ?string {
        $currentYear = (int)date('Y');

        if (!empty($data['tracking_number']) && !preg_match('/^\d{12}$/', trim($data['tracking_number']))) {
            return 'Tracking number must be exactly 12 numeric digits';
        }
        if (empty($data['part_type']) || !in_array($data['part_type'], Constants::PART_TYPES, true)) {
            return 'Part type must be one of: ' . implode(', ', Constants::PART_TYPES);
        }
        if (empty(trim($data['vehicle_make'] ?? ''))) {
            return 'Vehicle make is required';
        }
        if (empty(trim($data['vehicle_model'] ?? ''))) {
            return 'Vehicle model is required';
        }
        $year = (int)($data['vehicle_year'] ?? 0);
        if ($year < 1900 || $year > ($currentYear + 2)) {
            return "Vehicle year must be between 1900 and " . ($currentYear + 2);
        }
        if (!empty($data['vin'])) {
            $vin = trim($data['vin']);
            if (strlen($vin) !== 17 || !ctype_alnum($vin)) {
                return 'VIN must be exactly 17 characters and contain only letters and numbers';
            }
        }
        if (empty(trim($data['part_stock_number'] ?? ''))) {
            return 'Part stock number is required';
        }
        if (empty(trim($data['shipment_origin'] ?? ''))) {
            return 'Shipment origin is required';
        }
        if (empty(trim($data['destination'] ?? ''))) {
            return 'Destination is required';
        }
        if (!empty($data['current_status']) && !in_array($data['current_status'], Constants::STATUSES, true)) {
            return 'Status must be one of: ' . implode(', ', Constants::STATUSES);
        }
        if (!empty($data['estimated_delivery_date'])) {
            if (!strtotime($data['estimated_delivery_date'])) {
                return 'Invalid date format';
            }
        }
        if (empty(trim($data['customer_name'] ?? ''))) {
            return 'Customer name is required';
        }
        if (mb_strlen(trim($data['customer_name'])) > 255) {
            return 'Customer name cannot exceed 255 characters';
        }
        if (empty(trim($data['customer_number'] ?? ''))) {
            return 'Customer number is required';
        }
        if (mb_strlen(trim($data['customer_number'])) > 100) {
            return 'Customer number cannot exceed 100 characters';
        }
        if (!empty($data['assigned_user_id']) && !self::isValidUuid($data['assigned_user_id'])) {
            return 'Invalid user ID';
        }
        return null;
    }

    public static function validateUpdateTracking(array $data): ?string {
        $currentYear = (int)date('Y');

        if (array_key_exists('part_type', $data) && !in_array($data['part_type'], Constants::PART_TYPES, true)) {
            return 'Part type must be one of: ' . implode(', ', Constants::PART_TYPES);
        }
        if (array_key_exists('vehicle_make', $data) && empty(trim($data['vehicle_make']))) {
            return 'Vehicle make cannot be empty';
        }
        if (array_key_exists('vehicle_model', $data) && empty(trim($data['vehicle_model']))) {
            return 'Vehicle model cannot be empty';
        }
        if (array_key_exists('vehicle_year', $data)) {
            $year = (int)$data['vehicle_year'];
            if ($year < 1900 || $year > ($currentYear + 2)) {
                return "Vehicle year must be between 1900 and " . ($currentYear + 2);
            }
        }
        if (!empty($data['vin'])) {
            $vin = trim($data['vin']);
            if (strlen($vin) !== 17 || !ctype_alnum($vin)) {
                return 'VIN must be exactly 17 characters and contain only letters and numbers';
            }
        }
        if (array_key_exists('part_stock_number', $data) && empty(trim($data['part_stock_number']))) {
            return 'Part stock number cannot be empty';
        }
        if (array_key_exists('shipment_origin', $data) && empty(trim($data['shipment_origin']))) {
            return 'Shipment origin cannot be empty';
        }
        if (array_key_exists('destination', $data) && empty(trim($data['destination']))) {
            return 'Destination cannot be empty';
        }
        if (!empty($data['estimated_delivery_date'])) {
            if (!strtotime($data['estimated_delivery_date'])) {
                return 'Invalid date format';
            }
        }
        if (!empty($data['customer_name']) && mb_strlen(trim($data['customer_name'])) > 255) {
            return 'Customer name cannot exceed 255 characters';
        }
        if (!empty($data['customer_number']) && mb_strlen(trim($data['customer_number'])) > 100) {
            return 'Customer number cannot exceed 100 characters';
        }
        if (!empty($data['assigned_user_id']) && !self::isValidUuid($data['assigned_user_id'])) {
            return 'Invalid user ID';
        }
        return null;
    }

    public static function validateStatusUpdate(array $data): ?string {
        if (empty($data['status']) || !in_array($data['status'], Constants::STATUSES, true)) {
            return 'Status must be one of: ' . implode(', ', Constants::STATUSES);
        }
        return null;
    }

    public static function validateSignupRequest(array $data): ?string {
        if (empty(trim($data['name'] ?? ''))) {
            return 'Name is required';
        }
        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return 'Valid email is required';
        }
        if (empty($data['password']) || strlen($data['password']) < 8) {
            return 'Password must be at least 8 characters';
        }
        return null;
    }

    public static function validateSignupVerify(array $data): ?string {
        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return 'Valid email is required';
        }
        $otp = trim($data['otp'] ?? '');
        if (strlen($otp) !== 6 || !ctype_digit($otp)) {
            return 'Verification code must be 6 digits and numeric';
        }
        return null;
    }

    public static function validateForgotPasswordRequest(array $data): ?string {
        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return 'Valid email is required';
        }
        return null;
    }

    public static function validateForgotPasswordVerify(array $data): ?string {
        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return 'Valid email is required';
        }
        $otp = trim($data['otp'] ?? '');
        if (strlen($otp) !== 6 || !ctype_digit($otp)) {
            return 'Verification code must be 6 digits and numeric';
        }
        if (empty($data['password']) || strlen($data['password']) < 8) {
            return 'Password must be at least 8 characters';
        }
        return null;
    }

    public static function isValidUuid(string $uuid): bool {
        return (bool)preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $uuid);
    }
}
