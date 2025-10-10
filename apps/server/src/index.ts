import 'dotenv/config';

import { createApp } from './app';
import { config, ensureDirectoriesExist, isProduction } from './config';

const start = async () => {
  console.log('Running app in', isProduction() ? 'production' : 'development');

  // Database is managed by Prisma db push

  try {
    ensureDirectoriesExist();
  } catch (error) {
    console.error('Failed to ensure directories exist:', error);
    process.exit(1);
  }

  const app = createApp();

  console.log(`Server starting on ${config.host}:${config.port}`);
  // biome-ignore lint/correctness/noUndeclaredVariables: Bun is declared
  Bun.serve({
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
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
