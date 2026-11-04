import { Database } from "bun:sqlite";
import { env, resolveConfiguredPath } from "../config";

const databaseFilePath = resolveConfiguredPath(env.DATABASE_FILE);

export const sqliteDB = new Database(databaseFilePath, {
  create: true,
  strict: true,
});

// SQLite ignores foreign keys unless this is on, so ON DELETE CASCADE
// would never run. Wait up to 5s on a locked database instead of failing.
sqliteDB.run("PRAGMA foreign_keys = ON");
sqliteDB.run("PRAGMA busy_timeout = 5000");
