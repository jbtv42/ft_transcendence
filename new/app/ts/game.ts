type _MaybeEl<T extends HTMLElement> = T | null;

type WsState = {
  code: string;
  players: {
    left?: { id: number; username: string; display_name: string };
    right?: { id: number; username: string; display_name: string };
  };
  ball: { x: number; y: number };
  paddles: { leftY: number; rightY: number };
  score: { left: number; right: number };
  status: "waiting" | "active" | "finished";
  winner: "left" | "right" | null;
};

const canvas = document.getElementById("gameCanvas") as _MaybeEl<HTMLCanvasElement>;
const statusEl = document.getElementById("status") as _MaybeEl<HTMLSpanElement>;
const scoreEl = document.getElementById("score") as _MaybeEl<HTMLSpanElement>;

if (!canvas) throw new Error("Missing #gameCanvas");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("No 2D context");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const PADDLE_H = 90;
const PADDLE_W = 10;
const PADDLE_MARGIN = 20;
const BALL_R = 8;

let lastState: WsState | null = null;
let ws: WebSocket | null = null;
let myRole: "left" | "right" | null = null;

// -----------------------
// DEBUG TOGGLES
// -----------------------
const DEBUG = true; // set false when done

// Debug counters / timestamps
let wsMsgCount = 0;
let wsStateCount = 0;
let lastWsMsgAt = 0;
let lastStateAt = 0;
let lastRenderAt = performance.now();
let lastBall: { x: number; y: number } | null = null;
let lastPaddles: { leftY: number; rightY: number } | null = null;

function dlog(...args: any[]): void {
  if (!DEBUG) return;
  console.log("[game]", ...args);
}

function setStatus(text: string): void {
  if (statusEl) statusEl.textContent = text;
}

function setScore(left: number, right: number): void {
  if (scoreEl) scoreEl.textContent = `${left} : ${right}`;
}

// ✅ safer apiJson (cookies always, better errors, only sets JSON header if needed)
async function apiJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");

  // Only set JSON content-type if we're actually sending a body
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers,
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(String(msg));
  }

  return data as T;
}

function nowMs(): number {
  return Date.now();
}

function drawDebugOverlay(): void {
  if (!DEBUG || !ctx) return;
  const lines: string[] = [];
  lines.push(`role=${myRole ?? "?"}`);
  lines.push(`ws=${ws ? WebSocketState(ws.readyState) : "null"}`);
  lines.push(`msgs=${wsMsgCount} stateMsgs=${wsStateCount}`);
  lines.push(`lastMsg=${lastWsMsgAt ? nowMs() - lastWsMsgAt + "ms ago" : "-"}`);
  lines.push(`lastState=${lastStateAt ? nowMs() - lastStateAt + "ms ago" : "-"}`);
  if (lastState) {
    lines.push(`status=${lastState.status} code=${lastState.code ?? "?"}`);
    lines.push(`score=${lastState.score.left}:${lastState.score.right}`);
    lines.push(`ball=(${lastState.ball.x.toFixed(1)},${lastState.ball.y.toFixed(1)})`);
    lines.push(`paddles=(${lastState.paddles.leftY.toFixed(1)},${lastState.paddles.rightY.toFixed(1)})`);
    lines.push(
      `players L=${lastState.players.left ? lastState.players.left.username : "-"} R=${
        lastState.players.right ? lastState.players.right.username : "-"
      }`
    );
  } else {
    lines.push("state=null");
  }

  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = "black";
  ctx.fillRect(10, 10, 420, 18 * (lines.length + 1));
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = "white";
  ctx.font = "12px monospace";
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], 18, 30 + i * 16);
  }
  ctx.restore();
}

function WebSocketState(rs: number): string {
  if (rs === WebSocket.CONNECTING) return "CONNECTING";
  if (rs === WebSocket.OPEN) return "OPEN";
  if (rs === WebSocket.CLOSING) return "CLOSING";
  if (rs === WebSocket.CLOSED) return "CLOSED";
  return String(rs);
}

