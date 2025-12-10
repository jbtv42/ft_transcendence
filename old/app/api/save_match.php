<?php
header('Content-Type: application/json');

$path = getenv('DB_PATH') ?: '/var/www/sqlite/transcendence.sqlite';

try {
    $pdo = new PDO("sqlite:" . $path);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("PRAGMA foreign_keys = ON");
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB error: '.$e->getMessage()]);
    exit;
}

$body = file_get_contents('php://input');
$data = json_decode($body, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$mode      = $data['mode']      ?? null;
$maxScore  = $data['maxScore']  ?? null;
$left      = $data['leftPlayer']  ?? null;
$right     = $data['rightPlayer'] ?? null;

if (!$mode || !$maxScore || !$left || !$right) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing fields']);
    exit;
}

// -------- Elo helper (same logic as before, just SQLite) ----------
function updateElo(PDO $pdo, int $leftId, int $rightId, int $leftScore, int $rightScore, int $k = 32): void
{
    $stmt = $pdo->prepare("SELECT id, elo FROM users WHERE id IN (:l, :r)");
    $stmt->execute([':l' => $leftId, ':r' => $rightId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $elo = [];
    foreach ($rows as $row) {
        $elo[(int)$row['id']] = (int)$row['elo'];
    }

    $Ra = $elo[$leftId]  ?? 1000;
    $Rb = $elo[$rightId] ?? 1000;

    if ($leftScore > $rightScore) {
        $Sa = 1.0; $Sb = 0.0;
    } elseif ($leftScore < $rightScore) {
        $Sa = 0.0; $Sb = 1.0;
    } else {
        $Sa = 0.5; $Sb = 0.5;
    }

    $Ea = 1.0 / (1.0 + pow(10.0, ($Rb - $Ra) / 400.0));
    $Eb = 1.0 / (1.0 + pow(10.0, ($Ra - $Rb) / 400.0));

    $Ra_new = (int) round($Ra + $k * ($Sa - $Ea));
    $Rb_new = (int) round($Rb + $k * ($Sb - $Eb));

    $upd = $pdo->prepare("UPDATE users SET elo = :elo WHERE id = :id");
    $upd->execute([':elo' => $Ra_new, ':id' => $leftId]);
    $upd->execute([':elo' => $Rb_new, ':id' => $rightId]);
}

// ---------------- Main transaction ----------------
$pdo->beginTransaction();

// Insert or get users (SQLite way)
$userStmt = $pdo->prepare("INSERT OR IGNORE INTO users (username) VALUES (:username)");

$userStmt->execute([':username' => $left['username']]);
$leftId = (int)$pdo->query("SELECT id FROM users WHERE username = " . $pdo->quote($left['username']))->fetchColumn();

$userStmt->execute([':username' => $right['username']]);
$rightId = (int)$pdo->query("SELECT id FROM users WHERE username = " . $pdo->quote($right['username']))->fetchColumn();

// Insert match
$matchStmt = $pdo->prepare("
    INSERT INTO matches (mode, max_score)
    VALUES (:mode, :max_score)
");
$matchStmt->execute([
    ':mode'      => $mode,
    ':max_score' => $maxScore,
]);
$matchId = (int)$pdo->lastInsertId();

// Insert scores
$playerStmt = $pdo->prepare("
    INSERT INTO match_players (match_id, user_id, side, score)
    VALUES (:match_id, :user_id, :side, :score)
");

$playerStmt->execute([
    ':match_id' => $matchId,
    ':user_id'  => $leftId,
    ':side'     => 'left',
    ':score'    => (int)$left['score'],
]);

$playerStmt->execute([
    ':match_id' => $matchId,
    ':user_id'  => $rightId,
    ':side'     => 'right',
    ':score'    => (int)$right['score'],
]);

updateElo($pdo, $leftId, $rightId, (int)$left['score'], (int)$right['score']);

$pdo->commit();

echo json_encode([
    'status'  => 'ok',
    'matchId' => $matchId,
]);
