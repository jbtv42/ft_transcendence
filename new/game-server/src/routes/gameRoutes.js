export function registerGameRoutes(app, { authService, gameService }) {
  app.post("/api/game/matchmake", async (req, reply) => {
    const sid = req.cookies?.sid;
    const user = await authService.getMe({ sid });
    if (!user) return reply.code(401).send({ ok: false, error: "Not authenticated" });

    const { code, role } = await gameService.matchmakeForUser(user);
    return reply.send({ ok: true, code, role });
  });
}

