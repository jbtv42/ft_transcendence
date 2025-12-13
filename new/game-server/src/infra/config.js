export const config = {
  API_PORT: Number(process.env.API_PORT || 3000),
  COOKIE_SECRET: process.env.COOKIE_SECRET || "dev_secret_change_me",
  DB_PATH: process.env.DATABASE_URL || "/data/users.db",
};
