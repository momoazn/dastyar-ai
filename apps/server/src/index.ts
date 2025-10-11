import "dotenv/config";

import { createApp } from "./app";
import { ensureDirectoriesExist, env, isProduction } from "./config";

function start() {
  console.log("Running app in", isProduction() ? "production" : "development");

  try {
    ensureDirectoriesExist();
  } catch (error) {
    console.error("Failed to ensure directories exist:", error);
    process.exit(1);
  }

  const app = createApp();

  console.log(`Server starting on ${env.HOST}:${env.PORT}`);
  // biome-ignore lint/correctness/noUndeclaredVariables: Bun is declared
  Bun.serve({
    fetch: app.fetch,
    port: env.PORT,
    hostname: env.HOST,
  });
  console.log("Server started");
}

start();
