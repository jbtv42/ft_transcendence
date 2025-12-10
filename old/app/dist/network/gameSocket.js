// app/src/network/gameSocket.ts
let socket = null;
let onServerState = null;
let onSideAssigned = null;
export function setOnServerState(cb) {
    onServerState = cb;
}
export function setOnSideAssigned(cb) {
    onSideAssigned = cb;
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
            if (!onServerState)
                return;
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
            return;
        }
        if (msg.type === "assignSide") {
            const side = msg.side;
            console.log("[WS] assigned side:", side);
            if (onSideAssigned)
                onSideAssigned(side);
            return;
        }
        console.log("[WS] message:", msg);
    };
    socket.onclose = () => {
        console.warn("[WS] closed");
    };
}
// ---- API helpers ----
export function sendJoin() {
    if (!socket || socket.readyState !== WebSocket.OPEN)
        return;
    socket.send(JSON.stringify({ type: "join" }));
}
export function sendInput(input) {
    if (!socket || socket.readyState !== WebSocket.OPEN)
        return;
    socket.send(JSON.stringify({
        type: "input",
        payload: input,
    }));
}
