import { RPCHandler } from '@orpc/server/fetch';
import { Hono } from 'hono';
import { appRouter } from '../api/procedures';
import { createContext } from '../lib/context';

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
