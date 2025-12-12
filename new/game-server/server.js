import { WebSocketServer } from 'ws';

const GAME_PORT = Number(process.env.GAME_PORT || 3000);
const PHP_API_BASE = process.env.PHP_API_BASE || 'http://php';
const GAME_SERVER_SECRET = process.env.GAME_SERVER_SECRET || '';

const WIDTH = 800;
const HEIGHT = 600;
const PADDLE_H = 90;
const PADDLE_W = 10;
const PADDLE_MARGIN = 20;
const PADDLE_SPEED = 7;
const BALL_R = 8;
const TICK_HZ = 60;
const WIN_SCORE = 5;

/** @typedef {{ id: number, username: string, display_name: string }} User */

class Match {
  constructor(code) {
    this.code = code;
    /** @type {{ socket: import('ws').WebSocket, user: User, side: 'left'|'right', paddleY: number, inputDir: number }[]} */
    this.players = [];

    this.ballX = WIDTH / 2;
    this.ballY = HEIGHT / 2;
    this.vx = 4;
    this.vy = 2.5;

    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.startedAt = Date.now();
    this.ended = false;
  }
}

/** @type {Map<string, Match>} */
const matchesByCode = new Map();
/** @type {import('ws').WebSocket[]} */
const waitingQueue = [];

const wss = new WebSocketServer({ port: GAME_PORT });
console.log(`Game server listening on port ${GAME_PORT}`);

wss.on('connection', async (socket, request) => {

  console.log('WS CONNECT', request.url);
  console.log('WS COOKIE', request.headers['cookie']);

  try {
    const url = new URL(request.url || '/', 'http://localhost');
    const code = url.searchParams.get('code');

    const cookie = request.headers['cookie'] || '';
    console.log('PHP_API_BASE =', PHP_API_BASE);
    console.log('WS COOKIE HDR =', request.headers['cookie']);
    const user = await fetchUserFromPhp(cookie);

    if (!user) {
      socket.send(JSON.stringify({ type: 'status', text: 'Not authenticated. Please login.' }));
      socket.close();
      return;
    }

    let match = null;

    if (code) {
      match = matchesByCode.get(code) || new Match(code);
      matchesByCode.set(code, match);
    } else {
      if (waitingQueue.length > 0) {
        const otherSock = waitingQueue.shift();
        if (otherSock && otherSock.__matchCode) {
          match = matchesByCode.get(otherSock.__matchCode) || null;
        }
      }
      if (!match) {
        const autoCode = cryptoRandomCode();
        match = new Match(autoCode);
        matchesByCode.set(autoCode, match);
      }
    }

    if (match.players.length >= 2) {
      socket.send(JSON.stringify({ type: 'status', text: 'Match is full.' }));
      socket.close();
      return;
    }

    if (match.players.some(p => p.user.id === user.id)) {
      socket.send(JSON.stringify({ type: 'status', text: 'You are already connected to this match.' }));
      socket.close();
      return;
    }

    const side = match.players.length === 0 ? 'left' : 'right';

    const player = {
      socket,
      user,
      side,
      paddleY: HEIGHT / 2,
      inputDir: 0,
    };
    match.players.push(player);

    socket.__matchCode = match.code;

    socket.send(JSON.stringify({
      type: 'hello',
      code: match.code,
      side,
      you: { id: user.id, username: user.username, display_name: user.display_name },
    }));

    broadcast(match, {
      type: 'status',
      text: match.players.length < 2
        ? 'Waiting for opponent…'
        : 'Opponent joined. Starting…'
    });

    if (match.players.length === 2) {
      const leftP = match.players.find(p => p.side === 'left');
      const rightP = match.players.find(p => p.side === 'right');
      broadcast(match, {
        type: 'players',
        left: leftP ? leftP.user : null,
        right: rightP ? rightP.user : null,
      });
    }

    socket.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === 'input') {
        const dir = Number(msg.dir);
        player.inputDir = dir === -1 || dir === 0 || dir === 1 ? dir : 0;
      }
    });

    socket.on('close', () => {
      match.players = match.players.filter(p => p !== player);

      if (match.players.length === 1 && !match.ended) {
        broadcast(match, { type: 'status', text: 'Opponent disconnected.' });
      }

      if (match.players.length === 0) {
        matchesByCode.delete(match.code);
      }
    });

  } catch (err) {
    console.error('WS connection error:', err);
    try { socket.close(); } catch {}
  }
});

