import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import chatHandler from './routes/chat';
import { getConfig } from './config';
import orpcsHandler from './routes/rpc';

export function createApp() {
  const cfg = getConfig();
  const app = new Hono();

  // Middleware
  app.use(logger());
  app.use(async (_c, next) => {
    await next();
  });

  app.use(
    '/*',
    cors({
      origin: cfg.server.corsOrigin,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
    })
  );

  // API routes
  app.route('/rpc', orpcsHandler);
  app.route('/chat', chatHandler);

  // Static file serving
  const configuredDistDir = cfg.web.distDir;
  const resolvedDistDir = configuredDistDir
    ? path.resolve(configuredDistDir)
    : fileURLToPath(new URL('web', import.meta.url));

  app.use('/*', serveStatic({ root: resolvedDistDir }));
  app.get('*', serveStatic({ root: resolvedDistDir, path: 'index.html' }));

  return { app, config: cfg };
}