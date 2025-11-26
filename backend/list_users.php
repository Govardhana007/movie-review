<?php
// backend/list_users.php
// Return recent rows from the users (or user) table as JSON for debugging.
require_once __DIR__ . '/db.php';

$USERS_TABLE = 'users';
$res = $mysqli->query("SHOW TABLES LIKE 'users'");
if ($res && $res->num_rows === 0) {
    $res2 = $mysqli->query("SHOW TABLES LIKE 'user'");
    if ($res2 && $res2->num_rows > 0)
        $USERS_TABLE = 'user';
}

$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 50;
$limit = $limit > 0 && $limit <= 1000 ? $limit : 50;

$sql = "SELECT * FROM `{$USERS_TABLE}` ORDER BY created_at DESC LIMIT ?";
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'prepare failed', 'details' => $mysqli->error]);
    exit;
}
$stmt->bind_param('i', $limit);
$stmt->execute();
$result = $stmt->get_result();
$rows = [];
while ($r = $result->fetch_assoc()) {
    $rows[] = $r;
}
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['success' => true, 'table' => $USERS_TABLE, 'count' => count($rows), 'rows' => $rows]);

?>