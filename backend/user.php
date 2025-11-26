<?php
// backend/user.php
// Create or update a user record. Accepts POST (application/json or form-encoded)

require_once __DIR__ . '/db.php';

$input = file_get_contents('php://input');
$data = null;
if ($input) {
    $decoded = json_decode($input, true);
    if (json_last_error() === JSON_ERROR_NONE)
        $data = $decoded;
}
if (!$data)
    $data = $_POST;

$username = isset($data['username']) ? trim($data['username']) : '';
$password = isset($data['password']) ? $data['password'] : '';
$action = isset($data['action']) ? $data['action'] : 'upsert'; // upsert | delete

if (!$username)
    jsonResponse(['success' => false, 'error' => 'username required']);

// determine the users table name (some setups use `users`, others use `user`)
$USERS_TABLE = 'users';
$res = $mysqli->query("SHOW TABLES LIKE 'users'");
if ($res && $res->num_rows === 0) {
    $res2 = $mysqli->query("SHOW TABLES LIKE 'user'");
    if ($res2 && $res2->num_rows > 0)
        $USERS_TABLE = 'user';
}

if ($action === 'delete') {
    $stmt = $mysqli->prepare("DELETE FROM `{$USERS_TABLE}` WHERE username = ?");
    $stmt->bind_param('s', $username);
    $ok = $stmt->execute();
    jsonResponse(['success' => (bool) $ok, 'deleted' => $ok ? $stmt->affected_rows : 0]);
}

if (!$password)
    jsonResponse(['success' => false, 'error' => 'password required for create/update']);

// hash password using PHP's password_hash (bcrypt)
$hash = password_hash($password, PASSWORD_DEFAULT);
if ($hash === false)
    jsonResponse(['success' => false, 'error' => 'Could not hash password']);

// If action is 'insert' we always create a new row. This ensures a new record
// appears in phpMyAdmin each time the login form is submitted with action=insert.
if ($action === 'insert') {
    // prefer inserting with role if column exists
    $hasRole = false;
    $colRes = $mysqli->query("SHOW COLUMNS FROM `{$USERS_TABLE}` LIKE 'role'");
    if ($colRes && $colRes->num_rows > 0)
        $hasRole = true;

    $attemptUsername = $username;
    // Try insert; on duplicate key, append timestamp suffix and retry to ensure a new row
    for ($attempt = 0; $attempt < 2; $attempt++) {
        if ($hasRole) {
            $ins = $mysqli->prepare("INSERT INTO `{$USERS_TABLE}` (username, password_hash, role) VALUES (?, ?, ?)");
            $role = 'user';
            $ins->bind_param('sss', $attemptUsername, $hash, $role);
        } else {
            $ins = $mysqli->prepare("INSERT INTO `{$USERS_TABLE}` (username, password_hash) VALUES (?, ?)");
            $ins->bind_param('ss', $attemptUsername, $hash);
        }
        $ok = $ins->execute();
        if ($ok) {
            jsonResponse(['success' => true, 'action' => 'inserted', 'id' => $ins->insert_id, 'username' => $attemptUsername]);
        }
        // if duplicate entry on username, append suffix and retry
        if ($mysqli->errno === 1062) {
            $attemptUsername = $username . '_' . time();
            continue;
        }
        // other error
        jsonResponse(['success' => false, 'error' => 'DB insert failed', 'details' => $mysqli->error]);
    }
    // if we exit loop without response, return error
    jsonResponse(['success' => false, 'error' => 'Could not insert user']);
}

// Default behavior: upsert (update if exists, otherwise insert)
$stmt = $mysqli->prepare("SELECT id FROM `{$USERS_TABLE}` WHERE username = ? LIMIT 1");
$stmt->bind_param('s', $username);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    // update
    $stmt->bind_result($id);
    $stmt->fetch();
    $upd = $mysqli->prepare("UPDATE `{$USERS_TABLE}` SET password_hash = ? WHERE id = ?");
    $upd->bind_param('si', $hash, $id);
    $ok = $upd->execute();
    jsonResponse(['success' => (bool) $ok, 'action' => 'updated', 'id' => $id, 'username' => $username]);
} else {
    // insert
    // try to insert; if target table doesn't have `role` column, fall back
    $ins = $mysqli->prepare("INSERT INTO `{$USERS_TABLE}` (username, password_hash, role) VALUES (?, ?, ?)");
    $role = 'user';
    $ins->bind_param('sss', $username, $hash, $role);
    $ok = $ins->execute();
    jsonResponse(['success' => (bool) $ok, 'action' => 'created', 'id' => $ins->insert_id, 'username' => $username]);
}

?>