const canvas = document.getElementById("gameCanvas");
const statusEl = document.getElementById("status");
const scoreEl = document.getElementById("score");
if (!canvas)
    throw new Error("Missing #gameCanvas");
const ctx = canvas.getContext("2d");
if (!ctx)
    throw new Error("No 2D context");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PADDLE_H = 90;
const PADDLE_W = 10;
const PADDLE_MARGIN = 20;
const BALL_R = 8;
let lastState = null;
let ws = null;
let myRole = null;
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
let lastBall = null;
let lastPaddles = null;
function dlog(...args) {
    if (!DEBUG)
        return;
    console.log("[game]", ...args);
}
function setStatus(text) {
    if (statusEl)
        statusEl.textContent = text;
}
function setScore(left, right) {
    if (scoreEl)
        scoreEl.textContent = `${left} : ${right}`;
}
async function apiJson(url, init) {
    var _a;
    const res = await fetch(url, Object.assign(Object.assign({ credentials: "include" }, init), { headers: Object.assign(Object.assign({}, ((_a = init === null || init === void 0 ? void 0 : init.headers) !== null && _a !== void 0 ? _a : {})), { "Content-Type": "application/json" }) }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = data && (data.error || data.message)
            ? String(data.error || data.message)
            : `HTTP ${res.status}`;
        throw new Error(msg);
    }
    return data;
}
function nowMs() {
    return Date.now();
}
function drawDebugOverlay() {
    var _a;
    if (!DEBUG || !ctx)
        return;
    const lines = [];
    lines.push(`role=${myRole !== null && myRole !== void 0 ? myRole : "?"}`);
    lines.push(`ws=${ws ? WebSocketState(ws.readyState) : "null"}`);
    lines.push(`msgs=${wsMsgCount} stateMsgs=${wsStateCount}`);
    lines.push(`lastMsg=${lastWsMsgAt ? (nowMs() - lastWsMsgAt) + "ms ago" : "-"}`);
    lines.push(`lastState=${lastStateAt ? (nowMs() - lastStateAt) + "ms ago" : "-"}`);
    if (lastState) {
        lines.push(`status=${lastState.status} code=${(_a = lastState.code) !== null && _a !== void 0 ? _a : "?"}`);
        lines.push(`score=${lastState.score.left}:${lastState.score.right}`);
        lines.push(`ball=(${lastState.ball.x.toFixed(1)},${lastState.ball.y.toFixed(1)})`);
        lines.push(`paddles=(${lastState.paddles.leftY.toFixed(1)},${lastState.paddles.rightY.toFixed(1)})`);
        lines.push(`players L=${lastState.players.left ? lastState.players.left.username : "-"} R=${lastState.players.right ? lastState.players.right.username : "-"}`);
    }
    else {
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
function WebSocketState(rs) {
    if (rs === WebSocket.CONNECTING)
        return "CONNECTING";
    if (rs === WebSocket.OPEN)
        return "OPEN";
    if (rs === WebSocket.CLOSING)
        return "CLOSING";
    if (rs === WebSocket.CLOSED)
        return "CLOSED";
    return String(rs);
}
async function boot() {
    try {
        const me = await apiJson("/api/me", { method: "GET" });
        dlog("me OK:", me);
    }
    catch (e) {
        setStatus("Not logged in. Redirecting…");
        window.location.href = "/index.html";
        return;
    }
    let mm;
    try {
        mm = await apiJson("/api/game/matchmake", { method: "POST" });
    }
    catch (e) {
        setStatus(`Matchmaking failed: ${e.message}`);
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
    ws.onmessage = (event) => {
        wsMsgCount++;
        lastWsMsgAt = nowMs();
        const raw = String(event.data);
        let msg;
        try {
            msg = JSON.parse(raw);
        }
        catch (_a) {
            dlog("wss msg (non-json):", raw.slice(0, 200));
            return;
        }
        if (DEBUG) {
            const t = msg === null || msg === void 0 ? void 0 : msg.type;
            if (t === "state") {
                if (wsStateCount % 30 === 0)
                    dlog("ws state (sample)", msg);
            }
            else {
                dlog("wss msg", msg);
            }
        }
        if (msg.type === "status") {
            if (typeof msg.text === "string")
                setStatus(msg.text);
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
            const next = msg.state;
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
            }
            else if (next.status === "active") {
                const you = myRole ? `You: ${myRole}` : "You";
                setStatus(`${you} — Use ↑ / ↓`);
            }
            else if (next.status === "finished") {
                const w = next.winner ? `${next.winner} wins` : "Draw";
                setStatus(`Game over — ${w}`);
            }
            if (DEBUG && myRole) {
                const me = next.players[myRole];
                if (!me)
                    dlog("WARN: myRole set but players[myRole] missing in state", { myRole, players: next.players });
            }
            return;
        }
    };
    let dir = 0;
    function sendDir(newDir) {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            dlog("sendDir blocked: ws not open", { newDir, ws: ws ? WebSocketState(ws.readyState) : "null" });
            return;
        }
        if (newDir === dir)
            return;
        dir = newDir;
        const payload = { type: "input", dir };
        ws.send(JSON.stringify(payload));
        dlog("sent input", payload);
    }
    window.addEventListener("keydown", (ev) => {
        if (ev.key === "ArrowUp")
            sendDir(-1);
        if (ev.key === "ArrowDown")
            sendDir(1);
    });
    window.addEventListener("keyup", (ev) => {
        if (ev.key === "ArrowUp" || ev.key === "ArrowDown")
            sendDir(0);
    });
}
function render() {
    if (!ctx)
        return;
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
    setStatus(`Boot error: ${e.message}`);
});
render();
