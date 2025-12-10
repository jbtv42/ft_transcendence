<?php
require __DIR__ . '/../db.php';

session_bootstrap();
if (empty($_SESSION['user_id'])) {
    json_response(['error' => 'not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];
$db     = get_db();

$sql = "
    SELECT
        f.user_id AS from_id,
        f.created_at,
        u.username,
        u.display_name,
        u.avatar_path
    FROM friends f
    JOIN users u ON u.id = f.user_id
    WHERE f.friend_id = :me
      AND f.status = 'pending'
    ORDER BY f.created_at DESC
";

$stmt = $db->prepare($sql);
$stmt->execute([':me' => $userId]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

json_response([
    'ok'       => true,
    'requests' => $rows,
]);
