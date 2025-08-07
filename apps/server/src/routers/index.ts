import { z } from "zod";
import { listOllamaModels } from "../lib/ai";
import {
	clearThread,
	createThread,
	deleteMessage,
	deleteThread,
	getMessagesByThread,
	getThread,
	listThreads,
	renameThread,
	setArchived,
} from "../lib/chat-store";
import { publicProcedure } from "../lib/orpc";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	models: {
		listOllama: publicProcedure.handler(async () => {
			const models = await listOllamaModels();
			return models;
		}),
	},
	threads: {
		create: publicProcedure
			.input(z.object({ title: z.string().optional() }).optional())
			.handler(async ({ input }) => {
				const created = await createThread({ title: input?.title });
				return created;
			}),
		list: publicProcedure
			.input(z.object({ includeArchived: z.boolean().optional() }).optional())
			.handler(async ({ input }) => {
				const rows = await listThreads({
					includeArchived: input?.includeArchived,
				});
				return rows;
			}),
		get: publicProcedure
			.input(z.object({ id: z.string() }))
			.handler(async ({ input }) => {
				const row = await getThread(input.id);
				return row;
			}),
		rename: publicProcedure
			.input(z.object({ id: z.string(), title: z.string().min(1) }))
			.handler(async ({ input }) => {
				await renameThread(input.id, input.title);
				return { ok: true } as const;
			}),
		archive: publicProcedure
			.input(z.object({ id: z.string(), isArchived: z.boolean() }))
			.handler(async ({ input }) => {
				await setArchived(input.id, input.isArchived);
				return { ok: true } as const;
			}),
		delete: publicProcedure
			.input(z.object({ id: z.string() }))
			.handler(async ({ input }) => {
				await deleteThread(input.id);
				return { ok: true } as const;
			}),
	},
	messages: {
		listByThread: publicProcedure
			.input(
				z.object({
					threadId: z.string(),
					limit: z.number().optional(),
					cursor: z.string().optional(),
				}),
			)
			.handler(async ({ input }) => {
				const rows = await getMessagesByThread({
					threadId: input.threadId,
					limit: input.limit,
					cursor: input.cursor ?? null,
				});
				return rows;
			}),
		delete: publicProcedure
			.input(z.object({ id: z.string() }))
			.handler(async ({ input }) => {
				await deleteMessage(input.id);
				return { ok: true } as const;
			}),
		clearThread: publicProcedure
			.input(z.object({ threadId: z.string() }))
			.handler(async ({ input }) => {
				await clearThread(input.threadId);
				return { ok: true } as const;
			}),
	},
};
export type AppRouter = typeof appRouter;
