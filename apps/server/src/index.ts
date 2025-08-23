import 'dotenv/config';

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import chatHandler from './chat/handler';
import { runMigrations } from './db/migrate';
import { getConfig } from './lib/config';
import { syncModels } from './lib/repository';
import orpcsHandler from './orpc/handler';

const cfg = getConfig();

const app = new Hono();

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

app.route('/rpc', orpcsHandler);
app.route('/chat', chatHandler);

const configuredDistDir = cfg.web.distDir;
const resolvedDistDir = configuredDistDir
  ? path.resolve(configuredDistDir)
  : fileURLToPath(new URL('web', import.meta.url));

app.use('/*', serveStatic({ root: resolvedDistDir }));

app.get('*', serveStatic({ root: resolvedDistDir, path: 'index.html' }));

if (import.meta.main) {
  const start = async () => {
    await runMigrations();
    await syncModels();
    console.log(`Server is running on http://localhost:${cfg.server.port}`);
    // biome-ignore lint/correctness/noUndeclaredVariables: Bun is declared
    Bun.serve({ fetch: app.fetch, port: cfg.server.port, hostname: '0.0.0.0' });
  };
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
