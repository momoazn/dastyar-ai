import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { env, resolveConfiguredPath } from "../config";
import { logger } from "../lib/logger";

// biome-ignore lint/performance/noNamespaceImport: because the schema is used in the index.ts file
import * as schema from "./schema";

// Resolve the database file path properly for both development and production
const databaseFilePath = resolveConfiguredPath(env.DATABASE_FILE);

export const sqliteDB = new Database(databaseFilePath, {
  create: true,
  strict: true,
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    // Run migrations automatically
    const { runMigrations } = await import("./migrate");
    await runMigrations();
  } catch (error) {
    logger.error("Error initializing database", error);
    throw error;
  }
};

export const db = drizzle({
  client: sqliteDB,
  schema,
});

export * from "./schema";
