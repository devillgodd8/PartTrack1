<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class DashboardController {
    public static function stats(): void {
        $currentUser = AuthMiddleware::authenticate();
        $db = Database::getConnection();
        $isAdmin = ($currentUser['role'] === 'admin');

        $userFilter = $isAdmin ? "" : "WHERE assigned_user_id = :uid";
        $params = $isAdmin ? [] : [':uid' => $currentUser['id']];

        // 1. Total records
        $totalStmt = $db->prepare("SELECT COUNT(id) as total FROM tracking_records {$userFilter}");
        $totalStmt->execute($params);
        $totalRecords = (int)$totalStmt->fetch()['total'];

        // 2. Active shipments (not Delivered, not Cancelled)
        $activeWhere = $isAdmin 
            ? "WHERE current_status NOT IN ('Delivered', 'Cancelled')" 
            : "WHERE assigned_user_id = :uid AND current_status NOT IN ('Delivered', 'Cancelled')";
        $activeStmt = $db->prepare("SELECT COUNT(id) as total FROM tracking_records {$activeWhere}");
        $activeStmt->execute($params);
        $activeShipments = (int)$activeStmt->fetch()['total'];

        // 3. Records by status
        $byStatusStmt = $db->prepare("
            SELECT current_status as status, COUNT(id) as count 
            FROM tracking_records 
            {$userFilter} 
            GROUP BY current_status
        ");
        $byStatusStmt->execute($params);
        $byStatus = $byStatusStmt->fetchAll();

        // 4. Records by user (admin only)
        $byUser = [];
        if ($isAdmin) {
            $byUserStmt = $db->query("
                SELECT users.name as user_name, tr.assigned_user_id as user_id, COUNT(tr.id) as count 
                FROM tracking_records tr 
                LEFT JOIN users ON tr.assigned_user_id = users.id 
                GROUP BY tr.assigned_user_id, users.name
            ");
            $byUser = $byUserStmt->fetchAll();
        }

        // 5. Recent activity (last 10 status updates)
        $recentWhere = $isAdmin ? "" : "WHERE tr.assigned_user_id = :uid";
        $recentStmt = $db->prepare("
            SELECT 
                sh.*,
                users.name as updated_by_name,
                tr.tracking_number 
            FROM status_history sh 
            LEFT JOIN users ON sh.updated_by_id = users.id 
            LEFT JOIN tracking_records tr ON sh.tracking_record_id = tr.id 
            {$recentWhere} 
            ORDER BY sh.updated_at DESC 
            LIMIT 10
        ");
        $recentStmt->execute($params);
        $recentActivity = $recentStmt->fetchAll();

        Response::json([
            'totalRecords' => $totalRecords,
            'activeShipments' => $activeShipments,
            'byStatus' => $byStatus,
            'byUser' => $byUser,
            'recentActivity' => $recentActivity,
        ]);
    }
}
