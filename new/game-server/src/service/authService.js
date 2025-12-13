import crypto from "node:crypto";

import { hashPassword, verifyPassword } from "../domain/auth/password.js";
import { createUser, findUserByIdentifier } from "../repo/userRepo.js";
import { insertSession, deleteSession, getUserBySidAndTouch } from "../repo/sessionRepo.js";

export function createAuthService(dbCtx) {
  const { dbGet, dbRun } = dbCtx;

  function newSid() {
    return crypto.randomBytes(24).toString("hex");
  }

  async function createSession(userId) {
    const sid = newSid();
    await insertSession(dbRun, { sid, user_id: userId, created_at: new Date().toISOString() });
    return sid;
  }

  async function register({ email, username, display_name, password }) {
    if (!email || !username || !display_name || !password) {
      return { ok: false, status: 400, error: "Please fill in all fields." };
    }

    const password_hash = hashPassword(password);

    try {
      const userId = await createUser(dbRun, {
        email: String(email).trim(),
        username: String(username).trim(),
        display_name: String(display_name).trim(),
        password_hash,
        created_at: new Date().toISOString(),
      });

      const sid = await createSession(userId);
      return { ok: true, status: 201, sid };
    } catch (e) {
      const msg = String(e);
      if (msg.includes("UNIQUE") || msg.includes("SQLITE_CONSTRAINT")) {
        return { ok: false, status: 409, error: "Email, username, or display name already exists." };
      }
      return { ok: false, status: 500, error: "Database error.", cause: e };
    }
  }

  async function login({ identifier, password }) {
    if (!identifier || !password) {
      return { ok: false, status: 400, error: "Missing identifier or password." };
    }

    const ident = String(identifier).trim();
    const row = await findUserByIdentifier(dbGet, ident);

    if (!row || !verifyPassword(password, row.password_hash)) {
      return { ok: false, status: 401, error: "Invalid credentials." };
    }

    const sid = await createSession(row.id);
    return { ok: true, status: 200, sid, user: { id: row.id, username: row.username, display_name: row.display_name } };
  }

  async function logout({ sid }) {
    if (sid) await deleteSession(dbRun, sid);
    return { ok: true, status: 200 };
  }

  async function getMe({ sid }) {
    return await getUserBySidAndTouch(dbCtx, sid);
  }

  return { register, login, logout, getMe };
}

