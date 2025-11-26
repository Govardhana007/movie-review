<?php
// backend/submit.php
// Accepts POST requests with JSON body { movieId, rating, text }
// Appends reviews to reviews.json in the same folder and returns JSON { success: true }

header('Content-Type: application/json; charset=utf-8');

$input = file_get_contents('php://input');
$data = [];
if ($input) {
    $decoded = json_decode($input, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        $data = $decoded;
    }
}

// also accept fallback of form-encoded POST
if (empty($data) && !empty($_POST)) {
    $data = $_POST;
}

// basic validation
if (empty($data['movieId']) || empty($data['rating'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'movieId and rating required']);
    exit;
}

$movieId = preg_replace('/[^a-zA-Z0-9_\-]/', '', $data['movieId']);
$rating = (int) $data['rating'];
$text = isset($data['text']) ? trim($data['text']) : '';

$review = [
    'rating' => $rating,
    'text' => $text,
    'date' => date('c')
];

$dir = __DIR__;
$file = $dir . DIRECTORY_SEPARATOR . 'reviews.json';

$all = [];
if (file_exists($file)) {
    $raw = @file_get_contents($file);
    if ($raw !== false) {
        $decoded = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $all = $decoded;
        }
    }
}

if (!isset($all[$movieId]) || !is_array($all[$movieId])) {
    $all[$movieId] = [];
}
// append new review
$all[$movieId][] = $review;

// try to write back
if (@file_put_contents($file, json_encode($all, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Could not write reviews file']);
    exit;
}

echo json_encode(['success' => true, 'saved' => $review]);

?>