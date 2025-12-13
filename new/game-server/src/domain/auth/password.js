import crypto from "node:crypto";

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(String(password), salt, 32);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export function verifyPassword(password, stored) {
  try {
    const [tag, saltHex, keyHex] = String(stored).split("$");
    if (tag !== "scrypt") return false;

    const salt = Buffer.from(saltHex, "hex");
    const key = Buffer.from(keyHex, "hex");
    const test = crypto.scryptSync(String(password), salt, 32);

    return crypto.timingSafeEqual(test, key);
  } catch {
    return false;
  }
}
