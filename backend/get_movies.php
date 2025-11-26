<?php
// backend/get_movies.php
// Returns movie rows from the `movies` table as JSON.
require_once __DIR__ . '/db.php';

$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 100;
$limit = $limit > 0 && $limit <= 1000 ? $limit : 100;

$sql = 'SELECT id, title, year, poster_path, description, created_at FROM movies ORDER BY created_at DESC LIMIT ?';
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
    // provide poster path relative to project root
    $rows[] = $r;
}
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['success' => true, 'count' => count($rows), 'rows' => $rows]);

?>
