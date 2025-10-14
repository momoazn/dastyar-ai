import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { env, resolveConfiguredPath } from "../config";
// biome-ignore lint/performance/noNamespaceImport: GO AWAY
import * as schema from "./schema";

const databaseFile = resolveConfiguredPath(env.DATABASE_FILE);

export const sqlite = new Database(databaseFile, {
  create: true,
  strict: true,
});

export const db = drizzle({
  client: sqlite,
  schema,
});

// biome-ignore lint/performance/noBarrelFile: GO AWAY
export * from "./schema";
