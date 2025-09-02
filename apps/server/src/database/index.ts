import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { config } from '../config';
import type * as schema from './schema';

const FILE_PROTOCOL_RE = /^file:/;

function resolveDatabasePath(): string {
  const dbUrl = config.DATABASE_FILE?.trim();
  if (dbUrl && dbUrl.length > 0) {
    return dbUrl.startsWith('file:')
      ? dbUrl.replace(FILE_PROTOCOL_RE, '')
      : dbUrl;
  }
  console.log('No database URL found, using default database file');
  return './data.db';
}

const sqlite = new Database(resolveDatabasePath(), {
  create: true,
  strict: true,
});
export const db = drizzle<typeof schema>(sqlite);
export { sqlite };
