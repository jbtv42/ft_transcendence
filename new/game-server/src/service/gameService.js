import {
  WIDTH, HEIGHT, PADDLE_H, PADDLE_W, PADDLE_MARGIN,
  PADDLE_SPEED, BALL_R, WIN_SCORE,
} from "../domain/game/constants.js";

import { Match } from "../domain/game/match.js";
import { clamp, circleIntersectsRect, resetBall, speedUp } from "../domain/game/physics.js";

function randomCode() {
  const bytes = new Uint8Array(8);
  globalThis.crypto?.getRandomValues?.(bytes);
  if (!globalThis.crypto?.getRandomValues) {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function userPublic(u) {
  return u ? { id: u.id, username: u.username, display_name: u.display_name } : undefined;
}

export function createGameService(dbCtx) {
  const { dbGet, dbRun } = dbCtx;

  /** @type {Map<string, Match>} */
  const matchesByCode = new Map();

  function pickSide(match) {
    const hasLeft = match.players.some((p) => p.side === "left");
    return hasLeft ? "right" : "left";
  }

  function broadcast(match, msgObj) {
    const payload = JSON.stringify(msgObj);
    for (const p of match.players) {
      const s = p.socket;
      if (s && s.readyState === s.OPEN) s.send(payload);
    }
  }

  async function matchmakeForUser(user) {
    const now = Math.floor(Date.now() / 1000);

    const waiting = await dbGet(
      `SELECT id, code, player1_id
       FROM pong_games
       WHERE status = 'waiting'
         AND player2_id IS NULL
         AND player1_id != ?
       ORDER BY created_at ASC
       LIMIT 1`,
      [user.id]
    );

    if (waiting) {
      const upd = await dbRun(
        `UPDATE pong_games
         SET player2_id = ?, status = 'active', updated_at = ?
         WHERE id = ? AND player2_id IS NULL`,
        [user.id, now, waiting.id]
      );
      if (upd.changes > 0) {
        return { code: waiting.code, role: "right" };
      }
    }

    const code = randomCode();
    await dbRun(
      `INSERT INTO pong_games (code, player1_id, player2_id, status, created_at, updated_at)
       VALUES (?, ?, NULL, 'waiting', ?, ?)`,
      [code, user.id, now, now]
    );

    return { code, role: "left" };
  }

  function joinMatch({ user, code, socket }) {
    if (!code) {
      socket.send(JSON.stringify({ type: "status", text: "Missing match code." }));
      socket.close();
      return null;
    }

    let match = matchesByCode.get(code);
    if (!match) {
      match = new Match(code);
      matchesByCode.set(code, match);
    }

    if (match.players.length >= 2) {
      socket.send(JSON.stringify({ type: "status", text: "Match is full." }));
      socket.close();
      return null;
    }

    if (match.players.some((p) => p.user.id === user.id)) {
      socket.send(JSON.stringify({ type: "status", text: "You are already connected to this match." }));
      socket.close();
      return null;
    }

    const side = pickSide(match);

    const player = { socket, user, side, paddleY: HEIGHT / 2, inputDir: 0 };
    match.players.push(player);

    socket.send(JSON.stringify({
      type: "status",
      text: match.players.length < 2 ? "Waiting for opponent…" : "Opponent joined. Starting…",
      role: side,
    }));

    if (match.players.length === 2) match.status = "active";

    return { match, player };
  }

  function handleInput({ player, dir }) {
    const d = Number(dir);
    player.inputDir = d === -1 || d === 0 || d === 1 ? d : 0;
  }

  function handleDisconnect({ match, player }) {
    match.players = match.players.filter((p) => p !== player);

    if (match.players.length === 1 && !match.ended) {
      broadcast(match, { type: "status", text: "Opponent disconnected." });
      match.status = "waiting";
    }

    if (match.players.length === 0) {
      matchesByCode.delete(match.code);
    }
  }

  async function persistMatchResult({ code, scoreLeft, scoreRight }) {
    const game = await dbGet(
      `SELECT id, player1_id, player2_id, status FROM pong_games WHERE code = ? LIMIT 1`,
      [code]
    );
    if (!game) return;

    const gameId = Number(game.id);
    const p1 = Number(game.player1_id);
    const p2 = Number(game.player2_id || 0);
    if (!p2) return;

    let winnerId = null;
    let loserId = null;

    if (scoreLeft !== scoreRight) {
      winnerId = scoreLeft > scoreRight ? p1 : p2;
      loserId = scoreLeft > scoreRight ? p2 : p1;
    }

    const now = Math.floor(Date.now() / 1000);
    const dt = new Date().toISOString();

    await dbRun("BEGIN");
    try {
      await dbRun(
        `INSERT INTO pong_matches
         (game_id, code, player1_id, player2_id, score_left, score_right, winner_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [gameId, code, p1, p2, scoreLeft, scoreRight, winnerId, now]
      );

      if (winnerId && loserId) {
        await dbRun(`UPDATE users SET wins = wins + 1, updated_at = ? WHERE id = ?`, [dt, winnerId]);
        await dbRun(`UPDATE users SET losses = losses + 1, updated_at = ? WHERE id = ?`, [dt, loserId]);
      }

      await dbRun(`UPDATE pong_games SET status = 'finished', updated_at = ? WHERE id = ?`, [now, gameId]);

      await dbRun("COMMIT");
    } catch (e) {
      await dbRun("ROLLBACK");
      throw e;
    }
  }

  function tickAll() {
    for (const match of matchesByCode.values()) {
      if (match.ended) continue;
      if (match.players.length < 2) continue;
      if (match.status !== "active") match.status = "active";

      const left = match.players.find((p) => p.side === "left");
      const right = match.players.find((p) => p.side === "right");
      if (!left || !right) continue;

      for (const p of match.players) {
        p.paddleY += p.inputDir * PADDLE_SPEED;
        const minY = PADDLE_H / 2;
        const maxY = HEIGHT - PADDLE_H / 2;
        if (p.paddleY < minY) p.paddleY = minY;
        if (p.paddleY > maxY) p.paddleY = maxY;
      }

      match.ballX += match.vx;
      match.ballY += match.vy;

      if (match.ballY - BALL_R <= 0) {
        match.ballY = BALL_R;
        match.vy = Math.abs(match.vy);
      }
      if (match.ballY + BALL_R >= HEIGHT) {
        match.ballY = HEIGHT - BALL_R;
        match.vy = -Math.abs(match.vy);
      }

      const lpX = PADDLE_MARGIN;
      const lpY1 = left.paddleY - PADDLE_H / 2;

      const rpX1 = WIDTH - PADDLE_MARGIN - PADDLE_W;
      const rpY1 = right.paddleY - PADDLE_H / 2;

      if (match.vx < 0 && circleIntersectsRect(match.ballX, match.ballY, BALL_R, lpX, lpY1, PADDLE_W, PADDLE_H)) {
        match.ballX = lpX + PADDLE_W + BALL_R;
        match.vx = Math.abs(match.vx);
        const t = clamp((match.ballY - left.paddleY) / (PADDLE_H / 2), -1, 1);
        match.vy += t * 1.2;
        speedUp(match);
      }

      if (match.vx > 0 && circleIntersectsRect(match.ballX, match.ballY, BALL_R, rpX1, rpY1, PADDLE_W, PADDLE_H)) {
        match.ballX = rpX1 - BALL_R;
        match.vx = -Math.abs(match.vx);
        const t = clamp((match.ballY - right.paddleY) / (PADDLE_H / 2), -1, 1);
        match.vy += t * 1.2;
        speedUp(match);
      }

      if (match.ballX + BALL_R < 0) {
        match.scoreRight++;
        resetBall(match, -1);
        broadcast(match, { type: "status", text: `Point right! ${match.scoreLeft} - ${match.scoreRight}` });
      } else if (match.ballX - BALL_R > WIDTH) {
        match.scoreLeft++;
        resetBall(match, 1);
        broadcast(match, { type: "status", text: `Point left! ${match.scoreLeft} - ${match.scoreRight}` });
      }

      broadcast(match, {
        type: "state",
        state: {
          code: match.code,
          players: { left: userPublic(left.user), right: userPublic(right.user) },
          ball: { x: match.ballX, y: match.ballY },
          paddles: { leftY: left.paddleY, rightY: right.paddleY },
          score: { left: match.scoreLeft, right: match.scoreRight },
          status: match.status,
          winner: match.winner,
        },
      });

      if (match.scoreLeft >= WIN_SCORE || match.scoreRight >= WIN_SCORE) {
        match.ended = true;
        match.status = "finished";
        match.winner =
          match.scoreLeft === match.scoreRight ? null : match.scoreLeft > match.scoreRight ? "left" : "right";

        broadcast(match, { type: "status", text: `Game over — ${match.winner ?? "draw"}` });

        persistMatchResult({ code: match.code, scoreLeft: match.scoreLeft, scoreRight: match.scoreRight })
          .catch(() => {});
        matchesByCode.delete(match.code);
      }
    }
  }

  return { matchmakeForUser, joinMatch, handleInput, handleDisconnect, tickAll };
}

