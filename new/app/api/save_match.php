<?php
require __DIR__ . '/db.php';

$expected = getenv('GAME_SERVER_SECRET') ?: '';
$provided = $_SERVER['HTTP_X_GAME_SECRET'] ?? '';
if ($expected === '' || !hash_equals($expected, $provided)) {
    json_response(['error' => 'forbidden'], 403);
}

$body = read_json_body();
$code = isset($body['code']) ? (string)$body['code'] : '';
$scoreLeft  = isset($body['score_left']) ? (int)$body['score_left'] : null;
$scoreRight = isset($body['score_right']) ? (int)$body['score_right'] : null;

if ($code === '' || $scoreLeft === null || $scoreRight === null) {
    json_response(['error' => 'missing fields'], 400);
}

$db = get_db();

$stmt = $db->prepare('SELECT id, player1_id, player2_id, status FROM pong_games WHERE code = :code LIMIT 1');
$stmt->execute([':code' => $code]);
$game = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$game) {
    json_response(['error' => 'game not found'], 404);
}

$gameId = (int)$game['id'];
$p1 = (int)$game['player1_id'];
$p2 = isset($game['player2_id']) ? (int)$game['player2_id'] : 0;

if ($p2 === 0) {
    json_response(['error' => 'game has no opponent'], 409);
}

$winnerId = null;
$loserId  = null;
$winnerSide = null;

if ($scoreLeft === $scoreRight) {
} elseif ($scoreLeft > $scoreRight) {
    $winnerId = $p1;
    $loserId  = $p2;
    $winnerSide = 'left';
} else {
    $winnerId = $p2;
    $loserId  = $p1;
    $winnerSide = 'right';
}

$now = time();

$db->beginTransaction();
try {
    $ins = $db->prepare(
        "INSERT INTO pong_matches (game_id, code, player1_id, player2_id, score_left, score_right, winner_id, created_at)\n         VALUES (:gid, :code, :p1, :p2, :sl, :sr, :wid, :now)"
    );
    $ins->execute([
        ':gid'  => $gameId,
        ':code' => $code,
        ':p1'   => $p1,
        ':p2'   => $p2,
        ':sl'   => $scoreLeft,
        ':sr'   => $scoreRight,
        ':wid'  => $winnerId,
        ':now'  => $now,
    ]);

    if ($winnerId !== null && $loserId !== null) {
        $u1 = $db->prepare('UPDATE users SET wins = wins + 1, updated_at = :dt WHERE id = :id');
        $u1->execute([':dt' => (new DateTimeImmutable())->format(DateTime::ATOM), ':id' => $winnerId]);

        $u2 = $db->prepare('UPDATE users SET losses = losses + 1, updated_at = :dt WHERE id = :id');
        $u2->execute([':dt' => (new DateTimeImmutable())->format(DateTime::ATOM), ':id' => $loserId]);
    }

    $upd = $db->prepare("UPDATE pong_games SET status = 'finished', updated_at = :now WHERE id = :id");
    $upd->execute([':now' => $now, ':id' => $gameId]);

    $db->commit();
} catch (PDOException $e) {
    $db->rollBack();
    error_log('PDO ERROR in save_match: ' . $e->getMessage());
    json_response(['error' => 'db error'], 500);
}

json_response([
    'ok' => true,
    'code' => $code,
    'score_left' => $scoreLeft,
    'score_right' => $scoreRight,
    'winner_side' => $winnerSide,
]);
