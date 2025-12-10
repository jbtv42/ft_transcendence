<?php
require __DIR__ . '/../db.php';

session_bootstrap();

if (empty($_SESSION['user_id'])) {
    json_response(['error' => 'not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];
$data   = read_json_body();

$email        = isset($data['email'])        ? trim($data['email'])        : null;
$username     = isset($data['username'])     ? trim($data['username'])     : null;
$display_name = isset($data['display_name']) ? trim($data['display_name']) : null;

if ($email === null && $username === null && $display_name === null) {
    json_response(['error' => 'nothing to update'], 400);
}

$updates = [];
$params  = [':id' => $userId];

if ($email !== null) {
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(['error' => 'invalid email'], 400);
    }
    $updates[]      = 'email = :email';
    $params[':email'] = $email;
}

if ($username !== null) {
    if ($username === '' || strlen($username) < 3 || strlen($username) > 32) {
        json_response(['error' => 'username must be between 3 and 32 characters'], 400);
    }
    $updates[]          = 'username = :username';
    $params[':username'] = $username;
}

if ($display_name !== null) {
    if ($display_name === '' || strlen($display_name) < 3 || strlen($display_name) > 32) {
        json_response(['error' => 'display_name must be between 3 and 32 characters'], 400);
    }
    $updates[]               = 'display_name = :display_name';
    $params[':display_name'] = $display_name;
}

$updates[]             = 'updated_at = :updated_at';
$params[':updated_at'] = (new DateTimeImmutable())->format(DateTime::ATOM);

$sql = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = :id';

try {
    $db   = get_db();
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    if ($username !== null) {
        $_SESSION['username'] = $username;
    }
    if ($display_name !== null) {
        $_SESSION['display_name'] = $display_name;
    }

    json_response(['ok' => true]);
} catch (PDOException $e) {
    error_log('PDO ERROR in update_profile: ' . $e->getMessage());
    $msg = $e->getMessage();

    if (str_contains($msg, 'UNIQUE') && str_contains($msg, 'email')) {
        json_response(['error' => 'email already in use'], 409);
    }
    if (str_contains($msg, 'UNIQUE') && str_contains($msg, 'username')) {
        json_response(['error' => 'username already in use'], 409);
    }
    if (str_contains($msg, 'UNIQUE') && str_contains($msg, 'display_name')) {
        json_response(['error' => 'display_name already in use'], 409);
    }

    json_response(['error' => 'database error'], 500);
}
