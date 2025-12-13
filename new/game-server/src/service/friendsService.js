import {
  findUserByFriendIdentifier,
  createFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  listAcceptedFriendsAll,
  listIncomingPendingAll,
  hasAnyRelation,
} from "../repo/friendsRepo.js";

function isOnlineHeuristic(lastActiveIso) {
  if (!lastActiveIso) return false;
  const t = Date.parse(lastActiveIso);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 30_000;
}

export function createFriendsService(dbCtx) {
  const { dbGet, dbAll, dbRun } = dbCtx;

  async function friendsList(userId) {
    const rows = await listAcceptedFriendsAll(dbAll, userId);
    return rows.map((u) => ({
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      avatar_path: u.avatar_path ?? null,
      online: isOnlineHeuristic(u.last_active),
    }));
  }

  async function friendsPending(userId) {
    const rows = await listIncomingPendingAll(dbAll, userId);
    return rows.map((u) => ({
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      avatar_path: u.avatar_path ?? null,
    }));
  }

  async function requestFriend(userId, identifier) {
    const ident = String(identifier || "").trim();
    if (!ident) return { ok: false, status: 400, error: "Missing identifier." };

    const target = await findUserByFriendIdentifier(dbGet, ident);
    if (!target) return { ok: false, status: 404, error: "User not found." };
    if (target.id === userId) return { ok: false, status: 400, error: "You cannot add yourself." };

    const rel = await hasAnyRelation(dbGet, userId, target.id);
    if (rel) {
    if (rel.status === "pending" && rel.user_id === target.id && rel.friend_id === userId) {
        return {
        ok: false,
        status: 409,
        error: "This user already sent you a friend request. Accept it in Pending requests.",
        };
    }
    return { ok: false, status: 409, error: "Friend request already exists (or already friends)." };
    }

    try {
      await createFriendRequest(dbRun, { user_id: userId, friend_id: target.id });
      return { ok: true, status: 200 };
    } catch (e) {
      const msg = String(e);
      if (msg.includes("UNIQUE") || msg.includes("SQLITE_CONSTRAINT")) {
        return { ok: false, status: 409, error: "Friend request already exists." };
      }
      return { ok: false, status: 500, error: "Database error.", cause: e };
    }
  }

  async function respondFriend(userId, { requester_id, accept }) {
    const rid = Number(requester_id);
    if (!rid) return { ok: false, status: 400, error: "Missing requester_id." };

    if (accept) {
      await acceptFriendRequest(dbRun, { requester_id: rid, target_id: userId });
      return { ok: true, status: 200 };
    } else {
      await declineFriendRequest(dbRun, { requester_id: rid, target_id: userId });
      return { ok: true, status: 200 };
    }
  }

  return { friendsList, friendsPending, requestFriend, respondFriend };
}
