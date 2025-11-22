import { readFileSync } from "node:fs";
import { serve } from "bun";
import { createApp } from "./app";
import {
  configFilePath,
  ensureDirectoriesExist,
  env,
  isProduction,
  resolveConfiguredPath,
  validateProductionSecrets,
} from "./config";
import { initializeDatabase } from "./database";
import { logger } from "./lib/logger";

const SEPARATOR = "═".repeat(60);

/**
 * Get the protocol (http or https) based on SSL configuration
 */
const getProtocol = (): string => (env.SSL_ENABLED ? "https" : "http");

/**
 * Build server URL with appropriate protocol and hostname
 */
const buildServerUrl = (hostname: string, port: number): string => {
  const protocol = getProtocol();
  const host = hostname === "0.0.0.0" ? "localhost" : hostname;
  return `${protocol}://${host}:${port}`;
};

/**
 * Get list of enabled AI services
 */
const getEnabledServices = (): string[] => {
  const services: string[] = [];
  if (env.OLLAMA_ENABLED) services.push("Ollama");
  if (env.LMSTUDIO_ENABLED) services.push("LM Studio");
  if (env.GROQ_ENABLED) services.push("Groq");
  if (env.GEMINI_ENABLED) services.push("Gemini");
  if (env.STABLE_DIFFUSION_ENABLED) services.push("Stable Diffusion");
  return services;
};

/**
 * Load SSL certificate and key files
 */
const loadSSLCredentials = (): { cert: string; key: string } | undefined => {
  if (!env.SSL_ENABLED) {
    return;
  }

  const certPath = resolveConfiguredPath(env.SSL_CERT_PATH);
  const keyPath = resolveConfiguredPath(env.SSL_KEY_PATH);

  logger.info("Loading SSL certificates...", { certPath, keyPath });

  const cert = readFileSync(certPath, "utf8");
  const key = readFileSync(keyPath, "utf8");

  logger.info("SSL certificates loaded successfully");
  return { cert, key };
};

/**
 * Display startup configuration
 */
const displayStartupInfo = (): void => {
  const enabledServices = getEnabledServices();

  process.stdout.write(`\n${SEPARATOR}\n`);
  process.stdout.write("🚀 Dastyar AI Server - Starting\n");
  process.stdout.write(`${SEPARATOR}\n`);

  process.stdout.write(`📄 Config: ${configFilePath ?? "defaults"}\n`);
  process.stdout.write(`🌐 Host: ${env.HOST}\n`);
  process.stdout.write(`🔌 Port: ${env.PORT}\n`);
  process.stdout.write(`🔗 URL: ${buildServerUrl(env.HOST, env.PORT)}\n`);

  if (env.SSL_ENABLED) {
    process.stdout.write("🔒 SSL: Enabled\n");
  }

  process.stdout.write(`💾 Database: ${env.DATABASE_FILE}\n`);

  if (enabledServices.length > 0) {
    process.stdout.write(`🤖 AI Services: ${enabledServices.join(", ")}\n`);
  }

  process.stdout.write(`${SEPARATOR}\n\n`);
};

/**
 * Log detailed startup information to logger
 */
const logStartupInfo = (): void => {
  const mode = isProduction() ? "production" : "development";
  const bunVersion = typeof Bun !== "undefined" ? Bun.version : "unknown";
  const enabledServices = getEnabledServices();

  logger.info(SEPARATOR);
  logger.info("Server Starting");
  logger.info(SEPARATOR);
  logger.info("Environment", {
    mode,
    nodeEnv: process.env.NODE_ENV || "development",
    bunVersion,
  });
  logger.info("Configuration", {
    host: env.HOST,
    port: env.PORT,
    url: buildServerUrl(env.HOST, env.PORT),
    ssl: env.SSL_ENABLED,
    database: resolveConfiguredPath(env.DATABASE_FILE),
    images: resolveConfiguredPath(env.IMAGES_DIR),
    documents: resolveConfiguredPath(env.DOCUMENTS_DIR),
  });
  logger.info("AI Services", {
    enabled: enabledServices.length > 0 ? enabledServices.join(", ") : "none",
    whisper: env.WHISPER_SERVER_URL,
    models: env.WHISPER_MODELS,
  });
  logger.info(SEPARATOR);
};

async function startServer() {
  try {
    displayStartupInfo();
    validateProductionSecrets();
    logStartupInfo();

    logger.info("Ensuring required directories exist...");
    ensureDirectoriesExist();

    logger.info("Initializing database...");
    await initializeDatabase();

    logger.info("Creating application...");
    const app = createApp();

    const protocol = getProtocol().toUpperCase();
    logger.info(`Starting ${protocol} server on ${env.HOST}:${env.PORT}...`);

    const sslCredentials = loadSSLCredentials();

    const server = serve({
      fetch: app.fetch,
      port: env.PORT,
      hostname: env.HOST,
      idleTimeout: 200,
      ...(sslCredentials && { tls: sslCredentials }),
    });

    const hostname = server.hostname ?? env.HOST;
    const port = server.port ?? env.PORT;
    const localUrl = buildServerUrl(hostname, port);
    const networkUrl = `${getProtocol()}://${hostname}:${port}`;

    process.stdout.write(`\n${SEPARATOR}\n`);
    process.stdout.write("✅ Server is running!\n");
    process.stdout.write(`🌐 Local: ${localUrl}\n`);
    process.stdout.write(`📡 Network: ${networkUrl}\n`);
    process.stdout.write(`${SEPARATOR}\n\n`);

    logger.info(SEPARATOR);
    logger.info(`✅ Server listening on ${networkUrl}`);
    logger.info(SEPARATOR);
  } catch (error) {
    logger.fatal("Failed to start server", error);

    if (error instanceof Error) {
      const errorCode = (error as { code?: string }).code;

      switch (errorCode) {
        case "EADDRINUSE":
          console.error(`\n❌ Port ${env.PORT} is already in use`);
          console.error("   - Stop the service using that port");
          console.error("   - Change PORT in config.json");
          console.error(
            `   - Kill the process: lsof -ti:${env.PORT} | xargs kill -9\n`
          );
          break;
        case "EACCES":
          console.error(`\n❌ Permission denied for port ${env.PORT}`);
          console.error("   - Use a port >= 1024");
          console.error("   - Run with appropriate permissions\n");
          break;
        case "ENOENT":
          if (env.SSL_ENABLED) {
            console.error("\n❌ SSL certificate files not found");
            console.error(`   - Check SSL_CERT_PATH: ${env.SSL_CERT_PATH}`);
            console.error(`   - Check SSL_KEY_PATH: ${env.SSL_KEY_PATH}\n`);
          }
          break;
        default:
          console.error(`\n❌ Server startup failed: ${error.message}\n`);
          break;
      }
    }

    process.exit(1);
  }
}

// Handle uncaught errors and graceful shutdown
process.on("uncaughtException", (error) => {
  logger.fatal("Uncaught exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal("Unhandled promise rejection", reason);
  process.exit(1);
});

process.on("SIGINT", () => {
  logger.info("Shutting down gracefully (SIGINT)");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Shutting down gracefully (SIGTERM)");
  process.exit(0);
});

startServer();
