export function ensureSchema(db) {
  db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON;", (err) => {
      if (err) console.error("Error enabling foreign keys:", err);
    });

    db.run("PRAGMA journal_mode = WAL;", (err) => {
      if (err) console.error("Error setting journal mode:", err);
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_chat_room_id ON chat_messages(room, id);`, (err) => {
      if (err) console.error("Error creating index:", err);
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        display_name TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_path TEXT,
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_active TEXT
      )
    `, (err) => {
      if (err) console.error("Error creating users table:", err);
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error("Error creating sessions table:", err);
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room TEXT NOT NULL,
        sender_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error("Error creating chat_messages table:", err);
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS pong_games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        player1_id INTEGER NOT NULL,
        player2_id INTEGER,
        status TEXT NOT NULL DEFAULT 'waiting',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error("Error creating pong_games table:", err);
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        status TEXT NOT NULL, -- 'pending' | 'accepted'
        created_at TEXT NOT NULL,
        UNIQUE(user_id, friend_id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(friend_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error("Error creating friends table:", err);
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS pong_matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        code TEXT NOT NULL,
        player1_id INTEGER NOT NULL,
        player2_id INTEGER NOT NULL,
        score_left INTEGER NOT NULL,
        score_right INTEGER NOT NULL,
        winner_id INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (game_id) REFERENCES pong_games(id) ON DELETE CASCADE,
        FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `, (err) => {
      if (err) console.error("Error creating pong_matches table:", err);
    });

  });

  db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
    if (err) {
      console.error("Error listing tables:", err);
    } else {
      console.log("Tables:", tables);
    }
  });
}

