<?php
// backend/delete_movie.php
// Delete a movie row and its poster file (if present).
require_once __DIR__ . '/db.php';

$input = file_get_contents('php://input');
$data = null;
if ($input) {
    $decoded = json_decode($input, true);
    if (json_last_error() === JSON_ERROR_NONE) $data = $decoded;
}
if (!$data) $data = $_POST;

$id = isset($data['id']) ? (int)$data['id'] : 0;
if (!$id) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'id required']);
    exit;
}

// fetch poster path to unlink
$stmt = $mysqli->prepare('SELECT poster_path FROM movies WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $id);
$stmt->execute();
$stmt->bind_result($poster_path);
$stmt->fetch();
$stmt->close();

// delete row
$del = $mysqli->prepare('DELETE FROM movies WHERE id = ?');
$del->bind_param('i', $id);
$ok = $del->execute();
if (!$ok) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'error' => 'delete failed', 'details' => $del->error]);
    exit;
}

// remove poster file from disk if exists and path is relative
if ($poster_path && strpos($poster_path, 'uploads/posters/') === 0) {
    $file = dirname(__DIR__) . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $poster_path);
    if (file_exists($file)) @unlink($file);
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode(['success' => true, 'deleted_id' => $id]);

?>