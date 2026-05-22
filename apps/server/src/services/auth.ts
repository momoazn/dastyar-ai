import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { env } from "@/config";
import type { User } from "@/database";
import { serverTexts } from "@/lib/texts";
import { findUserById } from "@/repositories/auth";

type FindUserById = typeof findUserById;

export type AuthResult = {
  success: boolean;
  user?: User;
  error?: {
    code: string;
    message: string;
  };
};

const AUTH_ERROR_MESSAGES = {
  tokenExpired: serverTexts.auth.tokenExpired,
  invalidToken: serverTexts.auth.invalidToken,
  missingAuthHeader: serverTexts.auth.missingAuthHeader,
  userNotFound: serverTexts.auth.userNotFound,
} as const;

export type JwtPayload = {
  userId: number;
  username: string;
  role: string;
};

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
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

/**
 * Verifies and decodes a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded payload or throws an error
 */
export function verifyJwtToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

/**
 * Internal helper function to validate JWT token and fetch user from database
 * @param token - The JWT token to validate
 * @returns AuthResult with success status and user/error information
 */
export async function validateJwtToken(
  token: string,
  findUser: FindUserById = findUserById
): Promise<AuthResult> {
  try {
    const decoded = verifyJwtToken(token);

    // Fetch user from database to ensure they still exist
    const user = await findUser(decoded.userId);

    if (!user) {
      return {
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: AUTH_ERROR_MESSAGES.userNotFound,
        },
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return {
        success: false,
        error: {
          code: "TOKEN_EXPIRED",
          message: AUTH_ERROR_MESSAGES.tokenExpired,
        },
      };
    }

    if (error instanceof JsonWebTokenError) {
      return {
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: AUTH_ERROR_MESSAGES.invalidToken,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: AUTH_ERROR_MESSAGES.invalidToken,
      },
    };
  }
}

/**
 * Validates JWT token from Authorization header and returns user information
 * Use this for REQUIRED authentication (protected routes/procedures)
 * @param authHeader - The Authorization header value
 * @returns AuthResult with success status and user/error information
 */
export async function validateAuthHeader(
  authHeader: string | undefined,
  findUser: FindUserById = findUserById
): Promise<AuthResult> {
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      success: false,
      error: {
        code: "MISSING_AUTH_HEADER",
        message: AUTH_ERROR_MESSAGES.missingAuthHeader,
      },
    };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  return await validateJwtToken(token, findUser);
}

/**
 * Validates JWT token from Authorization header for optional authentication
 * Returns success even if no token is provided (for optional auth scenarios)
 * Use this for OPTIONAL authentication (public routes that can benefit from user context)
 * @param authHeader - The Authorization header value
 * @returns AuthResult with success status and user/error information
 */
export async function validateOptionalAuthHeader(
  authHeader: string | undefined,
  findUser: FindUserById = findUserById
): Promise<AuthResult> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { success: true }; // No token provided, but that's okay for optional auth
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const result = await validateJwtToken(token, findUser);

  // For optional auth, always return success even if token validation fails
  return {
    success: true,
    user: result.success ? result.user : undefined,
  };
}
