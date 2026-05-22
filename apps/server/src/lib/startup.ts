import { configFilePath, env, isProduction } from "../config";

const SEPARATOR = "═".repeat(60);

/**
 * Get the protocol (http or https) based on SSL configuration
 */
export const getProtocol = (): string => (env.SSL_ENABLED ? "https" : "http");

/**
 * Build server URL with appropriate protocol and hostname
 */
export const buildServerUrl = (hostname: string, port: number): string => {
  const protocol = getProtocol();
  const host = hostname === "0.0.0.0" ? "localhost" : hostname;
  return `${protocol}://${host}:${port}`;
};

/**
 * Get list of enabled AI services
 */
export const getEnabledServices = (): string[] => {
  const services: string[] = [];
  if (env.OLLAMA_ENABLED) services.push("Ollama");
  return services;
};

/**
 * Display startup configuration to console
 */
export const displayStartupInfo = (): void => {
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
  process.stdout.write(`   Runtime Mode: ${mode}\n`);
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
 * Display initialization progress
 */
export const displayInitProgress = (step: string, done = false): void => {
  if (done) {
    process.stdout.write(" ✅\n");
  } else {
    process.stdout.write(`   ⏳ ${step}...`);
  }
};

/**
 * Display server ready message
 */
export const displayServerReady = (
  localUrl: string,
  networkUrl: string,
  showNetwork: boolean
): void => {
  process.stdout.write(`${SEPARATOR}\n`);
  process.stdout.write("✅ SERVER READY!\n");
  process.stdout.write(`${SEPARATOR}\n\n`);
  process.stdout.write("🌐 Access your server at:\n");
  process.stdout.write(`   Local:   ${localUrl}\n`);
  if (showNetwork) {
    process.stdout.write(`   Network: ${networkUrl}\n`);
  }
  process.stdout.write("\n💡 Tips:\n");
  process.stdout.write("   • Press Ctrl+C to stop the server\n");
  process.stdout.write("   • Edit config.json to change settings\n");
  if (!env.SSL_ENABLED && isProduction()) {
    process.stdout.write("   ⚠️  Enable SSL in production for security\n");
  }
  process.stdout.write(`\n${SEPARATOR}\n\n`);
};

/**
 * Display startup error
 */
export const displayStartupError = (error: Error): void => {
  process.stdout.write("\n");

  process.stderr.write(`\n${SEPARATOR}\n`);
  process.stderr.write("❌ SERVER STARTUP FAILED\n");
  process.stderr.write(`${SEPARATOR}\n\n`);

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
};

/**
 * Display fatal error
 */
export const displayFatalError = (
  title: string,
  error: Error | unknown
): void => {
  process.stderr.write(`\n\n❌ FATAL: ${title}\n`);
  process.stderr.write(`${SEPARATOR}\n`);

  if (error instanceof Error) {
    process.stderr.write(`\n${error.message}\n`);
    if (error.stack) {
      process.stderr.write(`\n${error.stack}\n`);
    }
  } else {
    process.stderr.write(`\n${String(error)}\n`);
  }

  process.stderr.write(`${SEPARATOR}\n\n`);
};

/**
 * Display shutdown message
 */
export const displayShutdown = (): void => {
  process.stdout.write("\n\n");
  process.stdout.write(`${SEPARATOR}\n`);
  process.stdout.write("👋 Shutting down gracefully...\n");
  process.stdout.write(`${SEPARATOR}\n\n`);
};
