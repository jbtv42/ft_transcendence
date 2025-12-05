// app/src/network/gameSocket.ts
// (TS but imports use .js to match the rest of your project setup)
let socket = null;
let onServerState = null;
export function setOnServerState(cb) {
    onServerState = cb;
}
export async function connectGameServer() {
    if (socket && socket.readyState === WebSocket.OPEN)
        return;
    const WS_URL = (location.protocol === "https:" ? "wss://" : "ws://") +
        location.host +
        "/ws";
    socket = new WebSocket(WS_URL);
    await new Promise((resolve, reject) => {
        if (!socket)
            return reject(new Error("socket null"));
        socket.onopen = () => {
            console.log("[WS] connected to game server");
            resolve();
        };
        socket.onerror = (err) => {
            console.error("[WS] error", err);
            reject(new Error("WebSocket error"));
        };
    });
    if (!socket)
        return;
    socket.onmessage = (event) => {
        let msg;
        try {
            msg = JSON.parse(event.data);
        }
        catch (e) {
            console.error("[WS] bad JSON:", event.data, e);
            return;
        }
        if (msg.type === "state") {
            if (onServerState) {
                const { ballX, ballY, leftPaddleY, rightPaddleY, paddleHeight, leftScore, rightScore, ballRadius, } = msg;
                onServerState({
                    ballX,
                    ballY,
                    leftPaddleY,
                    rightPaddleY,
                    paddleHeight,
                    leftScore,
                    rightScore,
                    ballRadius,
                });
            }
        }
        else {
            console.log("[WS] message:", msg);
        }
    };
    socket.onclose = () => {
        console.warn("[WS] closed");
    };
}
export function sendInput(input) {
    if (!socket || socket.readyState !== WebSocket.OPEN)
        return;
    socket.send(JSON.stringify({
        type: "input",
        payload: input,
    }));
}
