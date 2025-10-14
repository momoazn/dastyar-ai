import bcrypt from "bcryptjs";
import { desc, eq } from "drizzle-orm";
import { db, type User, type UserRole, users } from "@/database";

export type UserWithoutSensitiveData = Omit<User, "password" | "salt">;

export async function getAllUsers(): Promise<UserWithoutSensitiveData[]> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return rows;
}

export async function updateUserRole(
  userId: number,
  newRole: UserRole
): Promise<UserWithoutSensitiveData> {
  await db
    .update(users)
    .set({
      role: newRole,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .run();

  const updatedUser = await getUserById(userId);
  if (!updatedUser) {
    throw new Error("User not found after role update");
  }
  return updatedUser;
}

export async function updateUserPassword(
  userId: number,
  newPassword: string
): Promise<{ success: boolean }> {
  const hashedPassword = await hashPassword(newPassword);

  await db
    .update(users)
    .set({
      password: hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .run();

  return { success: true };
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function getUserById(
  userId: number
): Promise<UserWithoutSensitiveData | null> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return rows.at(0) ?? null;
}
