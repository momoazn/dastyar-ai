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
  const mode = isProduction() ? "PRODUCTION" : "DEVELOPMENT";
  const modeEmoji = isProduction() ? "🏭" : "🔧";

  process.stdout.write(`\n${SEPARATOR}\n`);
  process.stdout.write(`🚀 Dastyar AI Server ${modeEmoji} ${mode} MODE\n`);
  process.stdout.write(`${SEPARATOR}\n\n`);

  // Configuration section
  process.stdout.write("📋 Configuration:\n");
  process.stdout.write(
    `   Config File: ${configFilePath ?? "using defaults"}\n`
  );
  process.stdout.write(
    `   Environment: ${process.env.NODE_ENV || "development"}\n`
  );
  process.stdout.write(
    `   Bun Version: ${typeof Bun !== "undefined" ? Bun.version : "unknown"}\n\n`
  );

  // Server section
  process.stdout.write("🌐 Server:\n");
  process.stdout.write(`   Host: ${env.HOST}\n`);
  process.stdout.write(`   Port: ${env.PORT}\n`);
  process.stdout.write(`   URL:  ${buildServerUrl(env.HOST, env.PORT)}\n`);
  process.stdout.write(
    `   SSL:  ${env.SSL_ENABLED ? "✅ Enabled" : "⚠️  Disabled"}\n\n`
  );

  // Storage section
  process.stdout.write("💾 Storage:\n");
  process.stdout.write(`   Database:  ${env.DATABASE_FILE}\n`);
  process.stdout.write(`   Images:    ${env.IMAGES_DIR}\n`);
  process.stdout.write(`   Documents: ${env.DOCUMENTS_DIR}\n\n`);

  // AI Services section
  process.stdout.write("🤖 AI Services:\n");
  if (env.OLLAMA_ENABLED) {
    process.stdout.write(`   ✅ Ollama (${env.OLLAMA_BASE_URL})\n`);
  }
  if (env.LMSTUDIO_ENABLED) {
    process.stdout.write(`   ✅ LM Studio (${env.LMSTUDIO_BASE_URL})\n`);
  }
  if (env.GROQ_ENABLED) {
    process.stdout.write("   ✅ Groq\n");
  }
  if (env.GEMINI_ENABLED) {
    process.stdout.write("   ✅ Gemini\n");
  }
  if (env.STABLE_DIFFUSION_ENABLED) {
    process.stdout.write(
      `   ✅ Stable Diffusion (${env.STABLE_DIFFUSION_URL})\n`
    );
  }
  if (enabledServices.length === 0) {
    process.stdout.write("   ⚠️  No AI services enabled\n");
  }

  // Whisper section
  process.stdout.write("\n🎙️  Whisper:\n");
  process.stdout.write(`   Server: ${env.WHISPER_SERVER_URL}\n`);
  process.stdout.write(`   Models: ${env.WHISPER_MODELS}\n`);

  process.stdout.write(`\n${SEPARATOR}\n\n`);
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

    // Initialization steps with progress indicators
    process.stdout.write("🔄 Initializing server components...\n\n");

    process.stdout.write("   ⏳ Checking directories...");
    ensureDirectoriesExist();
    process.stdout.write(" ✅\n");

    process.stdout.write("   ⏳ Setting up database...");
    await initializeDatabase();
    process.stdout.write(" ✅\n");

    process.stdout.write("   ⏳ Creating application...");
    const app = createApp();
    process.stdout.write(" ✅\n");

    const protocol = getProtocol().toUpperCase();
    process.stdout.write(`   ⏳ Starting ${protocol} server...`);

    const sslCredentials = loadSSLCredentials();

    const server = serve({
      fetch: app.fetch,
      port: env.PORT,
      hostname: env.HOST,
      idleTimeout: 200,
      ...(sslCredentials && { tls: sslCredentials }),
    });

    process.stdout.write(" ✅\n\n");

    const hostname = server.hostname ?? env.HOST;
    const port = server.port ?? env.PORT;
    const localUrl = buildServerUrl(hostname, port);
    const networkUrl = `${getProtocol()}://${hostname}:${port}`;

    // Success message
    process.stdout.write(`${SEPARATOR}\n`);
    process.stdout.write("✅ SERVER READY!\n");
    process.stdout.write(`${SEPARATOR}\n\n`);
    process.stdout.write("🌐 Access your server at:\n");
    process.stdout.write(`   Local:   ${localUrl}\n`);
    if (env.HOST === "0.0.0.0") {
      process.stdout.write(`   Network: ${networkUrl}\n`);
    }
    process.stdout.write("\n💡 Tips:\n");
    process.stdout.write("   • Press Ctrl+C to stop the server\n");
    process.stdout.write("   • Edit config.json to change settings\n");
    if (!env.SSL_ENABLED && isProduction()) {
      process.stdout.write("   ⚠️  Enable SSL in production for security\n");
    }
    process.stdout.write(`\n${SEPARATOR}\n\n`);

    logger.info("Server ready", { url: networkUrl });
  } catch (error) {
    process.stdout.write("\n");
    logger.fatal("Failed to start server", error);

    process.stderr.write(`\n${SEPARATOR}\n`);
    process.stderr.write("❌ SERVER STARTUP FAILED\n");
    process.stderr.write(`${SEPARATOR}\n\n`);

    if (error instanceof Error) {
      const errorCode = (error as { code?: string }).code;

      switch (errorCode) {
        case "EADDRINUSE":
          process.stderr.write(`🔴 Port ${env.PORT} is already in use\n\n`);
          process.stderr.write("💡 Solutions:\n");
          process.stderr.write("   1. Stop the service using that port\n");
          process.stderr.write(
            "   2. Change PORT in config.json to another port\n"
          );
          process.stderr.write(
            `   3. Kill the process: lsof -ti:${env.PORT} | xargs kill -9\n`
          );
          break;
        case "EACCES":
          process.stderr.write(`🔴 Permission denied for port ${env.PORT}\n\n`);
          process.stderr.write("💡 Solutions:\n");
          process.stderr.write("   1. Use a port >= 1024 (recommended)\n");
          process.stderr.write("   2. Run with sudo (not recommended)\n");
          break;
        case "ENOENT":
          if (env.SSL_ENABLED) {
            process.stderr.write("🔴 SSL certificate files not found\n\n");
            process.stderr.write("💡 Check these paths:\n");
            process.stderr.write(`   Certificate: ${env.SSL_CERT_PATH}\n`);
            process.stderr.write(`   Private Key: ${env.SSL_KEY_PATH}\n\n`);
            process.stderr.write(
              "   Make sure both files exist and are readable\n"
            );
          } else {
            process.stderr.write(`🔴 File not found: ${error.message}\n`);
          }
          break;
        default:
          process.stderr.write(`🔴 ${error.message}\n\n`);
          if (error.stack) {
            process.stderr.write("📋 Stack trace:\n");
            process.stderr.write(`${error.stack}\n`);
          }
          break;
      }

      process.stderr.write(`\n${SEPARATOR}\n\n`);
    }

    process.exit(1);
  }
}

