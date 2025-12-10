<?php
require __DIR__ . '/../db.php';

session_bootstrap();
if (empty($_SESSION['user_id'])) {
    json_response(['error' => 'not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];
$data   = read_json_body();

$fromId = isset($data['from_id']) ? (int)$data['from_id'] : 0;
$action = isset($data['action']) ? trim($data['action']) : '';

if ($fromId <= 0 || ($action !== 'accept' && $action !== 'reject')) {
    json_response(['error' => 'invalid parameters'], 400);
}

$db = get_db();

$stmt = $db->prepare('
    SELECT id, status
    FROM friends
    WHERE user_id = :from AND friend_id = :me AND status = "pending"
    LIMIT 1
');
$stmt->execute([':from' => $fromId, ':me' => $userId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    json_response(['error' => 'no pending request'], 404);
}

if ($action === 'accept') {
    $upd = $db->prepare('UPDATE friends SET status = "accepted" WHERE id = :id');
    $upd->execute([':id' => $row['id']]);
    json_response(['ok' => true]);
} else {
    $del = $db->prepare('DELETE FROM friends WHERE id = :id');
    $del->execute([':id' => $row['id']]);
    json_response(['ok' => true]);
}
