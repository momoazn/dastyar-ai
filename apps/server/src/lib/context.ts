import type { Context as HonoContext } from "hono";
import { db, type User } from "@/database";

export type CreateContextOptions = {
  context: HonoContext;
};

export function createContext({ context }: CreateContextOptions) {
  return {
    honoContext: context,
    req: context.req,
    db, // Attach the database instance to the context
    user: null as unknown as User, // Will be set by auth middleware
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
