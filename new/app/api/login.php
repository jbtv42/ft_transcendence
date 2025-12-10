<?php

require __DIR__ . '/db.php';

session_bootstrap();

$data = read_json_body();

$identifier = isset($data['identifier']) ? trim($data['identifier']) : '';
$password   = isset($data['password'])   ? trim($data['password'])   : '';

if ($identifier === '' || $password === '') {
    json_response(['error' => 'identifier and password are required'], 400);
}

$db = get_db();

if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
    $stmt = $db->prepare('SELECT * FROM users WHERE email = :id LIMIT 1');
} else {
    $stmt = $db->prepare('SELECT * FROM users WHERE username = :id LIMIT 1');
}

$stmt->execute([':id' => $identifier]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user['password_hash'])) {
    json_response(['error' => 'invalid credentials'], 401);
}

$_SESSION['user_id']       = (int)$user['id'];
$_SESSION['username']      = $user['username'];
$_SESSION['display_name']  = $user['display_name'];

json_response([
    'ok'   => true,
    'user' => [
        'id'           => (int)$user['id'],
        'username'     => $user['username'],
        'display_name' => $user['display_name'],
        'email'        => $user['email'],
        'avatar_path'  => $user['avatar_path'],
        'wins'         => (int)$user['wins'],
        'losses'       => (int)$user['losses'],
    ],
]);
