import 'dotenv/config';

import { createApp } from './app';
import { runMigrations } from './database/migrate';
import { createLogger } from './lib/logger';
import { syncModels } from './services/model-sync';

const start = async () => {
  const log = createLogger();
  try {
    await runMigrations();
    console.log('Migrations run successfully');
  } catch (error) {
    log.error({ error }, 'Failed to run migrations');
    process.exit(1);
  }

  try {
    await syncModels();
    console.log('Models synced successfully');
  } catch (error) {
    log.error({ error }, 'Failed to sync models');
    process.exit(1);
  }

  const { app, config } = createApp();
  const { host, port } = config.server;

  log.info({ host, port }, 'Server starting');
  // biome-ignore lint/correctness/noUndeclaredVariables: Bun is declared
  Bun.serve({
    fetch: app.fetch,
    port,
    hostname: host,
  });
  console.log('Server started');
};

if (import.meta.main) {
  console.log('Starting server');
  start().catch((err) => {
    const log = createLogger();
    log.fatal({ err }, 'Failed to start server');
    console.error('======> error in start', err);
    process.exit(1);
  });
}
