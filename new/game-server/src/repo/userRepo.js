export async function createUser(dbRun, { email, username, display_name, password_hash, created_at }) {
  const now = created_at;
  const r = await dbRun(
    `INSERT INTO users (email, username, display_name, password_hash, created_at, updated_at, wins, losses)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
    [email, username, display_name, password_hash, now, now]
  );
  return r.lastID;
}

export async function findUserByIdentifier(dbGet, ident) {
  const row = await dbGet(
    `SELECT id, email, username, display_name, password_hash, avatar_path, wins, losses, last_active
     FROM users
     WHERE username = ? OR email = ? OR display_name = ?
     LIMIT 1`,
    [ident, ident, ident]
  );
  return row || null;
}

export async function getUserById(dbGet, id) {
  const row = await dbGet(
    `SELECT id, email, username, display_name, avatar_path, wins, losses, last_active
     FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return row || null;
}

export async function getPasswordHashById(dbGet, id) {
  const row = await dbGet(`SELECT password_hash FROM users WHERE id = ? LIMIT 1`, [id]);
  return row ? row.password_hash : null;
}

export async function updateProfile(dbRun, id, { email, username, display_name }) {
  const fields = [];
  const params = [];

  if (email !== undefined) { fields.push("email = ?"); params.push(email); }
  if (username !== undefined) { fields.push("username = ?"); params.push(username); }
  if (display_name !== undefined) { fields.push("display_name = ?"); params.push(display_name); }

  fields.push("updated_at = ?");
  params.push(new Date().toISOString());

  params.push(id);

  await dbRun(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, params);
}

export async function updatePasswordHash(dbRun, id, password_hash) {
  await dbRun(
    `UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`,
    [password_hash, new Date().toISOString(), id]
  );
}

export async function updateAvatarPath(dbRun, id, avatar_path) {
  await dbRun(
    `UPDATE users SET avatar_path = ?, updated_at = ? WHERE id = ?`,
    [avatar_path, new Date().toISOString(), id]
  );
}

export async function updateLastActive(dbRun, id) {
  const now = new Date().toISOString();
  await dbRun(`UPDATE users SET last_active = ? WHERE id = ?`, [now, id]);
}

