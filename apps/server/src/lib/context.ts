import type { Context as HonoContext } from 'hono';
import prisma from '../database';

export type CreateContextOptions = {
  context: HonoContext;
};

export function createContext({ context }: CreateContextOptions) {
  // No auth configured
  return {
    honoContext: context,
    session: null,
    db: prisma, // Attach the database instance to the context
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
