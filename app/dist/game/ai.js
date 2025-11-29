// Predict ball Y when it reaches the paddle's X, with wall bounces.
function predictBallYAtPaddle(ball, paddleX, fieldWidth, fieldHeight, isRightPaddle, noiseRange) {
    const vx = ball.vx;
    const vy = ball.vy;
    if (vx === 0)
        return null;
    const dx = isRightPaddle ? paddleX - ball.x : ball.x - paddleX;
    if (dx <= 0)
        return null;
    const t = dx / Math.abs(vx);
    let y = ball.y + vy * t;
    const h = fieldHeight;
    while (y < 0 || y > h) {
        if (y < 0) {
            y = -y;
        }
        else if (y > h) {
            y = 2 * h - y;
        }
    }
    if (noiseRange > 0) {
        const noise = (Math.random() - 0.5) * 2 * noiseRange;
        y += noise;
    }
    if (y < 0)
        y = 0;
    if (y > fieldHeight)
        y = fieldHeight;
    return y;
}
// Core AI: predict intercept Y and store it in ai.target
function setSimpleTarget(ai, fieldWidth, fieldHeight, isRightPaddle, noiseRange) {
    const paddle = ai.paddle;
    const ball = ai.ball;
    const paddleCenter = paddle.y_up + paddle.height / 2;
    // Choose the x we want to intercept at:
    const paddleX = isRightPaddle
        ? paddle.x_up // right paddle
        : paddle.x_up + paddle.width; // left paddle
    const predictedY = predictBallYAtPaddle(ball, paddleX, fieldWidth, fieldHeight, isRightPaddle, noiseRange);
    // If we can't predict (ball going away / weird), stay where we are
    ai.target = predictedY ?? paddleCenter;
}
// --------- AI LEVEL 1–4: all identical for now ---------
export function moveai_1(ai, fieldWidth, fieldHeight, isRightPaddle) {
    setSimpleTarget(ai, fieldWidth, fieldHeight, isRightPaddle, 100);
}
export function moveai_2(ai, fieldWidth, fieldHeight, isRightPaddle) {
    setSimpleTarget(ai, fieldWidth, fieldHeight, isRightPaddle, 85);
}
export function moveai_3(ai, fieldWidth, fieldHeight, isRightPaddle) {
    setSimpleTarget(ai, fieldWidth, fieldHeight, isRightPaddle, 65);
}
export function moveai_4(ai, fieldWidth, fieldHeight, isRightPaddle, _opponent // kept for signature compatibility, not used for now
) {
    setSimpleTarget(ai, fieldWidth, fieldHeight, isRightPaddle, 40);
}
