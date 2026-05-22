import { ORPCError, os } from "@orpc/server";
import type { Context } from "@/lib/context";
import { logger } from "@/lib/logger";
import { getClientIpFromContext } from "@/lib/request-ip";
import { serverTexts } from "@/lib/texts";
import { recordUserIp } from "@/repositories/user-ips";
import { validateAuthHeader } from "@/services/auth";

// Create the base context with database support
export const o = os.$context<Context>();

// Create a database middleware for consistent database access
export const dbProvider = o.middleware(({ context, next }) =>
  next({ context: { db: context.db } })
);

// Helper function to validate auth and extract user
async function validateAndGetUser(authHeader: string | undefined) {
  const authResult = await validateAuthHeader(authHeader);

  if (!authResult.success) {
    throw new ORPCError(authResult.error?.code ?? "UNAUTHORIZED", {
      message: authResult.error?.message ?? serverTexts.auth.failed,
      status: 401,
    });
  }

  if (!authResult.user) {
    throw new ORPCError("USER_NOT_FOUND", {
      message: serverTexts.auth.userNotFound,
      status: 401,
    });
  }

  return authResult.user;
}

const trackUserIpBestEffort = async (
  context: Context,
  userId: number
): Promise<void> => {
  try {
    const clientIp = getClientIpFromContext(context.honoContext);
    if (!clientIp) {
      return;
    }
    await recordUserIp({ userId, ipAddress: clientIp });
  } catch (error) {
    logger.warn("Failed to track user IP", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Auth middleware to validate JWT and add user to context
export const authMiddleware = o.middleware(async ({ context, next }) => {
  const authHeader = context.req?.header("Authorization");
  const user = await validateAndGetUser(authHeader);
  await trackUserIpBestEffort(context, user.id);

  return next({
    context: {
      ...context,
      user,
    },
  });
});

// Admin middleware that requires authentication AND admin role
export const adminMiddleware = o.middleware(async ({ context, next }) => {
  const authHeader = context.req?.header("Authorization");
  const user = await validateAndGetUser(authHeader);
  await trackUserIpBestEffort(context, user.id);

  if (user.role !== "admin") {
    throw new ORPCError("FORBIDDEN", {
      message: serverTexts.errors.forbidden,
      status: 403,
    });
  }

  return next({
    context: {
      ...context,
      user,
    },
  });
});

// Export the public procedure with database context
export const publicProcedure = o.use(dbProvider);

// Export the protected procedure that requires authentication
export const protectedProcedure = o.use(dbProvider).use(authMiddleware);

// Export the admin procedure that requires authentication AND admin role
export const adminProcedure = o.use(dbProvider).use(adminMiddleware);
