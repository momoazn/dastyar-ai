import { eq } from "drizzle-orm";
import { db } from "../database";
import { users } from "../database/schema";

const username = process.argv[2];

if (!username) {
  console.error(
    "Please provide a username: bun run src/scripts/make-user-admin.ts <username>"
  );
  process.exit(1);
}

async function makeUserAdmin() {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user) {
      console.error(`User '${username}' not found.`);
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`User '${username}' is already an admin.`);
      process.exit(0);
    }

    await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));

    console.log(`Successfully promoted user '${username}' to admin.`);
    process.exit(0);
  } catch (error) {
    console.error("Error updating user role:", error);
    process.exit(1);
  }
}

makeUserAdmin();
