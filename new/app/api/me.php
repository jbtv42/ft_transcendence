<?php
require __DIR__ . '/db.php';

session_bootstrap();

if (empty($_SESSION['user_id'])) {
    json_response(['error' => 'not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];
$db     = get_db();

$now = (new DateTimeImmutable())->format(DateTime::ATOM);
try {
    $upd = $db->prepare('UPDATE users SET last_active = :now WHERE id = :id');
    $upd->execute([
        ':now' => $now,
        ':id'  => $userId,
    ]);
} catch (PDOException $e) {
    error_log('PDO ERROR in me (update last_active): ' . $e->getMessage());
}

$stmt = $db->prepare('
    SELECT id, username, display_name, email, avatar_path, wins, losses, last_active
    FROM users
    WHERE id = :id
');
$stmt->execute([':id' => $userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    session_unset();
    session_destroy();
    json_response(['error' => 'not authenticated'], 401);
}

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
        'last_active'  => $user['last_active'],
    ],
]);
