import { readFileSync } from "node:fs";
import { serve } from "bun";
import { createApp } from "./app";
import {
  ensureDirectoriesExist,
  env,
  isProduction,
  resolveConfiguredPath,
  validateProductionSecrets,
} from "./config";
import { initializeDatabase } from "./database";
import { logger } from "./lib/logger";
import {
  buildServerUrl,
  displayInitProgress,
  displayServerReady,
  displayStartupError,
  displayStartupInfo,
  getProtocol,
} from "./lib/startup";

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
 * Log detailed startup information to logger
 */
const logStartupInfo = (): void => {
  const mode = isProduction() ? "production" : "development";
  const bunVersion = typeof Bun !== "undefined" ? Bun.version : "unknown";

  logger.info("Server Starting", {
    mode,
    nodeEnv: process.env.NODE_ENV || "development",
    bunVersion,
    host: env.HOST,
    port: env.PORT,
    url: buildServerUrl(env.HOST, env.PORT),
    ssl: env.SSL_ENABLED,
    database: resolveConfiguredPath(env.DATABASE_FILE),
    images: resolveConfiguredPath(env.IMAGES_DIR),
    documents: resolveConfiguredPath(env.DOCUMENTS_DIR),
  });
};

/**
 * Start the server
 */
export async function startServer(): Promise<void> {
  try {
    displayStartupInfo();
    validateProductionSecrets();
    logStartupInfo();

    // Initialization steps with progress indicators
    process.stdout.write("🔄 Initializing server components...\n\n");

    displayInitProgress("Checking directories");
    ensureDirectoriesExist();
    displayInitProgress("", true);

    displayInitProgress("Setting up database");
    await initializeDatabase();
    displayInitProgress("", true);

    displayInitProgress("Creating application");
    const app = createApp();
    displayInitProgress("", true);

    const protocol = getProtocol().toUpperCase();
    displayInitProgress(`Starting ${protocol} server`);

    const sslCredentials = loadSSLCredentials();

    const server = serve({
      fetch: app.fetch,
      port: env.PORT,
      hostname: env.HOST,
      idleTimeout: 200,
      ...(sslCredentials && { tls: sslCredentials }),
    });

    displayInitProgress("", true);
    process.stdout.write("\n");

    const hostname = server.hostname ?? env.HOST;
    const port = server.port ?? env.PORT;
    const localUrl = buildServerUrl(hostname, port);
    const networkUrl = `${getProtocol()}://${hostname}:${port}`;

    displayServerReady(localUrl, networkUrl, env.HOST === "0.0.0.0");

    logger.info("Server ready", { url: networkUrl });
  } catch (error) {
    logger.fatal("Failed to start server", error);

    if (error instanceof Error) {
      displayStartupError(error);
    }

    process.exit(1);
  }
}
