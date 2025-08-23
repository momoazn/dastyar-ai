import { os } from '@orpc/server';
import type { Context } from '../lib/context';

// Create the base context with database support
export const o = os.$context<Context>();

// Create a database middleware for consistent database access
export const dbProvider = o.middleware(({ context, next }) => {
  return next({ context: { db: context.db } });
});

// Export the public procedure with database context
export const publicProcedure = o.use(dbProvider);