async function boot(): Promise<void> {
  try {
    const me = await apiJson<any>("/api/me", { method: "GET" });
    dlog("me OK:", me);
  } catch (e) {
    setStatus("Not logged in. Redirecting…");
    window.location.href = "/index.html";
    return;
  }

  type MMResp = { ok: true; code: string; role: "left" | "right" };
  let mm: MMResp;

  try {
    // ✅ send an empty JSON body to avoid 400s on strict servers
    mm = await apiJson<MMResp>("/api/game/matchmake", { method: "POST", body: "{}" });
  } catch (e) {
    setStatus(`Matchmaking failed: ${(e as Error).message}`);
    dlog("matchmake FAILED:", e);
    return;
  }

  myRole = mm.role;
  setStatus(`Matched as ${myRole}. Connecting…`);
  dlog("matchmake OK:", mm);

  const proto = location.protocol === "https:" ? "wss" : "ws";
  const wsUrl = `${proto}://${location.host}/ws?code=${encodeURIComponent(mm.code)}`;
  dlog("WSS URL:", wsUrl);

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    setStatus("Connected. Waiting for opponent…");
    dlog("wss open");
  };

  ws.onclose = (ev) => {
    setStatus("Disconnected. Refresh to rejoin.");
    dlog("wss close", { code: ev.code, reason: ev.reason, wasClean: ev.wasClean });
  };

  ws.onerror = () => {
    setStatus("WebSocket error.");
    dlog("wss error");
  };

  ws.onmessage = (event: MessageEvent) => {
    wsMsgCount++;
    lastWsMsgAt = nowMs();

    const raw = String(event.data);
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      dlog("wss msg (non-json):", raw.slice(0, 200));
      return;
    }

    if (DEBUG) {
      const t = msg?.type;
      if (t === "state") {
        if (wsStateCount % 30 === 0) dlog("ws state (sample)", msg);
      } else {
        dlog("wss msg", msg);
      }
    }

    if (msg.type === "status") {
      if (typeof msg.text === "string") setStatus(msg.text);
      if (msg.role === "left" || msg.role === "right") {
        const old = myRole;
        myRole = msg.role;
        dlog("role update from server", { old, new: myRole });
      }
      return;
    }

    if (msg.type === "state") {
      wsStateCount++;
      lastStateAt = nowMs();

      const next = msg.state as WsState;
      lastState = next;

      if (!next || !next.ball || !next.paddles || !next.score) {
        dlog("BAD state shape:", next);
        return;
      }

      if (lastBall) {
        const dx = Math.abs(next.ball.x - lastBall.x);
        const dy = Math.abs(next.ball.y - lastBall.y);
        if (next.status === "active" && dx < 0.001 && dy < 0.001 && wsStateCount % 60 === 0) {
          dlog("WARN: active but ball seems frozen");
        }
      }
      lastBall = { x: next.ball.x, y: next.ball.y };

      if (lastPaddles) {
        const dL = Math.abs(next.paddles.leftY - lastPaddles.leftY);
        const dR = Math.abs(next.paddles.rightY - lastPaddles.rightY);
        if (wsStateCount % 60 === 0) {
          dlog("paddle delta sample", { dL, dR });
        }
      }
      lastPaddles = { leftY: next.paddles.leftY, rightY: next.paddles.rightY };

      setScore(next.score.left, next.score.right);

      if (next.status === "waiting") {
        setStatus("Waiting for opponent…");
      } else if (next.status === "active") {
        const you = myRole ? `You: ${myRole}` : "You";
        setStatus(`${you} — Use ↑ / ↓`);
      } else if (next.status === "finished") {
        const w = next.winner ? `${next.winner} wins` : "Draw";
        setStatus(`Game over — ${w}`);
      }

      if (DEBUG && myRole) {
        const me = next.players[myRole];
        if (!me) dlog("WARN: myRole set but players[myRole] missing in state", { myRole, players: next.players });
      }
      return;
    }
  };

  let dir = 0;

  function sendDir(newDir: number): void {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      dlog("sendDir blocked: ws not open", { newDir, ws: ws ? WebSocketState(ws.readyState) : "null" });
      return;
    }
    if (newDir === dir) return;
    dir = newDir;
    const payload = { type: "input", dir };
    ws.send(JSON.stringify(payload));
    dlog("sent input", payload);
  }

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowUp") sendDir(-1);
    if (ev.key === "ArrowDown") sendDir(1);
  });

  window.addEventListener("keyup", (ev) => {
    if (ev.key === "ArrowUp" || ev.key === "ArrowDown") sendDir(0);
  });
}

function render(): void {
  if (!ctx) return;

  const now = performance.now();
  const dt = now - lastRenderAt;
  lastRenderAt = now;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.fillRect(WIDTH / 2 - 1, 0, 2, HEIGHT);

  if (lastState) {
    ctx.beginPath();
    ctx.arc(lastState.ball.x, lastState.ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();

    const leftX = PADDLE_MARGIN;
    const rightX = WIDTH - PADDLE_MARGIN - PADDLE_W;

    ctx.fillRect(leftX, lastState.paddles.leftY - PADDLE_H / 2, PADDLE_W, PADDLE_H);
    ctx.fillRect(rightX, lastState.paddles.rightY - PADDLE_H / 2, PADDLE_W, PADDLE_H);
  }

  drawDebugOverlay();

  requestAnimationFrame(render);
}

boot().catch((e) => {
  dlog("Boot error:", e);
  setStatus(`Boot error: ${(e as Error).message}`);
});
render();
