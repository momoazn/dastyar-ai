import { existsSync } from 'node:fs';
import path from 'node:path';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env as HonoPinoEnv } from 'hono-pino';
import { config, ensureDirectoriesExist } from './config';
import chatHandler from './routes/chat';
import imagesHandler from './routes/images';
import orpcsHandler from './routes/rpc';

export function createApp() {
  ensureDirectoriesExist();
  const app = new Hono<
    HonoPinoEnv & {
      Variables: {
        requestId: string;
      };
    }
  >();

  // Middleware
  // app.use(requestId());
  // app.use(
  //   pinoLogger({
  //     pino: pino({
  //       level: 'info',
  //       base: null,
  //       transport:
  //         process.env.NODE_ENV !== 'production'
  //           ? {
  //               target: 'pino-pretty',
  //               options: {
  //                 colorize: true,
  //                 translateTime: 'HH:MM:ss.l',
  //                 singleLine: false,
  //               },
  //             }
  //           : undefined,
  //     }),
  //     http: {
  //       referRequestIdKey: 'requestId',
  //     },
  //   })
  // );

  app.use(logger());

  app.use(
    '/*',
    cors({
      origin: config.CORS_ORIGIN,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
    })
  );

  // API routes
  app.route('/rpc', orpcsHandler);
  app.route('/api/chat', chatHandler);
  app.route('/api/images', imagesHandler);

  // Static file serving
  const resolvedDistDir = path.resolve(config.WEB_DIST_DIR);
  const hasWebAssets =
    existsSync(resolvedDistDir) &&
    existsSync(path.join(resolvedDistDir, 'index.html'));

  if (hasWebAssets) {
    app.use('/*', serveStatic({ root: resolvedDistDir }));
    app.get('*', serveStatic({ root: resolvedDistDir, path: 'index.html' }));
  } else {
    console.warn(
      `Web assets not found. Expected at ${resolvedDistDir}. Set WEB_DIST_DIR in config.json or place the 'web' folder next to the binary.`
    );
    app.get('/', (c) =>
      c.text(
        'Web assets not found. Please build the web app and set WEB_DIST_DIR in config.json or place the web folder next to the binary.',
        200
      )
    );
  }

  return { app, env: config };
}
