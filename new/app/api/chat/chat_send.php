<?php
require __DIR__ . '/../db.php';

session_bootstrap();
if (empty($_SESSION['user_id'])) {
    json_response(['error' => 'not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];
$data   = read_json_body();

$content      = isset($data['content']) ? trim($data['content']) : '';
$room         = isset($data['room']) ? trim($data['room']) : '';
$recipientId  = isset($data['recipient_id']) ? (int)$data['recipient_id'] : 0;

if ($content === '') {
    json_response(['error' => 'content required'], 400);
}

if ($recipientId > 0) {
    $a = min($userId, $recipientId);
    $b = max($userId, $recipientId);
    $room = 'dm:' . $a . ':' . $b;
} else {
    if ($room === '') {
        $room = 'global';
    }
}

$db  = get_db();
$now = (new DateTimeImmutable())->format(DateTime::ATOM);

$ins = $db->prepare('
    INSERT INTO chat_messages (room, sender_id, content, created_at)
    VALUES (:room, :sender, :content, :created_at)
');
$ins->execute([
    ':room'      => $room,
    ':sender'    => $userId,
    ':content'   => $content,
    ':created_at'=> $now,
]);

$id = (int)$db->lastInsertId();

$stmt = $db->prepare('
    SELECT m.id, m.room, m.content, m.created_at,
           u.id AS sender_id, u.username, u.display_name, u.avatar_path
    FROM chat_messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.id = :id
');
$stmt->execute([':id' => $id]);
$msg = $stmt->fetch(PDO::FETCH_ASSOC);

json_response([
    'ok'      => true,
    'message' => $msg,
]);
