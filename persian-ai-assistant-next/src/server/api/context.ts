import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import PocketBase from "pocketbase";
import type { TypedPocketBase } from "../types/pocketbase-types";

interface CreateContextOptions {
  req: CreateNextContextOptions["req"];
  res: CreateNextContextOptions["res"];
}

/**
 * Create tRPC context with PocketBase instance and user authentication
 */
export const createTRPCContext = (opts: CreateContextOptions) => {
  const { req } = opts;

  // Initialize PocketBase client for server-side operations
  const pb = new PocketBase(
    process.env.POCKETBASE_URL || "http://localhost:8090"
  ) as TypedPocketBase;

  // Disable auto-cancellation for server-side operations
  pb.autoCancellation(false);

  // Extract auth token from request headers
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  // Set auth token if available
  if (token) {
    pb.authStore.save(token);
  }

  return {
    req: opts.req,
    res: opts.res,
    pb,
    user: pb.authStore.model,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;