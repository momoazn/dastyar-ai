import { ORPCError, os } from "@orpc/server";
import type { Context } from "@/lib/context";
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
      message: authResult.error?.message ?? "احراز هویت ناموفق بود.",
      status: 401,
    });
  }

  if (!authResult.user) {
    throw new ORPCError("USER_NOT_FOUND", {
      message: "کاربر یافت نشد. لطفاً دوباره وارد شوید.",
      status: 401,
    });
  }

  return authResult.user;
}

// Auth middleware to validate JWT and add user to context
export const authMiddleware = o.middleware(async ({ context, next }) => {
  const authHeader = context.req?.header("Authorization");
  const user = await validateAndGetUser(authHeader);

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

  if (user.role !== "admin") {
    throw new ORPCError("FORBIDDEN", {
      message: "شما دسترسی لازم برای انجام این عملیات را ندارید.",
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
