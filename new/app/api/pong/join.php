<?php

require __DIR__ . '/common.php';

session_bootstrap();
if (empty($_SESSION['user_id'])) {
    json_response(['error' => 'not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];
$data   = read_json_body();

$code = isset($data['code']) ? strtoupper(trim($data['code'])) : '';
if ($code === '') {
    json_response(['error' => 'missing code'], 400);
}

$db = pong_get_db();

$stmt = $db->prepare('
    SELECT id, player1_id, player2_id, status
    FROM pong_games
    WHERE code = :code
    LIMIT 1
');
$stmt->execute([':code' => $code]);
$game = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$game) {
    json_response(['error' => 'game not found'], 404);
}

if ($game['status'] !== 'waiting') {
    json_response(['error' => 'game not joinable'], 400);
}

if ((int)$game['player1_id'] === $userId) {
    json_response(['error' => 'you are already player 1'], 400);
}

$stmt = $db->prepare('
    UPDATE pong_games
    SET player2_id = :p2,
        status = "ready",
        player1_ready = 0,
        player2_ready = 0
    WHERE id = :id AND player2_id IS NULL AND status = "waiting"
');
$stmt->execute([
    ':p2' => $userId,
    ':id' => $game['id'],
]);

if ($stmt->rowCount() === 0) {
    json_response(['error' => 'game already taken'], 409);
}

json_response([
    'code'   => $code,
    'status' => 'ready',
]);
