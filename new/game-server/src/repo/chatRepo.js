export async function insertChatMessage(dbRun, { room, sender_id, content }) {
  const now = new Date().toISOString();
  await dbRun(
    `INSERT INTO chat_messages (room, sender_id, content, created_at)
     VALUES (?, ?, ?, ?)`,
    [room, sender_id, content, now]
  );
}

export async function fetchChatMessages(dbAll, { room, since_id = 0, limit = 50 }) {
  const since = Number(since_id) || 0;
  const lim = Math.max(1, Math.min(Number(limit) || 50, 200));

  return dbAll(
    `SELECT m.id, m.room, m.sender_id, m.content, m.created_at,
            u.username, u.display_name
     FROM chat_messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.room = ? AND m.id > ?
     ORDER BY m.id ASC
     LIMIT ?`,
    [room, since, lim]
  );
}