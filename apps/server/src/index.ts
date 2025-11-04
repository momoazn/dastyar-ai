import { serve } from "bun";
import { createApp } from "./app";
import { ensureDirectoriesExist, env } from "./config";
import { initializeDatabase } from "./database";
import { logger } from "./lib/logger";

async function startServer() {
  try {
    // Direct stdout test - this proves process.stdout.write() works
    process.stdout.write(`[DEBUG] Binary: ${process.argv[0]}\n`);
    process.stdout.write("[INFO] Starting Dastyar AI Server...\n");

    logger.info("Starting Dastyar AI Server...");
    logger.info("Ensuring required directories exist...");
    ensureDirectoriesExist();

    logger.info("Initializing database...");
    await initializeDatabase();
    logger.info("Database initialized successfully");

    logger.info("Creating application...");
    const app = createApp();

    logger.info(`Starting HTTP server on ${env.HOST}:${env.PORT}...`);
    const server = serve({
      fetch: app.fetch,
      port: env.PORT,
      hostname: env.HOST,
      idleTimeout: 200,
    });

    logger.info(
      `🚀 Server listening on http://${server.hostname}:${server.port}`
    );
    logger.info("Server started successfully!");
  } catch (error) {
    logger.fatal("Failed to start server", error);

    if (error instanceof Error) {
      const errorCode = (error as { code?: string }).code;

      if (errorCode === "EADDRINUSE") {
        logger.error(
          `Port ${env.PORT} is already in use. Please either:`,
          undefined,
          {
            suggestions: [
              "Stop the service using that port",
              "Change PORT in config.json",
              `Use: lsof -ti:${env.PORT} | xargs kill -9`,
            ],
          }
        );
      } else if (errorCode === "EACCES") {
        logger.error(
          `Permission denied to bind to port ${env.PORT}. Try using a port >= 1024 or run with appropriate permissions.`
        );
      }
    }

    process.exit(1);
  }
}

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  logger.fatal("Uncaught exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.fatal("Unhandled promise rejection", reason, {
    promise: String(promise),
  });
  process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  logger.info("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

startServer();
