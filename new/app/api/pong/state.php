<?php

require __DIR__ . '/common.php';

session_bootstrap();
if (empty($_SESSION['user_id'])) {
    json_response(['error' => 'not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];

$code = isset($_GET['code']) ? strtoupper(trim($_GET['code'])) : '';
if ($code === '') {
    json_response(['error' => 'missing code'], 400);
}

$db = pong_get_db();

$stmt = $db->prepare('
    SELECT
        id, code, player1_id, player2_id, status, created_at,
        player1_ready, player2_ready,
        score1, score2, max_score,
        ball_x, ball_y, ball_vx, ball_vy,
        paddle1_y, paddle2_y,
        last_update
    FROM pong_games
    WHERE code = :code
    LIMIT 1
');
$stmt->execute([':code' => $code]);
$game = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$game) {
    json_response(['error' => 'game not found'], 404);
}

if ($userId !== (int)$game['player1_id'] && $userId !== (int)$game['player2_id']) {
    json_response(['error' => 'not a participant'], 403);
}

pong_update_physics($db, $game);

$players = [];
$stmtUser = $db->prepare('SELECT id, username, display_name FROM users WHERE id = :id');

if (!empty($game['player1_id'])) {
    $stmtUser->execute([':id' => $game['player1_id']]);
    $u = $stmtUser->fetch(PDO::FETCH_ASSOC) ?: [];
    $players['player1'] = [
        'id'           => (int)$game['player1_id'],
        'username'     => $u['username']     ?? null,
        'display_name' => $u['display_name'] ?? null,
    ];
}

if (!empty($game['player2_id'])) {
    $stmtUser->execute([':id' => $game['player2_id']]);
    $u = $stmtUser->fetch(PDO::FETCH_ASSOC) ?: [];
    $players['player2'] = [
        'id'           => (int)$game['player2_id'],
        'username'     => $u['username']     ?? null,
        'display_name' => $u['display_name'] ?? null,
    ];
}

json_response([
    'code'    => $game['code'],
    'status'  => $game['status'],
    'players' => $players,
    'you'     => $userId,
    'ready'   => [
        'player1' => (bool)$game['player1_ready'],
        'player2' => (bool)$game['player2_ready'],
    ],
    'score'   => [
        'player1' => (int)$game['score1'],
        'player2' => (int)$game['score2'],
    ],
    'max_score' => (int)$game['max_score'],
    'ball'      => [
        'x' => (float)$game['ball_x'],
        'y' => (float)$game['ball_y'],
    ],
    'paddles'   => [
        'player1' => (float)$game['paddle1_y'],
        'player2' => (float)$game['paddle2_y'],
    ],
]);

