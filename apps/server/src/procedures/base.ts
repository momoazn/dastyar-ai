import { os } from '@orpc/server';
import type { Context } from '../lib/context';
import { validateAuthHeader } from '../services/auth';

// Create the base context with database support
export const o = os.$context<Context>();

// Create a database middleware for consistent database access
export const dbProvider = o.middleware(({ context, next }) => {
  return next({ context: { db: context.db } });
});

// Auth middleware to validate JWT and add user to context
export const authMiddleware = o.middleware(async ({ context, next }) => {
  const authHeader = context.req?.header('Authorization');

  const authResult = await validateAuthHeader(authHeader, context.db);

  if (!authResult.success) {
    throw new Error(
      `Authentication failed: ${authResult.error?.message ?? 'Unknown error'}`
    );
  }

  if (!authResult.user) {
    throw new Error('Authentication failed: User not found');
  }

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
