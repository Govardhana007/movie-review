<?php
// backend/add_movie.php
// Accepts multipart/form-data with fields: title, year, description, poster (file)
// Saves poster to uploads/posters and inserts a row into `movies` table.

require_once __DIR__ . '/db.php';

// allow CORS for local testing (optional)
// header('Access-Control-Allow-Origin: *');

$title = isset($_POST['title']) ? trim($_POST['title']) : '';
$year = isset($_POST['year']) ? (int) $_POST['year'] : null;
$description = isset($_POST['description']) ? trim($_POST['description']) : '';

if (!$title)
    jsonResponse(['success' => false, 'error' => 'title required']);

$posterPath = null;
if (!empty($_FILES['poster']) && $_FILES['poster']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['poster'];
    $maxBytes = 1.5 * 1024 * 1024; // 1.5 MB
    if ($file['size'] > $maxBytes)
        jsonResponse(['success' => false, 'error' => 'poster too large']);

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    $allowed = ['image/jpeg' => '.jpg', 'image/png' => '.png', 'image/gif' => '.gif'];
    if (!isset($allowed[$mime]))
        jsonResponse(['success' => false, 'error' => 'unsupported image type']);

    $ext = $allowed[$mime];
    $safe = preg_replace('/[^a-z0-9\-_.]/i', '-', $title);
    $name = time() . '-' . substr($safe, 0, 40) . $ext;
    $destDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'posters';
    if (!is_dir($destDir))
        mkdir($destDir, 0755, true);
    $dest = $destDir . DIRECTORY_SEPARATOR . $name;
    if (!move_uploaded_file($file['tmp_name'], $dest))
        jsonResponse(['success' => false, 'error' => 'failed to save poster']);
    // path relative to project root (for use in front-end)
    $posterPath = 'uploads/posters/' . $name;
}

// insert into movies table
$stmt = $mysqli->prepare('INSERT INTO movies (title, year, poster_path, description) VALUES (?, ?, ?, ?)');
$yearParam = $year ? $year : null;
$stmt->bind_param('siss', $title, $yearParam, $posterPath, $description);
$ok = $stmt->execute();
if (!$ok) {
    jsonResponse(['success' => false, 'error' => 'DB insert failed', 'details' => $stmt->error]);
}

$json = ['success' => true, 'id' => $stmt->insert_id, 'title' => $title, 'poster' => $posterPath];
jsonResponse($json);

?>