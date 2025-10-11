import jwt from "jsonwebtoken";
import { env } from "@/config";
import type { PrismaClient, User } from "@/database";

export type AuthResult = {
  success: boolean;
  user?: User;
  error?: {
    code: string;
    message: string;
  };
};

export type JwtPayload = {
  userId: number;
  username: string;
  role: string;
};

// JWT configuration constants
export const JWT_SECRET = env.JWT_SECRET;
export const JWT_EXPIRES_IN = "24h";

/**
 * Generates a JWT token for a user
 * @param user - The user object containing id, username, and role
 * @returns The signed JWT token
 */
export function generateJwtToken(user: {
  id: number;
  username: string;
  role: string;
}): string {
  return jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verifies and decodes a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded payload or throws an error
 */
export function verifyJwtToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * Internal helper function to validate JWT token and fetch user from database
 * @param token - The JWT token to validate
 * @param prisma - Database instance to verify user exists
 * @returns AuthResult with success status and user/error information
 */
export async function validateJwtToken(
  token: string,
  prisma: PrismaClient
): Promise<AuthResult> {
  try {
    const decoded = verifyJwtToken(token);

    // Fetch user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User not found",
        },
      };
    }

    return {
      success: true,
      user,
    };
  } catch {
    return {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid token",
      },
    };
  }
}

/**
 * Validates JWT token from Authorization header and returns user information
 * Use this for REQUIRED authentication (protected routes/procedures)
 * @param authHeader - The Authorization header value
 * @param prisma - Database instance to verify user exists
 * @returns AuthResult with success status and user/error information
 */
export async function validateAuthHeader(
  authHeader: string | undefined,
  prisma: PrismaClient
): Promise<AuthResult> {
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid authorization header",
      },
    };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  return await validateJwtToken(token, prisma);
}

/**
 * Validates JWT token from Authorization header for optional authentication
 * Returns success even if no token is provided (for optional auth scenarios)
 * Use this for OPTIONAL authentication (public routes that can benefit from user context)
 * @param authHeader - The Authorization header value
 * @param prisma - Database instance to verify user exists
 * @returns AuthResult with success status and user/error information
 */
export async function validateOptionalAuthHeader(
  authHeader: string | undefined,
  prisma: PrismaClient
): Promise<AuthResult> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { success: true }; // No token provided, but that's okay for optional auth
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const result = await validateJwtToken(token, prisma);

  // For optional auth, always return success even if token validation fails
  return {
    success: true,
    user: result.success ? result.user : undefined,
  };
}
