import bcrypt from "bcryptjs";
import { prisma, type User, type UserRole } from "@/database";

export type UserWithoutSensitiveData = Omit<User, "password" | "salt">;

export async function getAllUsers(): Promise<UserWithoutSensitiveData[]> {
  return await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function updateUserRole(
  userId: number,
  newRole: UserRole
): Promise<UserWithoutSensitiveData> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
}

export async function updateUserPassword(
  userId: number,
  newPassword: string
): Promise<{ success: boolean }> {
  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { success: true };
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function getUserById(
  userId: number
): Promise<UserWithoutSensitiveData | null> {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
