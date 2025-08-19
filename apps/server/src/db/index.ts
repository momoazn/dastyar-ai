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
  // Dev-friendly fallback to local file database; support being run from repo root or server dir
  const candidates = [resolve(process.cwd(), './data.db')];
  // Prefer the first candidate that already exists; otherwise use the second within current cwd
  const existing = candidates.find((p) => existsSync(dirname(p)));
  const selected = existing ?? candidates[1];
  const dir = dirname(selected);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return selected;
}

const sqlite = new Database(resolveDatabasePath(), {
  create: true,
  strict: true,
});
export const db = drizzle(sqlite);
export { sqlite };
