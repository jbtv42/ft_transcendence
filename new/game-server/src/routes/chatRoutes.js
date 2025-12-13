export function registerChatRoutes(app, { authService, chatService }) {
  app.get("/api/chat/chat_fetch", async (req, reply) => {
    const sid = req.cookies?.sid;
    const me = await authService.getMe({ sid });
    if (!me) return reply.code(401).send({ ok: false, error: "Not authenticated" });

    const { room, since_id, limit } = req.query || {};
    const messages = await chatService.fetchMessages(room, since_id, limit);
    return reply.send({ ok: true, messages });
  });

  app.post("/api/chat/chat_send", async (req, reply) => {
    const sid = req.cookies?.sid;
    const me = await authService.getMe({ sid });
    if (!me) return reply.code(401).send({ ok: false, error: "Not authenticated" });

    const { room, content } = req.body || {};
    const out = await chatService.sendMessage(me.id, room, content);

    if (!out.ok) return reply.code(out.status || 400).send({ ok: false, error: out.error });
    return reply.send({ ok: true });
  });
}

