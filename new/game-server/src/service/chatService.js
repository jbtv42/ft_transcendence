import { insertChatMessage, fetchChatMessages } from "../repo/chatRepo.js";

export function createChatService(dbCtx) {
  return {
    async sendMessage(userId, room, content) {
      const r = String(room || "global").trim().slice(0, 64) || "global";
      const c = String(content || "").trim().slice(0, 500);
      if (!c) return { ok: false, status: 400, error: "Empty message." };

      await insertChatMessage(dbCtx.dbRun, { room: r, sender_id: userId, content: c });
      return { ok: true };
    },

    async fetchMessages(room, since_id = 0, limit = 50) {
      const r = String(room || "global").trim().slice(0, 64) || "global";
      const messages = await fetchChatMessages(dbCtx.dbAll, { room: r, since_id, limit });
      return messages;
    },
  };
}
