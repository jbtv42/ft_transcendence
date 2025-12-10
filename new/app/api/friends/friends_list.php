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
        u.id,
        u.username,
        u.display_name,
        u.avatar_path,
        u.last_active
    FROM friends f
    JOIN users u
      ON u.id = CASE
          WHEN f.user_id = :me THEN f.friend_id
          ELSE f.user_id
        END
    WHERE (f.user_id = :me OR f.friend_id = :me)
      AND f.status = 'accepted'
    ORDER BY u.display_name COLLATE NOCASE
";

$stmt = $db->prepare($sql);
$stmt->execute([':me' => $userId]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$now = new DateTimeImmutable();
$friends = [];
foreach ($rows as $r) {
    $status = 'offline';
    if (!empty($r['last_active'])) {
        $last = new DateTimeImmutable($r['last_active']);
        $diff = $now->getTimestamp() - $last->getTimestamp();
        if ($diff <= 60) {
            $status = 'online';
        } elseif ($diff <= 300) {
            $status = 'away';
        }
    }

    $friends[] = [
        'id'           => (int)$r['id'],
        'username'     => $r['username'],
        'display_name' => $r['display_name'],
        'avatar_path'  => $r['avatar_path'],
        'last_active'  => $r['last_active'],
        'status'       => $status,
    ];
}

json_response([
    'ok'      => true,
    'friends' => $friends,
]);
