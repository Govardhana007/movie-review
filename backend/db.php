<?php
// backend/db.php
// Simple DB helper for the project. Adjust credentials for your XAMPP setup.

$DB_HOST = '127.0.0.1';
$DB_USER = 'root';
$DB_PASS = '';
$DB_NAME = 'miniproject1_db';

$mysqli = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
if ($mysqli->connect_errno) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB connection failed', 'details' => $mysqli->connect_error]);
    exit;
}
$mysqli->set_charset('utf8mb4');

function jsonResponse($data)
{
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

?>