setInterval(() => {
  for (const match of matchesByCode.values()) {
    if (match.ended) continue;
    if (match.players.length < 2) continue;
    const left = match.players.find(p => p.side === 'left');
    const right = match.players.find(p => p.side === 'right');
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
    const lpY2 = left.paddleY + PADDLE_H / 2;
    const lpX1 = lpX;
    const lpX2 = lpX + PADDLE_W;

    const rpX = WIDTH - PADDLE_MARGIN - PADDLE_W;
    const rpY1 = right.paddleY - PADDLE_H / 2;
    const rpY2 = right.paddleY + PADDLE_H / 2;
    const rpX1 = rpX;
    const rpX2 = rpX + PADDLE_W;

    if (match.vx < 0 && circleIntersectsRect(match.ballX, match.ballY, BALL_R, lpX1, lpY1, PADDLE_W, PADDLE_H)) {
      match.ballX = lpX2 + BALL_R;
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
      broadcast(match, { type: 'status', text: `Point right! ${match.scoreLeft} - ${match.scoreRight}` });
    } else if (match.ballX - BALL_R > WIDTH) {
      match.scoreLeft++;
      resetBall(match, 1);
      broadcast(match, { type: 'status', text: `Point left! ${match.scoreLeft} - ${match.scoreRight}` });
    }

    broadcast(match, {
      type: "state",
      state: {
        code: match.code,

        players: {
          left: match.players[0]?.user
            ? {
                id: match.players[0].user.id,
                username: match.players[0].user.username,
                display_name: match.players[0].user.display_name,
              }
            : undefined,
          right: match.players[1]?.user
            ? {
                id: match.players[1].user.id,
                username: match.players[1].user.username,
                display_name: match.players[1].user.display_name,
              }
            : undefined,
        },

        ball: { x: match.ballX, y: match.ballY },

        paddles: {
          leftY: match.players[0]?.paddleY ?? (HEIGHT / 2),
          rightY: match.players[1]?.paddleY ?? (HEIGHT / 2),
        },

        score: { left: match.scoreLeft, right: match.scoreRight },

        status: match.status,
        winner: match.winner ?? null,
      },
    });


    if (match.scoreLeft >= WIN_SCORE || match.scoreRight >= WIN_SCORE) {
      endMatch(match, left, right).catch(err => console.error('endMatch error:', err));
    }
  }
}, 1000 / TICK_HZ);

function broadcast(match, msg) {
  const payload = JSON.stringify(msg);
  for (const p of match.players) {
    if (p.socket.readyState === p.socket.OPEN) {
      p.socket.send(payload);
    }
  }
}

function resetBall(match, dir) {
  match.ballX = WIDTH / 2;
  match.ballY = HEIGHT / 2;
  const base = 4;
  match.vx = base * dir;
  match.vy = (Math.random() * 2 - 1) * 2.5;
}

function speedUp(match) {
  const cap = 9;
  const s = Math.hypot(match.vx, match.vy);
  if (s < cap) {
    match.vx *= 1.03;
    match.vy *= 1.03;
  }
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function circleIntersectsRect(cx, cy, r, rx, ry, rw, rh) {
  const px = clamp(cx, rx, rx + rw);
  const py = clamp(cy, ry, ry + rh);
  const dx = cx - px;
  const dy = cy - py;
  return (dx * dx + dy * dy) <= r * r;
}

function cryptoRandomCode() {
  const bytes = new Uint8Array(8);
  globalThis.crypto?.getRandomValues?.(bytes);
  if (!globalThis.crypto?.getRandomValues) {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function fetchUserFromPhp(cookieHeader) {
  console.log('AUTH cookieHeader:', cookieHeader);
  console.log('AUTH sending Cookie =', cookieHeader);
  console.log('AUTH url =', `${PHP_API_BASE}/api/me.php`);

  try {
    const res = await fetch(`${PHP_API_BASE}/api/me.php`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Accept': 'application/json',
      },
    });

    const text = await res.text();
    if (!res.ok) return null;

    let data;
    try { data = JSON.parse(text); }
    catch { return null; }

    // Accept: { ok:true, user:{...} }
    if (data && data.ok === true && data.user) {
      return {
        id: Number(data.user.id),
        username: String(data.user.username),
        display_name: String(data.user.display_name),
      };
    }

    // Accept: { user:{...} }
    if (data && data.user) {
      return {
        id: Number(data.user.id),
        username: String(data.user.username),
        display_name: String(data.user.display_name),
      };
    }

    // Accept: direct user object
    if (data && (data.id !== undefined) && data.username && data.display_name) {
      return {
        id: Number(data.id),
        username: String(data.username),
        display_name: String(data.display_name),
      };
    }

    return null;
  } catch {
    return null;
  }
}

async function endMatch(match, left, right) {
  if (match.ended) return;
  match.ended = true;

  const winnerSide = match.scoreLeft === match.scoreRight
    ? null
    : (match.scoreLeft > match.scoreRight ? 'left' : 'right');

  broadcast(match, {
    type: 'game_over',
    winnerSide,
    scoreLeft: match.scoreLeft,
    scoreRight: match.scoreRight,
  });

  try {
    await fetch(`${PHP_API_BASE}/api/save_match.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Game-Secret': GAME_SERVER_SECRET,
      },
      body: JSON.stringify({
        code: match.code,
        score_left: match.scoreLeft,
        score_right: match.scoreRight,
      }),
    });
  } catch (e) {
    console.error('Failed to report match to PHP:', e);
  }

  for (const p of match.players) {
    try { p.socket.close(); } catch {}
  }

  matchesByCode.delete(match.code);
}
