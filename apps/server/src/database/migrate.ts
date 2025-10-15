import { existsSync } from "node:fs";
import { join } from "node:path";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db, sqliteDB } from "./index";

/**
 * Run migrations using bundled migration data
 * This function is designed to work in both development and production (compiled) environments
 */
export async function runMigrations(): Promise<void> {
  try {
    console.log("[migrate] Starting database migrations...");

    // Try to import bundled migration data
    let migrationData: { [key: string]: string } | undefined;
    try {
      const migrationModule = await import("./migration-data.generated");
      migrationData = migrationModule.migrationData;
    } catch {
      console.log(
        "[migrate] No bundled migrations found, checking for migrations directory..."
      );
    }

    // If we have bundled migrations, use them
    if (migrationData) {
      console.log(
        `[migrate] Running migrations from bundled data (${Object.keys(migrationData).length} files)...`
      );

      // Parse the journal to get migration entries
      const journalContent = migrationData["meta/_journal.json"];
      if (!journalContent) {
        throw new Error("Journal file not found in bundled migrations");
      }

      const journal = JSON.parse(journalContent);
      const entries = journal.entries as Array<{
        idx: number;
        tag: string;
        when: number;
      }>;

      // Create migrations table if it doesn't exist
      sqliteDB.run(`
        CREATE TABLE IF NOT EXISTS __drizzle_migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          hash TEXT NOT NULL UNIQUE,
          created_at INTEGER NOT NULL
        )
      `);

      // Get already applied migrations
      const appliedMigrations = sqliteDB
        .prepare("SELECT hash FROM __drizzle_migrations")
        .all() as Array<{ hash: string }>;
      const appliedHashes = new Set(appliedMigrations.map((m) => m.hash));

      // Apply each migration if not already applied
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

        // Split by statement-breakpoint (drizzle's delimiter) or semicolon
        const statements = sqlContent
          .split(/--> statement-breakpoint/g)
          .flatMap((block) => 
            block
              .split(";")
              .map((s) => s.trim())
              .filter((s) => s.length > 0 && !s.startsWith("--"))
          )
          .filter((s) => s.length > 0);

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

        // Record migration as applied
        sqliteDB.run(
          "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
          [migrationTag, Date.now()]
        );

        console.log(`[migrate] ✓ Migration ${migrationTag} applied successfully`);
      }

      console.log("[migrate] All migrations completed successfully");
      return;
    }

    // Fallback to file-based migrations in development
    const migrationsPath = join(
      import.meta.dir,
      "migrations"
    );

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
