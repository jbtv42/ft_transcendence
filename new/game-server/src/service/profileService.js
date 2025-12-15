import fs from "node:fs/promises";
import path from "node:path";

import { hashPassword, verifyPassword } from "../domain/auth/password.js";
import { getPasswordHashById, updatePasswordHash, updateProfile, updateAvatarPath } from "../repo/userRepo.js";

export function createProfileService(dbCtx) {
  const { dbGet, dbRun } = dbCtx;

  async function getUserById(userId) {
    try {
      console.log(`Fetching user with ID: ${userId}`);
      const user = await dbGet(
        `SELECT id, email, username, display_name, avatar_path, wins, losses FROM users WHERE id = ? LIMIT 1`,
        [userId]
      );

      console.log('Fetched user:', user);

      if (!user) {
        console.log(`User not found with ID: ${userId}`);
      }

      return user || null;
    } catch (error) {
      console.error('Error fetching user from DB:', error);
      throw new Error('Database error while fetching user');
    }
  }

  async function updateProfileInfo(userId, payload) {
    const email = payload?.email !== undefined ? String(payload.email).trim() : undefined;
    const username = payload?.username !== undefined ? String(payload.username).trim() : undefined;
    const display_name = payload?.display_name !== undefined ? String(payload.display_name).trim() : undefined;

    if (email === "" || username === "" || display_name === "") {
      return { ok: false, status: 400, error: "Fields cannot be empty." };
    }

    try {
      await updateProfile(dbRun, userId, { email, username, display_name });
      return { ok: true, status: 200 };
    } catch (e) {
      const msg = String(e);
      if (msg.includes("UNIQUE") || msg.includes("SQLITE_CONSTRAINT")) {
        return { ok: false, status: 409, error: "Email, username, or display name already exists." };
      }
      return { ok: false, status: 500, error: "Database error.", cause: e };
    }
  }

  async function changePassword(userId, { old_password, new_password }) {
    if (!old_password || !new_password) {
      return { ok: false, status: 400, error: "Missing old_password or new_password." };
    }

    const stored = await getPasswordHashById(dbGet, userId);
    if (!stored || !verifyPassword(old_password, stored)) {
      return { ok: false, status: 401, error: "Old password incorrect." };
    }

    const password_hash = hashPassword(new_password);
    await updatePasswordHash(dbRun, userId, password_hash);
    return { ok: true, status: 200 };
  }

  async function saveAvatarFile(userId, { bytes, ext }) {
    const safeExt = (ext || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const dir = "/data/avatars";
    await fs.mkdir(dir, { recursive: true });

    const filename = `user_${userId}.${safeExt}`;
    const filepath = path.join(dir, filename);

    await fs.writeFile(filepath, bytes);

    const publicPath = `/avatars/${filename}`;
    await updateAvatarPath(dbRun, userId, publicPath);

    return publicPath;
  }

  return { getUserById, updateProfileInfo, changePassword, saveAvatarFile };
}

