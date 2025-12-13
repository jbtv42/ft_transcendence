export async function findUserByFriendIdentifier(dbGet, ident) {
  const row = await dbGet(
    `SELECT id, username, display_name
     FROM users
     WHERE username = ? OR email = ? OR display_name = ?
     LIMIT 1`,
    [ident, ident, ident]
  );
  return row || null;
}

export async function createFriendRequest(dbRun, { user_id, friend_id }) {
  const now = new Date().toISOString();
  await dbRun(
    `INSERT INTO friends (user_id, friend_id, status, created_at)
     VALUES (?, ?, 'pending', ?)`,
    [user_id, friend_id, now]
  );
}

export async function acceptFriendRequest(dbRun, { requester_id, target_id }) {
  await dbRun(
    `UPDATE friends SET status='accepted'
     WHERE user_id = ? AND friend_id = ? AND status='pending'`,
    [requester_id, target_id]
  );

  const now = new Date().toISOString();
  await dbRun(
    `INSERT OR IGNORE INTO friends (user_id, friend_id, status, created_at)
     VALUES (?, ?, 'accepted', ?)`,
    [target_id, requester_id, now]
  );

  await dbRun(
    `UPDATE friends SET status='accepted'
     WHERE user_id = ? AND friend_id = ?`,
    [requester_id, target_id]
  );
}

export async function declineFriendRequest(dbRun, { requester_id, target_id }) {
  await dbRun(
    `DELETE FROM friends
     WHERE user_id = ? AND friend_id = ? AND status='pending'`,
    [requester_id, target_id]
  );
}

export async function listAcceptedFriends(dbGet, user_id) {
  return await new Promise((resolve, reject) => {
    dbGet(
      `SELECT u.id, u.username, u.display_name, u.avatar_path, u.last_active
       FROM friends f
       JOIN users u ON u.id = f.friend_id
       WHERE f.user_id = ? AND f.status='accepted'
       ORDER BY u.username ASC`,
      [user_id]
    )
      .then((row) => resolve(row))
      .catch(reject);
  });
}

export async function listAcceptedFriendsAll(dbAll, user_id) {
  return await dbAll(
    `SELECT u.id, u.username, u.display_name, u.avatar_path, u.last_active
     FROM friends f
     JOIN users u ON u.id = f.friend_id
     WHERE f.user_id = ? AND f.status='accepted'
     ORDER BY u.username ASC`,
    [user_id]
  );
}

export async function listIncomingPendingAll(dbAll, user_id) {
  return await dbAll(
    `SELECT u.id, u.username, u.display_name, u.avatar_path
     FROM friends f
     JOIN users u ON u.id = f.user_id
     WHERE f.friend_id = ? AND f.status='pending'
     ORDER BY u.username ASC`,
    [user_id]
  );
}

export async function hasAnyRelation(dbGet, a, b) {
  const row = await dbGet(
    `SELECT id, user_id, friend_id, status
     FROM friends
     WHERE (user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)
     LIMIT 1`,
    [a, b, b, a]
  );
  return row || null;
}
