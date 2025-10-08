import { os } from '@orpc/server';
import type { Context } from '../lib/context';
import { healthProcedures } from './health';
import { imageProcedures } from './images';
import { modelProcedures } from './models';
import { summarizeProcedures } from './summarize';
import { messageProcedures, threadProcedures } from './threads';
import { transcribeProcedures } from './transcribe';
import { translationProcedures } from './translation';

// Create the base context with database support
export const o = os.$context<Context>();

// Create a database middleware for consistent database access
export const dbProvider = o.middleware(({ context, next }) => {
  return next({ context: { db: context.db } });
});

// Export the public procedure with database context
export const publicProcedure = o.use(dbProvider);

export const appRouter = {
  ...healthProcedures,
  models: modelProcedures,
  threads: threadProcedures,
  messages: messageProcedures,
  translations: translationProcedures,
  transcribe: transcribeProcedures,
  summarize: summarizeProcedures,
  images: imageProcedures,
};

export type AppRouter = typeof appRouter;
