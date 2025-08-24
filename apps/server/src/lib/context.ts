import type { Context as HonoContext } from 'hono';
import { db } from '../database';
import type { Logger } from './logger';

export type CreateContextOptions = {
  context: HonoContext;
};

export function createContext({ context }: CreateContextOptions) {
  // No auth configured
  return {
    honoContext: context,
    session: null,
    db, // Attach the database instance to the context
    log: context.get('log') as Logger | undefined,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
