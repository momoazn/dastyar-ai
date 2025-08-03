import { threadsRouter } from "@/server/api/routers/threads";
import { messagesRouter } from "@/server/api/routers/messages";
import { modelsRouter } from "@/server/api/routers/models";
import { chatRouter } from "@/server/api/routers/chat";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  threads: threadsRouter,
  messages: messagesRouter,
  models: modelsRouter,
  chat: chatRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
