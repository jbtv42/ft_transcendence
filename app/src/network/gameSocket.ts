// app/src/network/gameSocket.ts
// (TS but imports use .js to match the rest of your project setup)

export type ServerState = {
  ballX: number;        // 0–1
  ballY: number;        // 0–1
  leftPaddleY: number;  // 0–1, center
  rightPaddleY: number; // 0–1, center
  paddleHeight: number; // 0–1
  leftScore: number;
  rightScore: number;
  ballRadius: number;   // 0–1
};

type ServerMessage =
  | { type: "state"; [key: string]: any }
  | { type: "hello"; [key: string]: any }
  | { type: "echo"; [key: string]: any }
  | { type: string; [key: string]: any };

let socket: WebSocket | null = null;
let onServerState: ((state: ServerState) => void) | null = null;

export function setOnServerState(cb: (state: ServerState) => void): void {
  onServerState = cb;
}

export async function connectGameServer(): Promise<void> {
  if (socket && socket.readyState === WebSocket.OPEN) return;

  const WS_URL =
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    "/ws";

  socket = new WebSocket(WS_URL);

  await new Promise<void>((resolve, reject) => {
    if (!socket) return reject(new Error("socket null"));

    socket.onopen = () => {
      console.log("[WS] connected to game server");
      resolve();
    };
    socket.onerror = (err) => {
      console.error("[WS] error", err);
      reject(new Error("WebSocket error"));
    };
  });

  if (!socket) return;

  socket.onmessage = (event) => {
    let msg: ServerMessage;
    try {
      msg = JSON.parse(event.data);
    } catch (e) {
      console.error("[WS] bad JSON:", event.data, e);
      return;
    }

    if (msg.type === "state") {
      if (onServerState) {
        const {
          ballX,
          ballY,
          leftPaddleY,
          rightPaddleY,
          paddleHeight,
          leftScore,
          rightScore,
          ballRadius,
        } = msg as any;

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
    } else {
      console.log("[WS] message:", msg);
    }
  };

  socket.onclose = () => {
    console.warn("[WS] closed");
  };
}

export type PaddleInput = {
  side: "left" | "right";
  up: boolean;
  down: boolean;
};

export function sendInput(input: PaddleInput): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(
    JSON.stringify({
      type: "input",
      payload: input,
    })
  );
}
