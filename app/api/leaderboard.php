<?php
// app/api/leaderboard.php
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

// Get top 10 players by Elo, ignore dummy names if needed
$stmt = $pdo->query("
    SELECT id, username, elo, created_at
    FROM users
    WHERE username != ''
    ORDER BY elo DESC, id ASC
    LIMIT 10
");

$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'status' => 'ok',
    'players' => $rows,
]);
