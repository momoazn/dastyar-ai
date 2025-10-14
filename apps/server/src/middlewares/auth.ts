import type { Context } from "hono";
import type { User } from "@/database";
import { validateAuthHeader, validateJwtToken } from "@/services/auth";

// Define the environment type for Hono
export type AuthEnv = {
  Variables: {
    user: User;
  };
};

/**
 * Hono authentication middleware that validates JWT tokens and adds user to context
 * Use this for routes that require authentication
 */
export const authMiddleware = async (
  c: Context<AuthEnv>,
  next: () => Promise<void>
) => {
  const authHeader = c.req.header("Authorization");

  const authResult = await validateAuthHeader(authHeader);
  if (!authResult.success) {
    return c.json(
      {
        error: {
          code: authResult.error?.code ?? "UNAUTHORIZED",
          message: authResult.error?.message ?? "Authentication failed",
        },
      },
      401
    );
  }
  if (!authResult.user) {
    return c.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "User not found",
        },
      },
      401
    );
  }

  // Add user to context
  c.set("user", authResult.user);
  await next();
};

/**
 * Authentication middleware that accepts token from Authorization header OR `?token=` query param
 * Useful for resources requested by the browser without custom headers (e.g., <img src>)
 */
export const authMiddlewareHeaderOrQuery = async (
  c: Context<AuthEnv>,
  next: () => Promise<void>
) => {
  const authHeader = c.req.header("Authorization");

  let result = await validateAuthHeader(authHeader);
  if (!result.success && c.req.query("token")) {
    result = await validateJwtToken(String(c.req.query("token")));
  }

  if (!(result.success && result.user)) {
    return c.json(
      {
        error: {
          code: result.error?.code ?? "UNAUTHORIZED",
          message: result.error?.message ?? "Authentication failed",
        },
      },
      401
    );
  }

  c.set("user", result.user);
  await next();
};
