import { serve } from "bun";
import { createApp } from "./app";
import { ensureDirectoriesExist, env } from "./config";
import { initializeDatabase } from "./database";

ensureDirectoriesExist();

await initializeDatabase();

const app = createApp();

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
  hostname: env.HOST,
  idleTimeout: 200,
});

console.log(`Server listening on http://${server.hostname}:${server.port}`);
