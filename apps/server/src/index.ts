import 'dotenv/config';

import { createApp } from './app';
import { config, ensureDirectoriesExist, isProduction } from './config';
import { runMigrations } from './database/migrate';

const start = async () => {
  console.log('Running app in', isProduction() ? 'production' : 'development');

  try {
    await runMigrations();
    console.log('Migrations run successfully');
  } catch (error) {
    console.error('Failed to run migrations:', error);
    process.exit(1);
  }

  try {
    ensureDirectoriesExist();
  } catch (error) {
    console.error('Failed to ensure directories exist:', error);
    process.exit(1);
  }

  const app = createApp();

  console.log(`Server starting on ${config.HOST}:${config.PORT}`);
  // biome-ignore lint/correctness/noUndeclaredVariables: Bun is declared
  Bun.serve({
    fetch: app.fetch,
    port: config.PORT,
    hostname: config.HOST,
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
