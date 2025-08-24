import { RPCHandler } from '@orpc/server/fetch';
import { Hono } from 'hono';
import { appRouter } from '../api/procedures';
import { getConfig } from '../config';
import { createContext } from '../lib/context';

const handler = new RPCHandler(appRouter);

const app = new Hono();
const config = getConfig();

app.use('*', async (c, next) => {
  const ctx = createContext({ context: c });
  const start = Date.now();
  const log =
    (c.get('log' as never) as unknown as
      | {
          info: (o?: unknown, m?: string) => void;
          error: (o?: unknown, m?: string) => void;
        }
      | undefined) ?? undefined;
  try {
    const { matched, response } = await handler.handle(c.req.raw, {
      prefix: '/rpc',
      context: ctx,
    });
    if (matched) {
      if (config.logging.enableHttpLogging && log) {
        log.info(
          {
            rpc: true,
            status: response.status,
            responseTimeMs: Date.now() - start,
          },
          'rpc handled'
        );
      }
      return c.newResponse(response.body, response);
    }
  } catch (err) {
    if (config.logging.enableHttpLogging && log) {
      log.error({ err }, 'rpc error');
    }
    throw err;
  }
  await next();
});

export default app;
