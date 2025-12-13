import { updateLastActive } from "./userRepo.js";

export async function insertSession(dbRun, { sid, user_id, created_at }) {
  await dbRun("INSERT INTO sessions (sid, user_id, created_at) VALUES (?, ?, ?)", [sid, user_id, created_at]);
}

export async function deleteSession(dbRun, sid) {
  await dbRun("DELETE FROM sessions WHERE sid = ?", [sid]);
}

export async function getUserBySid(dbGet, sid) {
  const row = await dbGet(
    `SELECT u.id, u.email, u.username, u.display_name, u.avatar_path, u.wins, u.losses, u.last_active
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.sid = ?`,
    [sid]
  );
  return row || null;
}

export async function getUserBySidAndTouch({ dbGet, dbRun }, sid) {
  const user = await getUserBySid(dbGet, sid);
  if (user) await updateLastActive(dbRun, user.id);
  return user;
}
