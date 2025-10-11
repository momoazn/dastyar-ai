import type { Context as HonoContext } from "hono";
import { prisma, type User } from "../database";

export type CreateContextOptions = {
  context: HonoContext;
};

export function createContext({ context }: CreateContextOptions) {
  return {
    honoContext: context,
    req: context.req,
    db: prisma, // Attach the database instance to the context
    user: null as User | null, // Will be set by auth middleware
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
