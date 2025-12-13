export function registerProfileRoutes(app, { authService, profileService }) {
  app.post("/api/profile/update_profile", async (req, reply) => {
    const sid = req.cookies?.sid;
    const me = await authService.getMe({ sid });
    if (!me) return reply.code(401).send({ ok: false, error: "Not authenticated" });

    const r = await profileService.updateProfileInfo(me.id, req.body || {});
    if (!r.ok) {
      if (r.cause) req.log.error(r.cause);
      return reply.code(r.status).send({ ok: false, error: r.error });
    }
    return reply.send({ ok: true });
  });

  app.post("/api/profile/change_password", async (req, reply) => {
    const sid = req.cookies?.sid;
    const me = await authService.getMe({ sid });
    if (!me) return reply.code(401).send({ ok: false, error: "Not authenticated" });

    const { old_password, new_password } = req.body || {};
    const r = await profileService.changePassword(me.id, { old_password, new_password });
    if (!r.ok) return reply.code(r.status).send({ ok: false, error: r.error });
    return reply.send({ ok: true });
  });

  app.post("/api/profile/upload_avatar", async (req, reply) => {
    const sid = req.cookies?.sid;
    const me = await authService.getMe({ sid });
    if (!me) return reply.code(401).send({ ok: false, error: "Not authenticated" });

    const mp = await req.file();
    if (!mp) return reply.code(400).send({ ok: false, error: "Missing file." });

    const buf = await mp.toBuffer();
    const filename = String(mp.filename || "");
    const ext = filename.includes(".") ? filename.split(".").pop() : "jpg";

    const publicPath = await profileService.saveAvatarFile(me.id, { bytes: buf, ext });
    return reply.send({ ok: true, avatar_path: publicPath });
  });
}
