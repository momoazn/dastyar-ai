import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { db, sqlite } from './index';
import migrationData from './migration-data.generated';

export async function runMigrations(): Promise<void> {
  try {
    // Check if migrations have already been applied
    const isMigrated = await checkIfMigrated();
    if (isMigrated) {
      console.log('Database is already up to date');
      return;
    }

    console.log('Database needs migration, running migrations...');

    // Use bundled migrations for compiled executable
    await runBundledMigrations();
  } catch (error) {
    console.warn('Bundled migrations failed, trying local files:', error);
    // Fallback to local migration files for development
    try {
      await runLocalMigrations();
    } catch (localError) {
      // If both fail with "table already exists", it might mean migrations were partially applied
      if (
        localError instanceof Error &&
        (localError.message.includes('already exists') ||
          localError.message.includes('duplicate column'))
      ) {
        console.warn(
          'Tables may already exist or database may be partially initialized. Checking if this is OK...'
        );
        const isMigrated = await checkIfMigrated();
        if (isMigrated) {
          console.log(
            'Database appears to be properly initialized despite the error'
          );
          return;
        }
      }
      throw localError;
    }
  }
}

function checkIfMigrated() {
  try {
    // Check if the migration tracking table exists
    const migrationTableExists = sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations';"
      )
      .get();
    if (!migrationTableExists) {
      return false;
    }

    // Check if our main tables exist
    const tablesToCheck = ['messages', 'models', 'threads', 'translations'];
    for (const table of tablesToCheck) {
      const tableExists = sqlite
        .prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}';`
        )
        .get();
      if (!tableExists) {
        return false;
      }
    }

    // Check if the specific migration has been applied
    const migrations = sqlite
      .prepare('SELECT * FROM __drizzle_migrations;')
      .all();
    if (migrations && migrations.length > 0) {
      console.log('Found existing migration records');
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

async function runBundledMigrations(): Promise<void> {
  console.log('Running bundled migrations...');

  // Create temporary folder for migrations
  const migrationsFolder = resolve(tmpdir(), `migrations-${Date.now()}`);
  mkdirSync(migrationsFolder, { recursive: true });

  try {
    // Create meta directory
    const metaDir = resolve(migrationsFolder, 'meta');
    mkdirSync(metaDir, { recursive: true });

    // Write migration files from bundled data
    for (const [filePath, content] of Object.entries(migrationData)) {
      const fullPath = resolve(migrationsFolder, filePath);
      const dir = resolve(fullPath, '..');

      // Ensure directory exists
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(fullPath, content, 'utf-8');
    }

    // Run migrations
    await migrate(db, { migrationsFolder });
    console.log('Bundled migrations completed successfully');
  } catch (error) {
    // If it's a "table already exists" error, we might have already run migrations
    if (
      error instanceof Error &&
      (error.message.includes('already exists') ||
        error.message.includes('duplicate column'))
    ) {
      console.log(
        'Bundled migrations may have already been applied. Checking if this is OK...'
      );
      const isMigrated = await checkIfMigrated();
      if (isMigrated) {
        console.log(
          'Database appears to be properly initialized despite the error'
        );
        return;
      }
    }
    throw error;
  } finally {
    // Cleanup temporary files (optional - OS will clean tmpdir)
    // We could add cleanup here if needed
  }
}

async function runLocalMigrations(): Promise<void> {
  console.log('Running local migrations...');

  // Support running from repo root or from the server app dir
  const candidates = [
    resolve(process.cwd(), 'apps/server/src/db/migrations'),
    resolve(process.cwd(), 'src/db/migrations'),
  ];
  const migrationsFolder = candidates.find((p) => existsSync(p));
  if (!migrationsFolder) {
    console.log('No local migrations found');
    return; // No migrations present, nothing to run in dev
  }

  try {
    await migrate(db, { migrationsFolder });
    console.log('Local migrations completed successfully');
  } catch (error) {
    // If it's a "table already exists" error, we might have already run migrations
    if (
      error instanceof Error &&
      (error.message.includes('already exists') ||
        error.message.includes('duplicate column'))
    ) {
      console.log(
        'Local migrations may have already been applied. Checking if this is OK...'
      );
      const isMigrated = await checkIfMigrated();
      if (isMigrated) {
        console.log(
          'Database appears to be properly initialized despite the error'
        );
        return;
      }
    }
    throw error;
  }
}
