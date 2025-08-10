import 'dotenv/config';

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { runMigrations } from './db/migrate';
import chatHandler from './handlers/chat';
import orpcsHandler from './handlers/orpc';
import { syncModels } from './lib/repository';

const app = new Hono();

app.use(logger());
app.use(async (_c, next) => {
  await next();
});

app.use(
  '/*',
  cors({
    origin: process.env.CORS_ORIGIN || '',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  })
);

app.route('/rpc', orpcsHandler);
app.route('/chat', chatHandler);

const isProduction =
  (process.env.NODE_ENV ?? '').toLowerCase() === 'production' ||
  (process.env.SERVE_STATIC ?? '').toLowerCase() === 'true';

if (isProduction) {
  // Resolve the absolute path to the built frontend assets directory
  // By default: apps/web/dist. Can be overridden via WEB_DIST_DIR
  const configuredDistDir = process.env.WEB_DIST_DIR;
  const resolvedDistDir = configuredDistDir
    ? path.resolve(configuredDistDir)
    : fileURLToPath(new URL('../../web/dist', import.meta.url));

  // Serve any static file if it exists (Vite outputs assets under /assets and top-level index.html)
  app.use('/*', serveStatic({ root: resolvedDistDir }));

  // SPA fallback: for any other GET route that isn't handled above, serve index.html
  // Keep this AFTER API routes so it doesn't shadow them
  app.get('*', serveStatic({ root: resolvedDistDir, path: 'index.html' }));
} else {
  app.get('/', (c) => {
    return c.text('OK');
  });
}

if (import.meta.main) {
  const start = async () => {
    await runMigrations();
    await syncModels();
    const port = Number(process.env.PORT) || 8787;
    console.log(`Server is running on port ${port}`);
    // biome-ignore lint/correctness/noUndeclaredVariables: Bun is declared
    Bun.serve({ fetch: app.fetch, port, hostname: '0.0.0.0' });
  };
  start().catch(() => {
    // Silently fail to avoid crashing process on startup errors
    // Prefer logging via a proper logger if available
  });
}
