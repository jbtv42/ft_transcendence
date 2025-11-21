export function AI(paddle, ball, dt) {
    const center = paddle.y_up + paddle.height / 2;
    const speed = paddle.delta_move;
    if (ball.y < center - 10) {
        paddle.y_up -= speed * dt;
    }
    else if (ball.y > center + 10) {
        paddle.y_up += speed * dt;
    }
    const canvasHeight = 360;
    if (paddle.y_up < 0)
        paddle.y_up = 0;
    if (paddle.y_up + paddle.height > canvasHeight) {
        paddle.y_up = canvasHeight - paddle.height;
    }
}
class Timer {
    constructor(counter = 3) {
        this.counter = counter;
        let intervalId = setInterval(() => {
            this.counter = this.counter - 1;
            console.log(this.counter);
            if (this.counter === 0)
                clearInterval(intervalId);
        }, 1000);
    }
}
