import 'dotenv/config';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env as transformersEnv } from '@huggingface/transformers';
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

// Configure Transformers.js to load local models in both prod (binary) and dev
try {
  const execDir = path.dirname(process.execPath);
  const srcDir = path.dirname(fileURLToPath(import.meta.url)); // apps/server/src
  const serverRoot = path.resolve(srcDir, '..'); // apps/server
  const repoRoot = path.resolve(serverRoot, '..'); // apps
  const workspaceRoot = path.resolve(repoRoot, '..'); // project root

  const modelCandidates = [
    process.env.MODELS_DIR,
    path.join(execDir, 'whisper-models'), // prod default (next to binary)
    path.join(serverRoot, 'whisper-models'), // apps/server/whisper-models
    path.join(workspaceRoot, 'whisper-models'), // repo-level
    path.join(process.cwd(), 'whisper-models'), // cwd
  ].filter(Boolean) as string[];

  const modelsDir =
    modelCandidates.find((p) => fs.existsSync(p)) || modelCandidates[0];

  const cacheDir =
    process.env.TRANSFORMERS_CACHE ||
    (process.env.NODE_ENV === 'production'
      ? path.join(execDir, '.whisper-cache') // prod default
      : path.join(workspaceRoot, '.whisper-cache'));

  transformersEnv.localModelPath = modelsDir;
  transformersEnv.cacheDir = cacheDir;

  // Allow remote model fetches in dev if local models are missing
  if (process.env.NODE_ENV !== 'production') {
    transformersEnv.allowRemoteModels = true;
  }
} catch {
  // ignore configuration errors
}

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
