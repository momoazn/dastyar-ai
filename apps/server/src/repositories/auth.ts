import bcrypt from "bcryptjs";
import { prisma, type User, type UserRole } from "@/database";

export async function findUserByUsername(
  username: string
): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { username },
  });
}

export async function findUserById(id: number): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id },
  });
}

export async function createUser(
  userData: Pick<User, "username" | "password" | "salt" | "role">
): Promise<User> {
  return await prisma.user.create({
    data: {
      ...userData,
      role: userData.role ?? ("user" as UserRole),
    },
  });
}

export async function usernameExists(username: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  return user !== null;
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
