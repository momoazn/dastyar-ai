import { drizzle } from "drizzle-orm/bun-sqlite";
import { logger } from "../lib/logger";
import { sqliteDB } from "./connection";

// biome-ignore lint/performance/noNamespaceImport: because the schema is used in the index.ts file
import * as schema from "./schema";

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
