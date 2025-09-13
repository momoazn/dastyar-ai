import { Database } from 'bun:sqlite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { config } from '../config';
import type * as schema from './schema';

const FILE_PROTOCOL_RE = /^file:/;

function resolveDatabasePath(): string {
  const p = config.database_file?.trim();
  if (p && p.length > 0) {
    if (p.startsWith('file:')) {
      try {
        return fileURLToPath(new URL(p));
      } catch {
        // Fall back to raw path if URL parsing fails
        return p.replace(FILE_PROTOCOL_RE, '');
      }
    }
    // Ensure relative paths are resolved consistently
    return resolve(p);
  }
  console.log('No database URL found, using default database file');
  return resolve('./data.db');
}

const sqlite = new Database(resolveDatabasePath(), {
  create: true,
  strict: true,
});
export const db = drizzle<typeof schema>(sqlite);
export { sqlite };
