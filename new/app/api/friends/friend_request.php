<?php
require __DIR__ . '/../db.php';

session_bootstrap();
if (empty($_SESSION['user_id'])) {
    json_response(['error' => 'not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];
$data   = read_json_body();

$identifier = isset($data['identifier']) ? trim($data['identifier']) : '';

if ($identifier === '') {
    json_response(['error' => 'identifier required'], 400);
}

$db = get_db();

$stmt = $db->prepare('
    SELECT id, username, display_name, email
    FROM users
    WHERE username = :id OR display_name = :id OR email = :id
    LIMIT 1
');
$stmt->execute([':id' => $identifier]);
$target = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$target) {
    json_response(['error' => 'user not found'], 404);
}

$targetId = (int)$target['id'];

if ($targetId === $userId) {
    json_response(['error' => 'you cannot add yourself'], 400);
}

$check = $db->prepare('
    SELECT id, status, user_id, friend_id
    FROM friends
    WHERE (user_id = :me AND friend_id = :them)
       OR (user_id = :them AND friend_id = :me)
    LIMIT 1
');
$check->execute([':me' => $userId, ':them' => $targetId]);
$existing = $check->fetch(PDO::FETCH_ASSOC);

if ($existing) {
    if ($existing['status'] === 'accepted') {
        json_response(['error' => 'already friends'], 400);
    }
    if ($existing['status'] === 'pending') {
        json_response(['error' => 'friend request already pending'], 400);
    }
}

$now = (new DateTimeImmutable())->format(DateTime::ATOM);
$ins = $db->prepare('
    INSERT INTO friends (user_id, friend_id, status, created_at)
    VALUES (:me, :them, :status, :created_at)
');
$ins->execute([
    ':me'         => $userId,
    ':them'       => $targetId,
    ':status'     => 'pending',
    ':created_at' => $now,
]);

json_response(['ok' => true]);
