<?php
require __DIR__ . '/../db.php';

session_bootstrap();

if (empty($_SESSION['user_id'])) {
    json_response(['error' => 'not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];
$db = get_db();
$now = time();

$stmt = $db->prepare(
    "SELECT id, code, player1_id FROM pong_games\n     WHERE status = 'waiting' AND player2_id IS NULL AND player1_id != :uid\n     ORDER BY created_at ASC\n     LIMIT 1"
);
$stmt->execute([':uid' => $userId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row) {
    $upd = $db->prepare(
        "UPDATE pong_games\n         SET player2_id = :uid, status = 'active', updated_at = :now\n         WHERE id = :id AND player2_id IS NULL"
    );
    $upd->execute([
        ':uid' => $userId,
        ':now' => $now,
        ':id'  => (int)$row['id'],
    ]);

    if ($upd->rowCount() > 0) {
        json_response([
            'ok'   => true,
            'code' => $row['code'],
            'role' => 'right',
        ]);
    }
}

$code = bin2hex(random_bytes(8));
$ins = $db->prepare(
    "INSERT INTO pong_games (code, player1_id, player2_id, status, created_at, updated_at)\n     VALUES (:code, :p1, NULL, 'waiting', :now, :now)"
);
$ins->execute([
    ':code' => $code,
    ':p1'   => $userId,
    ':now'  => $now,
]);

json_response([
    'ok'   => true,
    'code' => $code,
    'role' => 'left',
]);
