function setSidCookie(reply, sid) {
  reply.setCookie("sid", sid, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
  });
}

export function registerAuthRoutes(app, { authService }) {
  app.post("/api/register", async (req, reply) => {
    const { email, username, display_name, password } = req.body || {};

    const result = await authService.register({ email, username, display_name, password });
    if (!result.ok) {
      if (result.cause) req.log.error(result.cause);
      return reply.code(result.status).send({ error: result.error });
    }

    setSidCookie(reply, result.sid);
    return reply.code(201).send({ ok: true });
  });

  app.post("/api/login", async (req, reply) => {
    const { identifier, password } = req.body || {};

    const result = await authService.login({ identifier, password });
    if (!result.ok) {
      return reply.code(result.status).send({ error: result.error });
    }

    setSidCookie(reply, result.sid);
    return reply.send({ ok: true, user: result.user });
  });

  app.post("/api/logout", async (req, reply) => {
    const sid = req.cookies?.sid;
    await authService.logout({ sid });
    reply.clearCookie("sid", { path: "/" });
    return reply.send({ ok: true });
  });

  app.get("/api/me", async (req, reply) => {
    const sid = req.cookies?.sid;
    const user = await authService.getMe({ sid });
    if (!user) return reply.code(401).send({ ok: false, error: "Not authenticated" });
    return reply.send({ ok: true, user });
  });
}
