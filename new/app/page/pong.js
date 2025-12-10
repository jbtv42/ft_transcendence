let currentCode = null;
let pollTimer = null;
let currentUserId = null;
let currentState = null;
let youRole = null;

async function apiGet(url) {
  const resp = await fetch(url, { credentials: "include" });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw data;
  }
  return data;
}

async function apiPost(url, body) {
  const resp = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body || {}),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw data;
  }
  return data;
}

async function checkLogin() {
  try {
    const data = await apiGet("/api/me.php");
    const me = data.user || data;

    currentUserId = me.id;
    document.getElementById("user-info").textContent =
      "Logged in as " +
      (me.display_name ||
        me.username ||
        (me.id ? "User #" + me.id : "Unknown user"));
  } catch (err) {
    document.getElementById("user-info").textContent =
      "Not logged in. Please log in first.";
  }
}

async function createGame() {
  clearError();
  try {
    const res = await apiPost("/api/pong/create.php", {});
    console.log("createGame response:", res);

    if (!res.code) {
      showError("Server did not return a game code");
      return;
    }

    currentCode = res.code;
    showGame(res.code, res.status || "waiting");
    startPolling();
  } catch (err) {
    console.error("createGame error:", err);
    showError(err.error || JSON.stringify(err) || "Failed to create game");
  }
}

async function joinGame() {
  clearError();
  const codeInput = document.getElementById("join-code-input");
  const code = codeInput.value.trim();
  if (!code) {
    showError("Please enter a code");
    return;
  }
  try {
    const res = await apiPost("/api/pong/join.php", { code });
    console.log("joinGame response:", res);

    if (!res.code) {
      showError("Server did not return a game code");
      return;
    }

    currentCode = res.code;
    showGame(res.code, res.status || "ready");
    startPolling();
  } catch (err) {
    console.error("joinGame error:", err);
    showError(err.error || JSON.stringify(err) || "Failed to join game");
  }
}

function showGame(code, status) {
  const box = document.getElementById("current-game");
  box.style.display = "block";
  document.getElementById("game-code").textContent = code;
  document.getElementById("game-status").textContent = status;
}

function formatPlayerLabel(p, youId) {
  if (!p) return "waiting...";
  const base =
    p.display_name ||
    p.username ||
    (p.id ? "User #" + p.id : "Unknown user");
  return base + (p.id === youId ? " (you)" : "");
}

function updateGameState(state) {
  currentState = state;

  document.getElementById("game-status").textContent = state.status;

  const p1 = state.players && state.players.player1;
  const p2 = state.players && state.players.player2;

  youRole = null;
  if (p1 && p1.id === state.you) youRole = "player1";
  else if (p2 && p2.id === state.you) youRole = "player2";

  document.getElementById("you-role").textContent =
    youRole || "spectator (?)";

  document.getElementById("p1-ready").textContent =
    state.ready && state.ready.player1 ? "yes" : "no";
  document.getElementById("p2-ready").textContent =
    state.ready && state.ready.player2 ? "yes" : "no";

  document.getElementById("score-display").textContent =
    (state.score ? state.score.player1 : 0) +
    " : " +
    (state.score ? state.score.player2 : 0);

  const canvas = document.getElementById("pong-canvas");
  if (state.status === "running") {
    canvas.style.display = "block";
    renderCanvas(state);
  } else {
    canvas.style.display = "none";
  }
}

function renderCanvas(state) {
  const canvas = document.getElementById("pong-canvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#444";
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
  ctx.setLineDash([]);

  const bx = (state.ball ? state.ball.x : 0.5) * w;
  const by = (state.ball ? state.ball.y : 0.5) * h;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(bx, by, 8, 0, Math.PI * 2);
  ctx.fill();

  const paddleHeight = 0.25 * h;
  const p1y = (state.paddles ? state.paddles.player1 : 0.5) * h;
  const p2y = (state.paddles ? state.paddles.player2 : 0.5) * h;

  ctx.fillStyle = "#fff";
  ctx.fillRect(20, p1y - paddleHeight / 2, 10, paddleHeight);
  ctx.fillRect(w - 30, p2y - paddleHeight / 2, 10, paddleHeight);

  ctx.font = "20px sans-serif";
  ctx.fillText(
    String(state.score ? state.score.player1 : 0),
    w * 0.25,
    30
  );
  ctx.fillText(
    String(state.score ? state.score.player2 : 0),
    w * 0.75,
    30
  );
}

function startPolling() {
  if (!currentCode) return;
  if (pollTimer) clearInterval(pollTimer);

  pollTimer = setInterval(async () => {
    try {
      const state = await apiGet(
        "/api/pong/state.php?code=" + encodeURIComponent(currentCode)
      );
      updateGameState(state);
    } catch (err) {
      showError(err.error || "Failed to fetch game state");
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }, 200);
}

async function setReady(ready) {
  if (!currentCode) return;
  try {
    await apiPost("/api/pong/ready.php", {
      code: currentCode,
      ready: !!ready,
    });
  } catch (err) {
    showError(err.error || "Failed to change ready state");
  }
}

async function sendInput(move) {
  if (!currentCode || !currentState) return;
  if (currentState.status !== "running") return;
  if (!youRole) return;

  try {
    await apiPost("/api/pong/input.php", {
      code: currentCode,
      move,
    });
  } catch (err) {
    console.error(err);
  }
}

function showError(msg) {
  document.getElementById("error-msg").textContent = msg;
}

function clearError() {
  document.getElementById("error-msg").textContent = "";
}

window.addEventListener("keydown", (e) => {
  if (!currentState || currentState.status !== "running") return;

  if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
    sendInput("up");
  } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
    sendInput("down");
  }
});

window.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("create-game-btn")
    .addEventListener("click", createGame);
  document
    .getElementById("join-game-btn")
    .addEventListener("click", joinGame);

  document
    .getElementById("ready-btn")
    .addEventListener("click", () => setReady(true));
  document
    .getElementById("unready-btn")
    .addEventListener("click", () => setReady(false));

  checkLogin();
});
