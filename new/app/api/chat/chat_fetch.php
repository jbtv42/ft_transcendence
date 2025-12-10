<?php
require __DIR__ . '//../db.php';

session_bootstrap();
if (empty($_SESSION['user_id'])) {
    json_response(['error' => 'not authenticated'], 401);
}

$userId   = (int)$_SESSION['user_id'];
$room     = isset($_GET['room']) ? trim($_GET['room']) : 'global';
$sinceId  = isset($_GET['since_id']) ? (int)$_GET['since_id'] : 0;

$db = get_db();

$sql = '
    SELECT m.id, m.room, m.content, m.created_at,
           u.id AS sender_id, u.username, u.display_name, u.avatar_path
    FROM chat_messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.room = :room
';
$params = [':room' => $room];

if ($sinceId > 0) {
    $sql .= ' AND m.id > :since';
    $params[':since'] = $sinceId;
}

$sql .= ' ORDER BY m.id ASC LIMIT 100';

$stmt = $db->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

json_response([
    'ok'       => true,
    'messages' => $rows,
]);
