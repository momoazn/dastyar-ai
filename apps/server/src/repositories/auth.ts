import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, type User, type UserRole, users } from "@/database";

export async function findUserByUsername(
  username: string
): Promise<User | null> {
  return await db.query.users.findFirst({
    where: eq(users.username, username),
  });
}

export async function findUserById(id: number): Promise<User | null> {
  return await db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export async function createUser(
  userData: Pick<User, "username" | "password" | "salt" | "role">
): Promise<User> {
  const result = await db
    .insert(users)
    .values({
      username: userData.username,
      password: userData.password,
      salt: userData.salt,
      role: userData.role ?? ("user" as UserRole),
    })
    .run();

  const created = await findUserById(Number(result.lastInsertRowid));
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
}): Promise<User | null> {
  const user = await findUserByUsername(username);
  if (!user) {
    console.warn(`[auth.verifyUserCredentials] User not found: ${username}`);
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  return isValidPassword ? user : null;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}
