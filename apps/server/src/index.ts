import { serve } from "bun";
import { createApp } from "./app";
import {
  ensureDirectoriesExist,
  env,
  isProduction,
  resolveConfiguredPath,
} from "./config";
import { initializeDatabase } from "./database";
import { logger } from "./lib/logger";

// Config already loaded and logged above, now starting server initialization

function getEnabledServices(): string[] {
  const services: string[] = [];
  if (env.OLLAMA_ENABLED) services.push("Ollama");
  if (env.LMSTUDIO_ENABLED) services.push("LM Studio");
  if (env.GROQ_ENABLED) services.push("Groq");
  if (env.GEMINI_ENABLED) services.push("Gemini");
  if (env.STABLE_DIFFUSION_ENABLED) services.push("Stable Diffusion");
  return services;
}

function logStartupInfo(): void {
  const mode = isProduction() ? "production" : "development";
  const bunVersion = typeof Bun !== "undefined" ? Bun.version : "unknown";
  const enabledServices = getEnabledServices();

  logger.info("=".repeat(60));
  logger.info("🚀 Dastyar AI Server Starting");
  logger.info("=".repeat(60));
  logger.info("Environment", {
    mode,
    nodeEnv: process.env.NODE_ENV || "development",
    bunVersion,
  });
  logger.info("Server Configuration", {
    host: env.HOST,
    port: env.PORT,
    url: `http://${env.HOST}:${env.PORT}`,
  });
  logger.info("Database", {
    path: resolveConfiguredPath(env.DATABASE_FILE),
  });
  logger.info("Directories", {
    images: resolveConfiguredPath(env.IMAGES_DIR),
    documents: resolveConfiguredPath(env.DOCUMENTS_DIR),
  });
  logger.info("AI Services", {
    enabled: enabledServices.length > 0 ? enabledServices.join(", ") : "none",
    whisper: env.WHISPER_SERVER_URL,
    whisperModels: env.WHISPER_MODELS,
  });
  logger.info("=".repeat(60));
}

async function startServer() {
  try {
    // Write immediate status before detailed logs
    process.stdout.write("📦 Initializing server components...\n");
    logStartupInfo();

    logger.info("Ensuring required directories exist...");
    ensureDirectoriesExist();
    logger.info("Directories verified");

    logger.info("Initializing database...");
    await initializeDatabase();
    logger.info("Database initialized successfully");

    logger.info("Creating application...");
    const app = createApp();
    logger.info("Application created");

    logger.info(`Starting HTTP server on ${env.HOST}:${env.PORT}...`);
    const server = serve({
      fetch: app.fetch,
      port: env.PORT,
      hostname: env.HOST,
      idleTimeout: 200,
    });

    // Write immediate success message
    const serverUrl = `http://${server.hostname === "0.0.0.0" ? "localhost" : server.hostname}:${server.port}`;
    const networkUrl = `http://${server.hostname}:${server.port}`;
    process.stdout.write("\n");
    process.stdout.write(
      "═══════════════════════════════════════════════════════════\n"
    );
    process.stdout.write("✅ Server is running!\n");
    process.stdout.write(`🌐 Listening on: ${serverUrl}\n`);
    process.stdout.write(`📡 Network: ${networkUrl}\n`);
    process.stdout.write(
      "═══════════════════════════════════════════════════════════\n"
    );
    process.stdout.write("\n");

    logger.info("=".repeat(60));
    logger.info(
      `✅ Server listening on http://${server.hostname}:${server.port}`
    );
    logger.info("=".repeat(60));
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
