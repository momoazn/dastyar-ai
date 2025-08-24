import 'dotenv/config';

import { createApp } from './app';
import { runMigrations } from './database/migrate';
import { syncModels } from './services/model-sync';

if (import.meta.main) {
  const start = async () => {
    await runMigrations();
    await syncModels();

    const { app, config } = createApp();
    const { host, port } = config.server;

    console.log(`🚀 Server is running on http://${host}:${port}`);
    // biome-ignore lint/correctness/noUndeclaredVariables: Bun is declared
    Bun.serve({
      fetch: app.fetch,
      port,
      hostname: host,
    });
  };

  start().catch((err) => {
    console.error('💥 Failed to start server:', err);
    process.exit(1);
  });
}
