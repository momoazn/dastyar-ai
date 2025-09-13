import { existsSync } from 'node:fs';
import path from 'node:path';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env as HonoPinoEnv } from 'hono-pino';
import { config, isProduction } from './config';
import chatHandler from './routes/chat';
import imagesHandler from './routes/images';
import orpcHandler from './routes/rpc';

type Env = HonoPinoEnv & {
  Variables: {
    requestId: string;
  };
};

export function createApp() {
  const app = new Hono<Env>();

  // Logger middleware
  app.use(logger());

  // CORS middleware
  app.use(
    '/*',
    cors({
      origin: config.cors_origin,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
    })
  );

  // API routes
  app.route('/rpc', orpcHandler);
  app.route('/api/chat', chatHandler);
  app.route('/api/images', imagesHandler);

  // Static file serving
  const primaryDistDir = path.resolve(config.web_dist_dir);
  const execDir = path.dirname(process.execPath);
  const candidateDirs = Array.from(
    new Set([primaryDistDir, path.join(execDir, 'web')])
  );

  const staticRoot = candidateDirs.find((dir) => {
    try {
      return existsSync(dir) && existsSync(path.join(dir, 'index.html'));
    } catch {
      return false;
    }
  });

  if (staticRoot && isProduction()) {
    console.log(`Serving web assets from: ${staticRoot}`);
    app.use('/*', serveStatic({ root: staticRoot }));
    app.get('*', serveStatic({ root: staticRoot, path: 'index.html' }));
  } else {
    console.warn(
      `Web assets not found. Checked: ${candidateDirs.join(
        ', '
      )}. Set web_dist_dir in config.json or place a 'web' folder next to the binary.`
    );
    app.get('/', (c) =>
      c.text(
        'Web assets not found. Please build the web app and set web_dist_dir in config.json or place the web folder next to the binary.',
        200
      )
    );
  }

  return app;
}
