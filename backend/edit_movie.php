<?php
// backend/edit_movie.php
// Update movie metadata and optionally replace poster file.
require_once __DIR__ . '/db.php';

// Accept either JSON (application/json) or multipart/form-data
$input = file_get_contents('php://input');
$data = null;
if ($input) {
    $decoded = json_decode($input, true);
    if (json_last_error() === JSON_ERROR_NONE) $data = $decoded;
}
if (!$data) $data = $_POST;

$id = isset($data['id']) ? (int)$data['id'] : 0;
$title = isset($data['title']) ? trim($data['title']) : null;
$year = isset($data['year']) && $data['year'] !== '' ? (int)$data['year'] : null;
$description = isset($data['description']) ? trim($data['description']) : null;

if (!$id) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'id required']);
    exit;
}

$posterPath = null;
// handle uploaded poster file if provided
if (!empty($_FILES['poster']) && $_FILES['poster']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['poster'];
    $maxBytes = 1.5 * 1024 * 1024; // 1.5 MB
    if ($file['size'] > $maxBytes) jsonResponse(['success' => false, 'error' => 'poster too large']);

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    $allowed = ['image/jpeg' => '.jpg', 'image/png' => '.png', 'image/gif' => '.gif'];
    if (!isset($allowed[$mime])) jsonResponse(['success' => false, 'error' => 'unsupported image type']);

    $ext = $allowed[$mime];
    // fetch current title for safe name fallback
    $safeName = 'movie-' . time();
    // if title present, use it
    if ($title) $safeName = preg_replace('/[^a-z0-9\-_.]/i', '-', substr($title, 0, 40));

    $name = time() . '-' . $safeName . $ext;
    $destDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'posters';
    if (!is_dir($destDir)) mkdir($destDir, 0755, true);
    $dest = $destDir . DIRECTORY_SEPARATOR . $name;
    if (!move_uploaded_file($file['tmp_name'], $dest)) jsonResponse(['success' => false, 'error' => 'failed to save poster']);
    $posterPath = 'uploads/posters/' . $name;
}

// Build update SQL dynamically
$fields = [];
$params = [];
$types = '';
if ($title !== null) { $fields[] = 'title = ?'; $params[] = $title; $types .= 's'; }
if ($year !== null) { $fields[] = 'year = ?'; $params[] = $year; $types .= 'i'; }
if ($description !== null) { $fields[] = 'description = ?'; $params[] = $description; $types .= 's'; }
if ($posterPath !== null) { $fields[] = 'poster_path = ?'; $params[] = $posterPath; $types .= 's'; }

if (count($fields) === 0) jsonResponse(['success' => false, 'error' => 'no fields to update']);

$sql = 'UPDATE movies SET ' . implode(', ', $fields) . ' WHERE id = ?';
$params[] = $id; $types .= 'i';

$stmt = $mysqli->prepare($sql);
if (!$stmt) jsonResponse(['success' => false, 'error' => 'prepare failed', 'details' => $mysqli->error]);

// bind params dynamically
$bind_names[] = $types;
for ($i=0; $i<count($params); $i++) {
    $bind_name = 'bind' . $i;
    $$bind_name = $params[$i];
    $bind_names[] = &$$bind_name;
}
call_user_func_array([$stmt, 'bind_param'], $bind_names);
$ok = $stmt->execute();
if (!$ok) jsonResponse(['success' => false, 'error' => 'execute failed', 'details' => $stmt->error]);

jsonResponse(['success' => true, 'id' => $id, 'updated_fields' => $fields, 'poster' => $posterPath]);

// helper
function jsonResponse($data) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

?>