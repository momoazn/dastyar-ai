import { eq } from "drizzle-orm";
import { db } from "../database";
import { users } from "../database/schema";
import { logger } from "../lib/logger";

const username = process.argv[2];

if (!username) {
  logger.error("Please provide a username: bun run make-admin <username>");
  process.exit(1);
}

async function makeUserAdmin() {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user) {
      logger.error(`User '${username}' not found.`);
      process.exit(1);
    }

    if (user.role === "admin") {
      logger.info(`User '${username}' is already an admin.`);
      process.exit(0);
    }

    await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));

    logger.info(`Successfully promoted user '${username}' to admin.`);
    process.exit(0);
  } catch (error) {
    logger.error("Error updating user role:", error);
    process.exit(1);
  }
}

makeUserAdmin();
