import { os } from "@orpc/server";
import type { Context } from "@/lib/context";
import { validateAuthHeader } from "@/services/auth";

// Create the base context with database support
export const o = os.$context<Context>();

// Create a database middleware for consistent database access
export const dbProvider = o.middleware(({ context, next }) =>
  next({ context: { db: context.db } })
);

// Auth middleware to validate JWT and add user to context
export const authMiddleware = o.middleware(async ({ context, next }) => {
  const authHeader = context.req?.header("Authorization");

  console.debug(
    "[authMiddleware] Authorization header present: " +
      (authHeader ? "YES" : "NO")
  );

  const authResult = await validateAuthHeader(authHeader);

  console.debug(
    "[authMiddleware] Validation result: success=" +
      authResult.success +
      ", user=" +
      Boolean(authResult.user)
  );

  if (!authResult.success) {
    console.debug(
      "[authMiddleware] Authentication failed: " +
        (authResult.error?.message ?? "Unknown error")
    );
    throw new Error(
      `Authentication failed: ${authResult.error?.message ?? "Unknown error"}`
    );
  }

  if (!authResult.user) {
    console.debug("[authMiddleware] Authentication failed: User not found");
    throw new Error("Authentication failed: User not found");
  }

  console.debug(
    "[authMiddleware] Authentication succeeded for user: " +
      (authResult.user.id ?? "unknown-id")
  );

  return next({
    context: {
      ...context,
      user: authResult.user,
    },
  });
});

// Admin middleware that requires authentication AND admin role
export const adminMiddleware = o.middleware(async ({ context, next }) => {
  const authHeader = context.req?.header("Authorization");

  console.debug(
    "[adminMiddleware] Authorization header present: " +
      (authHeader ? "YES" : "NO")
  );

  const authResult = await validateAuthHeader(authHeader);

  console.debug(
    "[adminMiddleware] Validation result: success=" +
      authResult.success +
      ", user=" +
      Boolean(authResult.user)
  );

  if (!authResult.success) {
    console.debug(
      "[adminMiddleware] Authentication failed: " +
        (authResult.error?.message ?? "Unknown error")
    );
    throw new Error(
      `Authentication failed: ${authResult.error?.message ?? "Unknown error"}`
    );
  }

  if (!authResult.user) {
    console.debug("[adminMiddleware] Authentication failed: User not found");
    throw new Error("Authentication failed: User not found");
  }

  // Check if user has admin role
  if (authResult.user.role !== "admin") {
    console.debug(
      "[adminMiddleware] Access denied: User is not admin. Role: " +
        authResult.user.role
    );
    throw new Error("Access denied: Admin role required");
  }

  console.debug(
    "[adminMiddleware] Admin access granted for user: " +
      (authResult.user.id ?? "unknown-id")
  );

  return next({
    context: {
      ...context,
      user: authResult.user,
    },
  });
});

// Export the public procedure with database context
export const publicProcedure = o.use(dbProvider);

// Export the protected procedure that requires authentication
export const protectedProcedure = o.use(dbProvider).use(authMiddleware);

// Export the admin procedure that requires authentication AND admin role
export const adminProcedure = o.use(dbProvider).use(adminMiddleware);
