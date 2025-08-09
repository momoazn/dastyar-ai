import 'dotenv/config';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { runMigrations } from './db/migrate';
import chatHandler from './handlers/chat';
import orpcsHandler from './handlers/orpc';
import { syncModels } from './lib/repository';

const app = new Hono();

await runMigrations();
await syncModels();

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

app.get('/', (c) => {
  return c.text('OK');
});

export default app;

if (import.meta.main) {
  const port = Number(process.env.PORT) || 8787;
  // biome-ignore lint/correctness/noUndeclaredVariables: Bun is declared
  Bun.serve({ fetch: app.fetch, port, hostname: '0.0.0.0' });
}
