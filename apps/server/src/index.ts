import 'dotenv/config';

import { createApp } from './app';
import { runMigrations } from './database/migrate';
import { syncModels } from './services/model-sync';

if (import.meta.main) {
  const start = async () => {
    await runMigrations();
    await syncModels();
    
    const { app, config } = createApp();
    
    console.log(`Server is running on http://localhost:${config.server.port}`);
    // biome-ignore lint/correctness/noUndeclaredVariables: Bun is declared
    Bun.serve({ fetch: app.fetch, port: config.server.port, hostname: '0.0.0.0' });
  };
  
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
