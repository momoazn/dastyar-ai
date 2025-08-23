import path from 'node:path';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getConfig } from './config';
import chatHandler from './routes/chat';
import orpcsHandler from './routes/rpc';

export function createApp() {
  const config = getConfig();
  const app = new Hono();

  // Middleware
  app.use(logger());
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
  app.route('/chat', chatHandler);

  // Static file serving
  const resolvedDistDir = path.resolve(config.web.distDir);

  app.use('/*', serveStatic({ root: resolvedDistDir }));
  app.get('*', serveStatic({ root: resolvedDistDir, path: 'index.html' }));

  return { app, config };
}
