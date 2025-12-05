const WebSocket = require("ws");

const PORT = 3000;
const wss = new WebSocket.Server({ port: PORT });

console.log("[game-server] WebSocket server listening on port", PORT);

function broadcast(obj) {
  const data = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// --------- INPUT FROM CLIENTS ---------

let leftUp = false;
let leftDown = false;
let rightUp = false;
let rightDown = false;

wss.on("connection", (socket) => {
  console.log("[game-server] client connected");

  socket.on("message", (raw) => {
    const text = raw.toString();
    console.log("[game-server] message from client:", text);

    let msg;
    try {
      msg = JSON.parse(text);
    } catch {
      socket.send(JSON.stringify({ type: "echo", received: text }));
      return;
    }

    if (msg.type === "input" && msg.payload) {
      const { side, up, down } = msg.payload;
      if (side === "left") {
        leftUp = !!up;
        leftDown = !!down;
      } else if (side === "right") {
        rightUp = !!up;
        rightDown = !!down;
      }
    } else {
      socket.send(JSON.stringify({ type: "echo", received: msg }));
    }
  });

  socket.on("close", () => {
    console.log("[game-server] client disconnected");
  });

  socket.send(
    JSON.stringify({
      type: "hello",
      msg: "Hello from game-server",
    })
  );
});

// --------- GAME CONSTANTS (copied from your pong.ts) ---------

const WIDTH = 640;
const HEIGHT = 360;

const paddleWidth = 10;
const paddleHeight = 70;
const paddleSpeed = 180;

const ball = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  radius: 6,
  speed: 300,
  vx: 0,
  vy: 0,
};

// paddles use same Platform shape as your TS:
const leftPaddle = {
  x_up: 20,
  y_up: HEIGHT / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
  delta_move: paddleSpeed,
};

const rightPaddle = {
  x_up: WIDTH - 20 - paddleWidth,
  y_up: HEIGHT / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
  delta_move: paddleSpeed,
};

let leftScore = 0;
let rightScore = 0;
const maxScore = 5; // same as game.mScore default

let gameOn = true;

// BALL VELOCITY STATE (like ballVx / ballVy in pong.ts)
let ballVx = ball.speed;
let ballVy = 0;
ball.vx = ballVx;
ball.vy = ballVy;

// --------- BALL SPEED / RALLIES (copied logic) ---------

let rallyCount = 0;

function increaseBallSpeed(delta) {
  const newSpeed = ball.speed + delta;
  ball.speed = newSpeed;

  const currentSpeed = Math.sqrt(ballVx * ballVx + ballVy * ballVy) || 1;
  const factor = newSpeed / currentSpeed;

  ballVx *= factor;
  ballVy *= factor;

  ball.vx = ballVx;
  ball.vy = ballVy;
}

function onPaddleHit() {
  rallyCount++;
  if (rallyCount % 4 === 0) {
    increaseBallSpeed(10);
  }
}

function resetBall(direction) {
  ball.x = WIDTH / 2;
  ball.y = HEIGHT / 2;

  const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6;
  ballVx = direction * ball.speed * Math.cos(angle);
  ballVy = ball.speed * Math.sin(angle);

  ball.vx = ballVx;
  ball.vy = ballVy;
}

// initial serve (left or right randomly)
resetBall(Math.random() < 0.5 ? 1 : -1);

// --------- GAME LOGIC PORTED FROM pong.ts ---------

function updatePlatformFromKeys(platform, upPressed, downPressed, dt) {
  let vy = 0;
  if (upPressed) vy -= platform.delta_move;
  if (downPressed) vy += platform.delta_move;

  platform.y_up += vy * dt;

  if (platform.y_up < 0) platform.y_up = 0;
  if (platform.y_up + platform.height > HEIGHT) {
    platform.y_up = HEIGHT - platform.height;
  }
}

function checkGameOver() {
  if (leftScore >= maxScore || rightScore >= maxScore) {
    gameOn = false;
  }
}

function updateBall(dt) {
  if (!gameOn) return;

  ball.x += ballVx * dt;
  ball.y += ballVy * dt;

  // top / bottom bounce
  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ballVy = -ballVy;
  } else if (ball.y + ball.radius > HEIGHT) {
    ball.y = HEIGHT - ball.radius;
    ballVy = -ballVy;
  }

  function collideWithPlatform(p) {
    return (
      ball.x - ball.radius < p.x_up + p.width &&
      ball.x + ball.radius > p.x_up &&
      ball.y + ball.radius > p.y_up &&
      ball.y - ball.radius < p.y_up + p.height
    );
  }

  // left paddle
  if (ballVx < 0 && collideWithPlatform(leftPaddle)) {
    ball.x = leftPaddle.x_up + leftPaddle.width + ball.radius;
    ballVx = -ballVx;

    const hitPos = (ball.y - leftPaddle.y_up) / leftPaddle.height - 0.5;
    ballVy += hitPos * 200;

    onPaddleHit();
  }

  // right paddle
  if (ballVx > 0 && collideWithPlatform(rightPaddle)) {
    ball.x = rightPaddle.x_up - ball.radius;
    ballVx = -ballVx;

    const hitPos = (ball.y - rightPaddle.y_up) / rightPaddle.height - 0.5;
    ballVy += hitPos * 200;

    onPaddleHit();
  }

  // goals
  if (ball.x + ball.radius < 0) {
    rightScore++;
    checkGameOver();
    if (gameOn) resetBall(1);
  } else if (ball.x - ball.radius > WIDTH) {
    leftScore++;
    checkGameOver();
    if (gameOn) resetBall(-1);
  }

  ball.vx = ballVx;
  ball.vy = ballVy;
}

// --------- TICK LOOP + BROADCAST ---------

const TICK_MS = 16; // ~60 FPS
const DT = TICK_MS / 1000;

setInterval(() => {
  if (gameOn) {
    updatePlatformFromKeys(leftPaddle, leftUp, leftDown, DT);
    updatePlatformFromKeys(rightPaddle, rightUp, rightDown, DT);
    updateBall(DT);
  }

  broadcastState();
}, TICK_MS);

function broadcastState() {
  broadcast({
    type: "state",
    ballX: ball.x,
    ballY: ball.y,
    ballRadius: ball.radius,

    leftPaddleY: leftPaddle.y_up,
    rightPaddleY: rightPaddle.y_up,
    paddleHeight: leftPaddle.height,

    leftScore,
    rightScore,
  });
}
