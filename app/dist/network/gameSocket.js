let onStateCallback = null;
export function setOnServerState(cb) {
    onStateCallback = cb;
}
export function connectGameServer() {
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${location.host}/ws`;
    const ws = new WebSocket(url);
    ws.onopen = () => {
        console.log("[client] connected to game server:", url);
        ws.send(JSON.stringify({ type: "hello", from: "client" }));
    };
    ws.onmessage = (event) => {
        let msg;
        try {
            msg = JSON.parse(event.data);
        }
        catch {
            console.log("[client] raw message from server:", event.data);
            return;
        }
        if (msg.type === "state") {
            console.log("[client] state from server:", msg);
            if (onStateCallback) {
                onStateCallback(msg);
            }
        }
        else {
            console.log("[client] message from server:", msg);
        }
    };
    ws.onerror = (event) => {
        console.error("[client] WebSocket error:", event);
    };
    ws.onclose = (event) => {
        console.log("[client] WebSocket closed:", event.code, event.reason);
    };
    return ws;
}
