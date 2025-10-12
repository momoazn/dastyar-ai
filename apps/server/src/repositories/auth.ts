import bcrypt from "bcryptjs";
import { prisma, type User, type UserRole } from "@/database";

/**
 * Finds a user by username
 * @param username - The username to search for
 * @returns The user record or null if not found
 */
export async function findUserByUsername(
  username: string
): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    return user;
  } catch (error) {
    console.error(`Failed to find user by username "${username}":`, error);
    throw new Error("Database error while finding user");
  }
}

/**
 * Finds a user by ID
 * @param id - The user ID to search for
 * @returns The user record or null if not found
 */
export async function findUserById(id: number): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user;
  } catch (error) {
    console.error(`Failed to find user by ID ${id}:`, error);
    throw new Error("Database error while finding user");
  }
}

/**
 * Creates a new user with hashed password
 * @param userData - User data including username, password, salt, and optional role
 * @returns The created user record
 */
export async function createUser(
  userData: Pick<User, "username" | "password" | "salt" | "role">
): Promise<User> {
  try {
    const user = await prisma.user.create({
      data: {
        ...userData,
        role: userData.role ?? ("user" as UserRole),
      },
    });

    return user;
  } catch (error) {
    console.error(`Failed to create user "${userData.username}":`, error);
    throw new Error("Failed to register user. Please try again.");
  }
}

/**
 * Checks if a username already exists
 * @param username - The username to check
 * @returns True if username exists, false otherwise
 */
export async function usernameExists(username: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    return user !== null;
  } catch (error) {
    console.error(
      `Failed to check username existence for "${username}":`,
      error
    );
    throw new Error("Database error while checking username");
  }
}

/**
 * Verifies user credentials (username and password)
 * @param username - The username to verify
 * @param password - The password to verify
 * @returns The user record if credentials are valid, null otherwise
 */
export async function verifyUserCredentials({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<User | null> {
  try {
    const user = await findUserByUsername(username);

    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return null;
    }

    return user;
  } catch (error) {
    console.error(`Failed to verify credentials for "${username}":`, error);
    throw new Error("Database error while verifying credentials");
  }
}

/**
 * Generates a salt for password hashing
 * @param rounds - Number of salt rounds (default: 12)
 * @returns The generated salt
 */
export async function generateSalt(rounds = 12): Promise<string> {
  return await bcrypt.genSalt(rounds);
}

/**
 * Hashes a password with the provided salt
 * @param password - The plain text password
 * @param salt - The salt to use for hashing
 * @returns The hashed password
 */
export async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  return await bcrypt.hash(password, salt);
}
