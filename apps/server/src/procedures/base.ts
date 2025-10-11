import { os } from '@orpc/server';
import jwt from 'jsonwebtoken';
import { env } from '../config';
import type { Context } from '../lib/context';

const JWT_SECRET = env.JWT_SECRET;

// Create the base context with database support
export const o = os.$context<Context>();

// Create a database middleware for consistent database access
export const dbProvider = o.middleware(({ context, next }) => {
  return next({ context: { db: context.db } });
});

// Auth middleware to validate JWT and add user to context
export const authMiddleware = o.middleware(async ({ context, next }) => {
  const authHeader = context.req?.header('Authorization');

  if (!(authHeader && authHeader.startsWith('Bearer '))) {
    return next();
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      username: string;
      role: string;
    };

    // Fetch user from database to ensure they still exist
    const user = await context.db.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return next();
    }

    return next({
      context: {
        ...context,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    // Invalid token
    return next();
  }
});

// Export the public procedure with database context
export const publicProcedure = o.use(dbProvider);

// Export the protected procedure that requires authentication
export const protectedProcedure = o.use(dbProvider).use(authMiddleware);
