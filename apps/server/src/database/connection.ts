import { Database } from "bun:sqlite";
import { env, resolveConfiguredPath } from "../config";

const databaseFilePath = resolveConfiguredPath(env.DATABASE_FILE);

export const sqliteDB = new Database(databaseFilePath, {
  create: true,
  strict: true,
});
