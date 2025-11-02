import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, type SelectUser, type UserRole, users } from "@/database";
import { logger } from "@/lib/logger";

export async function findUserByUsername(
  username: string
): Promise<SelectUser | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  return user ?? null;
}

export async function findUserById(id: number): Promise<SelectUser | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  return user ?? null;
}

export async function createUser(
  userData: Pick<SelectUser, "username" | "password" | "salt" | "role">
): Promise<SelectUser> {
  const result = await db
    .insert(users)
    .values({
      username: userData.username,
      password: userData.password,
      salt: userData.salt,
      role: (userData.role as UserRole) ?? ("user" as UserRole),
    })
    .returning();

  const created = await findUserById(Number(result.at(0)?.id));
  if (!created) {
    throw new Error("Unable to create user");
  }
  return created;
}

export async function usernameExists(username: string): Promise<boolean> {
  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return user.length > 0;
}

export async function verifyUserCredentials({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<SelectUser | null> {
  const user = await findUserByUsername(username);
  if (!user) {
    logger.warn("User not found during credential verification", {
      username,
      function: "verifyUserCredentials",
    });
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  return isValidPassword ? user : null;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}
