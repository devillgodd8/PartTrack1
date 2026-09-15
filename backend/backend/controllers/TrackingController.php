<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../services/TrackingNumberService.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class TrackingController {
    public static function index(): void {
        $currentUser = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $where = [];
        $params = [];

        // Scope to own records for regular users
        if ($currentUser['role'] !== 'admin') {
            $where[] = "tr.assigned_user_id = :current_user_id";
            $params[':current_user_id'] = $currentUser['id'];
        } elseif (!empty($_GET['assigned_user_id'])) {
            $where[] = "tr.assigned_user_id = :assigned_user_id";
            $params[':assigned_user_id'] = $_GET['assigned_user_id'];
        }

        // Filters
        if (!empty($_GET['status'])) {
            $where[] = "tr.current_status = :status";
            $params[':status'] = $_GET['status'];
        }
        if (!empty($_GET['part_type'])) {
            $where[] = "tr.part_type = :part_type";
            $params[':part_type'] = $_GET['part_type'];
        }
        if (!empty($_GET['date_from'])) {
            $where[] = "tr.date_created >= :date_from";
            $params[':date_from'] = $_GET['date_from'];
        }
        if (!empty($_GET['date_to'])) {
            $where[] = "tr.date_created <= :date_to";
            $params[':date_to'] = $_GET['date_to'];
        }
        if (!empty($_GET['customer_name'])) {
            $where[] = "tr.customer_name LIKE :customer_name";
            $params[':customer_name'] = '%' . trim($_GET['customer_name']) . '%';
        }
        if (!empty($_GET['customer_number'])) {
            $where[] = "tr.customer_number LIKE :customer_number";
            $params[':customer_number'] = '%' . trim($_GET['customer_number']) . '%';
        }

        // Search across tracking_number, vin, part_stock_number, customer_name, customer_number
        if (!empty($_GET['q'])) {
            $search = '%' . trim($_GET['q']) . '%';
            $where[] = "(tr.tracking_number LIKE :q1 OR tr.vin LIKE :q2 OR tr.part_stock_number LIKE :q3 OR tr.customer_name LIKE :q4 OR tr.customer_number LIKE :q5)";
            $params[':q1'] = $search;
            $params[':q2'] = $search;
            $params[':q3'] = $search;
            $params[':q4'] = $search;
            $params[':q5'] = $search;
        }

        $whereSql = !empty($where) ? "WHERE " . implode(' AND ', $where) : "";

        // Total count
        $countSql = "SELECT COUNT(tr.id) as total FROM tracking_records tr {$whereSql}";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetch()['total'];

        // Pagination
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, (int)($_GET['limit'] ?? 25));
        $offset = ($page - 1) * $limit;

        $selectSql = "
            SELECT 
                tr.*,
                assigned.name as assigned_user_name,
                creator.name as created_by_name
            FROM tracking_records tr
            LEFT JOIN users assigned ON tr.assigned_user_id = assigned.id
            LEFT JOIN users creator ON tr.created_by_id = creator.id
            {$whereSql}
            ORDER BY tr.last_updated DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $db->prepare($selectSql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $records = $stmt->fetchAll();

        Response::json([
            'records' => $records,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => (int)ceil($total / $limit),
            ],
        ]);
    }

    public static function lookup(string $trackingNumber): void {
        $currentUser = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT 
                tr.*,
                assigned.name as assigned_user_name,
                creator.name as created_by_name
            FROM tracking_records tr
            LEFT JOIN users assigned ON tr.assigned_user_id = assigned.id
            LEFT JOIN users creator ON tr.created_by_id = creator.id
            WHERE tr.tracking_number = :tn
            LIMIT 1
        ");
        $stmt->execute([':tn' => $trackingNumber]);
        $record = $stmt->fetch();

        if (!$record) {
            Response::error('Tracking record not found', 404);
        }

        if ($currentUser['role'] !== 'admin' && $record['assigned_user_id'] !== $currentUser['id']) {
            Response::error('Access denied', 403);
        }

        $histStmt = $db->prepare("
            SELECT sh.*, users.name as updated_by_name
            FROM status_history sh
            LEFT JOIN users ON sh.updated_by_id = users.id
            WHERE sh.tracking_record_id = :rid
            ORDER BY sh.updated_at DESC
        ");
        $histStmt->execute([':rid' => $record['id']]);
        $history = $histStmt->fetchAll();

        Response::json([
            'record' => $record,
            'history' => $history,
        ]);
    }

    public static function show(string $id): void {
        $currentUser = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT 
                tr.*,
                assigned.name as assigned_user_name,
                creator.name as created_by_name
            FROM tracking_records tr
            LEFT JOIN users assigned ON tr.assigned_user_id = assigned.id
            LEFT JOIN users creator ON tr.created_by_id = creator.id
            WHERE tr.id = :id
            LIMIT 1
        ");
        $stmt->execute([':id' => $id]);
        $record = $stmt->fetch();

        if (!$record) {
            Response::error('Tracking record not found', 404);
        }

        if ($currentUser['role'] !== 'admin' && $record['assigned_user_id'] !== $currentUser['id']) {
            Response::error('Access denied', 403);
        }

        $histStmt = $db->prepare("
            SELECT sh.*, users.name as updated_by_name
            FROM status_history sh
            LEFT JOIN users ON sh.updated_by_id = users.id
            WHERE sh.tracking_record_id = :rid
            ORDER BY sh.updated_at DESC
        ");
        $histStmt->execute([':rid' => $record['id']]);
        $history = $histStmt->fetchAll();

        Response::json([
            'record' => $record,
            'history' => $history,
        ]);
    }

    public static function create(): void {
        $currentUser = AuthMiddleware::authenticate();
        $body = Response::getBody();

        $validationError = Validator::validateCreateTracking($body);
        if ($validationError) {
            Response::error($validationError, 400);
        }

        $db = Database::getConnection();

        $assignedUserId = $currentUser['id'];
        if ($currentUser['role'] === 'admin' && !empty($body['assigned_user_id'])) {
            $userCheck = $db->prepare("SELECT id FROM users WHERE id = :id AND is_active = 1 LIMIT 1");
            $userCheck->execute([':id' => $body['assigned_user_id']]);
            if (!$userCheck->fetch()) {
                Response::error('Assigned user not found or inactive', 400);
            }
            $assignedUserId = $body['assigned_user_id'];
        }

        $userPrefix = TrackingNumberService::ensureUserPrefix($db, $assignedUserId);
        $id = Response::generateUuid();
        $status = $body['current_status'] ?? 'Pending';
        $now = date('Y-m-d H:i:s');

        $maxAttempts = 3;
        $inserted = false;

        for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
            try {
                $trackingNumber = TrackingNumberService::generate12DigitTrackingNumber($db, $userPrefix);

                $stmt = $db->prepare("
                    INSERT INTO tracking_records (
                        id, tracking_number, part_type, vehicle_make, vehicle_model, vehicle_year,
                        vin, part_stock_number, shipment_origin, destination, current_status,
                        estimated_delivery_date, notes, customer_name, customer_number,
                        assigned_user_id, created_by_id, date_created, last_updated
                    ) VALUES (
                        :id, :tracking_number, :part_type, :vehicle_make, :vehicle_model, :vehicle_year,
                        :vin, :part_stock_number, :shipment_origin, :destination, :current_status,
                        :estimated_delivery_date, :notes, :customer_name, :customer_number,
                        :assigned_user_id, :created_by_id, :date_created, :last_updated
                    )
                ");

                $stmt->execute([
                    ':id' => $id,
                    ':tracking_number' => $trackingNumber,
                    ':part_type' => $body['part_type'],
                    ':vehicle_make' => trim($body['vehicle_make']),
                    ':vehicle_model' => trim($body['vehicle_model']),
                    ':vehicle_year' => (int)$body['vehicle_year'],
                    ':vin' => !empty($body['vin']) ? trim($body['vin']) : null,
                    ':part_stock_number' => trim($body['part_stock_number']),
                    ':shipment_origin' => trim($body['shipment_origin']),
                    ':destination' => trim($body['destination']),
                    ':current_status' => $status,
                    ':estimated_delivery_date' => !empty($body['estimated_delivery_date']) ? $body['estimated_delivery_date'] : null,
                    ':notes' => !empty($body['notes']) ? trim($body['notes']) : null,
                    ':customer_name' => !empty($body['customer_name']) ? trim($body['customer_name']) : null,
                    ':customer_number' => !empty($body['customer_number']) ? trim($body['customer_number']) : null,
                    ':assigned_user_id' => $assignedUserId,
                    ':created_by_id' => $currentUser['id'],
                    ':date_created' => $now,
                    ':last_updated' => $now,
                ]);

                $inserted = true;
                break;
            } catch (Throwable $e) {
                if ($attempt === $maxAttempts - 1) {
                    throw $e;
                }
            }
        }

        if (!$inserted) {
            Response::error('Failed to create tracking record. Please retry.', 500);
        }

        // Status history entry
        $histStmt = $db->prepare("
            INSERT INTO status_history (id, tracking_record_id, status, notes, updated_by_id, updated_at)
            VALUES (:id, :rid, :status, :notes, :uid, :at)
        ");
        $histStmt->execute([
            ':id' => Response::generateUuid(),
            ':rid' => $id,
            ':status' => $status,
            ':notes' => 'Record created',
            ':uid' => $currentUser['id'],
            ':at' => $now,
        ]);

        $fetchStmt = $db->prepare("SELECT * FROM tracking_records WHERE id = :id LIMIT 1");
        $fetchStmt->execute([':id' => $id]);
        $record = $fetchStmt->fetch();

        Response::json(['record' => $record], 201);
    }

    public static function update(string $id): void {
        $currentUser = AuthMiddleware::authenticate();
        $body = Response::getBody();

        $validationError = Validator::validateUpdateTracking($body);
        if ($validationError) {
            Response::error($validationError, 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT * FROM tracking_records WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $record = $stmt->fetch();

        if (!$record) {
            Response::error('Tracking record not found', 404);
        }

        if ($currentUser['role'] !== 'admin' && $record['assigned_user_id'] !== $currentUser['id']) {
            Response::error('Access denied', 403);
        }

        $allowedFields = [
            'part_type', 'vehicle_make', 'vehicle_model', 'vehicle_year',
            'vin', 'part_stock_number', 'shipment_origin', 'destination',
            'estimated_delivery_date', 'notes', 'customer_name', 'customer_number',
        ];

        if ($currentUser['role'] === 'admin') {
            $allowedFields[] = 'assigned_user_id';
        }

        $fields = [];
        $params = [':id' => $id];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $body)) {
                $fields[] = "{$field} = :{$field}";
                $val = $body[$field];
                if ($val === '' || $val === false) {
                    $val = null;
                }
                $params[":{$field}"] = $val;
            }
        }

        if (empty($fields)) {
            Response::error('No fields to update', 400);
        }

        $now = date('Y-m-d H:i:s');
        $fields[] = "last_updated = :last_updated";
        $params[':last_updated'] = $now;

        $updateSql = "UPDATE tracking_records SET " . implode(', ', $fields) . " WHERE id = :id";
        $updateStmt = $db->prepare($updateSql);
        $updateStmt->execute($params);

        $fetchStmt = $db->prepare("
            SELECT 
                tr.*,
                assigned.name as assigned_user_name,
                creator.name as created_by_name
            FROM tracking_records tr
            LEFT JOIN users assigned ON tr.assigned_user_id = assigned.id
            LEFT JOIN users creator ON tr.created_by_id = creator.id
            WHERE tr.id = :id
            LIMIT 1
        ");
        $fetchStmt->execute([':id' => $id]);
        $updated = $fetchStmt->fetch();

        Response::json(['record' => $updated]);
    }

    public static function updateStatus(string $id): void {
        $currentUser = AuthMiddleware::authenticate();
        $body = Response::getBody();

        $validationError = Validator::validateStatusUpdate($body);
        if ($validationError) {
            Response::error($validationError, 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT * FROM tracking_records WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $record = $stmt->fetch();

        if (!$record) {
            Response::error('Tracking record not found', 404);
        }

        if ($currentUser['role'] !== 'admin' && $record['assigned_user_id'] !== $currentUser['id']) {
            Response::error('Access denied', 403);
        }

        $status = $body['status'];
        $notes = !empty($body['notes']) ? trim($body['notes']) : null;
        $now = date('Y-m-d H:i:s');

        // Insert into status_history
        $histStmt = $db->prepare("
            INSERT INTO status_history (id, tracking_record_id, status, notes, updated_by_id, updated_at)
            VALUES (:id, :rid, :status, :notes, :uid, :at)
        ");
        $histStmt->execute([
            ':id' => Response::generateUuid(),
            ':rid' => $id,
            ':status' => $status,
            ':notes' => $notes,
            ':uid' => $currentUser['id'],
            ':at' => $now,
        ]);

        // Update tracking record current_status and last_updated
        $updateStmt = $db->prepare("
            UPDATE tracking_records 
            SET current_status = :status, last_updated = :at 
            WHERE id = :id
        ");
        $updateStmt->execute([
            ':status' => $status,
            ':at' => $now,
            ':id' => $id,
        ]);

        $fetchStmt = $db->prepare("SELECT * FROM tracking_records WHERE id = :id LIMIT 1");
        $fetchStmt->execute([':id' => $id]);
        $updated = $fetchStmt->fetch();

        Response::json(['record' => $updated]);
    }

    public static function delete(string $id): void {
        AuthMiddleware::authorize('admin');
        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT id FROM tracking_records WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        if (!$stmt->fetch()) {
            Response::error('Tracking record not found', 404);
        }

        $del = $db->prepare("DELETE FROM tracking_records WHERE id = :id");
        $del->execute([':id' => $id]);

        Response::json(['message' => 'Tracking record deleted']);
    }
}
