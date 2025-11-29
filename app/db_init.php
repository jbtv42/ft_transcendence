<?php

$path = getenv('DB_PATH') ?: '/var/www/sqlite/transcendence.sqlite';

echo "[init] Using DB path: $path\n";

try {
    $pdo = new PDO("sqlite:" . $path);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec("PRAGMA foreign_keys = ON");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            elo INTEGER NOT NULL DEFAULT 1000
        );
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            played_at TEXT DEFAULT (datetime('now')),
            mode TEXT NOT NULL,         -- 'mp', 'soloLeft', 'soloRight'
            max_score INTEGER NOT NULL
        );
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS match_players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            match_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            side TEXT NOT NULL,         -- 'left' or 'right'
            score INTEGER NOT NULL,
            FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    ");

    echo "[init] Schema created/verified.\n";

} catch (PDOException $e) {
    echo "[init] DB error: " . $e->getMessage() . "\n";
    exit(1);
}
