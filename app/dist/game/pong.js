import { moveai_1, moveai_2, moveai_3, moveai_4 } from "./ai.js";
function callAiAndSetTarget(level, aiState, fieldWidth, fieldHeight, isRightPaddle, opponent) {
    switch (level) {
        case 1:
            moveai_1(aiState, fieldWidth, fieldHeight, isRightPaddle);
            break;
        case 2:
            moveai_2(aiState, fieldWidth, fieldHeight, isRightPaddle);
            break;
        case 3:
            moveai_3(aiState, fieldWidth, fieldHeight, isRightPaddle);
            break;
        case 4:
            moveai_4(aiState, fieldWidth, fieldHeight, isRightPaddle, opponent);
            break;
    }
    // ⬆️ IMPORTANT: moveai_* must set aiState.target to the desired paddle center Y.
}
export function createPongGame(canvas, options) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Could not get 2D context for Pong");
    }
    const aiSide = options.aiSide;
    const aiLevel = options.aiLevel ?? 1;
    const width = canvas.width;
    const height = canvas.height;
    // ----------------- INPUT STATE -----------------
    const keys = {
        w: false,
        s: false,
        up: false,
        down: false,
    };
    const leftPlayer = {
        ...options.leftPlayer,
        place: { left: true, right: false },
    };
    const rightPlayer = {
        ...options.rightPlayer,
        place: { left: false, right: true },
    };
    const hasAI = aiSide === "left" || aiSide === "right";
    const game = {
        solo: hasAI,
        mp: !hasAI,
        on: true,
        lScore: 0,
        rScore: 0,
        mScore: options.maxScore ?? 10,
        winner: null,
    };
    // ----------------- PADDLES & BALL -----------------
    const paddleWidth = 10;
    const paddleHeight = 70;
    const paddleSpeed = 180; // slower so AI doesn't sweep the whole field in 1s
    const leftPaddle = {
        x_up: 20,
        y_up: height / 2 - paddleHeight / 2,
        width: paddleWidth,
        height: paddleHeight,
        delta_move: paddleSpeed,
    };
    const rightPaddle = {
        x_up: width - 20 - paddleWidth,
        y_up: height / 2 - paddleHeight / 2,
        width: paddleWidth,
        height: paddleHeight,
        delta_move: paddleSpeed,
    };
    const ball = {
        x: width / 2,
        y: height / 2,
        radius: 6,
        speed: 300,
        vx: 0,
        vy: 0,
    };
    let ballVx = ball.speed;
    let ballVy = 0;
    ball.vx = ballVx;
    ball.vy = ballVy;
    // Count how many times the ball hits *any* paddle
    let rallyCount = 0;
    function increaseBallSpeed(delta) {
        const newSpeed = ball.speed + delta;
        ball.speed = newSpeed;
        // Rescale current velocity vector to have magnitude = newSpeed
        const currentSpeed = Math.sqrt(ballVx * ballVx + ballVy * ballVy) || 1;
        const factor = newSpeed / currentSpeed;
        ballVx *= factor;
        ballVy *= factor;
        // Keep AI view in sync (will also be updated in updateBall)
        ball.vx = ballVx;
        ball.vy = ballVy;
    }
    function onPaddleHit() {
        rallyCount++;
        if (rallyCount % 4 === 0) {
            // every 4 exchanges, +10 speed
            increaseBallSpeed(10);
        }
    }
    function resetBall(direction) {
        ball.x = width / 2;
        ball.y = height / 2;
        const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6; // [-30°, +30°]
        ballVx = direction * ball.speed * Math.cos(angle);
        ballVy = ball.speed * Math.sin(angle);
        ball.vx = ballVx;
        ball.vy = ballVy;
    }
    resetBall(Math.random() < 0.5 ? 1 : -1);
    // ----------------- AI STATE -----------------
    const AI_UPDATE_INTERVAL = 1.0; // seconds – allowed by subject
    let aiTimer = 0;
    let aiDir = 0;
    // time (in seconds) we still need to move in current direction
    let aiMoveTimeRemaining = 0;
    // we keep a single AI state and reuse it
    const aiState = {
        paddle: aiSide === "right" ? rightPaddle : leftPaddle,
        ball,
        dt: AI_UPDATE_INTERVAL,
        target: 0, // will be set by moveai_*
    };
    function updatePlatformFromKeys(platform, upPressed, downPressed, dt) {
        let vy = 0;
        if (upPressed)
            vy -= platform.delta_move;
        if (downPressed)
            vy += platform.delta_move;
        platform.y_up += vy * dt;
        if (platform.y_up < 0)
            platform.y_up = 0;
        if (platform.y_up + platform.height > height) {
            platform.y_up = height - platform.height;
        }
    }
    function checkGameOver() {
        if (game.lScore >= game.mScore) {
            game.on = false;
            game.winner = leftPlayer;
            leftPlayer.rank = 1;
            rightPlayer.rank = 2;
            options.onGameEnd?.(game);
        }
        else if (game.rScore >= game.mScore) {
            game.on = false;
            game.winner = rightPlayer;
            rightPlayer.rank = 1;
            leftPlayer.rank = 2;
            options.onGameEnd?.(game);
        }
    }
    function updateBall(dt) {
        if (!game.on)
            return;
        ball.x += ballVx * dt;
        ball.y += ballVy * dt;
        // Top / bottom walls
        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ballVy = -ballVy;
        }
        else if (ball.y + ball.radius > height) {
            ball.y = height - ball.radius;
            ballVy = -ballVy;
        }
        function collideWithPlatform(p) {
            return (ball.x - ball.radius < p.x_up + p.width &&
                ball.x + ball.radius > p.x_up &&
                ball.y + ball.radius > p.y_up &&
                ball.y - ball.radius < p.y_up + p.height);
        }
        // Left paddle
        if (ballVx < 0 && collideWithPlatform(leftPaddle)) {
            ball.x = leftPaddle.x_up + leftPaddle.width + ball.radius;
            ballVx = -ballVx;
            const hitPos = (ball.y - leftPaddle.y_up) / leftPaddle.height - 0.5;
            ballVy += hitPos * 200;
            onPaddleHit();
        }
        if (ballVx > 0 && collideWithPlatform(rightPaddle)) {
            ball.x = rightPaddle.x_up - ball.radius;
            ballVx = -ballVx;
            const hitPos = (ball.y - rightPaddle.y_up) / rightPaddle.height - 0.5;
            ballVy += hitPos * 200;
            onPaddleHit();
        }
        // Scoring
        if (ball.x + ball.radius < 0) {
            game.rScore++;
            checkGameOver();
            if (game.on)
                resetBall(1);
        }
        else if (ball.x - ball.radius > width) {
            game.lScore++;
            checkGameOver();
            if (game.on)
                resetBall(-1);
        }
        // Keep AI's ball view in sync
        ball.vx = ballVx;
        ball.vy = ballVy;
    }
    function draw() {
        if (!ctx)
            throw new Error("Pong game error");
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width, height);
        // center line
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.setLineDash([]);
        // paddles
        ctx.fillStyle = "white";
        ctx.fillRect(leftPaddle.x_up, leftPaddle.y_up, leftPaddle.width, leftPaddle.height);
        ctx.fillRect(rightPaddle.x_up, rightPaddle.y_up, rightPaddle.width, rightPaddle.height);
        // ball
        if (game.on) {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        // scores
        ctx.font = "20px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(game.lScore), width * 0.25, 30);
        ctx.fillText(String(game.rScore), width * 0.75, 30);
        // winner text
        if (!game.on && game.winner) {
            ctx.font = "28px system-ui, sans-serif";
            ctx.fillText(`Winner: ${game.winner.name}`, width / 2, height / 2);
        }
    }
    let lastTime = 0;
    let animationFrameId = null;
    function loop(timestamp) {
        if (lastTime === 0) {
            lastTime = timestamp;
        }
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        if (game.on) {
            // ----------------- HUMAN INPUT -----------------
            if (aiSide === "left") {
                // human on right
                updatePlatformFromKeys(rightPaddle, keys.up, keys.down, dt);
            }
            else if (aiSide === "right") {
                // human on left
                updatePlatformFromKeys(leftPaddle, keys.w, keys.s, dt);
            }
            else {
                // no AI: both human
                updatePlatformFromKeys(leftPaddle, keys.w, keys.s, dt);
                updatePlatformFromKeys(rightPaddle, keys.up, keys.down, dt);
            }
            // ----------------- AI LOGIC (ONCE PER SECOND) -----------------
            if (aiSide === "left" || aiSide === "right") {
                aiTimer += dt;
                if (aiTimer >= AI_UPDATE_INTERVAL) {
                    aiTimer -= AI_UPDATE_INTERVAL;
                    const paddle = aiSide === "right" ? rightPaddle : leftPaddle;
                    const opponent = aiSide === "right" ? leftPaddle : rightPaddle;
                    const isRight = aiSide === "right";
                    // Fill current AI view
                    aiState.paddle = paddle;
                    aiState.ball = ball;
                    aiState.dt = AI_UPDATE_INTERVAL;
                    // Ask AI module to set a target position (center Y)
                    callAiAndSetTarget(aiLevel, aiState, width, height, isRight, opponent);
                    // Now compute how long we need to move to reach that target
                    const center = paddle.y_up + paddle.height / 2;
                    const diff = aiState.target - center;
                    if (Math.abs(diff) < 5) {
                        aiDir = 0;
                        aiMoveTimeRemaining = 0;
                    }
                    else {
                        aiDir = diff > 0 ? 1 : -1;
                        const distance = Math.abs(diff);
                        // time = distance / speed
                        aiMoveTimeRemaining = distance / paddle.delta_move;
                    }
                }
                // ----------------- AI "KEY PRESS" SIMULATION -----------------
                if (aiMoveTimeRemaining > 0) {
                    aiMoveTimeRemaining -= dt;
                    if (aiMoveTimeRemaining <= 0) {
                        aiMoveTimeRemaining = 0;
                        aiDir = 0;
                    }
                }
                else {
                    aiDir = 0;
                }
                const aiPaddle = aiSide === "right" ? rightPaddle : leftPaddle;
                updatePlatformFromKeys(aiPaddle, aiDir === -1, // up
                aiDir === 1, // down
                dt);
            }
            updateBall(dt);
        }
        draw();
        animationFrameId = window.requestAnimationFrame(loop);
    }
    function onKeyDown(e) {
        if (e.key === "w" || e.key === "W") {
            keys.w = true;
        }
        else if (e.key === "s" || e.key === "S") {
            keys.s = true;
        }
        else if (e.key === "ArrowUp") {
            keys.up = true;
        }
        else if (e.key === "ArrowDown") {
            keys.down = true;
        }
    }
    function onKeyUp(e) {
        if (e.key === "w" || e.key === "W") {
            keys.w = false;
        }
        else if (e.key === "s" || e.key === "S") {
            keys.s = false;
        }
        else if (e.key === "ArrowUp") {
            keys.up = false;
        }
        else if (e.key === "ArrowDown") {
            keys.down = false;
        }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    animationFrameId = window.requestAnimationFrame(loop);
    function destroy() {
        game.on = false;
        if (animationFrameId !== null) {
            window.cancelAnimationFrame(animationFrameId);
        }
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
    }
    return { destroy };
}
