import { logger } from "./lib/logger";
import { displayFatalError, displayShutdown } from "./lib/startup";
import { startServer } from "./server";

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  displayFatalError("Uncaught Exception", error);
  logger.fatal("Uncaught exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  displayFatalError("Unhandled Promise Rejection", reason);
  logger.fatal("Unhandled promise rejection", reason);
  process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  displayShutdown();
  logger.info("Server stopped by user (SIGINT)");
  process.exit(0);
});

process.on("SIGTERM", () => {
  displayShutdown();
  logger.info("Server stopped (SIGTERM)");
  process.exit(0);
});

// Start the server
startServer();
