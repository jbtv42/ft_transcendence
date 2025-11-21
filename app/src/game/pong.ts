type Place = {
  left: boolean;
  right: boolean;
};

type Player = {
  name: string;
  rank: number;
  id: number;
  place: Place;
};

type Platform = {
  x_up: number;
  y_up: number;
  width: number;
  height: number;
  delta_move: number;
};

type Ball = {
  x: number;
  y: number;
  radius: number;
  speed: number;
};

type GameState = {
  solo: boolean;
  mp: boolean;
  on: boolean;
  lScore: number;
  rScore: number;
  mScore: number;
  winner: Player | null;
};

type KeysState = {
  w: boolean;
  s: boolean;
  up: boolean;
  down: boolean;
};

export function createPongGame(canvas: HTMLCanvasElement): { destroy: () => void } {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D context for Pong");
  }

  const width = canvas.width;
  const height = canvas.height;

  const keys: KeysState = {
    w: false,
    s: false,
    up: false,
    down: false,
  };

  // -------- PLAYERS -------------------------------------------------------

  const leftPlayer: Player = {
    name: "Sam",
    rank: 0,
    id: 1,
    place: { left: true, right: false },
  };

  const rightPlayer: Player = {
    name: "Bob",
    rank: 0,
    id: 2,
    place: { left: false, right: true },
  };

  const game: GameState = {
    solo: false,
    mp: true,
    on: true,
    lScore: 0,
    rScore: 0,
    mScore: 10,     // stop when one player reaches 10
    winner: null,
  };

  // -------- PADDLES & BALL -----------------------------------------------

  const paddleWidth = 10;
  const paddleHeight = 70;
  const paddleSpeed = 300;

  const leftPaddle: Platform = {
    x_up: 20,
    y_up: height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    delta_move: paddleSpeed,
  };

  const rightPaddle: Platform = {
    x_up: width - 20 - paddleWidth,
    y_up: height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    delta_move: paddleSpeed,
  };

  const ball: Ball = {
    x: width / 2,
    y: height / 2,
    radius: 6,
    speed: 260,
  };

  let ballVx = ball.speed;
  let ballVy = 0;

  function resetBall(direction: 1 | -1): void {
    ball.x = width / 2;
    ball.y = height / 2;

    const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6; // [-30°, +30°]
    ballVx = direction * ball.speed * Math.cos(angle);
    ballVy = ball.speed * Math.sin(angle);
  }

  resetBall(Math.random() < 0.5 ? 1 : -1);

  // --------------------- UPDATE LOGIC --------------------------------------

  function updatePlatformFromKeys(
    platform: Platform,
    upPressed: boolean,
    downPressed: boolean,
    dt: number
  ): void {
    let vy = 0;
    if (upPressed) vy -= platform.delta_move;
    if (downPressed) vy += platform.delta_move;

    platform.y_up += vy * dt;

    if (platform.y_up < 0) platform.y_up = 0;
    if (platform.y_up + platform.height > height) {
      platform.y_up = height - platform.height;
    }
  }

  function checkGameOver(): void {
    if (game.lScore >= game.mScore) {
      game.on = false;
      game.winner = leftPlayer;
      leftPlayer.rank = 1;
      rightPlayer.rank = 2;
    } else if (game.rScore >= game.mScore) {
      game.on = false;
      game.winner = rightPlayer;
      rightPlayer.rank = 1;
      leftPlayer.rank = 2;
    }
  }

  function updateBall(dt: number): void {
    // if game already finished, don't move the ball anymore
    if (!game.on) return;

    ball.x += ballVx * dt;
    ball.y += ballVy * dt;

    // Top/bottom walls
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ballVy = -ballVy;
    } else if (ball.y + ball.radius > height) {
      ball.y = height - ball.radius;
      ballVy = -ballVy;
    }

    // Helper: collision with a platform
    function collideWithPlatform(p: Platform): boolean {
      return (
        ball.x - ball.radius < p.x_up + p.width &&
        ball.x + ball.radius > p.x_up &&
        ball.y + ball.radius > p.y_up &&
        ball.y - ball.radius < p.y_up + p.height
      );
    }

    // Left paddle collision
    if (ballVx < 0 && collideWithPlatform(leftPaddle)) {
      ball.x = leftPaddle.x_up + leftPaddle.width + ball.radius;
      ballVx = -ballVx;

      const hitPos = (ball.y - leftPaddle.y_up) / leftPaddle.height - 0.5;
      ballVy += hitPos * 200;
    }

    // Right paddle collision
    if (ballVx > 0 && collideWithPlatform(rightPaddle)) {
      ball.x = rightPaddle.x_up - ball.radius;
      ballVx = -ballVx;

      const hitPos = (ball.y - rightPaddle.y_up) / rightPaddle.height - 0.5;
      ballVy += hitPos * 200;
    }

    // Scoring
    if (ball.x + ball.radius < 0) {
      // Right player scores
      game.rScore++;
      checkGameOver();
      if (game.on) {
        resetBall(1);
      }
    } else if (ball.x - ball.radius > width) {
      // Left player scores
      game.lScore++;
      checkGameOver();
      if (game.on) {
        resetBall(-1);
      }
    }
  }

  // --------------------- RENDER -------------------------------------------

  function draw(): void {
    if (!ctx)
        throw new Error("Pong game error");

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    // Center line
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddles
    ctx.fillStyle = "white";
    ctx.fillRect(leftPaddle.x_up, leftPaddle.y_up, leftPaddle.width, leftPaddle.height);
    ctx.fillRect(rightPaddle.x_up, rightPaddle.y_up, rightPaddle.width, rightPaddle.height);

    // Ball
    if (game.on) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score
    ctx.font = "20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(game.lScore), width * 0.25, 30);
    ctx.fillText(String(game.rScore), width * 0.75, 30);

    // Winner text when game is over
    if (!game.on && game.winner) {
      ctx.font = "28px system-ui, sans-serif";
      ctx.fillText(`Winner: ${game.winner.name}`, width / 2, height / 2);
    }
  }

  // --------------------- LOOP ---------------------------------------------

  let lastTime = 0;
  let animationFrameId: number | null = null;

  function loop(timestamp: number): void {
    if (lastTime === 0) {
      lastTime = timestamp;
    }
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (game.on) {
      updatePlatformFromKeys(leftPaddle, keys.w, keys.s, dt);
      updatePlatformFromKeys(rightPaddle, keys.up, keys.down, dt);
      updateBall(dt);
    }

    draw();

    // keep the loop even after game.on=false so we keep the winner screen
    animationFrameId = window.requestAnimationFrame(loop);
  }

  // --------------------- INPUT -------------------------------------------

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === "w" || e.key === "W") {
      keys.w = true;
    } else if (e.key === "s" || e.key === "S") {
      keys.s = true;
    } else if (e.key === "ArrowUp") {
      keys.up = true;
    } else if (e.key === "ArrowDown") {
      keys.down = true;
    }
  }

  function onKeyUp(e: KeyboardEvent): void {
    if (e.key === "w" || e.key === "W") {
      keys.w = false;
    } else if (e.key === "s" || e.key === "S") {
      keys.s = false;
    } else if (e.key === "ArrowUp") {
      keys.up = false;
    } else if (e.key === "ArrowDown") {
      keys.down = false;
    }
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  // Start everything
  animationFrameId = window.requestAnimationFrame(loop);

  // Expose a destroy function (useful later if you change routes / reset game)
  function destroy(): void {
    game.on = false;
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId);
    }
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  }

  return { destroy };
}
