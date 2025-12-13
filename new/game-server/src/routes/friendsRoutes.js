export function registerFriendsRoutes(app, { authService, friendsService }) {
  app.get("/api/friends/friends_list", async (req, reply) => {
    const sid = req.cookies?.sid;
    const me = await authService.getMe({ sid });
    if (!me) return reply.code(401).send({ ok: false, error: "Not authenticated" });

    const friends = await friendsService.friendsList(me.id);
    return reply.send({ ok: true, friends });
  });

  app.get("/api/friends/friends_pending", async (req, reply) => {
    const sid = req.cookies?.sid;
    const me = await authService.getMe({ sid });
    if (!me) return reply.code(401).send({ ok: false, error: "Not authenticated" });

    const pending = await friendsService.friendsPending(me.id);
    return reply.send({ ok: true, pending });
  });

  app.post("/api/friends/friend_request", async (req, reply) => {
    const sid = req.cookies?.sid;
    const me = await authService.getMe({ sid });
    if (!me) return reply.code(401).send({ ok: false, error: "Not authenticated" });

    const { identifier } = req.body || {};
    const r = await friendsService.requestFriend(me.id, identifier);
    if (!r.ok) {
      if (r.cause) req.log.error(r.cause);
      return reply.code(r.status).send({ ok: false, error: r.error });
    }
    return reply.send({ ok: true });
  });

  app.post("/api/friends/friend_respond", async (req, reply) => {
    const sid = req.cookies?.sid;
    const me = await authService.getMe({ sid });
    if (!me) return reply.code(401).send({ ok: false, error: "Not authenticated" });

    const { requester_id, accept } = req.body || {};
    const r = await friendsService.respondFriend(me.id, { requester_id, accept: !!accept });
    if (!r.ok) return reply.code(r.status).send({ ok: false, error: r.error });
    return reply.send({ ok: true });
  });
}
