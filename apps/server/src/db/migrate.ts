import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { db } from './index';
import migrationData from './migration-data.generated';

export async function runMigrations(): Promise<void> {
  try {
    // Use bundled migrations for compiled executable
    await runBundledMigrations();
  } catch (error) {
    console.warn('Bundled migrations failed, trying local files:', error);
    // Fallback to local migration files for development
    await runLocalMigrations();
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

  await migrate(db, { migrationsFolder });
  console.log('Local migrations completed successfully');
}
