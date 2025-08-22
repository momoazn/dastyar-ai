import 'dotenv/config';

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import chatHandler from './chat/handler';
import { runMigrations } from './db/migrate';
import { syncModels } from './lib/repository';
import orpcsHandler from './orpc/handler';

const PORT = Number(process.env.SERVER_PORT) || 3000;

const app = new Hono();

app.use(logger());
app.use(async (_c, next) => {
  await next();
});

app.use(
  '/*',
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  })
);

app.route('/rpc', orpcsHandler);
app.route('/chat', chatHandler);

// Resolve the absolute path to the built frontend assets directory
// By default: apps/web/dist. Can be overridden via WEB_DIST_DIR
const configuredDistDir = process.env.WEB_DIST_DIR;
const resolvedDistDir = configuredDistDir
  ? path.resolve(configuredDistDir)
  : fileURLToPath(new URL('web', import.meta.url));

// Serve any static file if it exists (Vite outputs assets under /assets and top-level index.html)
app.use('/*', serveStatic({ root: resolvedDistDir }));

// SPA fallback: for any other GET route that isn't handled above, serve index.html
// Keep this AFTER API routes so it doesn't shadow them
app.get('*', serveStatic({ root: resolvedDistDir, path: 'index.html' }));

if (import.meta.main) {
  const start = async () => {
    await runMigrations();
    await syncModels();
    console.log(`Server is running on port ${PORT}`);
    // biome-ignore lint/correctness/noUndeclaredVariables: Bun is declared
    Bun.serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' });
  };
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
