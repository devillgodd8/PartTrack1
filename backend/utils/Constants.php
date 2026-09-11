<?php

/**
 * Application constants — status enums, part types, roles.
 */
class Constants {
    public const STATUSES = [
        'Pending',
        'Processing',
        'Picked Up',
        'In Transit',
        'Out for Delivery',
        'Delayed',
        'Delivered',
        'Cancelled',
        'On Hold',
    ];

    public const PART_TYPES = [
        'Engine',
        'Transmission',
        'Other',
    ];

    public const ROLE_ADMIN = 'admin';
    public const ROLE_USER = 'user';
    public const ROLES = ['admin', 'user'];
}
