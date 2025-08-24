import 'dotenv/config';

import { createApp } from './app';
import { runMigrations } from './database/migrate';
import { createLogger } from './lib/logger';
import { syncModels } from './services/model-sync';

if (import.meta.main) {
  const start = async () => {
    const log = createLogger();
    await runMigrations();
    await syncModels();

    const { app, config } = createApp();
    const { host, port } = config.server;

    log.info({ host, port }, 'Server starting');
    // biome-ignore lint/correctness/noUndeclaredVariables: Bun is declared
    Bun.serve({
      fetch: app.fetch,
      port,
      hostname: host,
    });
  };

  start().catch((err) => {
    const log = createLogger();
    log.fatal({ err }, 'Failed to start server');
    process.exit(1);
  });
}
