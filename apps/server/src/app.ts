import path from 'node:path';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getConfig } from './config';
import { createLogger } from './lib/logger';
import chatHandler from './routes/chat';
import imagesHandler from './routes/images';
import orpcsHandler from './routes/rpc';

export function createApp() {
  const config = getConfig();
  const app = new Hono();
  const log = createLogger();

  // Middleware
  if (config.logging.enableHttpLogging) {
    app.use('*', async (c, next) => {
      // attach request-scoped child logger with request info
      const reqId = crypto.randomUUID();
      const child = log.child({
        reqId,
        method: c.req.method,
        path: c.req.path,
      });
      // store as any to avoid typing issues; retrieved in context
      c.set('log' as never, child as never);
      const start = Date.now();
      try {
        await next();
        const rt = Date.now() - start;
        child.info(
          { status: c.res?.status, responseTimeMs: rt },
          'request completed'
        );
      } catch (err) {
        const rt = Date.now() - start;
        child.error({ err, responseTimeMs: rt }, 'request error');
        throw err;
      }
    });
  }
  // Keep hono default logger in dev for route traces if desired
  if (config.environment === 'development') {
    app.use(logger());
  }
  app.use(async (_c, next) => {
    await next();
  });

  app.use(
    '/*',
    cors({
      origin: config.server.corsOrigin,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
    })
  );

  // API routes
  app.route('/rpc', orpcsHandler);
  app.route('/api/chat', chatHandler);
  app.route('/api/images', imagesHandler);

  // Static file serving
  const resolvedDistDir = path.resolve(config.web.distDir);

  app.use('/*', serveStatic({ root: resolvedDistDir }));
  app.get('*', serveStatic({ root: resolvedDistDir, path: 'index.html' }));

  return { app, config };
}
