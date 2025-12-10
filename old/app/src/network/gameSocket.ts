// app/src/network/gameSocket.ts

export type ServerState = {
  ballX: number;        // pixels
  ballY: number;        // pixels
  leftPaddleY: number;  // pixels, top
  rightPaddleY: number; // pixels, top
  paddleHeight: number; // pixels
  leftScore: number;
  rightScore: number;
  ballRadius: number;   // pixels
};

type AssignSideMsg = {
  type: "assignSide";
  side: "left" | "right" | "spectator";
};

type ServerMessage =
  | ({ type: "state" } & any)
  | ({ type: "hello" } & any)
  | ({ type: "echo" } & any)
  | AssignSideMsg
  | { type: string; [key: string]: any };

let socket: WebSocket | null = null;
let onServerState: ((state: ServerState) => void) | null = null;
let onSideAssigned: ((side: "left" | "right" | "spectator") => void) | null =
  null;

export function setOnServerState(cb: (state: ServerState) => void): void {
  onServerState = cb;
}

export function setOnSideAssigned(
  cb: (side: "left" | "right" | "spectator") => void
): void {
  onSideAssigned = cb;
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
      if (!onServerState) return;

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
      return;
    }

    if (msg.type === "assignSide") {
      const side = (msg as AssignSideMsg).side;
      console.log("[WS] assigned side:", side);
      if (onSideAssigned) onSideAssigned(side);
      return;
    }

    console.log("[WS] message:", msg);
  };

  socket.onclose = () => {
    console.warn("[WS] closed");
  };
}

// ---- API helpers ----

export function sendJoin(): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: "join" }));
}

export type PaddleInput = {
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
