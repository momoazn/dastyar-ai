import { existsSync } from "node:fs";
import { join } from "node:path";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { logger } from "@/lib/logger";
import { db, sqliteDB } from "./index";

type MigrationEntry = {
  idx: number;
  tag: string;
  when: number;
};

type MigrationData = { [key: string]: string };

/**
 * Load bundled migration data
 */
async function loadBundledMigrations(): Promise<MigrationData | null> {
  try {
    const migrationModule = await import("./migration-data.generated");
    return migrationModule.migrationData;
  } catch (error) {
    logger.info(
      "No bundled migrations found, checking for migrations directory..."
    );
    return null;
  }
}

/**
 * Create migrations table if it doesn't exist
 */
function createMigrationsTable(): void {
  sqliteDB.run(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    )
  `);
}

/**
 * Get already applied migrations
 */
function getAppliedMigrations(): Set<string> {
  const appliedMigrations = sqliteDB
    .prepare("SELECT hash FROM __drizzle_migrations")
    .all() as Array<{ hash: string }>;
  return new Set(appliedMigrations.map((m) => m.hash));
}

/**
 * Parse SQL content into statements
 */
function parseSqlStatements(sqlContent: string): string[] {
  return sqlContent
    .split(/--> statement-breakpoint/g)
    .flatMap((block) =>
      block
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"))
    )
    .filter((s) => s.length > 0);
}

/**
 * Execute SQL statements for a migration
 */
function executeMigrationStatements(
  statements: string[],
  migrationTag: string
): void {
  for (const statement of statements) {
    try {
      sqliteDB.run(statement);
    } catch (error) {
      console.error(
        `[migrate] Error executing statement in ${migrationTag}:`,
        statement.substring(0, 100)
      );
      console.error(error);
      throw error;
    }
  }
}

/**
 * Record migration as applied
 */
function recordMigration(migrationTag: string): void {
  sqliteDB.run(
    "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
    [migrationTag, Date.now()]
  );
}

/**
 * Apply bundled migrations
 */
function applyBundledMigrations(migrationData: MigrationData): void {
  console.log(
    `[migrate] Running migrations from bundled data (${
      Object.keys(migrationData).length
    } files)...`
  );

  const journalContent = migrationData["meta/_journal.json"];
  if (!journalContent) {
    throw new Error("Journal file not found in bundled migrations");
  }

  const journal = JSON.parse(journalContent);
  const entries = journal.entries as MigrationEntry[];

  createMigrationsTable();
  const appliedHashes = getAppliedMigrations();

  for (const entry of entries) {
    const migrationTag = entry.tag;
    const sqlFileName = `${migrationTag}.sql`;
    const sqlContent = migrationData[sqlFileName];

    if (!sqlContent) {
      console.warn(`[migrate] Missing SQL file for migration: ${migrationTag}`);
      continue;
    }

    if (appliedHashes.has(migrationTag)) {
      console.log(`[migrate] ✓ Migration ${migrationTag} already applied`);
      continue;
    }

    console.log(`[migrate] Applying migration: ${migrationTag}...`);

    const statements = parseSqlStatements(sqlContent);
    executeMigrationStatements(statements, migrationTag);
    recordMigration(migrationTag);

    console.log(`[migrate] ✓ Migration ${migrationTag} applied successfully`);
  }
}

/**
 * Run migrations using bundled migration data
 * This function is designed to work in both development and production (compiled) environments
 */
export async function runMigrations(): Promise<void> {
  try {
    console.log("[migrate] Starting database migrations...");

    const migrationData = await loadBundledMigrations();

    if (migrationData) {
      applyBundledMigrations(migrationData);
      console.log("[migrate] All migrations completed successfully");
      return;
    }

    // Fallback to file-based migrations in development
    const migrationsPath = join(import.meta.dir, "migrations");

    if (existsSync(migrationsPath)) {
      console.log(
        `[migrate] Running migrations from directory: ${migrationsPath}`
      );
      await migrate(db, { migrationsFolder: migrationsPath });
      console.log("[migrate] Migrations completed successfully");
    } else {
      console.log(
        "[migrate] No migrations found, database will be created from schema"
      );
    }
  } catch (error) {
    console.error("[migrate] Migration failed:", error);
    throw error;
  }
}
