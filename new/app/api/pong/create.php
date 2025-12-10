<?php
// app/api/pong/create.php

require __DIR__ . '/common.php';

session_bootstrap();
if (empty($_SESSION['user_id'])) {
    json_response(['error' => 'not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];

$db = pong_get_db();

$stmt = $db->prepare('
    DELETE FROM pong_games
    WHERE player1_id = :uid AND status = "waiting"
');
$stmt->execute([':uid' => $userId]);

$code = pong_generate_code($db);
$now  = time();

$stmt = $db->prepare('
    INSERT INTO pong_games (
        code,
        player1_id,
        status,
        created_at
    )
    VALUES (:code, :p1, "waiting", :created)
');
$stmt->execute([
    ':code'    => $code,
    ':p1'      => $userId,
    ':created' => $now,
]);

json_response([
    'code'   => $code,
    'status' => 'waiting',
]);
