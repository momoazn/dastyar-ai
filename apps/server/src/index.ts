import 'dotenv/config';

import { createApp } from './app';
import { runMigrations } from './database/migrate';

const start = async () => {
  try {
    await runMigrations();
    console.log('Migrations run successfully');
  } catch (error) {
    console.error('Failed to run migrations:', error);
    process.exit(1);
  }

  const { app, config } = createApp();
  const { host, port } = config.server;

  console.log(`Server starting on ${host}:${port}`);
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
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
