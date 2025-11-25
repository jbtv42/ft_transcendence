//ai lvl 1-4
function movePaddleTwoardsCenter(paddle, targetH, dt, fieldHeight) {
    const center = paddle.y_up + (paddle.height / 2);
    const diff = targetH - center;
    const goenough = 5;
    if (Math.abs(diff) < goenough)
        return;
    const direction = diff > 0 ? 1 : -1;
}
export function moveai_1(ai, fieldWidth, fieldHeight, isRightPaddle) {
    const paddle = ai.paddle;
    const ball = ai.ball;
    const center = ai.paddle.y_up + ai.paddle.height / 2;
    const diff = ball.y - center;
    const quarterX = fieldWidth / 4;
    const inMyQuarter = isRightPaddle
        ? ball.x > fieldWidth - quarterX
        : ball.x < quarterX;
    const movingTowardsMe = (isRightPaddle && ball.vx > 0) ||
        (!isRightPaddle && ball.vx < 0);
    if (!inMyQuarter || !movingTowardsMe) {
        return 0;
    }
    const deadZone = 10;
    if (Math.abs(diff) < deadZone)
        return 0;
    return diff > 0 ? +1 : -1;
}
export function moveai_2(ai, fieldWidth, fieldHeight, isRightPaddle) {
    const paddle = ai.paddle;
    const ball = ai.ball;
    const center = ai.paddle.y_up + ai.paddle.height / 2;
    const diffToBall = ball.y - center;
    const thirdX = fieldWidth / 3;
    const inMyThird = isRightPaddle
        ? ball.x > fieldWidth - thirdX
        : ball.x < thirdX;
    const movingTowardsMe = (isRightPaddle && ball.vx > 0) ||
        (!isRightPaddle && ball.vx < 0);
    const deadZone = 8;
    if (inMyThird && movingTowardsMe) {
        if (Math.abs(diffToBall) < deadZone)
            return 0;
        return diffToBall > 0 ? +1 : -1;
    }
    const mid = fieldHeight / 2;
    const diffToMid = mid - center;
    if (Math.abs(diffToMid) < deadZone)
        return 0;
    return diffToMid > 0 ? +1 : -1;
}
export function moveai_3(ai, fieldWidth, fieldHeight, isRightPaddle) {
    const paddle = ai.paddle;
    const ball = ai.ball;
    const center = ai.paddle.y_up + ai.paddle.height / 2;
    let targetY = ball.y;
    const halfX = fieldWidth / 2;
    const inMyHalf = isRightPaddle ? ball.x > halfX : ball.x < halfX;
    const movingTowardsMe = (isRightPaddle && ball.vx > 0) ||
        (!isRightPaddle && ball.vx < 0);
    const deadZone = 6;
    if (inMyHalf && movingTowardsMe) {
        const below = ball.y > center;
        const offset = paddle.height * 0.25;
        targetY += below ? offset : -offset;
        const diff = targetY - center;
        if (Math.abs(diff) < deadZone)
            return 0;
        return diff > 0 ? +1 : -1;
    }
    const mid = fieldHeight / 2;
    const diffToMid = mid - center;
    if (Math.abs(diffToMid) < deadZone)
        return 0;
    return diffToMid > 0 ? +1 : -1;
}
export function moveai_4(ai, fieldWidth, fieldHeight, isRightPaddle, opponent) {
    const paddle = ai.paddle;
    const ball = ai.ball;
    const mySide = isRightPaddle ? fieldWidth * 0.6 : fieldWidth * 0.4;
    const onMySide = isRightPaddle ? ball.x > mySide : ball.x < mySide;
    const movingTowardsMe = (isRightPaddle && ball.vx > 0) ||
        (!isRightPaddle && ball.vx < 0);
    const center = ai.paddle.y_up + ai.paddle.height / 2;
    let targetY = ball.y;
    const deadZone = 4;
    if (onMySide && movingTowardsMe) {
        const oppCenter = opponent.y_up + opponent.height / 2;
        const wantGoHigh = oppCenter > fieldHeight / 2;
        const offset = paddle.height * 0.3;
        targetY += wantGoHigh ? -offset : +offset;
        const noise = (Math.random() - 0.5) * paddle.height * 0.2;
        targetY += noise;
        const diff = targetY - center;
        if (Math.abs(diff) < deadZone)
            return 0;
        return diff > 0 ? +1 : -1;
    }
    const guardY = fieldHeight * 0.4;
    const diffToGuard = guardY - center;
    if (Math.abs(diffToGuard) < deadZone)
        return 0;
    return diffToGuard > 0 ? +1 : -1;
}
