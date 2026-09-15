<?php
// Bridge between /backend/ and /backend/backend/
if (file_exists(__DIR__ . '/backend/index.php')) {
    require_once __DIR__ . '/backend/index.php';
} else {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Backend router not found']);
}
