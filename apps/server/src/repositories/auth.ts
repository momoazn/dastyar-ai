import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db, type SelectUser, type UserRole, users } from "@/database";
import { logger } from "@/lib/logger";

const DUMMY_HASH = bcrypt.hashSync("dummy-password", 12);

export class WrongPasswordError extends Error {
  constructor() {
    super("Current password is wrong");
    this.name = "WrongPasswordError";
  }
}

export class UsernameTakenError extends Error {
  constructor() {
    super("Username already taken");
    this.name = "UsernameTakenError";
  }
}

function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  const message = error instanceof Error ? error.message : "";
  return (
    code === "SQLITE_CONSTRAINT_UNIQUE" ||
    message.includes("UNIQUE constraint failed")
  );
}

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
  userData: Pick<SelectUser, "username" | "password" | "role">
): Promise<SelectUser> {
  let result: SelectUser[];
  try {
    result = await db
      .insert(users)
      .values({
        username: userData.username,
        password: userData.password,
        role: (userData.role as UserRole) ?? ("user" as UserRole),
      })
      .returning();
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new UsernameTakenError();
    }
    throw error;
  }

  const created = result[0];
  if (!created) {
    throw new Error("ایجاد کاربر ناموفق بود.");
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

export async function countUsers(): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  return result[0]?.count ?? 0;
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
    // Same bcrypt cost as a real check, so timing does not reveal the username.
    await bcrypt.compare(password, DUMMY_HASH);
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  return isValidPassword ? user : null;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function updateUsername(
  userId: number,
  newUsername: string
): Promise<SelectUser> {
  // Check if new username is already taken by another user
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, newUsername))
    .limit(1);

  if (existingUser.length > 0 && existingUser[0].id !== userId) {
    throw new UsernameTakenError();
  }

  let result: SelectUser[];
  try {
    result = await db
      .update(users)
      .set({ username: newUsername, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new UsernameTakenError();
    }
    throw error;
  }

  if (!result[0]) {
    throw new Error("به‌روزرسانی کد ملی ناموفق بود.");
  }

  logger.info("Username updated", { userId, newUsername });
  return result[0];
}

export async function updateUserPassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // Verify current password
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("کاربر یافت نشد.");
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    throw new WrongPasswordError();
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, userId));

  logger.info("Password updated", { userId });
}
