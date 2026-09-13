<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ActivityController {
    public static function index(): void {
        AuthMiddleware::authorize('admin');
        $db = Database::getConnection();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, (int)($_GET['limit'] ?? 50));
        $offset = ($page - 1) * $limit;

        $countStmt = $db->query("SELECT COUNT(id) as total FROM status_history");
        $total = (int)$countStmt->fetch()['total'];

        $sql = "
            SELECT 
                sh.*,
                users.name as updated_by_name,
                tr.tracking_number,
                tr.part_type,
                tr.vehicle_make,
                tr.vehicle_model
            FROM status_history sh
            LEFT JOIN users ON sh.updated_by_id = users.id
            LEFT JOIN tracking_records tr ON sh.tracking_record_id = tr.id
            ORDER BY sh.updated_at DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $entries = $stmt->fetchAll();

        Response::json([
            'entries' => $entries,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => (int)ceil($total / $limit),
            ],
        ]);
    }
}
