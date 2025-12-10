<?php

require __DIR__ . '/../db.php';

function pong_get_db(): PDO
{
    $db = get_db();
    pong_ensure_schema($db);
    return $db;
}

function pong_ensure_schema(PDO $db): void
{
    $db->exec('
        CREATE TABLE IF NOT EXISTS pong_games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            player1_id INTEGER NOT NULL,
            player2_id INTEGER,
            status TEXT NOT NULL,              -- waiting | ready | running | finished
            created_at INTEGER NOT NULL,

            player1_ready INTEGER NOT NULL DEFAULT 0,
            player2_ready INTEGER NOT NULL DEFAULT 0,

            score1 INTEGER NOT NULL DEFAULT 0,
            score2 INTEGER NOT NULL DEFAULT 0,
            max_score INTEGER NOT NULL DEFAULT 5,

            ball_x REAL NOT NULL DEFAULT 0.5,
            ball_y REAL NOT NULL DEFAULT 0.5,
            ball_vx REAL NOT NULL DEFAULT 0.4,
            ball_vy REAL NOT NULL DEFAULT 0.25,

            paddle1_y REAL NOT NULL DEFAULT 0.5,
            paddle2_y REAL NOT NULL DEFAULT 0.5,

            last_update REAL NOT NULL DEFAULT 0
        )
    ');

    $columns = [
        'player1_ready INTEGER NOT NULL DEFAULT 0',
        'player2_ready INTEGER NOT NULL DEFAULT 0',
        'score1 INTEGER NOT NULL DEFAULT 0',
        'score2 INTEGER NOT NULL DEFAULT 0',
        'max_score INTEGER NOT NULL DEFAULT 5',
        'ball_x REAL NOT NULL DEFAULT 0.5',
        'ball_y REAL NOT NULL DEFAULT 0.5',
        'ball_vx REAL NOT NULL DEFAULT 0.4',
        'ball_vy REAL NOT NULL DEFAULT 0.25',
        'paddle1_y REAL NOT NULL DEFAULT 0.5',
        'paddle2_y REAL NOT NULL DEFAULT 0.5',
        'last_update REAL NOT NULL DEFAULT 0',
    ];

    foreach ($columns as $colDef) {
        try {
            $db->exec('ALTER TABLE pong_games ADD COLUMN ' . $colDef);
        } catch (Throwable $e) {
        }
    }
}


function pong_reset_game_state(PDO $db, int $gameId, int $maxScore = 5): void
{
    $vx = (mt_rand(0, 1) === 0 ? -1 : 1) * 0.4;
    $vy = ((mt_rand(0, 100) / 100.0) - 0.5) * 0.5;
    $now = microtime(true);

    $stmt = $db->prepare('
        UPDATE pong_games
        SET
            score1 = 0,
            score2 = 0,
            max_score = :max_score,
            ball_x = 0.5,
            ball_y = 0.5,
            ball_vx = :vx,
            ball_vy = :vy,
            paddle1_y = 0.5,
            paddle2_y = 0.5,
            last_update = :lu
        WHERE id = :id
    ');
    $stmt->execute([
        ':max_score' => $maxScore,
        ':vx'        => $vx,
        ':vy'        => $vy,
        ':lu'        => $now,
        ':id'        => $gameId,
    ]);
}

function pong_update_physics(PDO $db, array &$game): void
{
    if ($game['status'] !== 'running') {
        return;
    }

    $now  = microtime(true);
    $last = isset($game['last_update']) ? (float)$game['last_update'] : 0.0;

    if ($last <= 0) {
        $game['last_update'] = $now;
        $stmt = $db->prepare('UPDATE pong_games SET last_update = :lu WHERE id = :id');
        $stmt->execute([':lu' => $now, ':id' => $game['id']]);
        return;
    }

    $dt = $now - $last;
    if ($dt <= 0) {
        return;
    }
    if ($dt > 0.2) {
        $dt = 0.2;
    }

    $ballX = (float)$game['ball_x'];
    $ballY = (float)$game['ball_y'];
    $vx    = (float)$game['ball_vx'];
    $vy    = (float)$game['ball_vy'];

    $p1y   = (float)$game['paddle1_y'];
    $p2y   = (float)$game['paddle2_y'];

    $score1    = (int)$game['score1'];
    $score2    = (int)$game['score2'];
    $maxScore  = (int)$game['max_score'];

    $ballX += $vx * $dt;
    $ballY += $vy * $dt;

    if ($ballY < 0.0) {
        $ballY = -$ballY;
        $vy    = -$vy;
    } elseif ($ballY > 1.0) {
        $ballY = 2.0 - $ballY;
        $vy    = -$vy;
    }

    $paddleHeight = 0.25;
    $paddleHalf   = $paddleHeight / 2.0;

    if ($ballX <= 0.0) {
        if ($ballY >= $p1y - $paddleHalf && $ballY <= $p1y + $paddleHalf) {
            $ballX = -$ballX;
            $vx    = -$vx;
        } else {
            $score2++;
            $ballX = 0.5;
            $ballY = 0.5;
            $vx    = 0.4;
            $vy    = ((mt_rand(0, 100) / 100.0) - 0.5) * 0.5;
        }
    }

    if ($ballX >= 1.0) {
        if ($ballY >= $p2y - $paddleHalf && $ballY <= $p2y + $paddleHalf) {
            $ballX = 2.0 - $ballX;
            $vx    = -$vx;
        } else {
            $score1++;
            $ballX = 0.5;
            $ballY = 0.5;
            $vx    = -0.4;
            $vy    = ((mt_rand(0, 100) / 100.0) - 0.5) * 0.5;
        }
    }

    $status = $game['status'];
    if ($score1 >= $maxScore || $score2 >= $maxScore) {
        $status = 'finished';
    }

    $stmt = $db->prepare('
        UPDATE pong_games
        SET
            ball_x = :bx,
            ball_y = :by,
            ball_vx = :vx,
            ball_vy = :vy,
            score1 = :s1,
            score2 = :s2,
            last_update = :lu,
            status = :status
        WHERE id = :id
    ');
    $stmt->execute([
        ':bx'     => $ballX,
        ':by'     => $ballY,
        ':vx'     => $vx,
        ':vy'     => $vy,
        ':s1'     => $score1,
        ':s2'     => $score2,
        ':lu'     => $now,
        ':status' => $status,
        ':id'     => $game['id'],
    ]);

    $game['ball_x']      = $ballX;
    $game['ball_y']      = $ballY;
    $game['ball_vx']     = $vx;
    $game['ball_vy']     = $vy;
    $game['score1']      = $score1;
    $game['score2']      = $score2;
    $game['last_update'] = $now;
    $game['status']      = $status;
}
