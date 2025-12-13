export function registerGameWsRoutes(app, { authService, gameService }) {
  app.get("/ws", { websocket: true }, async (connection, req) => {
    const socket = connection.socket;

    const sid = req.cookies?.sid;
    const user = await authService.getMe({ sid });

    if (!user) {
      socket.send(JSON.stringify({ type: "status", text: "Not authenticated. Please login." }));
      socket.close();
      return;
    }

    const url = new URL(req.url, "http://localhost");
    const code = url.searchParams.get("code") || "";

    const joined = gameService.joinMatch({ user, code, socket });
    if (!joined) return;

    const { match, player } = joined;

    socket.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === "input") {
        gameService.handleInput({ player, dir: msg.dir });
      }
    });

    socket.on("close", () => {
      gameService.handleDisconnect({ match, player });
    });
  });
}
