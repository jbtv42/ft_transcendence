// SELECT AI TARGET
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
    // UNPRESISE TARGETING
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
function setSimpleTarget(ai, fieldWidth, fieldHeight, isRightPaddle, noiseRange) {
    const paddle = ai.paddle;
    const ball = ai.ball;
    const paddleCenter = paddle.y_up + paddle.height / 2;
    const paddleX = isRightPaddle
        ? paddle.x_up
        : paddle.x_up + paddle.width;
    const predictedY = predictBallYAtPaddle(ball, paddleX, fieldWidth, fieldHeight, isRightPaddle, noiseRange);
    ai.target = predictedY ?? paddleCenter;
}
// CHANGE LAST NUMBER FOR PRESISION TARGET
export function moveai_1(ai, fieldWidth, fieldHeight, isRightPaddle) {
    setSimpleTarget(ai, fieldWidth, fieldHeight, isRightPaddle, 100);
}
export function moveai_2(ai, fieldWidth, fieldHeight, isRightPaddle) {
    setSimpleTarget(ai, fieldWidth, fieldHeight, isRightPaddle, 85);
}
export function moveai_3(ai, fieldWidth, fieldHeight, isRightPaddle) {
    setSimpleTarget(ai, fieldWidth, fieldHeight, isRightPaddle, 65);
}
export function moveai_4(ai, fieldWidth, fieldHeight, isRightPaddle, _opponent) {
    setSimpleTarget(ai, fieldWidth, fieldHeight, isRightPaddle, 40);
}
