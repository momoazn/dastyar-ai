import { serve } from "bun";
import { createApp } from "./app";
import { ensureDirectoriesExist, env } from "./config";
import { initializeDatabase } from "./database";
import { logger } from "./lib/logger";

ensureDirectoriesExist();

await initializeDatabase();

const app = createApp();

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
  hostname: env.HOST,
  idleTimeout: 200,
});

logger.info(`Server listening on http://${server.hostname}:${server.port}`);
