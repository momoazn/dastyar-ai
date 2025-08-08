import 'dotenv/config';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { runMigrations } from './db/migrate';
import chatHandler from './handlers/chat';
import orpcsHandler from './handlers/orpc';

const app = new Hono();

app.use(logger());
app.use(async (_c, next) => {
  // Ensure migrations are applied once per process
  await runMigrations();
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
