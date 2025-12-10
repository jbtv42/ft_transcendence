<?php

require __DIR__ . '/common.php';

session_bootstrap();
if (empty($_SESSION['user_id'])) {
    json_response(['error' => 'not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];
$data   = read_json_body();

$code  = isset($data['code']) ? strtoupper(trim($data['code'])) : '';
$ready = isset($data['ready']) ? (bool)$data['ready'] : false;

if ($code === '') {
    json_response(['error' => 'missing code'], 400);
}

$db = pong_get_db();

$stmt = $db->prepare('
    SELECT *
    FROM pong_games
    WHERE code = :code
    LIMIT 1
');
$stmt->execute([':code' => $code]);
$game = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$game) {
    json_response(['error' => 'game not found'], 404);
}

$isP1 = $userId === (int)$game['player1_id'];
$isP2 = $userId === (int)$game['player2_id'];

if (!$isP1 && !$isP2) {
    json_response(['error' => 'not a participant'], 403);
}

$col = $isP1 ? 'player1_ready' : 'player2_ready';

$stmt = $db->prepare("UPDATE pong_games SET $col = :r WHERE id = :id");
$stmt->execute([
    ':r'  => $ready ? 1 : 0,
    ':id' => $game['id'],
]);

$stmt = $db->prepare('SELECT * FROM pong_games WHERE id = :id LIMIT 1');
$stmt->execute([':id' => $game['id']]);
$game = $stmt->fetch(PDO::FETCH_ASSOC);

if ((int)$game['player1_ready'] === 1 &&
    (int)$game['player2_ready'] === 1 &&
    $game['status'] !== 'running' &&
    $game['status'] !== 'finished') {

    pong_reset_game_state($db, (int)$game['id']);
    $stmt = $db->prepare('UPDATE pong_games SET status = "running" WHERE id = :id');
    $stmt->execute([':id' => $game['id']]);
    $game['status'] = 'running';
}

json_response([
    'ok'      => true,
    'status'  => $game['status'],
    'ready'   => [
        'player1' => (bool)$game['player1_ready'],
        'player2' => (bool)$game['player2_ready'],
    ],
]);
