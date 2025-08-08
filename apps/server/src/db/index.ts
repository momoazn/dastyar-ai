import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/bun-sqlite';

const FILE_PROTOCOL_RE = /^file:/;

function resolveDatabasePath(): string {
  const envUrl = process.env.DATABASE_URL?.trim();
  if (envUrl && envUrl.length > 0) {
    // Support both file: and plain paths
    return envUrl.startsWith('file:')
      ? envUrl.replace(FILE_PROTOCOL_RE, '')
      : envUrl;
  }
  // Dev-friendly fallback to local file database
  const filePath = resolve(process.cwd(), 'apps/server/.data/local.db');
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return filePath;
}

const sqlite = new Database(resolveDatabasePath(), {
  create: true,
  strict: true,
});
export const db = drizzle(sqlite);
export { sqlite };
