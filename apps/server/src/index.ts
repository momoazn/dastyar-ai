import { serve } from "bun";
import { createApp } from "./app";
import { ensureDirectoriesExist, env, isProduction } from "./config";
import { initializeDatabase } from "./database";

ensureDirectoriesExist();

initializeDatabase();

console.log("Running app in", isProduction() ? "production" : "development");

const app = createApp();

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
  hostname: env.HOST,
});

console.log(`Server listening on http://${server.hostname}:${server.port}`);
