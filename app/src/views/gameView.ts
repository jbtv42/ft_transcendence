// app/src/views/gameView.ts

import {
  connectGameServer,
  setOnServerState,
  sendInput,
  type ServerState,
} from "../network/gameSocket.js";

import { createPongGame } from "../game/pong.js";
import type { Player, GameState } from "../game/header.js";

// ----- Types kept for compatibility with router/tournament -----

type PlayerInput = Omit<Player, "place">;
type AiLevel = 1 | 2 | 3 | 4;
type GameContext = "normal" | "tournament";

export type GameViewConfig = {
  leftPlayer?: PlayerInput;
  rightPlayer?: PlayerInput;
  maxScore?: number;
  onGameEnd?: (state: GameState) => void;
  mode?: "mp" | "soloLeft" | "soloRight";
  aiLevel?: AiLevel;
  context?: GameContext;
};

// --------- MAIN ENTRY POINT ---------

export function renderGameView(
  root: HTMLElement,
  config?: GameViewConfig
): void {
  // 1) SOLO / AI MODE -> use the old LOCAL game
  if (config?.mode === "soloLeft" || config?.mode === "soloRight") {
    renderLocalAiGame(root, config);
    return;
  }

  // 2) Otherwise -> ONLINE SERVER-SIDE PONG
  renderOnlineGame(root, config);
}

// Tournament view currently just uses the same rendering.
// This keeps tournamentView.ts happy.
export function renderTournamentGameView(
  root: HTMLElement,
  config?: GameViewConfig
): void {
  renderGameView(root, config);
}

// --------- LOCAL (NO NETWORK) GAME: reuse createPongGame ---------

function renderLocalAiGame(root: HTMLElement, config?: GameViewConfig): void {
  root.innerHTML = "";

  const title = document.createElement("h1");
  title.textContent = "Pong – local (vs AI)";

  const info = document.createElement("p");
  info.textContent = "Playing locally in your browser.";

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  canvas.style.border = "1px solid #fff";
  canvas.style.display = "block";
  canvas.style.margin = "1rem auto 0 auto";
  canvas.style.background = "#000";

  root.appendChild(title);
  root.appendChild(info);
  root.appendChild(canvas);

  const leftPlayer: PlayerInput =
    config?.leftPlayer ?? {
      id: 1,
      name: "Player",
      rank: 0,
    };

  const rightPlayer: PlayerInput =
    config?.rightPlayer ?? {
      id: 2,
      name: "AI",
      rank: 0,
    };

  const maxScore = config?.maxScore ?? 5;
  const aiLevel = config?.aiLevel ?? 4;

  // 🔥 Important part: translate mode -> aiSide (what createPongGame expects)
  const aiSide: "left" | "right" =
    config?.mode === "soloLeft" ? "left" : "right";

  // Your original engine, reused:
  createPongGame(canvas, {
    leftPlayer,
    rightPlayer,
    maxScore,
    aiLevel,
    aiSide,
    onGameEnd: config?.onGameEnd,
  });

  // No WebSocket in this branch.
}

// --------- ONLINE SERVER-SIDE GAME ---------

function renderOnlineGame(root: HTMLElement, _config?: GameViewConfig): void {
  root.innerHTML = "";

  const title = document.createElement("h1");
  title.textContent = "Pong – online (server-side)";

  const info = document.createElement("p");
  info.textContent = "Connecting to game server…";

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  canvas.style.border = "1px solid #fff";
  canvas.style.display = "block";
  canvas.style.margin = "1rem auto 0 auto";
  canvas.style.background = "#000";

  root.appendChild(title);
  root.appendChild(info);
  root.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    info.textContent = "Canvas not supported.";
    return;
  }

  let lastState: ServerState | null = null;

  // For now: this browser = LEFT player in online mode.
  const side: "left" | "right" = "left";

  const input = {
    up: false,
    down: false,
  };

  function sendCurrentInput() {
    sendInput({
      side,
      up: input.up,
      down: input.down,
    });
  }

  const keyDownHandler = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      if (!input.up) {
        input.up = true;
        sendCurrentInput();
      }
    } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      if (!input.down) {
        input.down = true;
        sendCurrentInput();
      }
    }
  };

  const keyUpHandler = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      if (input.up) {
        input.up = false;
        sendCurrentInput();
      }
    } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      if (input.down) {
        input.down = false;
        sendCurrentInput();
      }
    }
  };

  window.addEventListener("keydown", keyDownHandler);
  window.addEventListener("keyup", keyUpHandler);

  setOnServerState((state) => {
    lastState = state;
    info.textContent = `Score: ${state.leftScore} – ${state.rightScore}`;
  });

  connectGameServer()
    .then(() => {
      info.textContent =
        "Connected. Use ↑/↓ or W/S to move the left paddle.";
    })
    .catch((err) => {
      console.error(err);
      info.textContent = "Could not connect to game server.";
    });

  function loop() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!lastState) {
      ctx.fillStyle = "white";
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText("Waiting for server state…", 10, canvas.height / 2);
      requestAnimationFrame(loop);
      return;
    }

    const s = lastState;

    // Background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Middle dashed line
    ctx.strokeStyle = "white";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Server sends pixels directly
    const ballX = s.ballX;
    const ballY = s.ballY;
    const ballRadius = s.ballRadius;

    const paddleHeightPx = s.paddleHeight;
    const leftTopY = s.leftPaddleY;
    const rightTopY = s.rightPaddleY;

    const paddleWidth = 10;
    const leftX = 20;
    const rightX = canvas.width - 20 - paddleWidth;

    // Ball (green)
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "green";
    ctx.fill();

    // Paddles
    ctx.fillStyle = "white";
    ctx.fillRect(leftX, leftTopY, paddleWidth, paddleHeightPx);
    ctx.fillRect(rightX, rightTopY, paddleWidth, paddleHeightPx);

    // Scores
    ctx.fillStyle = "white";
    ctx.font = "24px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(s.leftScore), canvas.width / 2 - 40, 30);
    ctx.fillText(String(s.rightScore), canvas.width / 2 + 40, 30);
    ctx.textAlign = "start";

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
