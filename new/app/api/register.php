<?php
require __DIR__ . '/db.php';

$data = read_json_body();

$email        = isset($data['email'])        ? trim($data['email'])        : '';
$username     = isset($data['username'])     ? trim($data['username'])     : '';
$display_name = isset($data['display_name']) ? trim($data['display_name']) : '';
$password     = isset($data['password'])     ? trim($data['password'])     : '';

if ($email === '' || $username === '' || $display_name === '' || $password === '') {
    json_response(['error' => 'email, username, display_name and password are required'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['error' => 'invalid email'], 400);
}

if (strlen($username) < 3 || strlen($username) > 32) {
    json_response(['error' => 'username must be between 3 and 32 characters'], 400);
}

if (strlen($display_name) < 3 || strlen($display_name) > 32) {
    json_response(['error' => 'display_name must be between 3 and 32 characters'], 400);
}

if (strlen($password) < 6) {
    json_response(['error' => 'password too short'], 400);
}

try {
    $db = get_db();
    $stmt = $db->prepare("
        INSERT INTO users (
            email, username, display_name, password_hash, avatar_path,
            wins, losses, created_at, updated_at
        ) VALUES (
            :email, :username, :display_name, :password_hash, :avatar_path,
            0, 0, :created_at, :updated_at
        )
    ");

    $now = (new DateTimeImmutable())->format(DateTime::ATOM);
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt->execute([
        ':email'         => $email,
        ':username'      => $username,
        ':display_name'  => $display_name,
        ':password_hash' => $hash,
        ':avatar_path'   => null,
        ':created_at'    => $now,
        ':updated_at'    => $now,
    ]);

    json_response(['ok' => true]);
} catch (PDOException $e) {
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
