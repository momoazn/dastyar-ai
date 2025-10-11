import type { Context } from "hono";
import { prisma, type User } from "@/database";
import { validateAuthHeader } from "@/services/auth";

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

  const authResult = await validateAuthHeader(authHeader, prisma);

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
