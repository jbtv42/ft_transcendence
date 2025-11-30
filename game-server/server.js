const WebSocket = require("ws");

const PORT = 3000;
const wss = new WebSocket.Server({ port: PORT });

console.log("[game-server] WebSocket server listening on port", PORT);

function broadcast(obj) {
  const data = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

wss.on("connection", (socket) => {
  console.log("[game-server] client connected");

  socket.on("message", (raw) => {
    console.log("[game-server] message from client:", raw.toString());

    // Echo back for now
    socket.send(
      JSON.stringify({
        type: "echo",
        received: raw.toString(),
      })
    );
  });

  socket.on("close", () => {
    console.log("[game-server] client disconnected");
  });

  socket.send(
    JSON.stringify({
      type: "hello",
      msg: "Hello from game-server",
    })
  );
});

let t = 0;
setInterval(() => {
  t += 0.1;
  const ballX = 0.5 + 0.4 * Math.cos(t);
  const ballY = 0.5 + 0.4 * Math.sin(t);

  broadcast({
    type: "state",
    ballX,
    ballY,
  });
}, 100);