// Handle uncaught errors and graceful shutdown
process.on("uncaughtException", (error) => {
  process.stderr.write("\n\n❌ FATAL: Uncaught Exception\n");
  process.stderr.write(`${SEPARATOR}\n`);
  logger.fatal("Uncaught exception", error);
  process.stderr.write(`\n${error.message}\n`);
  if (error.stack) {
    process.stderr.write(`\n${error.stack}\n`);
  }
  process.stderr.write(`${SEPARATOR}\n\n`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  process.stderr.write("\n\n❌ FATAL: Unhandled Promise Rejection\n");
  process.stderr.write(`${SEPARATOR}\n`);
  logger.fatal("Unhandled promise rejection", reason);
  process.stderr.write(`\n${String(reason)}\n`);
  process.stderr.write(`${SEPARATOR}\n\n`);
  process.exit(1);
});

process.on("SIGINT", () => {
  process.stdout.write("\n\n");
  process.stdout.write(`${SEPARATOR}\n`);
  process.stdout.write("👋 Shutting down gracefully...\n");
  process.stdout.write(`${SEPARATOR}\n\n`);
  logger.info("Server stopped by user (SIGINT)");
  process.exit(0);
});

process.on("SIGTERM", () => {
  process.stdout.write("\n\n");
  process.stdout.write(`${SEPARATOR}\n`);
  process.stdout.write("👋 Shutting down gracefully...\n");
  process.stdout.write(`${SEPARATOR}\n\n`);
  logger.info("Server stopped (SIGTERM)");
  process.exit(0);
});

startServer();
