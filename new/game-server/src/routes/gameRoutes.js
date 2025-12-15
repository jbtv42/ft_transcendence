export function registerGameRoutes(app, { authService, gameService }) {
  app.post("/api/game/matchmake", async (req, reply) => {
    const sid = req.cookies?.sid;
    const user = await authService.getMe({ sid });
    if (!user) return reply.code(401).send({ ok: false, error: "Not authenticated" });

    const body = req.body || {};
    const friendIdentifier =
      typeof body.friendIdentifier === "string" ? body.friendIdentifier.trim() : "";

    try {
      const { code, role } = await gameService.matchmakeForUser(user, friendIdentifier || null);
      return reply.send({ ok: true, code, role });
    } catch (err) {
      app.log.error({ err }, "matchmake failed");
      return reply.code(400).send({ ok: false, error: err.message });
    }
  });

  app.get("/api/game/invites", async (req, reply) => {
    const sid = req.cookies?.sid;
    const user = await authService.getMe({ sid });
    if (!user) return reply.code(401).send({ ok: false, error: "Not authenticated" });

    try {
      const invites = await gameService.getPendingInvitesForUser(user.id);
      return reply.send({ ok: true, invites });
    } catch (err) {
      app.log.error({ err }, "get invites failed");
      return reply.code(500).send({ ok: false, error: "Failed to load invites" });
    }
  });
}



