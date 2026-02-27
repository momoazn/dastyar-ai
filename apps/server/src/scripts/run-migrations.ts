import { runMigrations } from "@/database/migrate";
import { logger } from "@/lib/logger";

const main = async (): Promise<void> => {
  try {
    await runMigrations();
    logger.info("[migrate] Migration command completed");
    process.exit(0);
  } catch (error) {
    logger.error("[migrate] Migration command failed", error);
    process.exit(1);
  }
};

await main();
