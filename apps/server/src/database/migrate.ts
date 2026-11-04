import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { logger } from "@/lib/logger";
import { sqliteDB } from "./connection";

type MigrationEntry = {
  idx: number;
  tag: string;
  when: number;
};

type MigrationData = Record<string, string>;
type MigrationSource = "directory" | "bundled";

/**
 * Load bundled migration data
 */
async function loadBundledMigrations(): Promise<MigrationData | null> {
  try {
    const migrationModule = await import("./migration-data.generated");
    return migrationModule.migrationData;
  } catch (_error) {
    logger.info(
      "No bundled migrations found, checking for migrations directory..."
    );
    return null;
  }
}

function loadFileMigrations(migrationsPath: string): MigrationData {
  const journalPath = join(migrationsPath, "meta", "_journal.json");

  if (!existsSync(journalPath)) {
    throw new Error(`Migration journal not found: ${journalPath}`);
  }

  const migrationData: MigrationData = {
    "meta/_journal.json": readFileSync(journalPath, "utf8"),
  };

  const journal = JSON.parse(migrationData["meta/_journal.json"]) as {
    entries: MigrationEntry[];
  };

  for (const entry of journal.entries) {
    const sqlFileName = `${entry.tag}.sql`;
    const sqlFilePath = join(migrationsPath, sqlFileName);

    if (!existsSync(sqlFilePath)) {
      throw new Error(`Migration SQL file not found: ${sqlFilePath}`);
    }

    migrationData[sqlFileName] = readFileSync(sqlFilePath, "utf8");
  }

  return migrationData;
}

async function loadAvailableMigrations(): Promise<{
  source: MigrationSource;
  data: MigrationData;
} | null> {
  const migrationsPath = join(import.meta.dir, "migrations");

  if (existsSync(migrationsPath)) {
    logger.info(
      `[migrate] Loading migrations from directory: ${migrationsPath}`
    );
    return {
      source: "directory",
      data: loadFileMigrations(migrationsPath),
    };
  }

  const bundled = await loadBundledMigrations();
  if (bundled) {
    logger.info("[migrate] Loading bundled migrations");
    return {
      source: "bundled",
      data: bundled,
    };
  }

  return null;
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
      logger.error(
        `[migrate] Error executing statement in ${migrationTag}:`,
        statement.substring(0, 100)
      );
      logger.error(error instanceof Error ? error.message : String(error));
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
 * Apply migrations from either directory or bundled source
 */
function applyMigrations(migrationData: MigrationData): void {
  logger.info(
    `[migrate] Running migrations from loaded migration data (${
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
      logger.warn(`[migrate] Missing SQL file for migration: ${migrationTag}`);
      continue;
    }

    if (appliedHashes.has(migrationTag)) {
      logger.info(`[migrate] ✓ Migration ${migrationTag} already applied`);
      continue;
    }

    logger.info(`[migrate] Applying migration: ${migrationTag}...`);

    const statements = parseSqlStatements(sqlContent);

    try {
      executeMigrationStatements(statements, migrationTag);
      recordMigration(migrationTag);
      logger.info(`[migrate] ✓ Migration ${migrationTag} applied successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already exists")) {
        logger.warn(
          `[migrate] Skipping migration ${migrationTag} because objects already exist`,
          { migrationTag, error: message }
        );
        recordMigration(migrationTag);
        continue;
      }

      throw error;
    }
  }
}

/**
 * Run migrations using bundled migration data
 * This function is designed to work in both development and production (compiled) environments
 */
export async function runMigrations(): Promise<void> {
  try {
    logger.info("[migrate] Starting database migrations...");

    const loadedMigrations = await loadAvailableMigrations();

    if (loadedMigrations) {
      // Table rebuilds in a migration would cascade-delete child rows
      // while foreign keys are on, so turn them off for the run.
      sqliteDB.run("PRAGMA foreign_keys = OFF");
      try {
        applyMigrations(loadedMigrations.data);
      } finally {
        sqliteDB.run("PRAGMA foreign_keys = ON");
      }
      logger.info(
        `[migrate] ${loadedMigrations.source} migrations completed successfully`
      );
      return;
    }

    logger.info(
      "[migrate] No migrations found, database will be created from schema"
    );
  } catch (error) {
    logger.error(
      "[migrate] Migration failed:",
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}
