import { os } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { Hono } from 'hono';
import { type Context, createContext } from '../lib/context';
import { appRouter } from './procedures';

// Create the base context with database support
export const o = os.$context<Context>();

// Create a database middleware for consistent database access
export const dbProvider = o.middleware(({ context, next }) => {
  return next({ context: { db: context.db } });
});

// Export the public procedure with database context
export const publicProcedure = o.use(dbProvider);

const handler = new RPCHandler(appRouter);

const app = new Hono();

app.use('*', async (c, next) => {
  const context = createContext({ context: c });
  const { matched, response } = await handler.handle(c.req.raw, {
    prefix: '/rpc',
    context,
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }
  await next();
});

export default app;
