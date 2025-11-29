<?php

$path = getenv('DB_PATH') ?: '/var/www/sqlite/transcendence.sqlite';

try {
    $pdo = new PDO("sqlite:" . $path);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("PRAGMA foreign_keys = ON");

    echo "<p>Connected to SQLite DB at: " . htmlspecialchars($path) . "</p>";

    $pdo->exec("INSERT OR IGNORE INTO users (username) VALUES ('TestPlayer');");

    $stmt = $pdo->query("SELECT id, username, elo, created_at FROM users");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "<pre>";
    print_r($rows);
    echo "</pre>";

} catch (PDOException $e) {
    echo "<p>DB error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
