<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/ApiKeyAuthMiddleware.php';

class PublicTrackingController {
    public static function track(?string $pathNumber = null): void {
        ApiKeyAuthMiddleware::authenticate();

        $rawNumber = $pathNumber ?: ($_GET['number'] ?? $_GET['tracking_number'] ?? null);

        if (empty($rawNumber) || !is_string($rawNumber) || empty(trim($rawNumber))) {
            Response::json([
                'success' => false,
                'error' => 'Tracking number is required. Pass in URL path or ?number= query parameter.',
            ], 400);
        }

        $trackingNumber = trim($rawNumber);
        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT 
                id, tracking_number, part_type, vehicle_make, vehicle_model, vehicle_year,
                shipment_origin, destination, current_status, estimated_delivery_date,
                date_created, last_updated
            FROM tracking_records 
            WHERE tracking_number = :tn 
            LIMIT 1
        ");
        $stmt->execute([':tn' => $trackingNumber]);
        $record = $stmt->fetch();

        if (!$record) {
            Response::json([
                'success' => false,
                'error' => "Tracking record with number \"{$trackingNumber}\" not found.",
            ], 404);
        }

        $histStmt = $db->prepare("
            SELECT status, notes, updated_at 
            FROM status_history 
            WHERE tracking_record_id = :rid 
            ORDER BY updated_at DESC
        ");
        $histStmt->execute([':rid' => $record['id']]);
        $history = $histStmt->fetchAll();

        Response::json([
            'success' => true,
            'data' => [
                'tracking_number' => $record['tracking_number'],
                'part_type' => $record['part_type'],
                'current_status' => $record['current_status'],
                'estimated_delivery_date' => $record['estimated_delivery_date'],
                'shipment' => [
                    'origin' => $record['shipment_origin'],
                    'destination' => $record['destination'],
                    'date_created' => $record['date_created'],
                    'last_updated' => $record['last_updated'],
                ],
                'vehicle' => [
                    'make' => $record['vehicle_make'],
                    'model' => $record['vehicle_model'],
                    'year' => (int)$record['vehicle_year'],
                ],
                'history' => $history,
            ],
        ]);
    }
}
