<?php

require __DIR__ . '/common.php';

session_bootstrap();
if (empty($_SESSION['user_id'])) {
    json_response(['error' => 'not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];
$data   = read_json_body();

$code = isset($data['code']) ? strtoupper(trim($data['code'])) : '';
$move = isset($data['move']) ? trim($data['move']) : '';

if ($code === '' || ($move !== 'up' && $move !== 'down')) {
    json_response(['error' => 'invalid parameters'], 400);
}

$db = pong_get_db();

$stmt = $db->prepare('SELECT * FROM pong_games WHERE code = :code LIMIT 1');
$stmt->execute([':code' => $code]);
$game = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$game) {
    json_response(['error' => 'game not found'], 404);
}

if ($game['status'] !== 'running') {
    json_response(['error' => 'game not running'], 400);
}

$isP1 = $userId === (int)$game['player1_id'];
$isP2 = $userId === (int)$game['player2_id'];

if (!$isP1 && !$isP2) {
    json_response(['error' => 'not a participant'], 403);
}

$step = 0.08;
$delta = ($move === 'up') ? -$step : $step;

if ($isP1) {
    $y = (float)$game['paddle1_y'] + $delta;
    if ($y < 0.0) $y = 0.0;
    if ($y > 1.0) $y = 1.0;
    $stmt = $db->prepare('UPDATE pong_games SET paddle1_y = :y WHERE id = :id');
    $stmt->execute([':y' => $y, ':id' => $game['id']]);
} else {
    $y = (float)$game['paddle2_y'] + $delta;
    if ($y < 0.0) $y = 0.0;
    if ($y > 1.0) $y = 1.0;
    $stmt = $db->prepare('UPDATE pong_games SET paddle2_y = :y WHERE id = :id');
    $stmt->execute([':y' => $y, ':id' => $game['id']]);
}

json_response(['ok' => true]);
