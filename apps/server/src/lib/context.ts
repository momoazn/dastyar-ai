import type { Context as HonoContext } from "hono";
import { db } from "../db";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	// No auth configured
	return {
		session: null,
		db, // Attach the database instance to the context
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
